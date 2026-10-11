// =========================================================================
// ARENAS/ARENA2/SUBMERGEDSKELETONS.JS - ZANURZONE SZKIELETY W KWASIE
// Renderowanie szkieletów ludzkich i rybich pływających w głębi kwasu (Arena 2)
// Czyste kości bezpośrednio w cieczy bez otoczek/bąbli, 0 alokacji GC
// =========================================================================

import {
  _submergedSkeletons,
  getAcidSurfaceY
} from './state.js';

/**
 * Główna procedura renderowania zanurzonych szkieletów pod taflą kwasu
 * Wywoływana bezpośrednio po nałożeniu koloru kwasu (drawAcidLevel)
 * Zero alokacji GC (stałe bufory i prymitywy)
 */
export function drawSubmergedAcidSkeletons(ctx, time, camera) {
  if (!ctx || !_submergedSkeletons || _submergedSkeletons.length === 0) return;

  const camZoom = (camera && camera.zoom) ? camera.zoom : 1;
  const camX = (camera && typeof camera.x === 'number') ? camera.x : 0;
  const canvasW = (ctx.canvas && ctx.canvas.width) ? ctx.canvas.width : 1920;
  const viewLeft = camX - 100;
  const viewRight = camX + (canvasW / camZoom) + 100;

  ctx.save();
  ctx.shadowBlur = 0;

  for (let i = 0; i < _submergedSkeletons.length; i++) {
    const item = _submergedSkeletons[i];

    // Dynamiczna pozycja X z prądem poziomym
    const curX = item.baseX + Math.sin(time * item.driftSpeed + item.phase) * item.driftAmp;

    // Viewport culling (zero kosztu poza ekranem)
    if (curX + 90 < viewLeft || curX - 90 > viewRight) continue;

    // Poziom tafli w danym punkcie X
    const acidSurfY = getAcidSurfaceY(curX, time);

    // Dynamiczna głębokość z pionowym falowaniem i prądami konwekcyjnymi
    const curY = acidSurfY + item.depth + Math.sin(time * item.bobSpeed + item.phase) * item.bobAmp;

    // Współczynnik przejrzystości kości w zależności od głębokości (im głębiej, tym bardziej wtopiony w ciecz)
    const depthFactor = Math.max(0.24, Math.min(0.95, 1.0 - (item.depth - 30) / 260));
    const opacity = depthFactor * 0.90;

    // Kąt kołysania / pływania
    let totalAngle = Math.sin(time * 1.4 + item.phase) * item.tiltAmp;
    if (item.type === 'mutant_fish') {
      totalAngle += Math.cos(time * (item.swimSpeed || 2.8) + item.phase) * 0.08;
    }

    ctx.save();
    ctx.translate(curX, curY);
    ctx.rotate(totalAngle);
    ctx.scale(item.facing || 1, 1);
    ctx.globalAlpha = opacity;

    switch (item.type) {
      case 'human_full':
        drawSubmergedHumanSkeleton(ctx, item.size, time, item, depthFactor);
        break;
      case 'mutant_fish':
        drawSubmergedFishSkeleton(ctx, item.size, time, item, depthFactor);
        break;
      case 'human_torso':
        drawSubmergedTorsoSkeleton(ctx, item.size, time, item, depthFactor);
        break;
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * 1. Kompletny ludzki szkielet dryfujący w głębi kwasu
 * Czysta struktura kości bezpośrednio w cieczy bez sztucznej obramówki/bąbla
 */
function drawSubmergedHumanSkeleton(ctx, size, time, item, depthFactor) {
  const scale = size / 38;

  // Płynne kołysanie kończyn w gęstym kwasie
  const armSway1 = Math.sin(time * 1.8 + item.phase) * 0.25;
  const armSway2 = Math.cos(time * 1.5 + item.phase) * 0.20;
  const legSway1 = Math.sin(time * 1.3 + item.phase) * 0.18;
  const legSway2 = Math.cos(time * 1.1 + item.phase) * 0.15;

  ctx.strokeStyle = '#94a3b8';
  ctx.fillStyle = '#cbd5e1';
  ctx.lineWidth = 1.4 * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // --- CZASZKA I TWARZOCZASZKA ---
  ctx.beginPath();
  ctx.arc(0, -22 * scale, 6.5 * scale, Math.PI, 0);
  ctx.lineTo(4.5 * scale, -16 * scale);
  ctx.lineTo(2.5 * scale, -12 * scale);
  ctx.lineTo(-2.5 * scale, -12 * scale);
  ctx.lineTo(-4.5 * scale, -16 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Oczodoły z zielonym blaskiem (wydajny render bez przełączania trybu screen)
  ctx.fillStyle = '#064e3b';
  ctx.beginPath();
  ctx.arc(-2.4 * scale, -18 * scale, 1.8 * scale, 0, Math.PI * 2);
  ctx.arc(2.4 * scale, -18 * scale, 1.8 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#86efac';
  ctx.beginPath();
  ctx.arc(-2.4 * scale, -18 * scale, 0.9 * scale, 0, Math.PI * 2);
  ctx.arc(2.4 * scale, -18 * scale, 0.9 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Otwór nosowy i szczęka z zębami
  ctx.fillStyle = '#064e3b';
  ctx.beginPath();
  ctx.moveTo(0, -16.5 * scale);
  ctx.lineTo(-1.0 * scale, -14.5 * scale);
  ctx.lineTo(1.0 * scale, -14.5 * scale);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(-2.0 * scale, -13.5 * scale, 1.0 * scale, 1.2 * scale);
  ctx.fillRect(-0.5 * scale, -13.5 * scale, 1.0 * scale, 1.2 * scale);
  ctx.fillRect(1.0 * scale, -13.5 * scale, 1.0 * scale, 1.2 * scale);

  // --- KRĘGOSŁUP SZYJNY I PIERSIOWY ---
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.8 * scale;
  ctx.beginPath();
  ctx.moveTo(0, -12 * scale);
  ctx.quadraticCurveTo(
    Math.sin(time * 2.0 + item.phase) * 1.5 * scale,
    -1 * scale,
    0,
    10 * scale
  );
  ctx.stroke();

  // Kręgi kręgosłupa
  ctx.fillStyle = '#e2e8f0';
  for (let vy = -10 * scale; vy <= 8 * scale; vy += 3.2 * scale) {
    ctx.fillRect(-1.5 * scale, vy, 3.0 * scale, 1.8 * scale);
  }

  // --- KLATKA PIERSIOWA (ŻEBRA) ---
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2 * scale;
  const ribSpans = [5.5, 7.5, 7.0, 5.8, 4.2];
  for (let r = 0; r < ribSpans.length; r++) {
    const ry = (-8 + r * 3.2) * scale;
    const rw = ribSpans[r] * scale;
    ctx.beginPath();
    ctx.moveTo(-rw, ry + 1.2 * scale);
    ctx.quadraticCurveTo(-rw * 0.8, ry - 1.2 * scale, 0, ry);
    ctx.quadraticCurveTo(rw * 0.8, ry - 1.2 * scale, rw, ry + 1.2 * scale);
    ctx.stroke();
  }

  // --- MIEDNICA (PELVIS) ---
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(-6 * scale, 9 * scale);
  ctx.quadraticCurveTo(-5 * scale, 14 * scale, 0, 13 * scale);
  ctx.quadraticCurveTo(5 * scale, 14 * scale, 6 * scale, 9 * scale);
  ctx.quadraticCurveTo(0, 10 * scale, -6 * scale, 9 * scale);
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.0 * scale;
  ctx.stroke();

  // --- KOŃCZYNY GÓRNE (RĘCE DRYFUJĄCE W PRĄDZIE) ---
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2 * scale;

  // Ręka lewa
  ctx.save();
  ctx.translate(-6.5 * scale, -7 * scale);
  ctx.rotate(armSway1 - 0.25);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-5 * scale, 8 * scale);
  ctx.lineTo(-8 * scale, 16 * scale);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-8 * scale, 16 * scale);
  ctx.lineTo(-9.5 * scale, 19 * scale);
  ctx.moveTo(-8 * scale, 16 * scale);
  ctx.lineTo(-7.5 * scale, 19.5 * scale);
  ctx.stroke();
  ctx.restore();

  // Ręka prawa
  ctx.save();
  ctx.translate(6.5 * scale, -7 * scale);
  ctx.rotate(armSway2 + 0.35);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(6 * scale, 7 * scale);
  ctx.lineTo(10 * scale, 15 * scale);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(10 * scale, 15 * scale);
  ctx.lineTo(11.5 * scale, 18 * scale);
  ctx.moveTo(10 * scale, 15 * scale);
  ctx.lineTo(9.5 * scale, 18.5 * scale);
  ctx.stroke();
  ctx.restore();

  // --- KOŃCZYNY DOLNE (NOGI PŁYWAJĄCE W TONI) ---
  // Noga lewa
  ctx.save();
  ctx.translate(-3.5 * scale, 13 * scale);
  ctx.rotate(legSway1);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-2 * scale, 11 * scale);
  ctx.lineTo(-3.5 * scale, 22 * scale);
  ctx.lineTo(-1 * scale, 24 * scale);
  ctx.stroke();
  ctx.restore();

  // Noga prawa
  ctx.save();
  ctx.translate(3.5 * scale, 13 * scale);
  ctx.rotate(legSway2);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(3 * scale, 10 * scale);
  ctx.lineTo(4.5 * scale, 21 * scale);
  ctx.lineTo(7 * scale, 23 * scale);
  ctx.stroke();
  ctx.restore();
}

/**
 * 2. Zmutowany prehistoryczny szkielet ryby kwasowej
 * Czyste ości bez obramówki i bez trybu screen
 */
function drawSubmergedFishSkeleton(ctx, size, time, item, depthFactor) {
  const scale = size / 64;
  const swimFreq = item.swimSpeed || 2.8;

  ctx.strokeStyle = '#94a3b8';
  ctx.fillStyle = '#cbd5e1';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // --- CZASZKA DRAPIEŻNIKA I ROZWARTA PASZCZA ---
  const headX = 22 * scale;
  const headY = Math.sin(time * swimFreq) * 2.0 * scale;

  ctx.save();
  ctx.translate(headX, headY);

  // Górna część czaszki i pysk
  ctx.beginPath();
  ctx.moveTo(0, -6 * scale);
  ctx.lineTo(12 * scale, -2 * scale);
  ctx.lineTo(8 * scale, 1 * scale);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dolna żuchwa otwarta w ataku
  ctx.beginPath();
  ctx.moveTo(0, 1 * scale);
  ctx.lineTo(10 * scale, 6 * scale);
  ctx.lineTo(6 * scale, 7.5 * scale);
  ctx.lineTo(-2 * scale, 3 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Ostre igłowate zęby w obu szczękach
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 1.0 * scale;
  for (let t = 2 * scale; t <= 10 * scale; t += 2.2 * scale) {
    ctx.beginPath();
    ctx.moveTo(t, -1 * scale);
    ctx.lineTo(t - 0.5 * scale, 1.2 * scale);
    ctx.moveTo(t - 1 * scale, 5 * scale);
    ctx.lineTo(t - 1.5 * scale, 2.5 * scale);
    ctx.stroke();
  }

  // Zielony oczodół bez screen mode
  ctx.fillStyle = '#064e3b';
  ctx.beginPath();
  ctx.arc(3 * scale, -2.5 * scale, 2.4 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#86efac';
  ctx.beginPath();
  ctx.arc(3 * scale, -2.5 * scale, 1.3 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Pokrywa skrzelowa (operculum) ze spiczastymi wyrostkami
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.2 * scale;
  ctx.beginPath();
  ctx.moveTo(-1 * scale, -5 * scale);
  ctx.quadraticCurveTo(-4 * scale, 0, -2 * scale, 4 * scale);
  ctx.stroke();

  ctx.restore();

  // --- FALUJĄCY KRĘGOSŁUP OŚCIOWY (10 KRĘGÓW) ---
  const numVerts = 10;
  const vertSpacing = 4.6 * scale;
  let prevX = headX;
  let prevY = headY;

  ctx.lineWidth = 1.4 * scale;

  for (let v = 0; v < numVerts; v++) {
    const vFraction = v / numVerts;
    const vX = headX - (v + 1) * vertSpacing;
    const waveAmp = (2.0 + v * 1.1) * scale;
    const vY = Math.sin(time * swimFreq - v * 0.52) * waveAmp;

    // Odcinek głównego rdzenia kręgosłupa
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(vX, vY);
    ctx.stroke();

    // Węzeł kręgu
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.arc(vX, vY, 1.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Ości grzbietowe i brzuszne
    const ribLen = Math.max(2.0, (1.0 - vFraction) * 14.0) * scale;
    const ribSlope = 0.35 + vFraction * 0.45;

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.0 * scale;

    ctx.beginPath();
    ctx.moveTo(vX, vY);
    ctx.lineTo(vX - ribSlope * ribLen * 0.6, vY - ribLen);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(vX, vY);
    ctx.lineTo(vX - ribSlope * ribLen * 0.6, vY + ribLen * 0.85);
    ctx.stroke();

    // Płetwa grzbietowa promieniowa
    if (v >= 2 && v <= 5) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.lineWidth = 0.9 * scale;
      ctx.beginPath();
      ctx.moveTo(vX, vY - ribLen);
      ctx.lineTo(vX - 3 * scale, vY - ribLen - 5 * scale);
      ctx.stroke();
    }

    prevX = vX;
    prevY = vY;
  }

  // --- PŁETWA OGONOWA (CAUDAL FIN) ---
  const tailX = prevX;
  const tailY = prevY;
  const tailAngle = Math.cos(time * swimFreq - numVerts * 0.52) * 0.55;

  ctx.save();
  ctx.translate(tailX, tailY);
  ctx.rotate(tailAngle);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2 * scale;

  const finRays = [
    { dx: -12, dy: -12 },
    { dx: -14, dy: -7 },
    { dx: -10, dy: -2 },
    { dx: -10, dy: 2 },
    { dx: -14, dy: 7 },
    { dx: -12, dy: 12 }
  ];

  for (let r = 0; r < finRays.length; r++) {
    const ray = finRays[r];
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(ray.dx * scale, ray.dy * scale);
    ctx.stroke();
  }

  // Błona między promieniami ogona
  ctx.fillStyle = 'rgba(74, 222, 128, 0.30)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-12 * scale, -12 * scale);
  ctx.lineTo(-14 * scale, -7 * scale);
  ctx.lineTo(-10 * scale, 0);
  ctx.lineTo(-14 * scale, 7 * scale);
  ctx.lineTo(-12 * scale, 12 * scale);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 3. Częściowo rozpuszczony korpus ludzki (torso) pływający w kwasie
 * Czyste żebra i kręgosłup bez obramówki
 */
function drawSubmergedTorsoSkeleton(ctx, size, time, item, depthFactor) {
  const scale = size / 32;
  const armSway = Math.sin(time * 1.6 + item.phase) * 0.28;

  ctx.strokeStyle = '#94a3b8';
  ctx.fillStyle = '#cbd5e1';
  ctx.lineWidth = 1.3 * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // --- CZASZKA ---
  ctx.beginPath();
  ctx.arc(0, -18 * scale, 5.5 * scale, Math.PI, 0);
  ctx.lineTo(4 * scale, -13 * scale);
  ctx.lineTo(2 * scale, -10 * scale);
  ctx.lineTo(-2 * scale, -10 * scale);
  ctx.lineTo(-4 * scale, -13 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Oczodoły
  ctx.fillStyle = '#064e3b';
  ctx.beginPath();
  ctx.arc(-2.0 * scale, -15 * scale, 1.5 * scale, 0, Math.PI * 2);
  ctx.arc(2.0 * scale, -15 * scale, 1.5 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#86efac';
  ctx.beginPath();
  ctx.arc(-2.0 * scale, -15 * scale, 0.8 * scale, 0, Math.PI * 2);
  ctx.arc(2.0 * scale, -15 * scale, 0.8 * scale, 0, Math.PI * 2);
  ctx.fill();

  // --- KRĘGOSŁUP Z POSZARPANĄ KOŃCÓWKĄ ---
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.8 * scale;
  ctx.beginPath();
  ctx.moveTo(0, -10 * scale);
  ctx.lineTo(0, 8 * scale);
  ctx.stroke();

  // Odłamki złamanego kręgosłupa
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.0 * scale;
  ctx.beginPath();
  ctx.moveTo(0, 8 * scale);
  ctx.lineTo(-1.8 * scale, 12 * scale);
  ctx.moveTo(0, 8 * scale);
  ctx.lineTo(1.2 * scale, 11 * scale);
  ctx.stroke();

  // --- ŻEBRA ---
  const ribs = [4.8, 6.2, 5.8, 4.4];
  for (let r = 0; r < ribs.length; r++) {
    const ry = (-7 + r * 3.4) * scale;
    const rw = ribs[r] * scale;
    ctx.beginPath();
    ctx.moveTo(-rw, ry + 1 * scale);
    ctx.quadraticCurveTo(-rw * 0.8, ry - 1 * scale, 0, ry);
    ctx.quadraticCurveTo(rw * 0.8, ry - 1 * scale, rw, ry + 1 * scale);
    ctx.stroke();
  }

  // --- RĘCE BEZWŁADNIE DRYFUJĄCE ---
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.1 * scale;

  ctx.save();
  ctx.translate(-5.5 * scale, -6 * scale);
  ctx.rotate(armSway);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-5 * scale, 7 * scale);
  ctx.lineTo(-7 * scale, 13 * scale);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(5.5 * scale, -6 * scale);
  ctx.rotate(-armSway + 0.2);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(5 * scale, 6 * scale);
  ctx.lineTo(7 * scale, 12 * scale);
  ctx.stroke();
  ctx.restore();
}
