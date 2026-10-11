// =========================================================================
// WORLD/SKY.JS - TŁA NIEBA, PARALAKSA I CACHE WIEŻOWCÓW
// Wydzielony moduł z js/world.js
// =========================================================================

import { ARENA_LEFT, ARENA_RIGHT } from '../config.js';
import { drawPandoraBackground } from '../background.js';
import { camera } from '../camera.js';
import { W, H, activeArenaId, skyCacheVersion } from './state.js';

// =========================================================================
// OFFSCREEN SKYLINE CANVAS CACHE (Eliminacja migotania okien i sub-pixel aliasingu)
// =========================================================================

let cachedArena1Towers = null;
let cachedArena1H = 0;
let cachedSkyVersion = -1;

const FAR_TOWERS_ARENA1 = [
  { x: 40,   w: 68,  h: 300, spire: 40, side: 'cyan' },
  { x: 160,  w: 105, h: 410, spire: 60, side: 'cyan' },
  { x: 310,  w: 58,  h: 250, spire: 30, side: 'cyan' },
  { x: 410,  w: 125, h: 450, spire: 75, side: 'cyan' },
  { x: 580,  w: 80,  h: 330, spire: 45, side: 'cyan' },
  { x: 720,  w: 95,  h: 370, spire: 50, side: 'center' },
  { x: 870,  w: 115, h: 430, spire: 70, side: 'center' },
  { x: 1030, w: 85,  h: 320, spire: 40, side: 'orange' },
  { x: 1160, w: 130, h: 460, spire: 80, side: 'orange' },
  { x: 1340, w: 60,  h: 270, spire: 35, side: 'orange' },
  { x: 1450, w: 110, h: 400, spire: 60, side: 'orange' },
  { x: 1620, w: 75,  h: 310, spire: 40, side: 'orange' }
];

function getArena1TowersCanvas(horizonY) {
  const curH = Math.ceil(H);
  if (cachedArena1Towers && cachedArena1H === curH && cachedSkyVersion === skyCacheVersion) {
    return cachedArena1Towers;
  }

  const cvs = document.createElement('canvas');
  cvs.width = 1800;
  cvs.height = curH;
  const cctx = cvs.getContext('2d');
  cctx.clearRect(0, 0, 1800, curH);

  for (let bIdx = 0; bIdx < FAR_TOWERS_ARENA1.length; bIdx++) {
    const b = FAR_TOWERS_ARENA1[bIdx];
    const bx = Math.round(b.x);
    const by = Math.round(horizonY + 35 - b.h);
    const bw = Math.round(b.w);
    const bh = Math.round(b.h + 120);

    // Bryła wieży w ciemnym graficie
    cctx.fillStyle = '#070a13';
    cctx.fillRect(bx, by, bw, bh);

    // Neonowa krawędź dachu
    const edgeCol = b.side === 'cyan' 
      ? 'rgba(6, 182, 212, 0.45)' 
      : (b.side === 'orange' ? 'rgba(249, 115, 22, 0.45)' : 'rgba(168, 85, 247, 0.35)');
    cctx.fillStyle = edgeCol;
    cctx.fillRect(bx, by, bw, 2);

    // Pasy okien LED / poziome szczeliny świetlne o stałej grubości 3px
    const winCol = b.side === 'cyan' 
      ? 'rgba(34, 211, 238, 0.28)' 
      : (b.side === 'orange' ? 'rgba(251, 146, 60, 0.28)' : 'rgba(192, 132, 252, 0.22)');
    cctx.fillStyle = winCol;
    let row = 0;
    for (let wy = by + 28; wy < by + b.h - 30; wy += 28, row++) {
      let col = 0;
      for (let wx = bx + 8; wx < bx + b.w - 8; wx += 14, col++) {
        // Stabilny, statyczny układ okien (nie zależy od pozycji kamery)
        if (((col * 3 + row * 5 + bIdx) % 7) < 4) {
          cctx.fillRect(Math.round(wx), Math.round(wy), 6, 3);
        }
      }
    }
  }

  cachedArena1Towers = cvs;
  cachedArena1H = curH;
  cachedSkyVersion = skyCacheVersion;
  return cachedArena1Towers;
}


