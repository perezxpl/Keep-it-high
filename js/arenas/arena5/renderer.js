// =========================================================================
// ARENAS/ARENA5/RENDERER.JS - RENDERER PREFABRYKATORA ORBITALNEGO (SEKTOR 05)
// Wizualia: Surowy szyb fabryczny, moduły kontenerowe ISO,
// laserowe wiązki ostrzegawcze suwnic, eksplozje czyszczenia linii i utylizator
// Standard: 60 FPS, Zero Emojis, Military Industrial Aesthetic
// =========================================================================

import {
  CELL_SIZE,
  COLS,
  SHAFT_LEFT,
  SHAFT_RIGHT,
  WALL_WIDTH,
  ARENA_LEFT,
  ARENA_RIGHT,
  BASE_FLOOR_Y,
  getGridX,
  getGridY,
  arena5State
} from './state.js';

/**
 * Renderuje tło szybu fabrycznego przed postaciami
 */
export function drawArena5Background(ctx, camera) {
  if (!ctx || !camera) return;

  const viewWidth = camera.viewWidth || (1920 / (camera.zoom || 0.75));
  const viewHeight = camera.viewHeight || (1080 / (camera.zoom || 0.75));
  const camX = camera.x;
  const camY = camera.y;

  ctx.save();

  // 1. Głębokie, surowe tło przemysłowego silosu orbitalnego
  const bgGrad = ctx.createLinearGradient(camX, camY, camX, camY + viewHeight);
  bgGrad.addColorStop(0, '#060a12');
  bgGrad.addColorStop(0.5, '#0a101d');
  bgGrad.addColorStop(1, '#05070d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(camX - 100, camY - 100, viewWidth + 200, viewHeight + 200);

  // 2. Wewnętrzny szyb: subtelna siatka konstrukcyjna i pionowe szyny suwnicy
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
  ctx.lineWidth = 1.5;

  // Pionowe linie kolumn wewnątrz szybu
  for (let c = 0; c <= COLS; c++) {
    const gx = SHAFT_LEFT + c * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(gx, camY - 100);
    ctx.lineTo(gx, camY + viewHeight + 100);
    ctx.stroke();
  }

  // Poziome dźwigary konstrukcyjne co 200 px
  const startGridY = Math.floor((camY - 100) / 200) * 200;
  for (let gy = startGridY; gy <= camY + viewHeight + 100; gy += 200) {
    ctx.beginPath();
    ctx.moveTo(SHAFT_LEFT, gy);
    ctx.lineTo(SHAFT_RIGHT, gy);
    ctx.stroke();

    // Nitowane węzły konstrukcyjne
    ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.fillRect(SHAFT_LEFT - 4, gy - 4, 8, 8);
    ctx.fillRect(SHAFT_RIGHT - 4, gy - 4, 8, 8);
  }

  // 3. Prowadnice suwnicy wysokociśnieniowej po bokach
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(SHAFT_LEFT - 20, camY - 100, 20, viewHeight + 200);
  ctx.fillRect(SHAFT_RIGHT, camY - 100, 20, viewHeight + 200);

  // Zębate szyny hydrauliczne
  ctx.fillStyle = '#1e293b';
  const startToothY = Math.floor((camY - 100) / 40) * 40;
  for (let ty = startToothY; ty <= camY + viewHeight + 100; ty += 40) {
    ctx.fillRect(SHAFT_LEFT - 16, ty, 12, 18);
    ctx.fillRect(SHAFT_RIGHT + 4, ty, 12, 18);
  }

  ctx.restore();
}

/**
 * Renderuje elementy areny na pierwszym planie (ściany, klocki, lasery ostrzegawcze, utylizator)
 */
export function drawArena5Foreground(ctx, camera) {
  if (!ctx || !camera) return;

  ctx.save();

  // 1. Ściany szybu po lewej i prawej stronie
  drawShaftWalls(ctx, camera);

  // 2. Podłoże bazowe (jeśli jeszcze nie zniknęło pod ekranem)
  drawBaseFloor(ctx);

  // 3. Ułożone klocki w wieży
  drawSettledBlocks(ctx);

  // 4. Laser ostrzegawczy suwnicy i rzutowanie lądowania
  drawCraneWarning(ctx, camera);

  // 5. Spadający kontener
  drawFallingCraneBlock(ctx);

  // 6. Animacje detonacji pełnych linii
  drawLineClearEffects(ctx);

  // 7. Cząsteczki odłamków
  drawDebris(ctx);

  // 8. Dolny utylizator (strefa śmierci)
  drawBottomRecycler(ctx, camera);

  ctx.restore();
}

/**
 * Rysuje pancerne ściany szybu
 */
function drawShaftWalls(ctx, camera) {
  const camY = camera.y;
  const viewHeight = camera.viewHeight || (1080 / (camera.zoom || 0.75));
  const topY = camY - 100;
  const h = viewHeight + 200;

  // Lewa ściana
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(ARENA_LEFT, topY, WALL_WIDTH, h);
  // Prawa ściana
  ctx.fillRect(SHAFT_RIGHT, topY, WALL_WIDTH, h);

  // Żółto-czarne pasy ostrzegawcze na krawędziach wewnętrznych
  drawHazardStripes(ctx, SHAFT_LEFT - 24, topY, 24, h);
  drawHazardStripes(ctx, SHAFT_RIGHT, topY, 24, h);

  // Napisy taktyczne na ścianach
  ctx.save();
  ctx.font = '900 12px monospace';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
  ctx.textAlign = 'center';

  const startTextY = Math.floor(topY / 300) * 300;
  for (let ty = startTextY; ty < topY + h; ty += 300) {
    ctx.fillText('SEKTOR 05 // SZYB PREFABRYKATÓW', ARENA_LEFT + WALL_WIDTH * 0.45, ty);
    ctx.fillText('UWAGA: ZRZUT PIONOWY', SHAFT_RIGHT + WALL_WIDTH * 0.55, ty);
  }
  ctx.restore();
}

/**
 * Rysuje pasy ostrzegawcze (hazard stripes)
 */
function drawHazardStripes(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 10;
  const stripeStep = 24;
  const startY = Math.floor(y / stripeStep) * stripeStep - w;
  for (let sy = startY; sy < y + h + w; sy += stripeStep) {
    ctx.beginPath();
    ctx.moveTo(x - 5, sy);
    ctx.lineTo(x + w + 5, sy + w);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Rysuje płytę fundamentową (startową)
 */
function drawBaseFloor(ctx) {
  if (BASE_FLOOR_Y > arena5State.recyclerY + 250) return;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(SHAFT_LEFT, BASE_FLOOR_Y, COLS * CELL_SIZE, 120);

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.strokeRect(SHAFT_LEFT, BASE_FLOOR_Y, COLS * CELL_SIZE, 120);

  // Górna krawędź fundamentu z fazowaniem
  ctx.fillStyle = '#475569';
  ctx.fillRect(SHAFT_LEFT, BASE_FLOOR_Y, COLS * CELL_SIZE, 6);
}

/**
 * Rysuje wszystkie ułożone klocki w wieży
 */
function drawSettledBlocks(ctx) {
  for (const rowData of arena5State.gridRows.values()) {
    if (!rowData) continue;
    for (let c = 0; c < COLS; c++) {
      const cell = rowData[c];
      if (!cell || cell.hp <= 0) continue;

      drawSingleBlock(ctx, cell.x, cell.y, cell.w, cell.h, cell.material, cell.hp, cell.maxHp);
    }
  }
}

/**
 * Rysuje pojedynczy kafelek kontenera wg jego materiału i stanu uszkodzeń
 */
function drawSingleBlock(ctx, x, y, w, h, material, hp, maxHp) {
  ctx.save();

  if (material === 'STEEL') {
    // Ciężki stalowy kontener ISO
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, w, h);

    // Wewnętrzne wytłoczenia blachy ryflowanej / profilowanej
    ctx.fillStyle = '#0f172a';
    for (let rx = x + 12; rx < x + w - 12; rx += 16) {
      ctx.fillRect(rx, y + 10, 8, h - 20);
    }

    // Wzmocniona rama zewnętrzna i narożniki ISO
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 2, y + 2, 10, 10);
    ctx.fillRect(x + w - 12, y + 2, 10, 10);
    ctx.fillRect(x + 2, y + h - 12, 10, 10);
    ctx.fillRect(x + w - 12, y + h - 12, 10, 10);

    // Oznaczenie taktyczne
    ctx.font = '900 8.5px monospace';
    ctx.fillStyle = 'rgba(234, 179, 8, 0.75)';
    ctx.fillText('PMC-100', x + 16, y + 22);

  } else if (material === 'CONCRETE_CRACKED') {
    // Pęknięty żelbet
    ctx.fillStyle = '#334155';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

    // Widoczne pęknięcia
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x + 15, y + 5);
    ctx.lineTo(x + 40, y + 45);
    ctx.lineTo(x + 30, y + 80);
    ctx.lineTo(x + 65, y + 95);
    ctx.stroke();

    // Sterczące zbrojenie
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w - 8, y + 20);
    ctx.lineTo(x + w + 6, y + 14);
    ctx.stroke();

  } else if (material === 'EXPLOSIVE') {
    // Czerwona skrzynia paliwowa / amunicyjna
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);

    // Żółto-czarne skośne pasy na krawędziach
    drawHazardStripes(ctx, x + 4, y + 4, w - 8, 12);
    drawHazardStripes(ctx, x + 4, y + h - 16, w - 8, 12);

    // Trójkąt ostrzegawczy z wykrzyknikiem w centrum
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y + 28);
    ctx.lineTo(x + w * 0.5 + 20, y + 68);
    ctx.lineTo(x + w * 0.5 - 20, y + 68);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = '900 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', x + w * 0.5, y + 62);

  } else if (material === 'SCAFFOLDING') {
    // Pomost ażurowy / krata podłogowa
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(x, y, w, h);

    // Ażurowa siatka
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1.2;
    for (let gx = x + 10; gx < x + w; gx += 14) {
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + h);
      ctx.stroke();
    }
    for (let gy = y + 10; gy < y + h; gy += 14) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
    }

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }

  // Wskaźnik uszkodzeń (jeśli zdrowie < maxHp)
  if (hp < maxHp) {
    const dmgRatio = Math.max(0, hp / maxHp);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(x + 10, y + h - 10, w - 20, 5);

    ctx.fillStyle = dmgRatio > 0.4 ? '#22c55e' : '#ef4444';
    ctx.fillRect(x + 10, y + h - 10, (w - 20) * dmgRatio, 5);
  }

  ctx.restore();
}

