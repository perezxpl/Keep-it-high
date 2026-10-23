// =========================================================================
// ARENAS/ARENA4/RENDERER.JS - POTOK RENDEROWANIA PĘDZĄCEGO POCIĄGU PANCERNEGO
// Modern Military: iluzja prędkości, podtorze, cząsteczki, militarne wnętrza i dachy
// =========================================================================

import { arena4State, ARENA_4_CONFIG } from './state.js';

/**
 * Renderowanie tła areny (przed postaciami i obiektami świata)
 * Wywoływane w renderArenaBackground na czystym canvasie
 */
export function drawArena4Background(ctx, camera) {
  if (!ctx) return;
  const time = arena4State.animTime;
  const camX = camera?.x || 0;
  const camY = camera?.y || 0;
  const camZoom = camera?.zoom || 1.0;
  const screenW = ctx.canvas?.width || 1920;
  const screenH = ctx.canvas?.height || 1080;

  ctx.save();

  // =======================================================================
  // 1. NIEBO PUSTYNI POSTAPOKALIPTYCZNEJ (Screen Space)
  // =======================================================================
  const skyGrad = ctx.createLinearGradient(0, 0, 0, screenH * 0.85);
  skyGrad.addColorStop(0.0, '#100803'); // Głęboka czerń i spalenizna
  skyGrad.addColorStop(0.35, '#280f02'); // Rdzawo-brunatna atmosfera
  skyGrad.addColorStop(0.70, '#532105'); // Gorący pył solny i kurz pustynny
  skyGrad.addColorStop(1.0, '#853709'); // Płonący horyzont
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, screenW, screenH);

  // Tarcza spalonego słońca pustyni
  const sunScreenX = screenW * 0.72 - (camX * 0.015);
  const sunScreenY = screenH * 0.22 - (camY * 0.015);
  const sunGlow = ctx.createRadialGradient(sunScreenX, sunScreenY, 8, sunScreenX, sunScreenY, 140);
  sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
  sunGlow.addColorStop(0.3, 'rgba(245, 158, 11, 0.35)');
  sunGlow.addColorStop(1, 'rgba(180, 83, 9, 0)');
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunScreenX, sunScreenY, 140, 0, Math.PI * 2);
  ctx.fill();

  // =======================================================================
  // 2. PARALAKSA L1: DALEKIE WYDMY I IGLICE SKALNE (Prędkość: skyOffset * 0.05)
  // =======================================================================
  ctx.fillStyle = '#200d04';
  ctx.beginPath();
  const speedL1 = (arena4State.skyOffset * 0.05 + camX * 0.03) % 1600;
  const baseH1 = screenH * 0.60 - (camY * 0.03);
  ctx.moveTo(0, screenH);
  for (let x = -80; x <= screenW + 80; x += 120) {
    const relX = (x + speedL1) % 1600;
    const peak = 85 + Math.sin(relX * 0.008) * 55 + Math.cos(relX * 0.02) * 25;
    ctx.lineTo(x, baseH1 - peak);
  }
  ctx.lineTo(screenW, screenH);
  ctx.closePath();
  ctx.fill();

  // =======================================================================
  // 3. PARALAKSA L2: SKAŁY I SŁUPY TRAKCYJNE (Prędkość: midOffset * 0.40)
  // =======================================================================
  ctx.fillStyle = '#381505';
  ctx.beginPath();
  const speedL2 = (arena4State.midOffset * 0.40 + camX * 0.09) % 1200;
  const baseH2 = screenH * 0.73 - (camY * 0.05);
  ctx.moveTo(0, screenH);
  for (let x = -60; x <= screenW + 60; x += 100) {
    const relX = (x + speedL2) % 1200;
    const dune = 60 + Math.sin(relX * 0.014) * 32;
    ctx.lineTo(x, baseH2 - dune);
  }
  ctx.lineTo(screenW, screenH);
  ctx.closePath();
  ctx.fill();

  // Słupy telegraficzne / trakcyjne pędzące w lewo wzdłuż trasy (Paralaksa L2)
  const poleStep = 280;
  const poleOffset = (arena4State.midOffset * 0.40 + camX * 0.09) % poleStep;
  ctx.strokeStyle = '#220b02';
  ctx.lineWidth = 3.5;
  for (let px = -poleStep; px <= screenW + poleStep; px += poleStep) {
    const poleX = px - poleOffset;
    const poleBottom = baseH2 + 35;
    const poleTop = poleBottom - 110;

    // Pionowy słup
    ctx.beginPath();
    ctx.moveTo(poleX, poleBottom);
    ctx.lineTo(poleX, poleTop);
    ctx.stroke();

    // Poprzeczka pozioma na izolatory
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(poleX - 22, poleTop + 14);
    ctx.lineTo(poleX + 22, poleTop + 14);
    ctx.moveTo(poleX - 16, poleTop + 32);
    ctx.lineTo(poleX + 16, poleTop + 32);
    ctx.stroke();

    // Drobne izolatory ceramiczne
    ctx.fillStyle = '#451a03';
    ctx.fillRect(poleX - 24, poleTop + 9, 5, 6);
    ctx.fillRect(poleX + 19, poleTop + 9, 5, 6);
    ctx.fillRect(poleX - 18, poleTop + 27, 5, 6);
    ctx.fillRect(poleX + 13, poleTop + 27, 5, 6);
  }

  // =======================================================================
  // 4. WARSTWA ŚWIATA W TLE (World Space: Ruchome Podtorze i Wnętrza Wagonów)
  // =======================================================================
  ctx.save();
  ctx.scale(camZoom, camZoom);
  ctx.translate(-camX, -camY);

  const trackY = ARENA_4_CONFIG.floorY; // 820
  const trackOffset = arena4State.trackOffset || 0;

  // 4A. Podtorze kolejowe i tłuczeń (World Space: Y = 820..1300)
  ctx.fillStyle = '#171412';
  ctx.fillRect(-300, trackY + 25, 4800, 500);

  // Kamienie tłuczniowe pod podkładami
  ctx.fillStyle = '#26221f';
  for (let kx = -200; kx < 4400; kx += 42) {
    const relKx = ((kx - trackOffset * 1.5) % 4400 + 4400) % 4400;
    ctx.fillRect(relKx - 200, trackY + 32 + (kx % 17), 6, 4);
  }

  // Ruchome podkłady kolejowe (przesuwane o trackOffset tworząc ciągły pęd pociągu)
  const tieStep = 60;
  for (let x = -300; x < 4500; x += tieStep) {
    const tieX = x - trackOffset;
    // Drewniano-stalowy podkład
    ctx.fillStyle = '#0a0908';
    ctx.fillRect(tieX, trackY + 38, 26, 68);
    // Stalowe płyty mocujące podkłady (tie plates) pod szynami
    ctx.fillStyle = '#38332e';
    ctx.fillRect(tieX + 2, trackY + 42, 22, 6);
    ctx.fillRect(tieX + 2, trackY + 74, 22, 6);
    // Śruby mocujące (żółty odblask)
    ctx.fillStyle = '#78716c';
    ctx.fillRect(tieX + 4, trackY + 43, 2, 2);
    ctx.fillRect(tieX + 20, trackY + 43, 2, 2);
    ctx.fillRect(tieX + 4, trackY + 75, 2, 2);
    ctx.fillRect(tieX + 20, trackY + 75, 2, 2);
  }

  // Szyny kolejowe ze stali walcowanej (dwie stalowe linie z połyskiem)
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-300, trackY + 43, 4800, 6);
  ctx.fillStyle = '#cbd5e1'; // Górna krawędź szyny odbijająca słońce
  ctx.fillRect(-300, trackY + 43, 4800, 2);

  ctx.fillStyle = '#64748b';
  ctx.fillRect(-300, trackY + 75, 4800, 6);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-300, trackY + 75, 4800, 2);

  // Przesuwające się łączenia szyn (rail joints)
  const jointStep = 360;
  const jointOffset = (trackOffset * 6) % jointStep;
  ctx.fillStyle = '#0f172a';
  for (let jx = -300; jx < 4500; jx += jointStep) {
    const rx = jx - jointOffset;
    ctx.fillRect(rx, trackY + 41, 10, 10);
    ctx.fillRect(rx, trackY + 73, 10, 10);
  }

  // 4B. Obłoki kurzu / pyłu spod podłogi pociągu (Object Pool)
  const dust = arena4State.dustPool;
  for (let i = 0; i < dust.length; i++) {
    const dp = dust[i];
    if (!dp.active || dp.alpha <= 0.01) continue;

    const dGrad = ctx.createRadialGradient(dp.x, dp.y, 2, dp.x, dp.y, dp.radius);
    dGrad.addColorStop(0.0, `rgba(180, 130, 85, ${dp.alpha.toFixed(3)})`);
    dGrad.addColorStop(0.55, `rgba(140, 95, 60, ${(dp.alpha * 0.55).toFixed(3)})`);
    dGrad.addColorStop(1.0, 'rgba(100, 70, 45, 0)');
    ctx.fillStyle = dGrad;
    ctx.beginPath();
    ctx.arc(dp.x, dp.y, dp.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4C. Przekrój wnętrza wagonów (Tylna ściana i wyposażenie militarne za postaciami)
  const wagons = [
    { id: 'caboose', x: 200, w: 720, label: 'ZBROJOWNIA / ARSENAL C1' },
    { id: 'command', x: 960, w: 760, label: 'SZTAB C2 / TACTICAL HUB' },
    { id: 'central', x: 1780, w: 760, label: 'ŁADOWNIA CARGO C3' },
    { id: 'cargo', x: 2600, w: 760, label: 'PLATFORMA KONTENEROWA C4' },
    { id: 'loco', x: 3420, w: 530, label: 'LOKOMOTYWA PANCERNA C5' }
  ];

  for (const w of wagons) {
    let drawX = w.x;
    if (w.id === 'central' && arena4State.decouple.phase === 'DECOUPLING') {
      drawX += arena4State.decouple.offsetX;
    } else if (w.id === 'central' && arena4State.decouple.phase === 'INCOMING') {
      drawX = arena4State.decouple.incomingX;
    }

    const interiorTop = (w.id === 'loco') ? 395 : 415;
    const interiorH = trackY - interiorTop; // ~405px

    // Tylna płyta pancerza wewnętrznego (Ciemna stal grafitowa)
    const wallGrad = ctx.createLinearGradient(drawX, interiorTop, drawX, trackY);
    wallGrad.addColorStop(0.0, '#090d16');
    wallGrad.addColorStop(0.5, '#101726');
    wallGrad.addColorStop(1.0, '#090d16');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(drawX, interiorTop, w.w, interiorH);

    // Pionowe przetłoczenia i profile nośne w tle
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    for (let px = drawX + 70; px < drawX + w.w - 50; px += 85) {
      ctx.beginPath();
      ctx.moveTo(px, interiorTop);
      ctx.lineTo(px, trackY);
      ctx.stroke();

      // Nity na profilach
      ctx.fillStyle = '#334155';
      ctx.fillRect(px - 2, interiorTop + 45, 4, 4);
      ctx.fillRect(px - 2, interiorTop + 165, 4, 4);
      ctx.fillRect(px - 2, interiorTop + 285, 4, 4);
    }

    // Pancerne okna / szczeliny strzelnicze w tylnej ścianie
    const winW = Math.min(220, w.w - 180);
    const winX = drawX + (w.w - winW) * 0.5;
    const winY = interiorTop + 110;
    const winH = 34;

    ctx.fillStyle = '#451a03'; // Przebijający pył pustynny za pancerną szybą
    ctx.fillRect(winX, winY, winW, winH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(winX, winY, winW, winH);

    // Stalowe pionowe pręty ochronne na oknie
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    for (let gx = winX + 25; gx < winX + winW; gx += 30) {
      ctx.beginPath();
      ctx.moveTo(gx, winY);
      ctx.lineTo(gx, winY + winH);
      ctx.stroke();
    }

    // Oświetlenie sufitowe: militarne lampy awaryjne
    const lampPositions = [drawX + w.w * 0.25, drawX + w.w * 0.50, drawX + w.w * 0.75];
    for (const lx of lampPositions) {
      const lampY = interiorTop + 6;
      ctx.fillStyle = '#eab308';
      ctx.fillRect(lx - 8, lampY, 16, 5);

      const lampGlow = ctx.createRadialGradient(lx, lampY + 4, 2, lx, lampY + 30, 75);
      lampGlow.addColorStop(0, 'rgba(234, 179, 8, 0.26)');
      lampGlow.addColorStop(0.5, 'rgba(234, 179, 8, 0.06)');
      lampGlow.addColorStop(1, 'rgba(234, 179, 8, 0)');
      ctx.fillStyle = lampGlow;
      ctx.beginPath();
      ctx.arc(lx, lampY + 25, 75, 0, Math.PI * 2);
      ctx.fill();
    }

    // =====================================================================
    // SPECYSICZNE OBIEKTY MILITARNE W KAŻDYM WAGONIE
    // =====================================================================
    if (w.id === 'caboose') {
      // Stojak na broń i szafy w tle podłogi
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(drawX + 40, trackY - 130, 75, 130);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(drawX + 40, trackY - 130, 75, 130);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(drawX + 65, trackY - 95, 25, 4);

      // Skrzynie amunicyjne na podłodze zbrojowni
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(drawX + 180, trackY - 45, 90, 45);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(drawX + 180, trackY - 45, 90, 45);

    } else if (w.id === 'command') {
      // -------------------------------------------------------------------
      // WAGON 2 (SZTAB): Blok serwerowy (ciemnoszara bryła z pulsującymi
      // małymi prostokącikami diod LED w kolorach #22c55e i #ef4444)
      // -------------------------------------------------------------------
      const srvX = drawX + 290; // 1250
      const srvW = 180;
      const srvY = 670;
      const srvH = 150;

      // Ciemnoszara bryła szafy serwerowej 19" rack
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(srvX, srvY, srvW, srvH);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(srvX, srvY, srvW, srvH);

      // Panele wentylacyjne serwera u góry i u dołu
      ctx.fillStyle = '#020617';
      ctx.fillRect(srvX + 12, srvY + 10, srvW - 24, 18);
      ctx.fillRect(srvX + 12, srvY + srvH - 24, srvW - 24, 14);

      // Poziome żaluzje wentylacyjne
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let vy = srvY + 13; vy < srvY + 26; vy += 3) {
        ctx.beginPath();
        ctx.moveTo(srvX + 16, vy);
        ctx.lineTo(srvX + srvW - 16, vy);
        ctx.stroke();
      }

      // 4 kasety serwerowe z pulsującymi diodami LED (#22c55e i #ef4444)
      for (let slot = 0; slot < 4; slot++) {
        const slotY = srvY + 36 + slot * 22;

        // Tło slotu serwerowego
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(srvX + 12, slotY, srvW - 24, 18);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.strokeRect(srvX + 12, slotY, srvW - 24, 18);

        // Uchwyty rackowe po bokach
        ctx.fillStyle = '#64748b';
        ctx.fillRect(srvX + 14, slotY + 3, 3, 12);
        ctx.fillRect(srvX + srvW - 17, slotY + 3, 3, 12);

        // Matryca pulsujących diod LED
        for (let led = 0; led < 7; led++) {
          const ledX = srvX + 26 + led * 18;
          const ledY = slotY + 6;

          // Pseudolosowe, ale powtarzalne pulsowanie na podstawie czasu i indeksu
          const isGreen = (led + slot) % 3 !== 0;
          const blinkRate = 4.0 + led * 2.2 + slot * 1.5;
          const isLit = Math.sin(time * blinkRate) > -0.2;

          if (isLit) {
            ctx.fillStyle = isGreen ? '#22c55e' : '#ef4444';
            ctx.fillRect(ledX, ledY, 5, 5);

            // Poświata diody LED
            ctx.fillStyle = isGreen ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.45)';
            ctx.fillRect(ledX - 1, ledY - 1, 7, 7);
          } else {
            ctx.fillStyle = isGreen ? '#14532d' : '#7f1d1d';
            ctx.fillRect(ledX, ledY, 5, 5);
          }
        }
      }

      // Wiązki kabli sieciowych biegnące do podłogi
      ctx.strokeStyle = '#0284c7'; // Błękitne kable krosowe
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(srvX + 35, srvY + srvH);
      ctx.lineTo(srvX + 25, trackY);
      ctx.stroke();

      ctx.strokeStyle = '#f59e0b'; // Bursztynowe kable
      ctx.beginPath();
      ctx.moveTo(srvX + 50, srvY + srvH);
      ctx.lineTo(srvX + 60, trackY);
      ctx.stroke();

      // Napis na bloku serwerowym
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('[TAC-NET SERVER RACK // ONLINE]', srvX + 14, srvY + srvH - 12);

    } else if (w.id === 'central') {
      // -------------------------------------------------------------------
      // WAGON 3 (CARGO): Dwa ułożone na sobie kontenery cargo
      // z żółto-czarnymi pasami ostrzegawczymi po bokach
      // -------------------------------------------------------------------
      // 1. Dolny szeroki kontener cargo (X = 1950, W = 420, Y = 690, H = 130)
      const c1X = drawX + 170; // 1950
      const c1W = 420;
      const c1Y = 690;
      const c1H = 130;

      // Korpus dolnego kontenera (oliwkowa stal wojskowa)
      ctx.fillStyle = '#1c2826';
      ctx.fillRect(c1X, c1Y, c1W, c1H);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(c1X, c1Y, c1W, c1H);

      // Pionowe przetłoczenia blachy falistej
      ctx.strokeStyle = '#283633';
      ctx.lineWidth = 2;
      for (let fx = c1X + 25; fx < c1X + c1W - 25; fx += 16) {
        ctx.beginPath();
        ctx.moveTo(fx, c1Y + 8);
        ctx.lineTo(fx, c1Y + c1H - 8);
        ctx.stroke();
      }

      // Żółto-czarne pasy ostrzegawcze na bokach dolnego kontenera
      const drawSideStripes = (x, y, w, h) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.fillStyle = '#eab308';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#09090b';
        for (let bx = x - 15; bx < x + w + 15; bx += 14) {
          ctx.beginPath();
          ctx.moveTo(bx, y);
          ctx.lineTo(bx + 7, y);
          ctx.lineTo(bx + 1, y + h);
          ctx.lineTo(bx - 6, y + h);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      };

      drawSideStripes(c1X, c1Y, 18, c1H);
      drawSideStripes(c1X + c1W - 18, c1Y, 18, c1H);

      // Pasy ostrzegawcze na górnym rancie dolnego kontenera
      drawSideStripes(c1X + 22, c1Y, c1W - 44, 8);

      // Tabliczka znamionowa
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('[CARGO MOD-01 // ARMOR PLATES]', c1X + 30, c1Y + 30);

      // 2. Górny kontener cargo leżący na dolnym (X = 2030, W = 260, Y = 560, H = 130)
      const c2X = drawX + 250; // 2030
      const c2W = 260;
      const c2Y = 560;
      const c2H = 130;

      // Korpus górnego kontenera (ciemna stal pancerna)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(c2X, c2Y, c2W, c2H);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(c2X, c2Y, c2W, c2H);

      // Przetłoczenia blachy falistej
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      for (let fx = c2X + 22; fx < c2X + c2W - 22; fx += 16) {
        ctx.beginPath();
        ctx.moveTo(fx, c2Y + 8);
        ctx.lineTo(fx, c2Y + c2H - 8);
        ctx.stroke();
      }

      // Żółto-czarne pasy ostrzegawcze po bokach górnego kontenera
      drawSideStripes(c2X, c2Y, 16, c2H);
      drawSideStripes(c2X + c2W - 16, c2Y, 16, c2H);
      drawSideStripes(c2X + 20, c2Y, c2W - 40, 8);

      // Oznaczenie taktyczne
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('[HAZMAT // MUNITIONS 120MM]', c2X + 25, c2Y + 28);

      // Masywne stalowe narożniki ISO
      ctx.fillStyle = '#64748b';
      ctx.fillRect(c2X, c2Y, 10, 10);
      ctx.fillRect(c2X + c2W - 10, c2Y, 10, 10);
      ctx.fillRect(c2X, c2Y + c2H - 10, 10, 10);
      ctx.fillRect(c2X + c2W - 10, c2Y + c2H - 10, 10, 10);

    } else if (w.id === 'cargo') {
      // Platforma kontenerowa z paletami
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(drawX + 120, trackY - 120, 140, 120);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(drawX + 120, trackY - 120, 140, 120);
    } else if (w.id === 'loco') {
      // Turbina i kocioł lokomotywy
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(drawX + 80, trackY - 160, 180, 160);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.strokeRect(drawX + 80, trackY - 160, 180, 160);

      // Rurociągi wysokociśnieniowe
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(drawX + 80, trackY - 130);
      ctx.lineTo(drawX + 260, trackY - 130);
      ctx.moveTo(drawX + 80, trackY - 80);
      ctx.lineTo(drawX + 260, trackY - 80);
      ctx.stroke();

      // Żarzące się palenisko
      ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.fillRect(drawX + 130, trackY - 50, 80, 40);
    }

    // Taktyczna tabliczka znamionowa na ścianie wewnętrznej
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`[${w.label}]`, drawX + 35, interiorTop + 35);
  }

  ctx.restore(); // Przywrócenie przestrzeni świata w tle
  ctx.restore(); // Przywrócenie stanu nadrzędnego
}