export function drawNeonNightOpsSky(ctx, camX) {
  const time = performance.now() * 0.001;
  const horizonY = H * 0.74;

  // =========================================================================
  // 1. DUAL-TONE GRADIENT NIEBA (GŁĘBOKA CZERŃ KOSMICZNA + NEONOWA ŁUNA)
  // =========================================================================
  // A. Głęboka czerń kosmiczna i ciemny fiolet / obsydian
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0.0, '#020208');
  skyGrad.addColorStop(0.35, '#060714');
  skyGrad.addColorStop(0.68, '#0d0f22');
  skyGrad.addColorStop(1.0, '#15132d');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // B. Ambientowa poświata skrzydeł areny (Cyan po lewej, Orange po prawej)
  const leftGlowX = W * 0.20 + (ARENA_LEFT - camX) * 0.12;
  const rightGlowX = W * 0.80 + (ARENA_RIGHT - camX) * 0.12;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // Horyzontalna łuna na horyzoncie z płynnym wymieszaniem w ciemny, chłodny fiolet w centrum
  const horizGlow = ctx.createLinearGradient(0, 0, W, 0);
  horizGlow.addColorStop(0.0, 'rgba(6, 182, 212, 0.18)');
  horizGlow.addColorStop(0.28, 'rgba(6, 182, 212, 0.08)');
  horizGlow.addColorStop(0.50, 'rgba(79, 70, 229, 0.06)'); // ciemny, chłodny fiolet
  horizGlow.addColorStop(0.72, 'rgba(249, 115, 22, 0.08)');
  horizGlow.addColorStop(1.0, 'rgba(249, 115, 22, 0.18)');
  ctx.fillStyle = horizGlow;
  ctx.fillRect(0, H * 0.46, W, H * 0.54);

  // Lewa mgławica / radialny ambient bazy Cyan (rgba(6, 182, 212, 0.18))
  const cyanRadius = Math.max(W * 0.60, 640);
  const cyanNebula = ctx.createRadialGradient(leftGlowX, horizonY, 20, leftGlowX, horizonY, cyanRadius);
  cyanNebula.addColorStop(0.0, 'rgba(6, 182, 212, 0.18)');
  cyanNebula.addColorStop(0.42, 'rgba(6, 182, 212, 0.05)');
  cyanNebula.addColorStop(1.0, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = cyanNebula;
  ctx.fillRect(0, 0, W, H);

  // Prawa mgławica / radialny ambient bazy Orange (rgba(249, 115, 22, 0.18))
  const orangeRadius = Math.max(W * 0.60, 640);
  const orangeNebula = ctx.createRadialGradient(rightGlowX, horizonY, 20, rightGlowX, horizonY, orangeRadius);
  orangeNebula.addColorStop(0.0, 'rgba(249, 115, 22, 0.18)');
  orangeNebula.addColorStop(0.42, 'rgba(249, 115, 22, 0.05)');
  orangeNebula.addColorStop(1.0, 'rgba(249, 115, 22, 0)');
  ctx.fillStyle = orangeNebula;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // =========================================================================
  // 2. CYFROWY PYŁ / NEONOWE ISKRY W TLE
  // =========================================================================
  const dustCount = 55;
  for (let i = 0; i < dustCount; i++) {
    const seed = i * 71.197;
    const periodX = 3600;
    const worldX = ((seed * 197.3 + time * 22 * ((i % 3 === 0) ? -1 : 1)) % periodX + periodX) % periodX;
    const scrX = Math.round(((worldX - camX * 0.04) % W + W) % W);
    const normY = (Math.sin(seed * 3.7) * 0.5 + 0.5);
    const scrY = Math.round(normY * (H * 0.70) + Math.sin(time * 1.5 + seed) * 10);

    const twinkle = Math.sin(time * 2.6 + seed * 4.1) * 0.5 + 0.5;
    const isCyanSide = (worldX < periodX * 0.5);
    const alpha = (0.28 + twinkle * 0.62).toFixed(2);
    ctx.fillStyle = isCyanSide ? `rgba(34, 211, 238, ${alpha})` : `rgba(251, 146, 60, ${alpha})`;
    const size = (i % 6 === 0) ? 2.4 : ((i % 2 === 0) ? 1.6 : 1.0);
    ctx.fillRect(scrX, scrY, size, size);
  }

  // =========================================================================
  // 3. SUBTELNA NEONOWA SIATKA WEKTOROWA (SYNTHWAVE GRID NA HORYZONCIE)
  // =========================================================================
  ctx.save();
  const gridTopY = H * 0.65;
  const gridBottomY = H * 0.88;
  const vanishX = W * 0.50 + (1760 - camX) * 0.12;

  // Poziome linie perspektywiczne (rozstaw zagęszczony ku horyzontowi)
  const horizLines = 6;
  for (let l = 1; l <= horizLines; l++) {
    const t = l / horizLines;
    const ly = Math.round(gridTopY + (gridBottomY - gridTopY) * (t * t));
    const lineGrad = ctx.createLinearGradient(0, ly, W, ly);
    lineGrad.addColorStop(0.0, `rgba(6, 182, 212, ${0.16 * t})`);
    lineGrad.addColorStop(0.5, `rgba(168, 85, 247, ${0.10 * t})`);
    lineGrad.addColorStop(1.0, `rgba(249, 115, 22, ${0.16 * t})`);
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, ly);
    ctx.lineTo(W, ly);
    ctx.stroke();
  }

  ctx.restore();

  // =========================================================================
  // 4. WARSTWA DALEKA: MEGA-WIEŻE I PYLONY (OFFSCREEN CACHING + ZERO ALIASING)
  // =========================================================================
  const towersCanvas = getArena1TowersCanvas(Math.round(horizonY));
  const farPeriod = 1800;
  const parallaxFactor = 0.03;
  // Całkowite zaokrąglenie przesunięcia kamery (eliminacja subpixel aliasingu):
  const farOffset = Math.floor(((camX * parallaxFactor) % farPeriod + farPeriod) % farPeriod);

  const minLoop = Math.floor((-farOffset) / farPeriod) - 1;
  const maxLoop = Math.ceil((W - farOffset) / farPeriod) + 1;
  for (let loop = minLoop; loop <= maxLoop; loop++) {
    const drawX = Math.floor(loop * farPeriod - farOffset);
    if (drawX + farPeriod < 0 || drawX > W) continue;
    ctx.drawImage(towersCanvas, drawX, 0);
  }

  // =========================================================================
  // 6. KRZYŻUJĄCE SIĘ NEONOWE LASERY / REFLEKTORY (SPOTLIGHTS)
  // =========================================================================
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  const leftSpotX = W * 0.18 + (ARENA_LEFT - camX) * 0.12;
  const rightSpotX = W * 0.82 + (ARENA_RIGHT - camX) * 0.12;
  const spotSourceY = horizonY + 30;
  const beamLen = Math.max(H * 2.2, 1300);

  // A. LEWY REFLEKTOR (CYAN)
  const leftAngle = 0.40 + Math.sin(time * 0.85) * 0.24;
  ctx.save();
  ctx.translate(leftSpotX, spotSourceY);
  ctx.rotate(leftAngle);

  // Szeroki snop światła Cyan: rgba(6, 182, 212, 0.28) -> rgba(6, 182, 212, 0)
  const cyanBeam = ctx.createLinearGradient(0, 0, 0, -beamLen);
  cyanBeam.addColorStop(0.0, 'rgba(6, 182, 212, 0.28)');
  cyanBeam.addColorStop(0.25, 'rgba(6, 182, 212, 0.16)');
  cyanBeam.addColorStop(0.65, 'rgba(6, 182, 212, 0.05)');
  cyanBeam.addColorStop(1.0, 'rgba(6, 182, 212, 0.0)');
  ctx.fillStyle = cyanBeam;

  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-160, -beamLen);
  ctx.lineTo(160, -beamLen);
  ctx.lineTo(18, 0);
  ctx.closePath();
  ctx.fill();

  // Wewnętrzny rdzeń lasera o wyższej jasności
  const cyanCore = ctx.createLinearGradient(0, 0, 0, -beamLen);
  cyanCore.addColorStop(0.0, 'rgba(165, 243, 252, 0.32)');
  cyanCore.addColorStop(0.35, 'rgba(34, 211, 238, 0.14)');
  cyanCore.addColorStop(1.0, 'rgba(6, 182, 212, 0.0)');
  ctx.fillStyle = cyanCore;
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(-55, -beamLen);
  ctx.lineTo(55, -beamLen);
  ctx.lineTo(6, 0);
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // B. PRAWY REFLEKTOR (ORANGE)
  const rightAngle = -0.40 - Math.sin(time * 0.75 + 1.4) * 0.24;
  ctx.save();
  ctx.translate(rightSpotX, spotSourceY);
  ctx.rotate(rightAngle);

  // Szeroki snop światła Orange: rgba(249, 115, 22, 0.28) -> rgba(249, 115, 22, 0)
  const orangeBeam = ctx.createLinearGradient(0, 0, 0, -beamLen);
  orangeBeam.addColorStop(0.0, 'rgba(249, 115, 22, 0.28)');
  orangeBeam.addColorStop(0.25, 'rgba(249, 115, 22, 0.16)');
  orangeBeam.addColorStop(0.65, 'rgba(249, 115, 22, 0.05)');
  orangeBeam.addColorStop(1.0, 'rgba(249, 115, 22, 0.0)');
  ctx.fillStyle = orangeBeam;

  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-160, -beamLen);
  ctx.lineTo(160, -beamLen);
  ctx.lineTo(18, 0);
  ctx.closePath();
  ctx.fill();

  // Wewnętrzny rdzeń lasera o wyższej jasności
  const orangeCore = ctx.createLinearGradient(0, 0, 0, -beamLen);
  orangeCore.addColorStop(0.0, 'rgba(254, 215, 170, 0.32)');
  orangeCore.addColorStop(0.35, 'rgba(251, 146, 60, 0.14)');
  orangeCore.addColorStop(1.0, 'rgba(249, 115, 22, 0.0)');
  ctx.fillStyle = orangeCore;
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(-55, -beamLen);
  ctx.lineTo(55, -beamLen);
  ctx.lineTo(6, 0);
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = '#f97316';
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fb923c';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

