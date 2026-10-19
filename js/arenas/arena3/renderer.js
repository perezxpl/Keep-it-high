// =========================================================================
// ARENAS/ARENA3/RENDERER.JS - RENDEROWANIE TŁA I PIERWSZEGO PLANU ARENY 3
// Wydzielony moduł z js/arenas/arena3.js
// =========================================================================

import {
  animTime,
  LEAF_PARTICLES,
  WATER_RIPPLES,
  getRiverbankGroundY,
  ARENA_3_BRIDGE_BLOCKS,
  getApproachInclineY,
  ARENA_3_RAMP_BLOCKS,
  BRIDGE_SPLINTERS,
  ARENA_3_WATER_SPLASHES,
  ARENA_3_PYLONS,
  ARENA_3_CANOPY_PLATFORMS,
  STONE_DEBRIS,
  ARENA_3_SNIPER_SLABS,
  ARENA_3_TOWER_PILLARS,
  ARENA_3_TOWER_BLOCKS,
  ARENA_3_PLATFORMS
} from './state.js';

import { drawArena3Background } from './background.js';
export { drawArena3Background };

// =========================================================================
// 7. RENDEROWANIE PIERWSZEGO PLANU (PLATFORMY, TEREN, WIEŻE, BRAMKI Y, RZEKA)
// Pixel-perfect dopasowanie do geometrii kolizyjnej ARENA_3_PLATFORMS
// =========================================================================
export function drawArena3Foreground(ctx, camera) {
  if (!ctx) return;

  ctx.save();

  const camL = camera ? camera.x - 200 : 0;
  const camR = camera ? camera.x + (camera.viewWidth || 2000) + 200 : 4400;

  // -----------------------------------------------------------------------
  // 1. PODŁOŻE: OWALNE PŁASZCZYZNY SCHODZĄCE DO WODY (LEWY I PRAWY BRZEG)
  // Przekształcone w naturalne, owalne wzgórza łagodnie zanurzające się w rzece
  // -----------------------------------------------------------------------
  const leftOvalPoints = [
    { x: 0, y: 1200 },
    { x: 500, y: 1200 },
    { x: 1000, y: 1200 },
    { x: 1150, y: 1200 },
    { x: 1300, y: 1225 },
    { x: 1450, y: 1260 },
    { x: 1580, y: 1295 },
    { x: 1680, y: 1320 },
    { x: 1750, y: 1335 }
  ];

  const rightOvalPoints = [
    { x: 2650, y: 1335 },
    { x: 2720, y: 1320 },
    { x: 2820, y: 1295 },
    { x: 2950, y: 1260 },
    { x: 3100, y: 1225 },
    { x: 3250, y: 1200 },
    { x: 3400, y: 1200 },
    { x: 3900, y: 1200 },
    { x: 4400, y: 1200 }
  ];

  // A. Lewy brzeg - owalna płaszczyzna schodząca do wody (X: 0 do 1750)
  if (camL < 1850 && camR > -50) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 1400);
    ctx.lineTo(0, 1200);
    for (let i = 1; i < leftOvalPoints.length; i++) {
      ctx.lineTo(leftOvalPoints[i].x, leftOvalPoints[i].y);
    }
    ctx.lineTo(1750, 1400);
    ctx.closePath();

    const gGradL = ctx.createLinearGradient(0, 1200, 0, 1400);
    gGradL.addColorStop(0.0, '#42321e');
    gGradL.addColorStop(0.18, '#2e2214');
    gGradL.addColorStop(0.55, '#1e160c');
    gGradL.addColorStop(1.0, '#100c06');
    ctx.fillStyle = gGradL;
    ctx.fill();

    // Detale starożytnych bloków kamiennych zatopionych w gruncie
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let kx = 60; kx < 1520; kx += 110) {
      const ky = 1200 + Math.pow(kx / 1750, 2) * 135;
      ctx.fillRect(kx, ky + 26, 60, 22);
      ctx.fillRect(kx + 35, ky + 62, 50, 20);
    }

    // Warstwa mchu i dżunglowej trawy na owalnej krawędzi
    ctx.save();
    ctx.strokeStyle = '#3e7025';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(leftOvalPoints[0].x, leftOvalPoints[0].y);
    for (let i = 1; i < leftOvalPoints.length; i++) {
      ctx.lineTo(leftOvalPoints[i].x, leftOvalPoints[i].y);
    }
    ctx.stroke();

    // Jaśniejsza trawa
    ctx.strokeStyle = '#589e34';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(leftOvalPoints[0].x, leftOvalPoints[0].y - 2);
    for (let i = 1; i < leftOvalPoints.length; i++) {
      ctx.lineTo(leftOvalPoints[i].x, leftOvalPoints[i].y - 2);
    }
    ctx.stroke();

    // Rim lighting (światło na owalnej krawędzi stoku)
    ctx.strokeStyle = 'rgba(125, 220, 60, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(leftOvalPoints[0].x, leftOvalPoints[0].y - 4);
    for (let i = 1; i < leftOvalPoints.length; i++) {
      ctx.lineTo(leftOvalPoints[i].x, leftOvalPoints[i].y - 4);
    }
    ctx.stroke();

    // Kępki trawy / paprocie wzdłuż owalnego zbocza (aż do linii wody)
    ctx.fillStyle = '#4fa32c';
    for (let i = 0; i < leftOvalPoints.length - 2; i++) {
      const pA = leftOvalPoints[i];
      const pB = leftOvalPoints[i + 1];
      for (let t = 0.2; t <= 0.8; t += 0.3) {
        const gx = pA.x + (pB.x - pA.x) * t;
        const gy = pA.y + (pB.y - pA.y) * t;
        if (gy < 1290) {
          ctx.beginPath();
          ctx.moveTo(gx - 4, gy);
          ctx.lineTo(gx, gy - 7);
          ctx.lineTo(gx + 4, gy);
          ctx.fill();
        }
      }
    }

    // Zaokrąglone, gładkie kamienie rzeczne przy i pod linią wody (schodzenie do wody)
    ctx.fillStyle = '#2d3748';
    ctx.strokeStyle = '#1a202c';
    ctx.lineWidth = 1.5;
    const riverStonesL = [
      { x: 1620, y: 1290, rx: 14, ry: 8 },
      { x: 1655, y: 1298, rx: 16, ry: 9 },
      { x: 1690, y: 1308, rx: 18, ry: 10 },
      { x: 1725, y: 1320, rx: 20, ry: 11 },
      { x: 1745, y: 1332, rx: 15, ry: 9 }
    ];
    for (const st of riverStonesL) {
      ctx.beginPath();
      ctx.ellipse(st.x, st.y, st.rx, st.ry, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Kontur stoku
    ctx.strokeStyle = '#18120a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 1200);
    for (let i = 1; i < leftOvalPoints.length; i++) {
      ctx.lineTo(leftOvalPoints[i].x, leftOvalPoints[i].y);
    }
    ctx.lineTo(1750, 1400);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  // B. Prawy brzeg - owalna płaszczyzna schodząca do wody (X: 2650 do 4400)
  if (camL < 4450 && camR > 2600) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(4400, 1400);
    ctx.lineTo(4400, 1200);
    for (let i = rightOvalPoints.length - 1; i >= 0; i--) {
      ctx.lineTo(rightOvalPoints[i].x, rightOvalPoints[i].y);
    }
    ctx.lineTo(2650, 1400);
    ctx.closePath();

    const gGradR = ctx.createLinearGradient(4400, 1200, 4400, 1400);
    gGradR.addColorStop(0.0, '#42321e');
    gGradR.addColorStop(0.18, '#2e2214');
    gGradR.addColorStop(0.55, '#1e160c');
    gGradR.addColorStop(1.0, '#100c06');
    ctx.fillStyle = gGradR;
    ctx.fill();

    // Detale starożytnych bloków kamiennych
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let kx = 2860; kx < 4350; kx += 110) {
      const u = (4400 - kx) / 1750;
      const ky = 1200 + Math.pow(u, 2) * 135;
      ctx.fillRect(kx, ky + 26, 60, 22);
      ctx.fillRect(kx + 35, ky + 62, 50, 20);
    }

    // Warstwa mchu i dżunglowej trawy
    ctx.save();
    ctx.strokeStyle = '#3e7025';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(rightOvalPoints[0].x, rightOvalPoints[0].y);
    for (let i = 1; i < rightOvalPoints.length; i++) {
      ctx.lineTo(rightOvalPoints[i].x, rightOvalPoints[i].y);
    }
    ctx.stroke();

    ctx.strokeStyle = '#589e34';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(rightOvalPoints[0].x, rightOvalPoints[0].y - 2);
    for (let i = 1; i < rightOvalPoints.length; i++) {
      ctx.lineTo(rightOvalPoints[i].x, rightOvalPoints[i].y - 2);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(125, 220, 60, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(rightOvalPoints[0].x, rightOvalPoints[0].y - 4);
    for (let i = 1; i < rightOvalPoints.length; i++) {
      ctx.lineTo(rightOvalPoints[i].x, rightOvalPoints[i].y - 4);
    }
    ctx.stroke();

    // Kępki trawy
    ctx.fillStyle = '#4fa32c';
    for (let i = 1; i < rightOvalPoints.length - 1; i++) {
      const pA = rightOvalPoints[i];
      const pB = rightOvalPoints[i + 1];
      for (let t = 0.2; t <= 0.8; t += 0.3) {
        const gx = pA.x + (pB.x - pA.x) * t;
        const gy = pA.y + (pB.y - pA.y) * t;
        if (gy < 1290) {
          ctx.beginPath();
          ctx.moveTo(gx - 4, gy);
          ctx.lineTo(gx, gy - 7);
          ctx.lineTo(gx + 4, gy);
          ctx.fill();
        }
      }
    }

    // Zaokrąglone kamienie rzeczne
    ctx.fillStyle = '#2d3748';
    ctx.strokeStyle = '#1a202c';
    ctx.lineWidth = 1.5;
    const riverStonesR = [
      { x: 2660, y: 1332, rx: 15, ry: 9 },
      { x: 2685, y: 1320, rx: 19, ry: 11 },
      { x: 2720, y: 1308, rx: 17, ry: 10 },
      { x: 2755, y: 1298, rx: 16, ry: 9 },
      { x: 2790, y: 1290, rx: 14, ry: 8 }
    ];
    for (const st of riverStonesR) {
      ctx.beginPath();
      ctx.ellipse(st.x, st.y, st.rx, st.ry, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Kontur stoku
    ctx.strokeStyle = '#18120a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(2650, 1400);
    for (let i = 0; i < rightOvalPoints.length; i++) {
      ctx.lineTo(rightOvalPoints[i].x, rightOvalPoints[i].y);
    }
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // 2. STREFA WODY - RZEKA (X: 1600 do 2800, Y: 1300 do 1400)
  // Falująca powierzchnia wody, głębia, odbicia
  // -----------------------------------------------------------------------
  if (camL < 2850 && camR > 1550) {
    // A. Wypełnienie toni wodnej (płycizny przy brzegach i mroczna, śmiertelna głębia w środku)
    // Brzegi: przezroczysta woda rzeczna
    const shoreGrad = ctx.createLinearGradient(1600, 1300, 1600, 1400);
    shoreGrad.addColorStop(0.0, 'rgba(28, 120, 180, 0.70)');
    shoreGrad.addColorStop(0.5, 'rgba(16, 85, 145, 0.82)');
    shoreGrad.addColorStop(1.0, 'rgba(8, 48, 92, 0.90)');
    ctx.fillStyle = shoreGrad;
    ctx.fillRect(1600, 1300, 1200, 100);

    // Głęboki nurt centralny (X: 1750 do 2650) - głęboka toń śmiertelna
    const deepAbyssGrad = ctx.createLinearGradient(2200, 1315, 2200, 1400);
    deepAbyssGrad.addColorStop(0.0, 'rgba(12, 55, 95, 0.75)');
    deepAbyssGrad.addColorStop(0.3, 'rgba(6, 32, 65, 0.92)');
    deepAbyssGrad.addColorStop(1.0, 'rgba(3, 14, 34, 0.98)');
    ctx.fillStyle = deepAbyssGrad;
    ctx.fillRect(1750, 1315, 900, 85);

    // B. Falująca powierzchnia rzeki
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(1600, 1300);
    const waveStep = 30;
    for (let wx = 1600; wx <= 2800; wx += waveStep) {
      const wave1 = Math.sin((wx * 0.022) + animTime * 2.8) * 5.5;
      const wave2 = Math.cos((wx * 0.011) - animTime * 1.9) * 3.5;
      ctx.lineTo(wx, 1300 + wave1 + wave2);
    }
    ctx.lineTo(2800, 1400);
    ctx.lineTo(1600, 1400);
    ctx.closePath();

    const surfGrad = ctx.createLinearGradient(1600, 1292, 1600, 1340);
    surfGrad.addColorStop(0.0, 'rgba(96, 210, 255, 0.92)');
    surfGrad.addColorStop(0.4, 'rgba(32, 150, 220, 0.75)');
    surfGrad.addColorStop(1.0, 'rgba(16, 90, 160, 0.50)');
    ctx.fillStyle = surfGrad;
    ctx.fill();

    // C. Błyszczące refleksy piany na powierzchni rzeki
    ctx.strokeStyle = 'rgba(200, 245, 255, 0.85)';
    ctx.lineWidth = 2.2;
    for (let wx = 1630; wx < 2770; wx += 95) {
      const wy = 1300 + Math.sin((wx * 0.022) + animTime * 2.8) * 5.5;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + 45, wy - 1);
      ctx.stroke();
    }

    // D. Bąbelki / piana w strefie wody
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (let i = 0; i < WATER_RIPPLES.length; i++) {
      const rip = WATER_RIPPLES[i];
      const ry = rip.y + Math.sin(animTime * 2 + rip.phase) * 6;
      ctx.beginPath();
      ctx.arc(rip.x, ry, rip.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // E. Ostrzeżenie przed głębią rzeki (umieszczone centralnie w kanale)
    ctx.save();
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = 'rgba(239, 68, 68, 0.50)';
    ctx.textAlign = 'center';
    ctx.fillText('GŁĘBIA RZEKI (ŚMIERTELNA)', 2200, 1370);
    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // 3. DREWNIANE WIEŻE NOŚNE BRAMEK (X: 200 oraz X: 4200)
  // Fortyfikacje w stylu militarnej dżungli ze starożytnymi okuciami
  // -----------------------------------------------------------------------
  // -----------------------------------------------------------------------
  // 3. DREWNIANE WIEŻE NOŚNE (X: 185 oraz X: 4185)
  // Fortyfikacje w stylu militarnej dżungli z zniszczalnymi pilarami i podestami
  // -----------------------------------------------------------------------
  function drawTowerStructure(isLeft) {
    const sideKey = isLeft ? 'left' : 'right';
    const pillar = ARENA_3_TOWER_PILLARS[sideKey];
    const tx = isLeft ? 185 : 4185;
    const tw = 30;
    const ty = 600;
    const th = 600;
    if (tx + tw + 160 < camL || tx - 160 > camR) return;

    ctx.save();
    // A. Kamienna podstawa / cokół na gruncie (zawsze niezniszczalny)
    const stoneGrad = ctx.createLinearGradient(tx - 15, ty + th - 60, tx + tw + 15, ty + th);
    stoneGrad.addColorStop(0, '#3f4738');
    stoneGrad.addColorStop(0.5, '#2b3325');
    stoneGrad.addColorStop(1, '#1b2117');
    ctx.fillStyle = stoneGrad;
    ctx.fillRect(tx - 12, ty + th - 60, tw + 24, 60);
    ctx.strokeStyle = '#12170f';
    ctx.lineWidth = 2;
    ctx.strokeRect(tx - 12, ty + th - 60, tw + 24, 60);

    // Mech na cokole
    ctx.fillStyle = '#4d8028';
    ctx.fillRect(tx - 12, ty + th - 60, tw + 24, 6);

    if (pillar && pillar.intact) {
      // B. Główny pionowy drewniany słup (filar z bali tekowych)
      const woodGrad = ctx.createLinearGradient(tx, ty, tx + tw, ty + th);
      woodGrad.addColorStop(0, '#533418');
      woodGrad.addColorStop(0.5, '#3c230e');
      woodGrad.addColorStop(1, '#251406');
      ctx.fillStyle = woodGrad;
      ctx.fillRect(tx, ty, tw, th);

      // C. Słoje drewna i nacięcia
      ctx.strokeStyle = 'rgba(16, 8, 3, 0.65)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(tx + 8, ty);
      ctx.lineTo(tx + 8, ty + th);
      ctx.moveTo(tx + 21, ty);
      ctx.lineTo(tx + 21, ty + th);
      ctx.stroke();

      // D. Drewniane zastrzały / krzyżulce wzmacniające wieżę
      ctx.strokeStyle = '#3e240e';
      ctx.lineWidth = 8;
      for (let sy = ty + 40; sy < ty + th - 60; sy += 90) {
        ctx.beginPath();
        const spreadX = isLeft ? (tx - 50) : (tx + 50 + tw);
        ctx.moveTo(tx + tw / 2, sy);
        ctx.lineTo(spreadX, sy + 60);
        ctx.stroke();
      }

      // E. Kute żelazne obejmy i pasy nitowane
      for (let by = ty + 50; by < ty + th - 40; by += 90) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(tx - 4, by, tw + 8, 12);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(tx - 4, by, tw + 8, 12);
        // Nity
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(tx - 2, by + 3.5, 3, 5);
        ctx.fillRect(tx + tw - 1, by + 3.5, 3, 5);
      }

      // Pęknięcia w drewnie przy uszkodzeniu
      if (pillar.hp < pillar.maxHp) {
        const dmgRatio = 1 - (pillar.hp / pillar.maxHp);
        ctx.strokeStyle = '#0f0502';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(tx + 10, ty + 120);
        ctx.lineTo(tx + 18, ty + 160);
        ctx.lineTo(tx + 12, ty + 210);
        if (dmgRatio > 0.45) {
          ctx.moveTo(tx + 22, ty + 260);
          ctx.lineTo(tx + 14, ty + 310);
          ctx.lineTo(tx + 20, ty + 360);
        }
        ctx.stroke();
      }
    } else if (pillar) {
      // ZAWALONY FILAR WIEŻY (PO ZNISZCZENIU)
      // Wyszczerbiony kikut przy fundamencie
      ctx.fillStyle = '#3a210b';
      ctx.beginPath();
      ctx.moveTo(tx - 10, ty + th - 60);
      ctx.lineTo(tx - 10, ty + th - 85);
      ctx.lineTo(tx + 8, ty + th - 110);
      ctx.lineTo(tx + tw + 10, ty + th - 75);
      ctx.lineTo(tx + tw + 10, ty + th - 60);
      ctx.closePath();
      ctx.fill();

      // Przechylony pień słupa
      ctx.save();
      ctx.translate(tx + tw / 2, ty + th - 70);
      ctx.rotate(pillar.tiltAngle);
      const fallenGrad = ctx.createLinearGradient(-tw / 2, -th + 70, tw / 2, 0);
      fallenGrad.addColorStop(0, '#533418');
      fallenGrad.addColorStop(1, '#251406');
      ctx.fillStyle = fallenGrad;
      ctx.fillRect(-tw / 2, -th + 70, tw, th - 90);
      ctx.restore();
    }

    // F. Pomost inspekcyjny dolny przy wieży (Y: 600) - RYSOWANY Z MODUŁOWYCH BLOKÓW
    const lowerBlocks = ARENA_3_TOWER_BLOCKS.filter(b => b.side === sideKey && b.tier === 'lower');
    for (let i = 0; i < lowerBlocks.length; i++) {
      const b = lowerBlocks[i];
      if (b.x + b.w + 30 < camL || b.x - 30 > camR) continue;

      ctx.save();
      if (b.intact) {
        const deckGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
        deckGrad.addColorStop(0, '#5f3c1a');
        deckGrad.addColorStop(0.5, '#43280f');
        deckGrad.addColorStop(1, '#2c1706');
        ctx.fillStyle = deckGrad;
        ctx.fillRect(b.x, b.y, b.w, b.h);

        // Krawędź pomostu z mchem
        ctx.fillStyle = '#4c7a2b';
        ctx.fillRect(b.x, b.y, b.w, 4);

        ctx.strokeStyle = '#1c1005';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        // Nity
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(b.x + 4, b.y + 4, 3, 3);
        ctx.fillRect(b.x + b.w - 7, b.y + 4, 3, 3);

        // Pęknięcia jeśli oberwał
        if (b.hp < b.maxHp) {
          ctx.strokeStyle = '#120802';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(b.x + b.w * 0.4, b.y);
          ctx.lineTo(b.x + b.w * 0.5, b.y + b.h);
          ctx.stroke();
        }
      } else {
        // Zniszczona belka pomostu w powietrzu lub w wodzie
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        ctx.translate(cx, cy);
        ctx.rotate(b.angle);

        const halfW = b.w / 2;
        const halfH = b.h / 2;

        const deckGrad = ctx.createLinearGradient(-halfW, -halfH, -halfW, halfH);
        deckGrad.addColorStop(0, '#4d2e12');
        deckGrad.addColorStop(1, '#1e0e04');
        ctx.fillStyle = deckGrad;
        ctx.fillRect(-halfW, -halfH, b.w, b.h);

        ctx.strokeStyle = '#120802';
        ctx.lineWidth = 2;
        ctx.strokeRect(-halfW, -halfH, b.w, b.h);
      }
      ctx.restore();
    }

    // Podpory pomostu od dołu (drewniane zastrzały)
    if (pillar && pillar.intact) {
      const deckX = isLeft ? 120 : 4120;
      const deckW = 160;
      const deckY = 600;
      const deckH = 24;
      ctx.strokeStyle = '#3a220c';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(deckX + 25, deckY + deckH);
      ctx.lineTo(tx + tw / 2, deckY + deckH + 50);
      ctx.moveTo(deckX + deckW - 25, deckY + deckH);
      ctx.lineTo(tx + tw / 2, deckY + deckH + 50);
      ctx.stroke();

      // G. Zwisający z boku wieży militarny proporzec drużyny (Field Banner)
      const bannerX = isLeft ? 90 : 4270;
      const bannerY = 635;
      const bannerW = 42;
      const bannerH = 110;
      const teamColDark = isLeft ? '#0e7490' : '#c2410c';
      const teamColLight = isLeft ? '#06b6d4' : '#f97316';

      ctx.fillStyle = '#221508';
      ctx.fillRect(bannerX - 4, bannerY - 6, bannerW + 8, 6);

      ctx.save();
      ctx.fillStyle = teamColDark;
      ctx.beginPath();
      ctx.moveTo(bannerX, bannerY);
      ctx.lineTo(bannerX + bannerW, bannerY);
      ctx.lineTo(bannerX + bannerW, bannerY + bannerH);
      ctx.lineTo(bannerX + bannerW / 2, bannerY + bannerH - 20);
      ctx.lineTo(bannerX, bannerY + bannerH);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = teamColLight;
      ctx.font = '900 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isLeft ? 'A' : 'B', bannerX + bannerW / 2, bannerY + 45);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(bannerX + 5, bannerY + 60, bannerW - 10, 4);
      ctx.fillRect(bannerX + 8, bannerY + 70, bannerW - 16, 3);
      ctx.restore();
    }

    ctx.restore();
  }

  drawTowerStructure(true);
  drawTowerStructure(false);

  // -----------------------------------------------------------------------
  // 4. WOJSKOWE WIEŻE OBSERWACYJNE I GNIAZDA SNAJPERSKIE (X: 200 oraz X: 4200)
  // Zniszczalne gniazda snajperskie na Y: 400 z modularnymi podestami
  // -----------------------------------------------------------------------
  function drawWatchtowerSniperNest(isLeft) {
    const sideKey = isLeft ? 'left' : 'right';
    const pillar = ARENA_3_TOWER_PILLARS[sideKey];
    const cx = isLeft ? 200 : 4200;
    const stemX = isLeft ? 185 : 4185;
    const deckX = isLeft ? 100 : 4100;
    const deckY = 400;
    const deckW = 200;
    const deckH = 22;

    if (cx + 250 < camL || cx - 250 > camR) return;

    ctx.save();
    const teamCol = isLeft ? '#06b6d4' : '#f97316';
    const teamName = isLeft ? 'FORTRESS ALPHA' : 'OUTPOST BRAVO';

    if (pillar && pillar.intact) {
      // A. Przedłużenie słupów wieży w górę (od Y: 600 do 400)
      const stemGrad = ctx.createLinearGradient(stemX, 400, stemX + 30, 600);
      stemGrad.addColorStop(0, '#533418');
      stemGrad.addColorStop(0.5, '#3c230e');
      stemGrad.addColorStop(1, '#251406');
      ctx.fillStyle = stemGrad;
      ctx.fillRect(stemX, 400, 30, 200);

      // Stalowe okucia i nity słupa
      for (let py = 430; py < 590; py += 50) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(stemX - 3, py, 36, 10);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(stemX - 3, py, 36, 10);
      }

      ctx.strokeStyle = '#1b0e04';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(stemX, 400, 30, 200);

      // Drabina drewniana łącząca dolny pomost Y: 600 z górnym pomostem Y: 400
      const ladderX = isLeft ? 150 : 4230;
      ctx.strokeStyle = '#38200b';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(ladderX, 420);
      ctx.lineTo(ladderX, 600);
      ctx.moveTo(ladderX + 16, 420);
      ctx.lineTo(ladderX + 16, 600);
      ctx.stroke();

      ctx.strokeStyle = '#5c3917';
      ctx.lineWidth = 2.5;
      for (let ly = 435; ly < 595; ly += 18) {
        ctx.beginPath();
        ctx.moveTo(ladderX, ly);
        ctx.lineTo(ladderX + 16, ly);
        ctx.stroke();
      }

      // B. Drewniane zastrzały podtrzymujące górny pomost snajperski
      ctx.strokeStyle = '#321c08';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(stemX + 15, 470);
      ctx.lineTo(deckX + 30, 422);
      ctx.moveTo(stemX + 15, 470);
      ctx.lineTo(deckX + deckW - 30, 422);
      ctx.stroke();
    }

    // C. MODUŁOWE PŁYTY PODŁOGOWE GNIAZDA SNAJPERSKIEGO (Y: 400)
    const upperBlocks = ARENA_3_TOWER_BLOCKS.filter(b => b.side === sideKey && b.tier === 'upper');
    for (let i = 0; i < upperBlocks.length; i++) {
      const b = upperBlocks[i];
      if (b.x + b.w + 30 < camL || b.x - 30 > camR) continue;

      ctx.save();
      if (b.intact) {
        const platGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
        platGrad.addColorStop(0.0, '#6d431c');
        platGrad.addColorStop(0.5, '#492a0f');
        platGrad.addColorStop(1.0, '#2b1606');
        ctx.fillStyle = platGrad;
        ctx.fillRect(b.x, b.y, b.w, b.h);

        // Mech i zbrojenia na krawędzi
        ctx.fillStyle = '#4c7a2b';
        ctx.fillRect(b.x, b.y, b.w, 4);

        ctx.strokeStyle = '#1a0e04';
        ctx.lineWidth = 2.2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        // Nacięcia desek i śruby
        ctx.strokeStyle = 'rgba(20, 10, 4, 0.6)';
        ctx.lineWidth = 1.5;
        for (let dx = b.x + 10; dx < b.x + b.w - 5; dx += 20) {
          ctx.beginPath();
          ctx.moveTo(dx, b.y);
          ctx.lineTo(dx, b.y + b.h);
          ctx.stroke();
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(dx - 1, b.y + 4, 2.5, 2.5);
        }

        // D. Drewniana balustrada obronna z otworami strzelniczymi nad tą deską
        ctx.fillStyle = '#43260d';
        ctx.fillRect(b.x + 2, b.y - 30, b.w - 4, 30);
        ctx.strokeStyle = '#1c0f04';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(b.x + 2, b.y - 30, b.w - 4, 30);

        // Szczelina strzelnicza
        ctx.fillStyle = '#110903';
        ctx.fillRect(b.x + b.w * 0.5 - 9, b.y - 22, 18, 12);
      } else {
        // Odłamany segment podestu gniazda snajperskiego
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        ctx.translate(cx, cy);
        ctx.rotate(b.angle);

        const halfW = b.w / 2;
        const halfH = b.h / 2;

        const bGrad = ctx.createLinearGradient(-halfW, -halfH, -halfW, halfH);
        bGrad.addColorStop(0, '#533418');
        bGrad.addColorStop(1, '#211003');
        ctx.fillStyle = bGrad;
        ctx.fillRect(-halfW, -halfH, b.w, b.h);

        ctx.strokeStyle = '#110903';
        ctx.lineWidth = 2;
        ctx.strokeRect(-halfW, -halfH, b.w, b.h);
      }
      ctx.restore();
    }

    if (pillar && pillar.intact) {
      // E. Słupy zadaszenia i maskująca płachta taktyczna (Camo Netting)
      ctx.strokeStyle = '#321908';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(deckX + 14, deckY - 32);
      ctx.lineTo(deckX + 14, deckY - 75);
      ctx.moveTo(deckX + deckW - 14, deckY - 32);
      ctx.lineTo(deckX + deckW - 14, deckY - 75);
      ctx.stroke();

      // Daszek cieniujący
      ctx.fillStyle = '#2d471c';
      ctx.beginPath();
      ctx.moveTo(deckX - 6, deckY - 70);
      ctx.lineTo(deckX + deckW / 2, deckY - 84);
      ctx.lineTo(deckX + deckW + 6, deckY - 70);
      ctx.lineTo(deckX + deckW, deckY - 75);
      ctx.lineTo(deckX, deckY - 75);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#182b0d';
      ctx.lineWidth = 2;
      ctx.stroke();

      // F. Maszt radiowy łączności wojskowej z pulsującą czerwoną diodą
      const antX = isLeft ? (deckX + 18) : (deckX + deckW - 18);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(antX, deckY - 75);
      ctx.lineTo(antX, deckY - 120);
      ctx.stroke();

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(antX - 8, deckY - 110);
      ctx.lineTo(antX + 8, deckY - 110);
      ctx.moveTo(antX - 5, deckY - 100);
      ctx.lineTo(antX + 5, deckY - 100);
      ctx.stroke();

      const bBlink = (Math.sin(animTime * 6.0) > 0);
      ctx.fillStyle = bBlink ? '#ef4444' : '#500707';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = bBlink ? 12 : 0;
      ctx.beginPath();
      ctx.arc(antX, deckY - 121, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // G. Tablica informacyjna bazy
      const signW = 120;
      const signH = 18;
      const signX = cx - signW / 2;
      const signY = deckY - 26;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(signX, signY, signW, signH);
      ctx.strokeStyle = teamCol;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(signX, signY, signW, signH);

      ctx.font = '900 9.5px monospace';
      ctx.fillStyle = teamCol;
      ctx.textAlign = 'center';
      ctx.fillText(teamName, cx, signY + 12);
    }

    ctx.restore();
  }

  drawWatchtowerSniperNest(true);
  drawWatchtowerSniperNest(false);

  // -----------------------------------------------------------------------
  // 5. GŁÓWNE PLATFORMY SNAJPERSKIE (X: 600-1000 ORAZ X: 3400-3800, Y: 800)
  // Zniszczalne modułowe płyty skalne dolomitowe porośnięte dżunglą
  // -----------------------------------------------------------------------
  function drawSniperSlabs() {
    for (let i = 0; i < ARENA_3_SNIPER_SLABS.length; i++) {
      const slab = ARENA_3_SNIPER_SLABS[i];
      if (slab.x + slab.w + 50 < camL || slab.x - 50 > camR) continue;

      ctx.save();
      if (slab.intact) {
        const px = slab.x;
        const py = slab.y;
        const pw = slab.w;
        const ph = slab.h;

        // A. Skalna masa (dolomit / bazalt porośnięty dżunglą)
        const rockGrad = ctx.createLinearGradient(px, py, px, py + ph);
        rockGrad.addColorStop(0.0, '#536353');
        rockGrad.addColorStop(0.3, '#3a473a');
        rockGrad.addColorStop(0.8, '#262f26');
        rockGrad.addColorStop(1.0, '#151b15');
        ctx.fillStyle = rockGrad;
        ctx.fillRect(px, py, pw, ph);

        // B. Warstwa mchu na szczycie półki skalnej
        ctx.fillStyle = '#4e8d2e';
        ctx.fillRect(px, py, pw, 9);
        ctx.fillStyle = '#6ab83e';
        ctx.fillRect(px + 6, py, pw - 12, 4);

        // C. Ostra krawędź komiksowa / rim lighting
        ctx.strokeStyle = 'rgba(135, 235, 75, 0.75)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + pw, py);
        ctx.stroke();

        // D. Kamienne spękania przy uszkodzeniu
        if (slab.hp < slab.maxHp) {
          const dmgRatio = 1 - (slab.hp / slab.maxHp);
          ctx.strokeStyle = '#0d130d';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(px + pw * 0.35, py);
          ctx.lineTo(px + pw * 0.42, py + ph * 0.55);
          ctx.lineTo(px + pw * 0.38, py + ph);
          if (dmgRatio > 0.45) {
            ctx.moveTo(px + pw * 0.75, py + 2);
            ctx.lineTo(px + pw * 0.65, py + ph * 0.7);
          }
          ctx.stroke();
        }

        // Reliefy ruin
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.fillRect(px + 8, py + 14, pw - 16, 12);

        // E. Zwieszające się pnącza (liany) pod platformą
        ctx.strokeStyle = '#3d6325';
        ctx.lineWidth = 2.8;
        const vineLen = 32 + Math.sin(slab.origX * 0.3) * 14;
        ctx.beginPath();
        ctx.moveTo(px + pw * 0.5, py + ph);
        ctx.quadraticCurveTo(px + pw * 0.5 + 8, py + ph + vineLen * 0.5, px + pw * 0.5 - 4, py + ph + vineLen);
        ctx.stroke();

        // F. Obrys płyty
        ctx.strokeStyle = '#1b231b';
        ctx.lineWidth = 2.2;
        ctx.strokeRect(px, py, pw, ph);
      } else {
        // Zniszczona płyta skalna (boulder spadający w powietrzu lub spoczywający na dnie)
        const cx = slab.x + slab.w / 2;
        const cy = slab.y + slab.h / 2;
        ctx.translate(cx, cy);
        ctx.rotate(slab.angle);

        const halfW = slab.w / 2;
        const halfH = slab.h / 2;

        const rockGrad = ctx.createLinearGradient(-halfW, -halfH, -halfW, halfH);
        rockGrad.addColorStop(0.0, '#3f4b3f');
        rockGrad.addColorStop(0.5, '#2b352b');
        rockGrad.addColorStop(1.0, '#151c15');
        ctx.fillStyle = rockGrad;

        // Wyszczerbiony nieregularny kamień
        ctx.beginPath();
        ctx.moveTo(-halfW + 6, -halfH);
        ctx.lineTo(halfW - 8, -halfH + 3);
        ctx.lineTo(halfW, halfH - 4);
        ctx.lineTo(-halfW + 4, halfH);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#111811';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        ctx.strokeStyle = '#090d09';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-halfW + 12, -halfH + 4);
        ctx.lineTo(2, 0);
        ctx.lineTo(-halfW + 10, halfH - 4);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawSniperSlabs();

  // -----------------------------------------------------------------------
  // 6. WISZĄCY MOST (X: 1750 do 2650, Y: 1000)
  // Potężne pylony kotwiczące i wiszące przęsło rozpięte bezpośrednio nad rzeką
  // -----------------------------------------------------------------------
  const bridgeX1 = 1750;
  const bridgeX2 = 2650;
  const bridgeY = 1000;
  const pylonLeftX = 1755;
  const pylonRightX = 2645;
  const pylonTopY = 850;

  // A. PYLONY NOŚNE MOSTU (Drewniano-kamienne wieże bramowe na brzegach rzeki)
  function drawBridgePylon(pylonKey) {
    const p = ARENA_3_PYLONS[pylonKey];
    if (!p) return;
    const px = p.x;
    if (px + 90 < camL || px - 90 > camR) return;

    ctx.save();
    // 1. Potężny kamienny keson / filar fundamentowy (Y: 1100 aż do litego dna rzeki Y: 1395)
    // Osadzony głęboko w litym dnie rzeki - NIGDY NIE LEWITUJE W POWIETRZU!
    const caissonTopY = 1100;
    const caissonBottomY = 1395;
    const caissonW = 62;
    const caissonLeft = px - caissonW / 2;

    const pBaseGrad = ctx.createLinearGradient(caissonLeft, caissonTopY, caissonLeft + caissonW, caissonBottomY);
    pBaseGrad.addColorStop(0.0, '#4a5445');
    pBaseGrad.addColorStop(0.35, '#313a2d');
    pBaseGrad.addColorStop(0.70, '#1f251c'); // Strefa zanurzona w wodzie poniżej 1300
    pBaseGrad.addColorStop(1.0, '#121710');
    ctx.fillStyle = pBaseGrad;
    ctx.fillRect(caissonLeft, caissonTopY, caissonW, caissonBottomY - caissonTopY);
    ctx.strokeStyle = '#141812';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(caissonLeft, caissonTopY, caissonW, caissonBottomY - caissonTopY);

    // Kute żelazne klamry i obejmy kesonu
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(caissonLeft - 2, 1130, caissonW + 4, 10);
    ctx.fillRect(caissonLeft - 2, 1210, caissonW + 4, 10);
    ctx.fillRect(caissonLeft - 2, 1290, caissonW + 4, 12);
    ctx.fillRect(caissonLeft - 2, 1345, caissonW + 4, 12);

    // Ciosane bloki kamienne i spoiny
    ctx.strokeStyle = '#182015';
    ctx.lineWidth = 2;
    for (let by = caissonTopY + 30; by < caissonBottomY; by += 35) {
      ctx.beginPath();
      ctx.moveTo(caissonLeft, by);
      ctx.lineTo(caissonLeft + caissonW, by);
      ctx.stroke();
    }

    if (p.intact) {
      // 2. Masywne pionowe słupy pylonu (A-frame z belek tekowych od 850 do 1100)
      const pWoodGrad = ctx.createLinearGradient(px - 25, pylonTopY, px + 25, caissonTopY);
      pWoodGrad.addColorStop(0, '#533418');
      pWoodGrad.addColorStop(0.5, '#3c230e');
      pWoodGrad.addColorStop(1, '#251406');
      ctx.fillStyle = pWoodGrad;

      // Lewa i prawa noga pylonu
      ctx.fillRect(px - 24, pylonTopY, 18, caissonTopY - pylonTopY);
      ctx.fillRect(px + 6, pylonTopY, 18, caissonTopY - pylonTopY);

      // Krzyżowe rygle wzmacniające (X-bracing)
      ctx.strokeStyle = '#3e240e';
      ctx.lineWidth = 6;
      for (let crossY = pylonTopY + 40; crossY < caissonTopY - 20; crossY += 75) {
        ctx.beginPath();
        ctx.moveTo(px - 20, crossY);
        ctx.lineTo(px + 20, crossY + 60);
        ctx.moveTo(px + 20, crossY);
        ctx.lineTo(px - 20, crossY + 60);
        ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.fillRect(px - 26, crossY - 4, 52, 8);
      }

      // Dynamiczne pęknięcia drewna przy uszkodzeniu
      if (p.hp < p.maxHp) {
        const damageRatio = 1 - (p.hp / p.maxHp);
        ctx.strokeStyle = '#0a0502';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(px - 15, 950);
        ctx.lineTo(px - 8, 990);
        ctx.lineTo(px - 14, 1040);
        if (damageRatio > 0.4) {
          ctx.moveTo(px + 12, 920);
          ctx.lineTo(px + 18, 970);
          ctx.lineTo(px + 10, 1020);
        }
        if (damageRatio > 0.7) {
          ctx.moveTo(px - 20, 1060);
          ctx.lineTo(px + 15, 1080);
        }
        ctx.stroke();
      }

      // 3. Szczyt pylonu: siodło linowe (Cable Saddle z żelaza i brązu)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px - 30, pylonTopY - 14, 60, 16);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 30, pylonTopY - 14, 60, 16);

      // Kołowroty / rolki linowe
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(px - 10, pylonTopY - 6, 7, 0, Math.PI * 2);
      ctx.arc(px + 10, pylonTopY - 6, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // PYLON ZNISZCZONY (ANGRY BIRDS RUBBLE / FALLEN TOWER)
      // A. Wyszczerbione kikuty przy szczycie kesonu
      ctx.fillStyle = '#3a210b';
      ctx.beginPath();
      ctx.moveTo(px - 24, caissonTopY);
      ctx.lineTo(px - 24, caissonTopY - 25);
      ctx.lineTo(px - 16, caissonTopY - 40);
      ctx.lineTo(px - 12, caissonTopY - 20);
      ctx.lineTo(px - 6, caissonTopY - 30);
      ctx.lineTo(px - 6, caissonTopY);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(px + 6, caissonTopY);
      ctx.lineTo(px + 6, caissonTopY - 35);
      ctx.lineTo(px + 14, caissonTopY - 20);
      ctx.lineTo(px + 18, caissonTopY - 45);
      ctx.lineTo(px + 24, caissonTopY - 30);
      ctx.lineTo(px + 24, caissonTopY);
      ctx.closePath();
      ctx.fill();

      // B. Przechylony / zawalony korpus wieży pylonu
      ctx.save();
      ctx.translate(px, caissonTopY - 25);
      ctx.rotate(p.tiltAngle);

      const towerLen = caissonTopY - pylonTopY;
      const pFallenGrad = ctx.createLinearGradient(-25, -towerLen, 25, 0);
      pFallenGrad.addColorStop(0, '#533418');
      pFallenGrad.addColorStop(1, '#251406');
      ctx.fillStyle = pFallenGrad;

      ctx.fillRect(-24, -towerLen, 18, towerLen - 25);
      ctx.fillRect(6, -towerLen, 18, towerLen - 25);

      ctx.strokeStyle = '#2a1608';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-20, -towerLen + 50);
      ctx.lineTo(20, -towerLen + 110);
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-30, -towerLen - 14, 60, 16);
      ctx.restore();
    }

    ctx.restore();
  }

  drawBridgePylon('left');
  drawBridgePylon('right');

  // B. ZNISZCZALNE MODUŁOWE RAMPY PODEJŚCIOWE NA MOST (Łączące grunt z kładką)
  function drawGentleBridgeApproach(isLeft) {
    const rx1 = isLeft ? 1150 : 2650;
    const rx2 = isLeft ? 1750 : 3250;

    if (rx2 < camL || rx1 > camR) return;

    ctx.save();

    // Filtruj bloki dla tej strony
    const rampBlocks = ARENA_3_RAMP_BLOCKS.filter(b => isLeft ? b.side === 'left' : b.side === 'right');

    for (let rIdx = 0; rIdx < rampBlocks.length; rIdx++) {
      const b = rampBlocks[rIdx];
      if (b.x + b.w + 40 < camL || b.x - 40 > camR) continue;

      const y1 = getApproachInclineY(b.origX, isLeft);
      const y2 = getApproachInclineY(b.origX + b.w, isLeft);
      const groundY = getRiverbankGroundY(b.stiltX);

      if (b.intact) {
        // 1. Drewniany pal nośny (stilt) pod kładką zakotwiczony w podłożu
        if (groundY > Math.max(y1, y2) + 14) {
          ctx.strokeStyle = '#38200b';
          ctx.lineWidth = 9;
          ctx.beginPath();
          ctx.moveTo(b.stiltX, Math.max(y1, y2) + 12);
          ctx.lineTo(b.stiltX, groundY + 12);
          ctx.stroke();

          // Światło na krawędzi pala
          ctx.strokeStyle = '#5a3818';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(b.stiltX - 3, Math.max(y1, y2) + 12);
          ctx.lineTo(b.stiltX - 3, groundY + 12);
          ctx.stroke();

          // Żelazne klamry mocujące pal do podłoża i kładki
          ctx.fillStyle = '#334155';
          ctx.fillRect(b.stiltX - 7, Math.max(y1, y2) + 18, 14, 7);
          ctx.fillRect(b.stiltX - 7, groundY - 14, 14, 7);

          // Zastrzały krzyżowe do sąsiedniego pala jeśli oba są całe
          if (rIdx < rampBlocks.length - 1 && rampBlocks[rIdx + 1].intact) {
            const nextB = rampBlocks[rIdx + 1];
            const nextY = Math.max(getApproachInclineY(nextB.origX, isLeft), getApproachInclineY(nextB.origX + nextB.w, isLeft));
            const nextGroundY = getRiverbankGroundY(nextB.stiltX);

            ctx.strokeStyle = '#281507';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(b.stiltX, Math.max(y1, y2) + 26);
            ctx.lineTo(nextB.stiltX, Math.min(nextGroundY, nextY + 60));
            ctx.moveTo(nextB.stiltX, nextY + 26);
            ctx.lineTo(b.stiltX, Math.min(groundY, Math.max(y1, y2) + 60));
            ctx.stroke();
          }
        }

        // 2. Belka podestu rampy
        ctx.beginPath();
        ctx.moveTo(b.origX, y1);
        ctx.lineTo(b.origX + b.w, y2);
        ctx.lineTo(b.origX + b.w, y2 + 20);
        ctx.lineTo(b.origX, y1 + 20);
        ctx.closePath();

        const blockGrad = ctx.createLinearGradient(b.origX, y1, b.origX + b.w, y2);
        blockGrad.addColorStop(0.0, '#785226');
        blockGrad.addColorStop(0.5, '#563814');
        blockGrad.addColorStop(1.0, '#362108');
        ctx.fillStyle = blockGrad;
        ctx.fill();

        ctx.strokeStyle = '#221306';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 3. Listwy antypoślizgowe
        for (let ax = b.origX + 15; ax <= b.origX + b.w - 10; ax += 22) {
          const ay = getApproachInclineY(ax, isLeft);
          ctx.strokeStyle = 'rgba(235, 195, 105, 0.85)';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(ax - 5, ay);
          ctx.lineTo(ax + 5, ay + 6);
          ctx.stroke();

          ctx.fillStyle = '#1e293b';
          ctx.fillRect(ax - 1, ay + 3, 3, 3);
        }

        // Mech na górnej krawędzi
        ctx.strokeStyle = 'rgba(95, 180, 50, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(b.origX, y1 + 1);
        ctx.lineTo(b.origX + b.w, y2 + 1);
        ctx.stroke();

        // Pęknięcia jeśli rampa jest uszkodzona
        if (b.hp < b.maxHp) {
          const dmgRatio = 1 - (b.hp / b.maxHp);
          ctx.strokeStyle = '#100702';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(b.origX + b.w * 0.4, y1 + 5);
          ctx.lineTo(b.origX + b.w * 0.5, y1 + 14);
          if (dmgRatio > 0.5) {
            ctx.moveTo(b.origX + b.w * 0.7, y2 + 4);
            ctx.lineTo(b.origX + b.w * 0.6, y2 + 16);
          }
          ctx.stroke();
        }

        // 4. Słupek poręczy na środku segmentu
        const postX = b.stiltX;
        const postY = getApproachInclineY(postX, isLeft);
        const handrailH = 34;

        ctx.strokeStyle = '#3e240e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(postX, postY);
        ctx.lineTo(postX, postY - handrailH);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(postX, postY - handrailH, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Linka poręczy do kolejnego segmentu
        if (rIdx < rampBlocks.length - 1 && rampBlocks[rIdx + 1].intact) {
          const nextPostX = rampBlocks[rIdx + 1].stiltX;
          const nextPostY = getApproachInclineY(nextPostX, isLeft);

          ctx.strokeStyle = '#5a3d1c';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(postX, postY - handrailH);
          ctx.lineTo(nextPostX, nextPostY - handrailH);
          ctx.stroke();

          ctx.strokeStyle = '#3d2610';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(postX, postY - handrailH * 0.5);
          ctx.lineTo(nextPostX, nextPostY - handrailH * 0.5);
          ctx.stroke();
        }
      } else {
        // ZNISZCZONY SEGMENT RAMPY (Wyrwa na podejściu - klocek spadający lub spoczywający na zboczu/rzece)
        // A. Wyszczerbiony kikut pala podestu
        if (groundY > Math.max(y1, y2) + 14) {
          ctx.strokeStyle = '#251406';
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(b.stiltX, groundY + 12);
          ctx.lineTo(b.stiltX, groundY - 20);
          ctx.stroke();
        }

        // B. Spadający / spoczywający modularny drewniany segment
        ctx.save();
        const bcx = b.x + b.w / 2;
        const bcy = b.y + b.h / 2;
        ctx.translate(bcx, bcy);
        ctx.rotate(b.angle);

        const halfW = b.w / 2;
        const halfH = b.h / 2;

        const rotGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
        rotGrad.addColorStop(0, '#533614');
        rotGrad.addColorStop(0.6, '#37200b');
        rotGrad.addColorStop(1, '#1e0e04');
        ctx.fillStyle = rotGrad;
        ctx.fillRect(-halfW, -halfH, b.w, b.h);

        ctx.strokeStyle = '#150901';
        ctx.lineWidth = 2.2;
        ctx.strokeRect(-halfW, -halfH, b.w, b.h);

        ctx.strokeStyle = '#0f0501';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-halfW + 6, -halfH);
        ctx.lineTo(4, 0);
        ctx.lineTo(-halfW + 10, halfH);
        ctx.stroke();

        ctx.restore();

        // Piana jeśli klocek wpadł do rzeki
        if (b.y + b.h >= 1300) {
          ctx.save();
          ctx.strokeStyle = 'rgba(195, 240, 255, 0.75)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.ellipse(bcx, 1306, b.w * 0.7, 4, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // 5. Oznaczenie wejściowe na gruntowej krawędzi rampy
    const entryX = isLeft ? 1150 : 3250;
    const entryY = 1200;
    ctx.fillStyle = '#3a200a';
    ctx.fillRect(entryX - 6, entryY - 45, 12, 45);
    ctx.strokeStyle = '#1a0e05';
    ctx.lineWidth = 2;
    ctx.strokeRect(entryX - 6, entryY - 45, 12, 45);

    // Kute zwieńczenie słupa (bez pomarańczowych poświat)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(entryX - 8, entryY - 50, 16, 6);
    ctx.restore();
  }

  drawGentleBridgeApproach(true);
  drawGentleBridgeApproach(false);

  // -----------------------------------------------------------------------
  // PLATFORMY DUŻO WYŻEJ NAD POMOSTEM (Y: 620, most Y: 1000)
  // Wiszące w koronach drzew dżungli pomosty taktyczne
  // -----------------------------------------------------------------------
  // -----------------------------------------------------------------------
  // PLATFORMY DUŻO WYŻEJ NAD POMOSTEM (Y: 620, most Y: 1000)
  // Zniszczalne wiszące pomosty taktyczne w koronach drzew (Angry Birds Physics)
  // -----------------------------------------------------------------------
  function drawHighCanopyPlatform(plat) {
    if (!plat) return;
    const px = plat.origX;
    const py = plat.origY;
    const pw = plat.w;
    const ph = plat.h;

    if (px + pw * 2 + 80 < camL || px - pw - 80 > camR) return;

    ctx.save();
    // 1. Długie liny nośne z baldachimu dżungli biegnące prosto do punktów zaczepienia
    const anchorLX = plat.ropeLeft.anchorX || plat.ropeLeft.x;
    const anchorRX = plat.ropeRight.anchorX || plat.ropeRight.x;
    let attachLX = plat.attachLX;
    let attachLY = plat.attachLY;
    let attachRX = plat.attachRX;
    let attachRY = plat.attachRY;

    if (attachLX === undefined || attachLY === undefined || attachRX === undefined || attachRY === undefined) {
      const ropeLen = plat.origY;
      if (plat.isSplit) {
        const swayLX = plat.leftSwayX || 0;
        const swayRX = plat.rightSwayX || 0;
        attachLX = anchorLX + swayLX;
        attachLY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayLX * swayLX)) + (plat.leftBounceY || 0);
        attachRX = anchorRX + swayRX;
        attachRY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayRX * swayRX)) + (plat.rightBounceY || 0);
      } else if (plat.ropeLeft.intact && !plat.ropeRight.intact) {
        const swayX = plat.swayX || 0;
        attachLX = anchorLX + swayX;
        attachLY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayX * swayX)) + (plat.bounceY || 0);
        const relRX = plat.ropeRight.x - plat.ropeLeft.x;
        attachRX = attachLX + relRX * Math.cos(plat.tiltAngle);
        attachRY = attachLY + relRX * Math.sin(plat.tiltAngle);
      } else if (!plat.ropeLeft.intact && plat.ropeRight.intact) {
        const swayX = plat.swayX || 0;
        attachRX = anchorRX + swayX;
        attachRY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayX * swayX)) + (plat.bounceY || 0);
        const relLX = plat.ropeLeft.x - plat.ropeRight.x;
        attachLX = attachRX + relLX * Math.cos(plat.tiltAngle);
        attachLY = attachRY + relLX * Math.sin(plat.tiltAngle);
      } else {
        const platCenterX = plat.origX + plat.w * 0.5 + (plat.swayX || 0);
        const platCenterY = plat.origY + (plat.bounceY || 0);
        const cosA = Math.cos(plat.tiltAngle);
        const sinA = Math.sin(plat.tiltAngle);
        const relLX = plat.ropeLeft.x - (plat.origX + plat.w * 0.5);
        attachLX = platCenterX + relLX * cosA;
        attachLY = platCenterY + relLX * sinA;
        const relRX = plat.ropeRight.x - (plat.origX + plat.w * 0.5);
        attachRX = platCenterX + relRX * cosA;
        attachRY = platCenterY + relRX * sinA;
      }
    }

    // Lewa lina nośna
    if (plat.ropeLeft.intact) {
      ctx.strokeStyle = '#4e3316';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(anchorLX, 0);
      ctx.lineTo(attachLX, attachLY);
      ctx.stroke();

      // Owijające się liany wokół lin
      ctx.strokeStyle = '#3e6822';
      ctx.lineWidth = 2;
      for (let t = 0.15; t <= 0.85; t += 0.18) {
        const lx = anchorLX + (attachLX - anchorLX) * t;
        const ly = attachLY * t;
        ctx.beginPath();
        ctx.arc(lx, ly, 6, 0, Math.PI);
        ctx.stroke();
      }

      // Nacięcia / postrzępienia jeśli lina jest uszkodzona
      if (plat.ropeLeft.hp < plat.ropeLeft.maxHp) {
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.strokeRect(attachLX - 3, attachLY - 25, 6, 12);
      }
    } else {
      // Zerwana lina powiewająca na wietrze z baldachimu
      const vSway = Math.sin(animTime * 3.0 + px * 0.05) * 8;
      ctx.strokeStyle = '#3a200a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(anchorLX, 0);
      ctx.quadraticCurveTo(anchorLX + vSway * 0.5, 45, anchorLX + vSway, 85);
      ctx.stroke();
    }

    // Prawa lina nośna
    if (plat.ropeRight.intact) {
      ctx.strokeStyle = '#4e3316';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(anchorRX, 0);
      ctx.lineTo(attachRX, attachRY);
      ctx.stroke();

      ctx.strokeStyle = '#3e6822';
      ctx.lineWidth = 2;
      for (let t = 0.2; t <= 0.85; t += 0.18) {
        const rx = anchorRX + (attachRX - anchorRX) * t;
        const ry = attachRY * t;
        ctx.beginPath();
        ctx.arc(rx, ry, 6, 0, Math.PI);
        ctx.stroke();
      }

      if (plat.ropeRight.hp < plat.ropeRight.maxHp) {
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.strokeRect(attachRX - 3, attachRY - 25, 6, 12);
      }
    } else {
      const vSway = Math.sin(animTime * 3.0 + px * 0.05 + 1.2) * 8;
      ctx.strokeStyle = '#3a200a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(anchorRX, 0);
      ctx.quadraticCurveTo(anchorRX + vSway * 0.5, 45, anchorRX + vSway, 85);
      ctx.stroke();
    }

    // 2. Kładka i modularne deski pomostu wiszącego
    for (let bIdx = 0; bIdx < plat.blocks.length; bIdx++) {
      const b = plat.blocks[bIdx];
      if (b.x + b.w + 20 < camL || b.x - 20 > camR) continue;

      ctx.save();
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      ctx.translate(cx, cy);
      if (b.angle) {
        ctx.rotate(b.angle);
      }
      const halfW = b.w / 2;
      const halfH = b.h / 2;

      if (b.intact) {
        const platGrad = ctx.createLinearGradient(-halfW, -halfH, -halfW, halfH);
        platGrad.addColorStop(0.0, '#7c582c');
        platGrad.addColorStop(0.5, '#563a18');
        platGrad.addColorStop(1.0, '#35220c');
        ctx.fillStyle = platGrad;
        ctx.fillRect(-halfW, -halfH, b.w, b.h);

        // Szczeble i gwoździe
        ctx.strokeStyle = '#201306';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -halfH);
        ctx.lineTo(0, halfH);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-halfW + 4, -halfH + 3, 2, 2);
        ctx.fillRect(halfW - 6, -halfH + 3, 2, 2);

        // Mech na deskach
        ctx.fillStyle = '#4c802b';
        ctx.fillRect(-halfW, -halfH, b.w, 3.5);

        // Obrys i rim light
        ctx.strokeStyle = '#1b1005';
        ctx.lineWidth = 2;
        ctx.strokeRect(-halfW, -halfH, b.w, b.h);

        ctx.strokeStyle = 'rgba(235, 195, 100, 0.85)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-halfW, -halfH);
        ctx.lineTo(halfW, -halfH);
        ctx.stroke();

        // Pęknięcia jeśli oberwała
        if (b.hp < b.maxHp) {
          ctx.strokeStyle = '#150901';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-halfW + 6, -halfH);
          ctx.lineTo(2, 0);
          ctx.stroke();
        }
      } else {
        // Zniszczona deska (spadająca / unosząca się w wodzie)
        const rotGrad = ctx.createLinearGradient(-halfW, -halfH, -halfW, halfH);
        rotGrad.addColorStop(0, '#533614');
        rotGrad.addColorStop(0.6, '#37200b');
        rotGrad.addColorStop(1, '#1e0e04');
        ctx.fillStyle = rotGrad;
        ctx.fillRect(-halfW, -halfH, b.w, b.h);

        ctx.strokeStyle = '#150901';
        ctx.lineWidth = 2;
        ctx.strokeRect(-halfW, -halfH, b.w, b.h);

        ctx.strokeStyle = '#0f0501';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-halfW + 4, -halfH);
        ctx.lineTo(2, 0);
        ctx.lineTo(-halfW + 6, halfH);
        ctx.stroke();
      }
      ctx.restore();

      // Piana wodna wokół klocka w wodzie
      if (!b.intact && b.y + b.h >= 1300) {
        ctx.save();
        ctx.strokeStyle = 'rgba(195, 240, 255, 0.75)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(cx, 1306, b.w * 0.7, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  // Renderowanie wszystkich 4 wiszących pomostów taktycznych
  for (let pIdx = 0; pIdx < ARENA_3_CANOPY_PLATFORMS.length; pIdx++) {
    drawHighCanopyPlatform(ARENA_3_CANOPY_PLATFORMS[pIdx]);
  }

  // C. MONOLITYCZNE BLOKI KOTWIĄCE I KABLE ODCIĄGOWE (Tension Anchor Blocks & Backstays)
  const anchorLeftX = 1140;
  const anchorLeftY = 1185;
  const anchorRightX = 3260;
  const anchorRightY = 1185;

  function drawAnchorBlock(ax, ay) {
    if (ax + 50 < camL || ax - 50 > camR) return;
    ctx.save();
    // 1. Monolityczny kamienny blok kotwiący wkopany w lity grunt
    const aGrad = ctx.createLinearGradient(ax - 26, ay - 24, ax + 26, ay + 18);
    aGrad.addColorStop(0.0, '#3e473b');
    aGrad.addColorStop(0.5, '#283126');
    aGrad.addColorStop(1.0, '#151b14');
    ctx.fillStyle = aGrad;
    ctx.fillRect(ax - 26, ay - 24, 52, 42);
    ctx.strokeStyle = '#0f140e';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(ax - 26, ay - 24, 52, 42);

    // Warstwa mchu
    ctx.fillStyle = '#4e8d2e';
    ctx.fillRect(ax - 26, ay - 24, 52, 5);

    // Kute żelazne pasy kotwiczne z nitami
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(ax - 22, ay - 14, 44, 9);
    ctx.fillRect(ax - 22, ay + 4, 44, 9);

    // Śruba rzymska (Turnbuckle) i ucho kotwiące ze stali
    ctx.fillStyle = '#475569';
    ctx.fillRect(ax - 7, ay - 34, 14, 14);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(ax - 7, ay - 34, 14, 14);

    // Otwór ściągacza
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(ax - 3, ay - 30, 6, 6);
    ctx.restore();
  }

  drawAnchorBlock(anchorLeftX, anchorLeftY);
  drawAnchorBlock(anchorRightX, anchorRightY);

  // Kable odciągowe od pylonów do bloków kotwiących
  ctx.save();
  ctx.strokeStyle = '#4e3316';
  ctx.lineWidth = 5;
  ctx.beginPath();
  if (ARENA_3_PYLONS.left.intact) {
    ctx.moveTo(pylonLeftX, pylonTopY - 6);
    ctx.lineTo(anchorLeftX, anchorLeftY - 26);
  } else {
    const vSway = Math.sin(animTime * 2.5) * 12;
    ctx.moveTo(anchorLeftX, anchorLeftY - 26);
    ctx.quadraticCurveTo(anchorLeftX + 150, anchorLeftY + 20 + vSway, anchorLeftX + 280, anchorLeftY + 15);
  }
  if (ARENA_3_PYLONS.right.intact) {
    ctx.moveTo(pylonRightX, pylonTopY - 6);
    ctx.lineTo(anchorRightX, anchorRightY - 26);
  } else {
    const vSway = Math.sin(animTime * 2.5 + 1.2) * 12;
    ctx.moveTo(anchorRightX, anchorRightY - 26);
    ctx.quadraticCurveTo(anchorRightX - 150, anchorRightY + 20 + vSway, anchorRightX - 280, anchorRightY + 15);
  }
  ctx.stroke();

  // Druga lina odciągowa (podwójna lina stalowa)
  ctx.strokeStyle = '#2d1c0a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  if (ARENA_3_PYLONS.left.intact) {
    ctx.moveTo(pylonLeftX + 4, pylonTopY - 6);
    ctx.lineTo(anchorLeftX + 3, anchorLeftY - 26);
  }
  if (ARENA_3_PYLONS.right.intact) {
    ctx.moveTo(pylonRightX - 4, pylonTopY - 6);
    ctx.lineTo(anchorRightX - 3, anchorRightY - 26);
  }
  ctx.stroke();
  ctx.restore();

  // D. GŁÓWNE LINY NOŚNE PRZĘSŁA (Łuk paraboliczny od pylonu do pylonu)
  if (bridgeX2 + 80 >= camL && bridgeX1 - 80 <= camR) {
    ctx.save();
    const leftAnchorX = ARENA_3_PYLONS.left.intact ? pylonLeftX : (pylonLeftX + 40);
    const leftAnchorY = ARENA_3_PYLONS.left.intact ? (pylonTopY - 6) : 1150;
    const rightAnchorX = ARENA_3_PYLONS.right.intact ? pylonRightX : (pylonRightX - 40);
    const rightAnchorY = ARENA_3_PYLONS.right.intact ? (pylonTopY - 6) : 1150;
    const midSagY = (ARENA_3_PYLONS.left.intact && ARENA_3_PYLONS.right.intact) ? 970 : 1260;

    // 1. Górna główna lina nośna (Main Cable)
    ctx.strokeStyle = '#5a3b19';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(leftAnchorX, leftAnchorY);
    ctx.quadraticCurveTo(2200, midSagY, rightAnchorX, rightAnchorY);
    ctx.stroke();

    // Ciemna krawędź liny (cień)
    ctx.strokeStyle = '#2c1a0a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftAnchorX, leftAnchorY + 3);
    ctx.quadraticCurveTo(2200, midSagY + 3, rightAnchorX, rightAnchorY + 3);
    ctx.stroke();

    // 2. Dolna lina poręczy (Handrail cable)
    if (ARENA_3_PYLONS.left.intact && ARENA_3_PYLONS.right.intact) {
      ctx.strokeStyle = '#432910';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(bridgeX1 - 10, bridgeY - 35);
      ctx.lineTo(bridgeX2 + 10, bridgeY - 35);
      ctx.stroke();
    }

    // 3. Pionowe wieszaki linowe łączące główną linę z kładką (Vertical Suspenders)
    ctx.strokeStyle = 'rgba(115, 78, 38, 0.85)';
    ctx.lineWidth = 2;
    for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
      const b = ARENA_3_BRIDGE_BLOCKS[i];
      const hx = b.origX + b.w / 2;
      const u = (hx - pylonLeftX) / (pylonRightX - pylonLeftX);
      const cableY = (1 - u) * (1 - u) * leftAnchorY + 2 * (1 - u) * u * midSagY + u * u * rightAnchorY;
      const currentY = b.y + (b.intact ? (b.sag || 0) : 0);

      if (b.intact && b.cableAttached) {
        // Nienaruszona lina nośna
        ctx.beginPath();
        ctx.moveTo(hx, cableY);
        ctx.lineTo(hx, currentY);
        ctx.stroke();

        // Stalowa obejma na desce
        ctx.fillStyle = '#334155';
        ctx.fillRect(hx - 2, currentY - 2, 4, 6);
      } else {
        // Zerwana lina powiewająca na wietrze (frayed cable)
        const vSway = Math.sin(animTime * 3.5 + i * 0.8) * 8;
        ctx.beginPath();
        ctx.moveTo(hx, cableY);
        ctx.quadraticCurveTo(hx + vSway * 0.5, cableY + 18, hx + vSway, cableY + 36);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // E. DREWNIANE MODUŁOWE BELKI MOSTU (24 klocki, Angry Birds Dynamic Destruction)
  for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
    const b = ARENA_3_BRIDGE_BLOCKS[i];
    if (b.x + b.w + 40 < camL || b.x - 40 > camR) continue;

    ctx.save();
    if (b.intact) {
      // 1. NIENARUSZONA BELKA MOSTU (Stabilna część pomostu ze sprężystym uginaniem)
      const currentY = b.y + (b.sag || 0);
      const bGrad = ctx.createLinearGradient(b.x, currentY, b.x, currentY + b.h);
      bGrad.addColorStop(0.0, '#785226');
      bGrad.addColorStop(0.5, '#563814');
      bGrad.addColorStop(1.0, '#362108');
      ctx.fillStyle = bGrad;
      ctx.fillRect(b.x, currentY, b.w, b.h);

      // Słoje i nacięcia drewna
      ctx.strokeStyle = 'rgba(28, 16, 5, 0.65)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(b.x + b.w * 0.5, currentY);
      ctx.lineTo(b.x + b.w * 0.5, currentY + b.h);
      ctx.stroke();

      // Śruby mocujące deski
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(b.x + 3, currentY + 3, 2.5, 2.5);
      ctx.fillRect(b.x + b.w - 5, currentY + 3, 2.5, 2.5);
      ctx.fillRect(b.x + 3, currentY + 12, 2.5, 2.5);
      ctx.fillRect(b.x + b.w - 5, currentY + 12, 2.5, 2.5);

      // Warstwa mchu na górnej krawędzi
      ctx.strokeStyle = '#4d8028';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(b.x, currentY + 1);
      ctx.lineTo(b.x + b.w, currentY + 1);
      ctx.stroke();

      // Jasny rim light
      ctx.strokeStyle = 'rgba(225, 185, 95, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.x, currentY);
      ctx.lineTo(b.x + b.w, currentY);
      ctx.stroke();

      // Obrys belki
      ctx.strokeStyle = '#241405';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(b.x, currentY, b.w, b.h);

      // Zwisające pnącza co kilka segmentów
      if (b.blockIndex % 3 === 0) {
        ctx.strokeStyle = '#32571e';
        ctx.lineWidth = 2.2;
        const vLen = 22 + Math.sin(b.x * 0.15) * 10;
        const vSway = Math.sin(animTime * 2.2 + b.x * 0.05) * 6;
        ctx.beginPath();
        ctx.moveTo(b.x + b.w / 2, currentY + b.h);
        ctx.quadraticCurveTo(b.x + b.w / 2 + vSway * 0.5, currentY + b.h + vLen * 0.5, b.x + b.w / 2 + vSway, currentY + b.h + vLen);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // 2. ODERWANY / ZAWALONY KLOCEK FIZYCZNY (Falling / Floating Rubble)
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      ctx.translate(cx, cy);
      ctx.rotate(b.angle);

      const halfW = b.w / 2;
      const halfH = b.h / 2;

      // Ciemniejsze, wyszczerbione drewno odłamka
      const bGrad = ctx.createLinearGradient(-halfW, -halfH, -halfW, halfH);
      bGrad.addColorStop(0.0, '#664019');
      bGrad.addColorStop(0.5, '#45280c');
      bGrad.addColorStop(1.0, '#231204');
      ctx.fillStyle = bGrad;
      ctx.fillRect(-halfW, -halfH, b.w, b.h);

      // Wyszczerbione, pęknięte krawędzie
      ctx.strokeStyle = '#150901';
      ctx.lineWidth = 2;
      ctx.strokeRect(-halfW, -halfH, b.w, b.h);

      // Pęknięcie w poprzek klocka
      ctx.strokeStyle = '#0f0501';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-halfW + 4, -halfH);
      ctx.lineTo(2, 0);
      ctx.lineTo(-halfW + 6, halfH);
      ctx.stroke();

      // Stalowe okucie lub wygięta klamra
      ctx.fillStyle = '#334155';
      ctx.fillRect(-halfW + 2, -halfH + 2, 4, 4);

      ctx.restore();

      // Piana wodna i fale wokół unoszącego się klocka w rzece
      if (b.y + b.h >= 1300) {
        ctx.save();
        ctx.strokeStyle = 'rgba(195, 240, 255, 0.75)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(cx, 1306, b.w * 0.75, 4.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // F. CZĄSTECZKI DRZAZG DREWNIANYCH (Bridge Splinters)
  for (let i = 0; i < BRIDGE_SPLINTERS.length; i++) {
    const sp = BRIDGE_SPLINTERS[i];
    if (sp.x < camL - 20 || sp.x > camR + 20) continue;
    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.rotate(sp.rot);
    ctx.fillStyle = sp.color;
    ctx.fillRect(-sp.size / 2, -sp.size * 0.3, sp.size, sp.size * 0.6);
    ctx.restore();
  }

  // F2. CZĄSTECZKI ODŁAMKÓW SKALNYCH (Stone Debris)
  for (let i = 0; i < STONE_DEBRIS.length; i++) {
    const sd = STONE_DEBRIS[i];
    if (sd.x < camL - 20 || sd.x > camR + 20) continue;
    ctx.save();
    ctx.translate(sd.x, sd.y);
    ctx.rotate(sd.rot);
    ctx.fillStyle = sd.color;
    ctx.beginPath();
    ctx.moveTo(-sd.size / 2, -sd.size / 2);
    ctx.lineTo(sd.size / 2, -sd.size * 0.3);
    ctx.lineTo(sd.size * 0.3, sd.size / 2);
    ctx.lineTo(-sd.size * 0.4, sd.size * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // F3. ROZBRYZGI WODY W RZECE (Arena 3 Water Splashes)
  for (let i = 0; i < ARENA_3_WATER_SPLASHES.length; i++) {
    const ws = ARENA_3_WATER_SPLASHES[i];
    if (ws.x < camL - 20 || ws.x > camR + 20) continue;
    ctx.save();
    ctx.globalAlpha = ws.alpha;
    ctx.fillStyle = ws.color;
    ctx.beginPath();
    ctx.arc(ws.x, ws.y, ws.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // 7. LIŚCIE OPADAJĄCE NA PIERWSZYM PLANIE (PRZED PLATFORMAMI)
  // -----------------------------------------------------------------------
  for (let i = 1; i < LEAF_PARTICLES.length; i += 2) {
    const leaf = LEAF_PARTICLES[i];
    if (leaf.x < camL - 40 || leaf.x > camR + 40) continue;

    ctx.save();
    ctx.globalAlpha = leaf.alpha;
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.rot + 0.3);
    ctx.fillStyle = leaf.color;
    ctx.strokeStyle = 'rgba(10, 45, 10, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, leaf.size * 1.15, leaf.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

// Pomocnicze funkcje przecięcia promienia pocisku (swept segment)