/**
 * Renderowanie pierwszego planu: bryły dachów (agregat, antena, barierki),
 * ramy przekroju wagonów, podwozie, koła, iskry spod kół, dym i most
 * Wywoływane w renderArenaForeground W PRZESTRZENI ŚWIATA (po graczach)
 */
export function drawArena4Foreground(ctx, camera) {
  if (!ctx) return;
  const time = arena4State.animTime;
  const trackY = ARENA_4_CONFIG.floorY; // 820

  ctx.save();

  // =======================================================================
  // 1. WAGONY: RAMY PRZEKROJU, DACHY, PODWOZIA I KOŁA (World Space Cutaway)
  // =======================================================================
  const wagons = [
    { id: 'caboose', x: 200, w: 720, roofY: 410, roofW: 720, roofX: 200 },
    { id: 'command', x: 960, w: 760, roofY: 410, roofW: 760, roofX: 960 },
    { id: 'central', x: 1780, w: 760, roofY: 410, roofW: 760, roofX: 1780 },
    { id: 'cargo', x: 2600, w: 760, roofY: 410, roofW: 760, roofX: 2600 },
    { id: 'loco', x: 3420, w: 530, roofY: 390, roofW: 530, roofX: 3420 }
  ];

  for (const w of wagons) {
    let drawX = w.x;
    if (w.id === 'central' && arena4State.decouple.phase === 'DECOUPLING') {
      drawX += arena4State.decouple.offsetX;
    } else if (w.id === 'central' && arena4State.decouple.phase === 'INCOMING') {
      drawX = arena4State.decouple.incomingX;
    }

    const interiorTop = (w.id === 'loco') ? 395 : 415;
    const roofY = w.roofY;

    // 1A. PŁYTA DACHOWA WAGONU (Solid Catwalk Surface: Y = roofY)
    const roofDrawX = drawX + (w.roofX - w.x);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(roofDrawX, roofY - 14, w.roofW, 18);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(roofDrawX, roofY - 14, w.roofW, 18);

    // Krawędź nawierzchni dachu z nitami
    ctx.fillStyle = '#64748b';
    ctx.fillRect(roofDrawX, roofY - 16, w.roofW, 2);

    // Niska barierka ochronna na dachu
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(roofDrawX + 15, roofY - 24);
    ctx.lineTo(roofDrawX + w.roofW - 15, roofY - 24);
    ctx.stroke();

    for (let rx = roofDrawX + 40; rx < roofDrawX + w.roofW - 20; rx += 70) {
      ctx.beginPath();
      ctx.moveTo(rx, roofY - 24);
      ctx.lineTo(rx, roofY - 14);
      ctx.stroke();
    }

    // =====================================================================
    // 1B. ZRÓŻNICOWANIE BRYŁY DACHÓW (OSŁONY MILITARNE NA DACHACH)
    // =====================================================================
    if (w.id === 'caboose') {
      // -------------------------------------------------------------------
      // WAGON 1: Agregat wentylacyjny (szerokość 70 px, wysokość 35 px)
      // -------------------------------------------------------------------
      const acX = drawX + 320; // 520
      const acY = roofY - 35; // 375
      const acW = 70;
      const acH = 35;

      // Korpus agregatu ze stali grafitowej
      ctx.fillStyle = '#334155';
      ctx.fillRect(acX, acY, acW, acH);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.strokeRect(acX, acY, acW, acH);

      // Żaluzje wlotowe powietrza po lewej stronie
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(acX + 6, acY + 6, 26, acH - 12);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let ly = acY + 9; ly < acY + acH - 6; ly += 4) {
        ctx.beginPath();
        ctx.moveTo(acX + 8, ly);
        ctx.lineTo(acX + 30, ly);
        ctx.stroke();
      }

      // Wirnik wentylatora po prawej stronie
      const fanCx = acX + 50;
      const fanCy = acY + acH * 0.5;
      const fanR = 12;

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(fanCx, fanCy, fanR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Obracające się łopatki wirnika wentylatora
      const fanRot = time * 28.0;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
        ctx.beginPath();
        ctx.moveTo(fanCx, fanCy);
        ctx.lineTo(fanCx + Math.cos(fanRot + a) * (fanR - 2), fanCy + Math.sin(fanRot + a) * (fanR - 2));
        ctx.stroke();
      }

      // Nity mocujące agregat do dachu
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(acX + 2, acY + acH - 3, 3, 3);
      ctx.fillRect(acX + acW - 5, acY + acH - 3, 3, 3);

    } else if (w.id === 'command') {
      // -------------------------------------------------------------------
      // WAGON 2: Antena radiowo-radarowa (ukośny maszt) i niska skrzynia
      // -------------------------------------------------------------------
      // 1. Niska skrzynia dachowa (szerokość 60 px, wysokość 25 px) na x = 1450, y = 385
      const crX = drawX + 490; // 1450
      const crY = roofY - 25; // 385
      const crW = 60;
      const crH = 25;

      ctx.fillStyle = '#2d4a22'; // Wojskowa ciemnozielona skrzynia
      ctx.fillRect(crX, crY, crW, crH);
      ctx.strokeStyle = '#182813';
      ctx.lineWidth = 2;
      ctx.strokeRect(crX, crY, crW, crH);

      // Stalowe okucia rogów skrzyni
      ctx.fillStyle = '#64748b';
      ctx.fillRect(crX, crY, 6, 4);
      ctx.fillRect(crX + crW - 6, crY, 6, 4);
      ctx.fillRect(crX, crY + crH - 4, 6, 4);
      ctx.fillRect(crX + crW - 6, crY + crH - 4, 6, 4);

      // Centralna metalowa klamra skrzyni
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(crX + crW * 0.5 - 4, crY + crH * 0.5 - 3, 8, 6);

      // 2. Ukośny maszt antenowo-radarowy na x = 1120
      const antX = drawX + 160;
      const antBaseY = roofY - 14;

      // Stalowa stopa masztu
      ctx.fillStyle = '#334155';
      ctx.fillRect(antX - 8, antBaseY - 6, 16, 6);

      // Ukośny maszt antenowy
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(antX, antBaseY - 6);
      ctx.lineTo(antX - 25, antBaseY - 75);
      ctx.stroke();

      // Odciągi linowe masztu
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(antX - 25, antBaseY - 75);
      ctx.lineTo(antX + 22, antBaseY - 6);
      ctx.moveTo(antX - 25, antBaseY - 75);
      ctx.lineTo(antX - 45, antBaseY - 6);
      ctx.stroke();

      // Obracający się talerz radarowy na szczycie masztu
      const radCx = antX - 25;
      const radCy = antBaseY - 75;
      const radW = 24 * Math.cos(time * 3.5);

      ctx.strokeStyle = '#38bdf8'; // Błękitny radar C2
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(radCx, radCy, Math.max(3, Math.abs(radW)), 6, 0.2, 0, Math.PI * 2);
      ctx.stroke();

      // Środkowy emiter radaru
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(radCx, radCy, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (w.id === 'central') {
      // -------------------------------------------------------------------
      // WAGON 3: Dwie niskie barierki ochronne na krawędziach
      // (lewa na x = 1815, prawa na x = 2465, w = 40 px, h = 25 px)
      // -------------------------------------------------------------------
      const drawRoofBarrier = (bx, by) => {
        const bw = 40;
        const bh = 25;

        // Pancerz barierki ochronnej
        ctx.fillStyle = '#334155';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);

        // Szczelina obserwacyjno-strzelecka
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bx + 6, by + 5, bw - 12, 6);

        // Żółto-czarny pas ostrzegawczy na dole barierki
        ctx.save();
        ctx.beginPath();
        ctx.rect(bx, by + bh - 7, bw, 7);
        ctx.clip();
        ctx.fillStyle = '#eab308';
        ctx.fillRect(bx, by + bh - 7, bw, 7);
        ctx.fillStyle = '#09090b';
        for (let sx = bx - 6; sx < bx + bw + 6; sx += 8) {
          ctx.beginPath();
          ctx.moveTo(sx, by + bh - 7);
          ctx.lineTo(sx + 4, by + bh - 7);
          ctx.lineTo(sx + 1, by + bh);
          ctx.lineTo(sx - 3, by + bh);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      };

      // Lewa barierka dachowa
      drawRoofBarrier(drawX + 35, roofY - 25);
      // Prawa barierka dachowa
      drawRoofBarrier(drawX + w.w - 75, roofY - 25);
    }

    // Zamknięta pancerna pokrywa włazu dachowego (zabezpieczenie przed wpadaniem)
    const hatchX = roofDrawX + w.roofW * 0.48;
    // Stalowy kołnierz włazu
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(hatchX - 25, roofY - 14, 50, 18);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(hatchX - 25, roofY - 14, 50, 18);

    // Gruba pancerna pokrywa z uszczelką
    ctx.fillStyle = '#334155';
    ctx.fillRect(hatchX - 22, roofY - 15, 44, 10);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(hatchX - 22, roofY - 15, 44, 10);

    // Dwa potężne zawiasy pancerne po lewej
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(hatchX - 24, roofY - 14, 4, 3);
    ctx.fillRect(hatchX - 24, roofY - 8, 4, 3);

    // Koło dociskowe / rygiel pneumatyczny na środku pokrywy
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(hatchX, roofY - 10, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#eab308';
    ctx.fillRect(hatchX - 1, roofY - 11, 2, 2);

    // Dwa rygle blokujące po prawej
    ctx.fillStyle = '#475569';
    ctx.fillRect(hatchX + 18, roofY - 13, 4, 6);

    // 1C. PODWOZIE I RAMA PODŁOGOWA (Floor Surface: Y = 818..835)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(drawX, trackY, w.w, 18);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(drawX, trackY, w.w, 18);

    // Żółto-czarne pasy ostrzegawcze na ramie podłogi
    const stripeH = 9;
    const stripeY = trackY + 8;
    ctx.save();
    ctx.beginPath();
    ctx.rect(drawX, stripeY, w.w, stripeH);
    ctx.clip();
    ctx.fillStyle = '#eab308';
    ctx.fillRect(drawX, stripeY, w.w, stripeH);
    ctx.fillStyle = '#09090b';
    for (let bx = drawX - 10; bx < drawX + w.w + 20; bx += 22) {
      ctx.beginPath();
      ctx.moveTo(bx, stripeY);
      ctx.lineTo(bx + 11, stripeY);
      ctx.lineTo(bx + 4, stripeY + stripeH);
      ctx.lineTo(bx - 7, stripeY + stripeH);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 1D. PIONOWE SŁUPY I RAMY PRZEKROJU (Cutaway Vertical Frames)
    // Lewy narożnik pancerny wagonu
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(drawX, interiorTop, 20, trackY - interiorTop);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(drawX, interiorTop, 20, trackY - interiorTop);

    // Prawy narożnik pancerny wagonu
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(drawX + w.w - 20, interiorTop, 20, trackY - interiorTop);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(drawX + w.w - 20, interiorTop, 20, trackY - interiorTop);

    // Środkowy wąski filar nośny
    const midX = drawX + w.w * 0.5 - 6;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(midX, interiorTop, 12, trackY - interiorTop);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(midX, interiorTop, 12, trackY - interiorTop);

    // 1E. ODSŁONIĘTA SZPARA MIĘDZY WAGONAMI
    // (Brak poziomego podestu - widoczne pędzące szyny i wyrzut iskier w podtorzu)
    if (w.id !== 'loco') {
      const coupX = drawX + w.w;
      // Drobny sworzeń wózka jezdnego głęboko pod ramą przy podłożu (Y = trackY + 16)
      ctx.fillStyle = '#090d16';
      const gapWidth = (w.id === 'caboose' ? 40 : 60);
      ctx.fillRect(coupX, trackY + 16, gapWidth, 5);
    }

    // 1F. WÓZKI JEZDNE I KOŁA POCIĄGU (Bogies: Y = 874)
    const wheelPositions = [drawX + 130, drawX + 230, drawX + w.w - 230, drawX + w.w - 130];
    const wy = trackY + 54;
    const radius = 30;

    // Stalowa belka wózka jezdnego
    ctx.fillStyle = '#090d16';
    ctx.fillRect(drawX + 90, trackY + 20, 180, 18);
    ctx.fillRect(drawX + w.w - 270, trackY + 20, 180, 18);

    for (const wx of wheelPositions) {
      // Koło stalowe
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(wx, wy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Obręcz koła
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(wx, wy, radius - 4, 0, Math.PI * 2);
      ctx.stroke();

      // Szprychy obracające się w pędzie
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      const wheelRot = time * 24.0;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + Math.cos(wheelRot + a) * (radius - 5), wy + Math.sin(wheelRot + a) * (radius - 5));
        ctx.stroke();
      }

      // Piasta koła
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(wx, wy, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // =======================================================================
  // 2. ISKRY SPOD KÓŁ POCIĄGU (Object Pool - odlatujące w lewo w dół)
  // =======================================================================
  const sparks = arena4State.sparksPool;
  ctx.save();
  for (let i = 0; i < sparks.length; i++) {
    const sp = sparks[i];
    if (!sp.active) continue;

    const alpha = Math.min(1.0, sp.life / (sp.maxLife * 0.7));
    ctx.strokeStyle = sp.color;
    ctx.lineWidth = sp.size;
    ctx.globalAlpha = alpha;

    // Smuga ruchu iskry w stronę wektora prędkości
    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y);
    ctx.lineTo(sp.x - sp.vx * 0.016, sp.y - sp.vy * 0.016);
    ctx.stroke();

    // Jasny rdzeń iskry
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sp.x - 1, sp.y - 1, 2, 2);
  }
  ctx.restore();

  // =======================================================================
  // 3. LOKOMOTYWA: KOMIN, DYM I PŁUG CZARNY (Cowcatcher)
  // =======================================================================
  // Komin lokomotywy (X = 3680, Y = 335)
  ctx.fillStyle = '#090d16';
  ctx.fillRect(3680, 335, 42, 55);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.strokeRect(3680, 335, 42, 55);

  // Kłęby dymu uciekające w pędzie w lewo
  ctx.fillStyle = 'rgba(71, 85, 105, 0.40)';
  for (let i = 0; i < 5; i++) {
    const smokeAge = ((time * 4 + i * 0.7) % 3.0);
    const smX = 3680 - smokeAge * 280;
    const smY = 330 - smokeAge * 45;
    const smR = 18 + smokeAge * 26;
    ctx.beginPath();
    ctx.arc(smX, smY, smR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pług czołowy taranujący na X = 3940
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(3940, 480);
  ctx.lineTo(3980, 810);
  ctx.lineTo(3940, 810);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 3;
  ctx.stroke();

  // =======================================================================
  // 4. ZAGROŻENIE ŚRODOWISKOWE: NISKI MOST PANCERNY (Low Overhead Bridge)
  // =======================================================================
  const b = arena4State.bridge;
  if (b.active) {
    ctx.save();
    const bx = b.x;
    const by = b.y;
    const bw = b.width;
    const bh = b.h;

    // Belka nośna mostu
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx - bw * 0.5, by, bw, bh);

    // Stalowa kratownica krzyżowa
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx - bw * 0.5, by, bw, bh);

    // Krzyżulce kratownicy
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    for (let kx = bx - bw * 0.5; kx < bx + bw * 0.5; kx += 60) {
      ctx.beginPath();
      ctx.moveTo(kx, by);
      ctx.lineTo(kx + 60, by + bh);
      ctx.moveTo(kx + 60, by);
      ctx.lineTo(kx, by + bh);
      ctx.stroke();
    }

    // Pasy ostrzegawcze na dolnej krawędzi mostu
    const bottomH = 20;
    const bottomY = by + bh - bottomH;
    ctx.save();
    ctx.beginPath();
    ctx.rect(bx - bw * 0.5, bottomY, bw, bottomH);
    ctx.clip();
    ctx.fillStyle = '#eab308';
    ctx.fillRect(bx - bw * 0.5, bottomY, bw, bottomH);
    ctx.fillStyle = '#09090b';
    for (let px = bx - bw * 0.5 - 20; px < bx + bw * 0.5 + 20; px += 24) {
      ctx.beginPath();
      ctx.moveTo(px, bottomY);
      ctx.lineTo(px + 12, bottomY);
      ctx.lineTo(px + 4, bottomY + bottomH);
      ctx.lineTo(px - 8, bottomY + bottomH);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Napis taktyczny na belce
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[SKRAJNA 2.2M - PADAJ NA BRZUCH!]', bx, by + bh * 0.45);
    ctx.restore();
  }

  // =======================================================================
  // 5. SYGNALIZACJA OSTRZEGAWCZA HUD NA EKRANIE
  // =======================================================================
  if (b.warning) {
    const pulse = Math.floor(time * 6) % 2 === 0;
    if (pulse) {
      ctx.save();
      const bannerW = 460;
      const bannerH = 32;
      const bx = (camera?.x || 0) + (camera?.viewWidth || 1920) * 0.5 - bannerW * 0.5;
      const by = (camera?.y || 0) + 70;

      ctx.fillStyle = 'rgba(220, 38, 38, 0.90)';
      ctx.fillRect(bx, by, bannerW, bannerH);
      ctx.strokeStyle = '#fef2f2';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, bannerW, bannerH);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[UWAGA: ZBLIŻA SIĘ NISKI MOST - PADNIJ NA BRZUCH!]', bx + bannerW * 0.5, by + 20);
      ctx.restore();
    }
  }

  if (arena4State.decouple.warning) {
    const pulse = Math.floor(time * 5) % 2 === 0;
    if (pulse) {
      ctx.save();
      const bannerW = 430;
      const bannerH = 32;
      const bx = (camera?.x || 0) + (camera?.viewWidth || 1920) * 0.5 - bannerW * 0.5;
      const by = (camera?.y || 0) + 110;

      ctx.fillStyle = 'rgba(234, 179, 8, 0.90)';
      ctx.fillRect(bx, by, bannerW, bannerH);
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, bannerW, bannerH);

      ctx.fillStyle = '#09090b';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[OSTRZEŻENIE: ROZŁĄCZENIE WAGONU CENTRALNEGO!]', bx + bannerW * 0.5, by + 20);
      ctx.restore();
    }
  }

  ctx.restore();
}