export const drawSoldatParallax = drawNeonNightOpsSky;

export function drawCyberStadiumSky(ctx, camX) {
  drawPandoraBackground(ctx, camera);
}

/**
 * Renderuje malownicze tło Kanionu w Dżungli (Jungle Canyon / Arena 3):
 * - Wilgotne, poranne niebo z mgłą nad koronami drzew i delikatnymi promieniami słońca (god rays)
 * - Paralaksa daleka (camX * 0.015): pasma zamglonych grzbietów górskich pokrytych gęstą dżunglą
 * - Paralaksa średnia (camX * 0.038): gigantyczne drzewa deszczowe z wiszącymi lianami i krasowe filary skalne
 * - Paralaksa bliska (camX * 0.075): tropikalne liście i gałęzie palmowe okalające kadr od góry
 * - Cząsteczki atmosferyczne: wirujące tropikalne liście i świetliste zarodniki unoszące się na wietrze
 */
export function drawJungleSky(ctx, camX) {
  const time = performance.now() * 0.001;
  const horizonY = H * 0.78;

  // 1. PIONOWY GRADIENT TŁA BAZOWEGO (WILGOTNE NIEBO DŻUNGLI -> MGŁA NAD KORONAMI DRZEW)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0.0, '#c7d6be');
  skyGrad.addColorStop(0.32, '#a7bf9d');
  skyGrad.addColorStop(0.58, '#829f77');
  skyGrad.addColorStop(0.82, '#5e7c53');
  skyGrad.addColorStop(1.0, '#3a5431');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. (Usunięto pionowe snopy światła / god rays)
  ctx.shadowBlur = 0;

  // 3. PARALAKSA DALEKA (camX * 0.015) – Zamglone pasma górskie i sylwetki gęstych koron lasu
  const farPeriod = 1400;
  const farOffset = Math.floor(((camX * 0.015) % farPeriod + farPeriod) % farPeriod);
  const minFarLoop = Math.floor((-farOffset) / farPeriod) - 1;
  const maxFarLoop = Math.ceil((W - farOffset) / farPeriod) + 1;

  ctx.save();
  ctx.fillStyle = '#49633f';

  for (let loop = minFarLoop; loop <= maxFarLoop; loop++) {
    const baseX = Math.floor(loop * farPeriod - farOffset);
    if (baseX + farPeriod < 0 || baseX > W) continue;

    // Pasmo górskie 1 (lewy masyw krasowy)
    ctx.beginPath();
    ctx.moveTo(baseX, horizonY);
    ctx.lineTo(baseX, horizonY - 140);
    ctx.quadraticCurveTo(baseX + 160, horizonY - 310, baseX + 340, horizonY - 180);
    ctx.quadraticCurveTo(baseX + 520, horizonY - 340, baseX + 720, horizonY - 160);
    ctx.quadraticCurveTo(baseX + 940, horizonY - 290, baseX + 1140, horizonY - 170);
    ctx.quadraticCurveTo(baseX + 1300, horizonY - 260, baseX + farPeriod, horizonY - 140);
    ctx.lineTo(baseX + farPeriod, horizonY);
    ctx.closePath();
    ctx.fill();

    // Zaokrąglone kępy gęstych koron drzew na grzbiecie górskim
    ctx.fillStyle = '#3c5333';
    for (let bx = 40; bx < farPeriod; bx += 85) {
      const hillY = horizonY - 180 - Math.sin((bx / farPeriod) * Math.PI * 3) * 60;
      ctx.beginPath();
      ctx.arc(baseX + bx, hillY, 48, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = '#49633f';
  }

  // Pozioma warstwa mgły w dolinie górskiej
  const mistGrad = ctx.createLinearGradient(0, horizonY - 180, 0, horizonY - 40);
  mistGrad.addColorStop(0.0, 'rgba(180, 203, 172, 0)');
  mistGrad.addColorStop(0.5, 'rgba(180, 203, 172, 0.28)');
  mistGrad.addColorStop(1.0, 'rgba(180, 203, 172, 0.06)');
  ctx.fillStyle = mistGrad;
  ctx.fillRect(0, horizonY - 180, W, 140);
  ctx.restore();

  // 4. PARALAKSA ŚREDNIA (camX * 0.038) – Kolumny krasowe i pradawne drzewa tropikalne
  const midPeriod = 1100;
  const midOffset = Math.floor(((camX * 0.038) % midPeriod + midPeriod) % midPeriod);
  const minMidLoop = Math.floor((-midOffset) / midPeriod) - 1;
  const maxMidLoop = Math.ceil((W - midOffset) / midPeriod) + 1;

  ctx.save();
  for (let loop = minMidLoop; loop <= maxMidLoop; loop++) {
    const baseX = Math.floor(loop * midPeriod - midOffset);
    if (baseX + midPeriod < 0 || baseX > W) continue;

    // Filar skalny w tle (jak formacje krasowe w Wietnamie / Soldat 2)
    const p1X = baseX + 220;
    const p1Y = horizonY - 330;
    ctx.fillStyle = '#344b2f';
    ctx.beginPath();
    ctx.moveTo(p1X - 25, horizonY);
    ctx.lineTo(p1X - 18, p1Y + 30);
    ctx.quadraticCurveTo(p1X, p1Y - 10, p1X + 45, p1Y + 25);
    ctx.lineTo(p1X + 55, horizonY);
    ctx.closePath();
    ctx.fill();

    // Czapa zieleni na szczycie filaru w tle
    ctx.fillStyle = '#4c6c44';
    ctx.beginPath();
    ctx.arc(p1X + 15, p1Y + 12, 34, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();

    // Drzewo 1: Gigantyczne drzewo tropikalne z rozłożystą koroną
    const t1X = baseX + 560;
    const t1Y = horizonY - 260;
    ctx.fillStyle = '#263a22';
    // Pień drzewa
    ctx.beginPath();
    ctx.moveTo(t1X - 16, horizonY);
    ctx.quadraticCurveTo(t1X - 8, horizonY - 130, t1X - 10, t1Y + 40);
    ctx.lineTo(t1X + 18, t1Y + 40);
    ctx.quadraticCurveTo(t1X + 16, horizonY - 130, t1X + 28, horizonY);
    ctx.closePath();
    ctx.fill();

    // Konary i korona liściasta
    ctx.fillStyle = '#2e4929';
    ctx.beginPath();
    ctx.arc(t1X - 45, t1Y + 15, 62, 0, Math.PI * 2);
    ctx.arc(t1X + 40, t1Y + 10, 68, 0, Math.PI * 2);
    ctx.arc(t1X, t1Y - 20, 78, 0, Math.PI * 2);
    ctx.fill();

    // Jaśniejszy refleks na koronie
    ctx.fillStyle = '#41633a';
    ctx.beginPath();
    ctx.arc(t1X - 10, t1Y - 30, 46, 0, Math.PI * 2);
    ctx.arc(t1X + 30, t1Y - 10, 42, 0, Math.PI * 2);
    ctx.fill();

    // Wiszące pnącza / liany ze skrajnych gałęzi
    ctx.strokeStyle = '#273f23';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(t1X - 70, t1Y + 40);
    ctx.quadraticCurveTo(t1X - 65, t1Y + 110, t1X - 74, t1Y + 160);
    ctx.moveTo(t1X + 65, t1Y + 35);
    ctx.quadraticCurveTo(t1X + 70, t1Y + 100, t1X + 62, t1Y + 150);
    ctx.stroke();

    // Drzewo 2 (mniejsze skupisko w tle po prawej)
    const t2X = baseX + 920;
    const t2Y = horizonY - 220;
    ctx.fillStyle = '#263a22';
    ctx.beginPath();
    ctx.arc(t2X - 25, t2Y + 20, 52, 0, Math.PI * 2);
    ctx.arc(t2X + 30, t2Y + 15, 55, 0, Math.PI * 2);
    ctx.arc(t2X, t2Y - 10, 60, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 5. PARALAKSA BLISKA (camX * 0.075) – Tropikalne liście zwisające z góry ekranu
  const nearPeriod = 900;
  const nearOffset = Math.floor(((camX * 0.075) % nearPeriod + nearPeriod) % nearPeriod);
  const minNearLoop = Math.floor((-nearOffset) / nearPeriod) - 1;
  const maxNearLoop = Math.ceil((W - nearOffset) / nearPeriod) + 1;

  ctx.save();
  for (let loop = minNearLoop; loop <= maxNearLoop; loop++) {
    const baseX = Math.floor(loop * nearPeriod - nearOffset);
    if (baseX + nearPeriod < 0 || baseX > W) continue;

    // Duże liście palmowe i paprocie w górnych partiach kadru
    const lx1 = baseX + 90;
    const leafSway1 = Math.sin(time * 1.5 + loop) * 8;
    ctx.fillStyle = '#1c2e1a';
    ctx.beginPath();
    ctx.moveTo(lx1 - 50, 0);
    ctx.quadraticCurveTo(lx1 + leafSway1, 85, lx1 + 55 + leafSway1, 130);
    ctx.quadraticCurveTo(lx1 + 25 + leafSway1, 75, lx1 + 35, 0);
    ctx.closePath();
    ctx.fill();

    const lx2 = baseX + 140;
    const leafSway2 = Math.cos(time * 1.7 + loop) * 10;
    ctx.fillStyle = '#284124';
    ctx.beginPath();
    ctx.moveTo(lx2 - 40, 0);
    ctx.quadraticCurveTo(lx2 + leafSway2, 110, lx2 + 75 + leafSway2, 175);
    ctx.quadraticCurveTo(lx2 + 35 + leafSway2, 95, lx2 + 45, 0);
    ctx.closePath();
    ctx.fill();

    // Długa zwisająca liana z listkami
    const vineX = baseX + 680;
    const vineSway = Math.sin(time * 1.2 + loop * 2.1) * 14;
    ctx.strokeStyle = '#1e331b';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(vineX, 0);
    ctx.quadraticCurveTo(vineX + vineSway * 0.5, 140, vineX + vineSway, 280);
    ctx.stroke();

    // Drobne listki na lianie
    ctx.fillStyle = '#3f6236';
    for (let vy = 40; vy < 260; vy += 32) {
      const vProgress = vy / 280;
      const vx = vineX + vineSway * vProgress;
      const leafDir = (vy % 64 === 0) ? 1 : -1;
      ctx.beginPath();
      ctx.ellipse(vx + leafDir * 9, vy, 11, 5, leafDir * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // 6. CZĄSTECZKI TROPIKALNE (ZOPTYMALIZOWANE DO 22 SZTUK, BEZ CIENI I TRANSFORMACJI)
  ctx.save();
  ctx.shadowBlur = 0;
  const leafCount = 22;
  for (let i = 0; i < leafCount; i++) {
    const seed = i * 53.17;
    const spdY = 24 + (i % 5) * 11;
    const driftY = ((time * spdY + seed * 41) % (H + 60)) - 30;
    const sway = Math.sin(time * 1.9 + seed) * 32;
    const leafX = (((seed * 179.3 + sway - camX * 0.05) % W + W) % W);

    if (i % 3 === 0) {
      // Tropikalny listek (szybkie małe koło)
      ctx.fillStyle = (i % 6 === 0) ? '#65a30d' : '#4d7c0f';
      ctx.beginPath();
      ctx.arc(leafX, driftY, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Świetlisty zarodnik / pyłek (szybki prostokąt bez gradientu)
      const sporePulse = 0.4 + 0.5 * (0.5 + 0.5 * Math.sin(time * 3.0 + seed));
      const sporeY = (H - ((time * (spdY * 0.75) + seed * 27) % H));
      ctx.fillStyle = (i % 2 === 0)
        ? `rgba(250, 204, 21, ${sporePulse * 0.75})`
        : `rgba(163, 230, 53, ${sporePulse * 0.65})`;
      const sz = (i % 5 === 0) ? 2.5 : 1.6;
      ctx.fillRect(leafX, sporeY, sz, sz);
    }
  }
  ctx.restore();
}

/**
 * Kompatybilność wsteczna: tło Areny 3 renderowane jest autonomicznie przez wtyczkę js/arenas/arena3.js
 */
export function drawFoundrySky(ctx, camX) {
  // Delegowane do aktywnego modułu areny
}

export function drawSky(ctx) {
  const camCenterX = camera ? (camera.x + (camera.viewWidth || (W / (camera.zoom || 1))) / 2) : 1760;
  if (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY') {
    // Tło Areny 3 (The Foundry) renderowane jest bezpośrednio przez wtyczkę arena3.js
    return;
  }
  if (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X') {
    drawPandoraBackground(ctx, camera);
  } else {
    drawNeonNightOpsSky(ctx, camCenterX);
  }
}