/**
 * Rysuje laser ostrzegawczy i pulsujący obrys lądowania suwnicy
 */
function drawCraneWarning(ctx, camera) {
  const crane = arena5State.crane;
  if (!crane || crane.phase !== 'WARNING' || !crane.shape) return;

  const camY = camera.y;
  const startX = getGridX(crane.col);
  const totalW = crane.shape.w * CELL_SIZE;
  const landY = crane.targetLandY;

  ctx.save();

  // 1. Półprzezroczysty słup światła ostrzegawczego z sufitu
  const pulse = 0.55 + 0.35 * Math.sin(performance.now() * 0.015);
  const beamGrad = ctx.createLinearGradient(startX, camY - 50, startX + totalW, camY - 50);
  beamGrad.addColorStop(0, `rgba(239, 68, 68, ${0.12 * pulse})`);
  beamGrad.addColorStop(0.5, `rgba(239, 68, 68, ${0.28 * pulse})`);
  beamGrad.addColorStop(1, `rgba(239, 68, 68, ${0.12 * pulse})`);

  ctx.fillStyle = beamGrad;
  ctx.fillRect(startX, camY - 100, totalW, landY - (camY - 100));

  // Pionowe linie laserowe po bokach strefy zrzutu
  ctx.strokeStyle = `rgba(239, 68, 68, ${0.85 * pulse})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(startX, camY - 100);
  ctx.lineTo(startX, landY);
  ctx.moveTo(startX + totalW, camY - 100);
  ctx.lineTo(startX + totalW, landY);
  ctx.stroke();

  // 2. Pulsujący rzut lądowania klocka (Footprint)
  for (const cell of crane.shapeCells) {
    const fx = getGridX(crane.col + cell.colRel);
    const fy = landY + (crane.shape.h - 1 - cell.rowRel) * CELL_SIZE;

    ctx.fillStyle = `rgba(239, 68, 68, ${0.22 * pulse})`;
    ctx.fillRect(fx + 2, fy + 2, CELL_SIZE - 4, CELL_SIZE - 4);

    ctx.strokeStyle = `rgba(248, 113, 113, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(fx + 2, fy + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    ctx.setLineDash([]);
  }

  // 3. Etykieta ostrzegawcza
  ctx.font = '900 13px monospace';
  ctx.fillStyle = '#ef4444';
  ctx.textAlign = 'center';
  const labelY = Math.min(landY - 16, camY + 120);
  ctx.fillText(`[ZRZUT: ${(crane.timer).toFixed(1)}s // UWAGA: ZMIAŻDŻENIE]`, startX + totalW * 0.5, labelY);

  ctx.restore();
}

/**
 * Rysuje spadający klocek z suwnicy
 */
function drawFallingCraneBlock(ctx) {
  const crane = arena5State.crane;
  if (!crane || crane.phase !== 'FALLING' || !crane.shape) return;

  ctx.save();
  for (const cell of crane.shapeCells) {
    const bx = getGridX(crane.col + cell.colRel);
    const by = crane.currentY + (crane.shape.h - 1 - cell.rowRel) * CELL_SIZE;

    // Cień i efekt pędu w dół
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(bx, by - 12, CELL_SIZE, 12);

    drawSingleBlock(ctx, bx, by, CELL_SIZE, CELL_SIZE, cell.material, cell.hp, cell.maxHp);
  }
  ctx.restore();
}

/**
 * Rysuje efekty detonacji pełnych linii
 */
function drawLineClearEffects(ctx) {
  for (const clear of arena5State.activeLineClears) {
    const tRatio = clear.timer / clear.maxTimer;
    const ly = clear.y;

    ctx.save();
    // Błysk wybuchu w rzędzie
    ctx.fillStyle = `rgba(251, 191, 36, ${0.6 * tRatio})`;
    ctx.fillRect(SHAFT_LEFT, ly - CELL_SIZE * 0.5, COLS * CELL_SIZE, CELL_SIZE);

    ctx.strokeStyle = `rgba(239, 68, 68, ${tRatio})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(SHAFT_LEFT, ly);
    ctx.lineTo(SHAFT_RIGHT, ly);
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Rysuje odłamki zniszczonych klocków
 */
function drawDebris(ctx) {
  for (const p of arena5State.debrisParticles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color || '#475569';
    ctx.fillRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h);
    ctx.restore();
  }
}

/**
 * Rysuje dolny utylizator (laserową strefę mielenia odpadów)
 */
function drawBottomRecycler(ctx, camera) {
  const bottomY = arena5State.recyclerY;
  // Na starcie rozgrywki (gdy utylizator spoczywa pod ziemią) nie rysujemy strefy śmierci
  if (bottomY >= BASE_FLOOR_Y) return;

  const viewWidth = camera.viewWidth || (1920 / (camera.zoom || 0.75));

  ctx.save();

  // Czerwona poświata dolnej strefy śmierci
  const pulse = 0.75 + 0.25 * Math.sin(performance.now() * 0.02);
  const deathGrad = ctx.createLinearGradient(camera.x, bottomY - 60, camera.x, bottomY + 120);
  deathGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
  deathGrad.addColorStop(0.5, `rgba(220, 38, 38, ${0.55 * pulse})`);
  deathGrad.addColorStop(1, 'rgba(153, 27, 27, 0.95)');

  ctx.fillStyle = deathGrad;
  ctx.fillRect(camera.x - 50, bottomY - 60, viewWidth + 100, 180);

  // Zębate laserowe linie mielenia
  ctx.strokeStyle = `rgba(254, 202, 202, ${pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = camera.x - 50; x < camera.x + viewWidth + 50; x += 30) {
    ctx.moveTo(x, bottomY);
    ctx.lineTo(x + 15, bottomY - 14);
    ctx.lineTo(x + 30, bottomY);
  }
  ctx.stroke();

  // Napis ostrzegawczy na dole
  ctx.font = '900 11px monospace';
  ctx.fillStyle = '#fee2e2';
  ctx.textAlign = 'center';
  ctx.fillText('STREFA UTYLIZACJI // ŚMIERĆ PRZY UPADKU', SHAFT_LEFT + (COLS * CELL_SIZE) * 0.5, bottomY + 22);

  ctx.restore();
}
