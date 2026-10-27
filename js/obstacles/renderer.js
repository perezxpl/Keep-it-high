// =========================================================================
// OBSTACLES/RENDERER.JS - PROCEDURALNE RENDEROWANIE PRZESZKÓD, WYSPA I BRAMEK
// Wydzielony moduł z js/obstacles.js
// =========================================================================

import { ARENA_WIDTH } from '../config.js';
import { drawCaveTerrain, activeArenaId } from '../world.js';
import { arena1State } from '../arenas/arena1.js';
import { normalizeObstacleType } from './palette.js';
import {
  getDiamondPlatePattern,
  getReinforcedConcretePattern,
  getBrushedSteelPattern,
  drawTexturedPlatformBox
} from './materials.js';

const altarShockwaves = [];
export function spawnAltarShockwave(x, y) {
  altarShockwaves.push({
    x,
    y,
    radius: 12,
    maxRadius: 95,
    alpha: 1.0,
    color: '#00e5ff'
  });
}



// =========================================================================
// =========================================================================
// ARENA 3: KANYON W DŻUNGLI / JUNGLE CANYON (3600x1300)
// =========================================================================
// ARENA 3: PODZIEMNA KOPALNIA I SZTOLNIE / MINING CAVERN & SHAFTS (3600x1300)
// =========================================================================


export function drawHazardStripes(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = '#eab308';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#18181b';
  for (let sx = x - h; sx < x + w + h; sx += 12) {
    ctx.beginPath();
    ctx.moveTo(sx, y);
    ctx.lineTo(sx + 6, y);
    ctx.lineTo(sx - 2, y + h);
    ctx.lineTo(sx - 8, y + h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawCrate(ctx, x, y, w, h) {
  ctx.save();

  // 1. Cień rzucany na podłoże
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.beginPath();
  if (ctx.ellipse) {
    ctx.ellipse(x + w / 2, y + h, w * 0.48, 2.5, 0, 0, Math.PI * 2);
  } else {
    ctx.rect(x + 2, y + h - 1, w - 4, 2);
  }
  ctx.fill();

  // 2. Główny korpus skrzyni w kolorystyce wojskowej zieleni (#2d4a22)
  const bodyGrad = ctx.createLinearGradient(x, y, x, y + h);
  bodyGrad.addColorStop(0, '#3a5f2c');   // jaśniejsza krawędź u góry
  bodyGrad.addColorStop(0.35, '#2d4a22'); // wojskowa zieleń wojsk lądowych (#2d4a22)
  bodyGrad.addColorStop(0.85, '#22381a'); // ciemniejszy oliwkowy
  bodyGrad.addColorStop(1, '#182813');   // głęboki cień u dołu
  ctx.fillStyle = bodyGrad;

  const rad = 2.5;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, rad);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.fill();

  // 3. Ciemna obwódka skrzyni
  ctx.strokeStyle = '#121f0e';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // 4. Górne rozjaśnienie pokrywy (bevel)
  ctx.strokeStyle = 'rgba(110, 175, 80, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 1);
  ctx.lineTo(x + w - 2, y + 1);
  ctx.stroke();

  // 5. Pozioma szczelina pokrywy
  const lidH = Math.max(5, Math.round(h * 0.28));
  const seamY = y + lidH;
  ctx.strokeStyle = '#0f1a0b';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x + 1, seamY);
  ctx.lineTo(x + w - 1, seamY);
  ctx.stroke();

  // Odblask pod rowkiem pokrywy
  ctx.strokeStyle = 'rgba(75, 120, 55, 0.45)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + 1, seamY + 1.2);
  ctx.lineTo(x + w - 1, seamY + 1.2);
  ctx.stroke();

  // 6. Stalowe okucia rogów (metalowe narożniki)
  const bracketW = Math.max(3, Math.min(6, w * 0.16));
  const bracketH = Math.max(3, Math.min(5, h * 0.18));
  ctx.fillStyle = '#334155'; // stal grafitowa
  // Lewy górny
  ctx.fillRect(x, y, bracketW, 2);
  ctx.fillRect(x, y, 2, bracketH);
  // Prawy górny
  ctx.fillRect(x + w - bracketW, y, bracketW, 2);
  ctx.fillRect(x + w - 2, y, 2, bracketH);
  // Lewy dolny
  ctx.fillRect(x, y + h - 2, bracketW, 2);
  ctx.fillRect(x, y + h - bracketH, 2, bracketH);
  // Prawy dolny
  ctx.fillRect(x + w - bracketW, y + h - 2, bracketW, 2);
  ctx.fillRect(x + w - 2, y + h - bracketH, 2, bracketH);

  // Nity na narożnikach
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x + 2.5, y + 2.5, 1.2, 1.2);
  ctx.fillRect(x + w - 3.7, y + 2.5, 1.2, 1.2);
  ctx.fillRect(x + 2.5, y + h - 3.7, 1.2, 1.2);
  ctx.fillRect(x + w - 3.7, y + h - 3.7, 1.2, 1.2);

  // 7. Boczne zagłębienia na uchwyty transportowe
  const handleH = Math.max(4, Math.round(h * 0.22));
  const handleY = y + lidH + (h - lidH - handleH) / 2;
  ctx.fillStyle = '#14220f';
  ctx.fillRect(x + 1, handleY, 2, handleH);
  ctx.fillRect(x + w - 3, handleY, 2, handleH);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x + 1.5, handleY + 1, 1, handleH - 2);
  ctx.fillRect(x + w - 2.5, handleY + 1, 1, handleH - 2);

  // 8. Centralna klamra / zamek (metalowy zatrzask)
  const latchW = Math.max(4, Math.min(7, Math.round(w * 0.18)));
  const latchH = Math.max(4, Math.min(6, Math.round(h * 0.22)));
  const latchX = x + (w - latchW) / 2;
  const latchY = seamY - Math.round(latchH * 0.40);

  // Cień pod klamrą
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(latchX - 0.5, latchY + 0.5, latchW + 1, latchH + 1);

  // Płytka zatrzasku ze stali
  const latchGrad = ctx.createLinearGradient(latchX, latchY, latchX + latchW, latchY);
  latchGrad.addColorStop(0, '#94a3b8');
  latchGrad.addColorStop(0.4, '#e2e8f0');
  latchGrad.addColorStop(0.7, '#cbd5e1');
  latchGrad.addColorStop(1, '#64748b');
  ctx.fillStyle = latchGrad;
  ctx.fillRect(latchX, latchY, latchW, latchH);

  // Ramka klamry
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.strokeRect(latchX, latchY, latchW, latchH);

  // Otwór zamka / rygiel
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(latchX + latchW / 2 - 0.6, latchY + latchH * 0.52, 1.2, 1.6);

  // 9. Żółty szablonowy napis "AMMO"
  const textSpaceY = seamY + 1;
  const textSpaceH = h - (seamY - y);
  const fontSize = Math.max(6, Math.min(8, Math.round(w * 0.22)));
  ctx.font = `900 ${fontSize}px "Courier New", Courier, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textY = textSpaceY + textSpaceH / 2 + 0.5;
  const textX = x + w / 2;

  // Cień tekstu dla kontrastu
  ctx.fillStyle = 'rgba(10, 18, 8, 0.85)';
  ctx.fillText('AMMO', textX + 0.6, textY + 0.6);

  // Wojskowy żółty kolor napisu
  ctx.fillStyle = '#facc15';
  ctx.fillText('AMMO', textX, textY);

  ctx.restore();
}

function drawSingleSandbag(ctx, bx, by, bw, bh, isOlive = false) {
  ctx.save();

  // Cień pod workiem
  ctx.fillStyle = 'rgba(20, 16, 10, 0.40)';
  ctx.beginPath();
  if (ctx.ellipse) {
    ctx.ellipse(bx + bw / 2, by + bh, bw * 0.46, 2, 0, 0, Math.PI * 2);
  } else {
    ctx.rect(bx + 1, by + bh - 1, bw - 2, 2);
  }
  ctx.fill();

  // Gradient tkaniny worka (beżowy lub oliwkowy)
  const bagGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
  if (isOlive) {
    bagGrad.addColorStop(0, '#8c8b60');   // oliwkowy rozbłysk
    bagGrad.addColorStop(0.35, '#76744d'); // oliwkowa juta
    bagGrad.addColorStop(0.85, '#5d5c3b'); // cień oliwkowy
    bagGrad.addColorStop(1, '#444329');   // głębokie załamanie
  } else {
    bagGrad.addColorStop(0, '#b8a681');   // piaskowo-beżowy rozbłysk
    bagGrad.addColorStop(0.35, '#9e8c67'); // ciepły beżowy płótno
    bagGrad.addColorStop(0.85, '#7d6d4d'); // ciemniejsza juta
    bagGrad.addColorStop(1, '#574b33');   // załamanie materiału
  }
  ctx.fillStyle = bagGrad;

  // Zaokrąglony kształt worka (poduszkowaty)
  const r = Math.min(5, bh * 0.45);
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(bx, by, bw, bh, r);
  } else {
    ctx.rect(bx, by, bw, bh);
  }
  ctx.fill();

  // Zarys tkaniny (kontur)
  ctx.strokeStyle = isOlive ? '#3c3b24' : '#4d412b';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Górna krawędź światła (rozjaśnienie wypukłości)
  ctx.strokeStyle = isOlive ? 'rgba(195, 195, 150, 0.45)' : 'rgba(235, 220, 185, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx + r, by + 1.2);
  ctx.lineTo(bx + bw - r, by + 1.2);
  ctx.stroke();

  // Związane końce ("uszy" worka na brzegach)
  ctx.fillStyle = isOlive ? '#504f32' : '#635438';
  ctx.beginPath();
  if (ctx.ellipse) {
    ctx.ellipse(bx + 1, by + bh / 2, 1.8, 3, -0.2, 0, Math.PI * 2);
    ctx.ellipse(bx + bw - 1, by + bh / 2, 1.8, 3, 0.2, 0, Math.PI * 2);
  } else {
    ctx.rect(bx, by + bh / 2 - 2, 2, 4);
    ctx.rect(bx + bw - 2, by + bh / 2 - 2, 2, 4);
  }
  ctx.fill();

  // Sznurek / przewiązanie worka
  ctx.fillStyle = '#f5eedb';
  ctx.fillRect(bx + 1.8, by + bh / 2 - 1.5, 0.9, 3);
  ctx.fillRect(bx + bw - 2.7, by + bh / 2 - 1.5, 0.9, 3);

  // Załamania i fałdy tkaniny (naprężenia materiału)
  ctx.strokeStyle = isOlive ? 'rgba(45, 44, 28, 0.35)' : 'rgba(60, 50, 32, 0.35)';
  ctx.lineWidth = 0.9;
  const numCreases = Math.max(2, Math.floor(bw / 12));
  for (let c = 1; c <= numCreases; c++) {
    const cxPos = bx + (bw / (numCreases + 1)) * c;
    ctx.beginPath();
    ctx.moveTo(cxPos - 2, by + 3);
    ctx.quadraticCurveTo(cxPos + 1, by + bh / 2, cxPos - 1, by + bh - 3);
    ctx.stroke();
  }

  // Szew poziomy przez środek worka
  ctx.strokeStyle = isOlive ? 'rgba(35, 34, 20, 0.25)' : 'rgba(50, 40, 24, 0.25)';
  ctx.lineWidth = 0.7;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(bx + 4, by + bh * 0.55);
  ctx.lineTo(bx + bw - 4, by + bh * 0.55);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

export function drawSandbags(ctx, x, y, w, h) {
  ctx.save();

  // Cień ogólny pod barykadą
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.beginPath();
  if (ctx.ellipse) {
    ctx.ellipse(x + w / 2, y + h, w * 0.48, 2.5, 0, 0, Math.PI * 2);
  } else {
    ctx.rect(x + 2, y + h - 2, w - 4, 2);
  }
  ctx.fill();

  // Warstwowy układ stosu worków (staggered stack)
  // Dolna warstwa: 2 worki obok siebie
  // Górna warstwa: 2 worki przesunięte, zachodzące na łączenie
  const rowH = Math.round(h * 0.56);
  const bottomY = y + h - rowH;
  const topY = y;

  const bBagW = Math.round(w * 0.52);

  // Dolne worki: lewy beżowy, prawy oliwkowy
  drawSingleSandbag(ctx, x, bottomY, bBagW, rowH, false);
  drawSingleSandbag(ctx, x + w - bBagW, bottomY, bBagW, rowH, true);

  // Cień rzucany przez górne worki na dolne
  ctx.fillStyle = 'rgba(15, 12, 8, 0.45)';
  ctx.fillRect(x + 4, bottomY - 0.5, w - 8, 2.5);

  // Górne worki: przesunięte, wypełniające stos
  const tBagW = Math.round(w * 0.46);
  const tBagH = Math.round(h * 0.52);
  const tOffset = Math.round((w - (tBagW * 2 - 4)) / 2);

  // Górne worki: lewy oliwkowy, prawy ciepły beż
  drawSingleSandbag(ctx, x + Math.max(2, tOffset), topY, tBagW, tBagH, true);
  drawSingleSandbag(ctx, x + w - Math.max(2, tOffset) - tBagW, topY, tBagW, tBagH, false);

  ctx.restore();
}

export function drawHedgehog(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(-size / 2, size / 2); ctx.lineTo(size / 2, -size / 2);
  ctx.moveTo(-size / 2, -size / 2); ctx.lineTo(size / 2, size / 2);
  ctx.moveTo(0, -size / 2); ctx.lineTo(0, size / 2);
  ctx.stroke();
  ctx.restore();
}

export function drawBunkerBlock(ctx, x, y, w, h) {
  ctx.save();
  drawTexturedPlatformBox(ctx, x, y, w, h, 'concrete', { hasBrackets: true });

  const stripeH = Math.min(10, h * 0.3);
  const stripeY = y + (h - stripeH) / 2;
  drawHazardStripes(ctx, x + 4, stripeY, w - 8, stripeH);

  ctx.fillStyle = '#090d16';
  ctx.fillRect(x + w * 0.25, y + 7, w * 0.5, 4);
  ctx.restore();
}

export function drawCyberCatwalk(ctx, x, y, w, h) {
  ctx.save();
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 25, y); ctx.lineTo(x + 25, y - 180);
  ctx.moveTo(x + w - 25, y); ctx.lineTo(x + w - 25, y - 180);
  ctx.stroke();

  drawTexturedPlatformBox(ctx, x, y, w, h, 'steel', { hasBrackets: true });

  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(x, y, w, 3);

  ctx.fillStyle = 'rgba(6, 182, 212, 0.18)';
  for (let sx = x + 10; sx < x + w - 10; sx += 18) {
    ctx.fillRect(sx, y + 5, 11, h - 8);
  }

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

export function drawNeonBarrier(ctx, x, y, w, h) {
  ctx.save();
  const time = performance.now() * 0.003;
  const pulse = 0.7 + 0.3 * Math.sin(time * 2);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x, y, 6, h);
  ctx.fillRect(x + w - 6, y, 6, h);

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, `rgba(0, 229, 255, ${0.45 * pulse})`);
  grad.addColorStop(0.5, `rgba(168, 85, 247, ${0.30 * pulse})`);
  grad.addColorStop(1, `rgba(0, 229, 255, ${0.45 * pulse})`);
  ctx.fillStyle = grad;
  ctx.fillRect(x + 6, y, w - 12, h);

  ctx.strokeStyle = `rgba(0, 229, 255, ${0.85 * pulse})`;
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  const scanY = y + ((time * 35) % h);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 6, scanY);
  ctx.lineTo(x + w - 6, scanY);
  ctx.stroke();

  ctx.restore();
}

export function drawJumpPad(ctx, x, y, w, h) {
  ctx.save();
  const time = performance.now() * 0.005;

  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y + 4, w, h - 4, 3);
  else ctx.rect(x, y + 4, w, h - 4);
  ctx.fill();
  ctx.stroke();

  const padGrad = ctx.createLinearGradient(x, y, x + w, y);
  padGrad.addColorStop(0, '#10b981');
  padGrad.addColorStop(0.5, '#34d399');
  padGrad.addColorStop(1, '#10b981');
  ctx.fillStyle = padGrad;
  ctx.shadowColor = '#10b981';
  ctx.shadowBlur = 0;
  ctx.fillRect(x + 4, y, w - 8, 4);

  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const wave = Math.sin(time * 3);
  ctx.fillStyle = wave > 0 ? '#ffffff' : '#34d399';
  ctx.fillText('▲  ▲  ▲', x + w / 2, y + h / 2 + 1);

  ctx.restore();
}

export function drawCyberPillar(ctx, x, y, w, h) {
  // Wyłączono rysowanie pionowego słupka
}

export function drawExplosiveBarrel(ctx, x, y, w, h) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#7f1d1d');
  grad.addColorStop(0.3, '#dc2626');
  grad.addColorStop(0.7, '#ef4444');
  grad.addColorStop(1, '#991b1b');
  ctx.fillStyle = grad;
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 3);
  else ctx.rect(x, y, w, h);
  ctx.fill();

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(x, y + 6); ctx.lineTo(x + w, y + 6);
  ctx.moveTo(x, y + h - 6); ctx.lineTo(x + w, y + h - 6);
  ctx.stroke();

  drawHazardStripes(ctx, x + 2, y + h * 0.38, w - 4, 8);

  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 0;
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXP', x + w / 2, y + h * 0.72);

  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

export function drawBarbedWire(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#78716c';
  ctx.strokeStyle = '#292524';
  ctx.lineWidth = 1.2;
  ctx.fillRect(x + 4, y, 5, h);
  ctx.strokeRect(x + 4, y, 5, h);
  ctx.fillRect(x + w - 9, y, 5, h);
  ctx.strokeRect(x + w - 9, y, 5, h);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const cy = y + h / 2;
  for (let i = x + 8; i < x + w - 8; i += 7) {
    ctx.ellipse(i, cy, 3.5, 6, 0.4, 0, Math.PI * 2);
  }
  ctx.stroke();

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = x + 11; i < x + w - 10; i += 10) {
    ctx.moveTo(i - 2, cy - 5); ctx.lineTo(i + 2, cy + 5);
    ctx.moveTo(i - 2, cy + 5); ctx.lineTo(i + 2, cy - 5);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawSniperTower(ctx, x, y, w, h) {
  ctx.save();
  const platH = 14;
  const platY = y;
  const legsTopY = platY + platH;
  const legsBottomY = y + h;

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.0;

  ctx.beginPath();
  ctx.moveTo(x + 12, legsTopY); ctx.lineTo(x + 4, legsBottomY);
  ctx.moveTo(x + w - 12, legsTopY); ctx.lineTo(x + w - 4, legsBottomY);
  ctx.stroke();

  const numSections = 4;
  const secH = (legsBottomY - legsTopY) / numSections;
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = '#64748b';
  for (let s = 0; s < numSections; s++) {
    const sy1 = legsTopY + s * secH;
    const sy2 = sy1 + secH;
    const t1 = s / numSections;
    const t2 = (s + 1) / numSections;
    const lx1 = (x + 12) * (1 - t1) + (x + 4) * t1;
    const rx1 = (x + w - 12) * (1 - t1) + (x + w - 4) * t1;
    const lx2 = (x + 12) * (1 - t2) + (x + 4) * t2;
    const rx2 = (x + w - 12) * (1 - t2) + (x + w - 4) * t2;

    ctx.beginPath();
    ctx.moveTo(lx1, sy1); ctx.lineTo(rx2, sy2);
    ctx.moveTo(rx1, sy1); ctx.lineTo(lx2, sy2);
    ctx.moveTo(lx2, sy2); ctx.lineTo(rx2, sy2);
    ctx.stroke();
  }

  const ladderX = x + w / 2;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ladderX - 5, legsTopY); ctx.lineTo(ladderX - 5, legsBottomY);
  ctx.moveTo(ladderX + 5, legsTopY); ctx.lineTo(ladderX + 5, legsBottomY);
  ctx.stroke();

  ctx.lineWidth = 1.0;
  for (let ly = legsTopY + 10; ly < legsBottomY; ly += 12) {
    ctx.beginPath();
    ctx.moveTo(ladderX - 5, ly); ctx.lineTo(ladderX + 5, ly);
    ctx.stroke();
  }

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x, platY, w, platH);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, platY, w, platH);

  drawHazardStripes(ctx, x, platY + platH - 4, w, 4);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 2, platY - 14); ctx.lineTo(x + w - 2, platY - 14);
  ctx.moveTo(x + 2, platY); ctx.lineTo(x + 2, platY - 14);
  ctx.moveTo(x + w - 2, platY); ctx.lineTo(x + w - 2, platY - 14);
  ctx.moveTo(x + 24, platY); ctx.lineTo(x + 24, platY - 14);
  ctx.moveTo(x + w - 24, platY); ctx.lineTo(x + w - 24, platY - 14);
  ctx.stroke();

  ctx.restore();
}

export function drawMetalRamp(ctx, x, y, w, h, isLeft) {
  ctx.save();
  ctx.beginPath();
  if (isLeft) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
  } else {
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
  }
  ctx.closePath();

  // Wzorzec blachy ryflowanej na pochylni
  const dPattern = getDiamondPlatePattern(ctx);
  if (dPattern) {
    ctx.fillStyle = dPattern;
    ctx.fill();
  }

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, 'rgba(51, 65, 85, 0.45)');
  grad.addColorStop(0.5, 'rgba(30, 41, 59, 0.65)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.2;
  for (let rx = x + 16; rx < x + w - 8; rx += 16) {
    const t = (rx - x) / w;
    const topRampY = isLeft ? (y + t * h) : (y + (1 - t) * h);
    ctx.beginPath();
    ctx.moveTo(rx, topRampY);
    ctx.lineTo(rx, y + h);
    ctx.stroke();
  }

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  if (isLeft) {
    ctx.moveTo(x, y); ctx.lineTo(x + w, y + h);
  } else {
    ctx.moveTo(x, y + h); ctx.lineTo(x + w, y);
  }
  ctx.stroke();

  drawHazardStripes(ctx, x, y + h - 4, w, 4);
  ctx.restore();
}

export function drawTallConcreteWall(ctx, x, y, w, h) {
  ctx.save();
  drawTexturedPlatformBox(ctx, x, y, w, h, 'concrete', { hasBrackets: true });

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x - 2, y, w + 4, 4);

  drawHazardStripes(ctx, x + 2, y + h * 0.45, w - 4, 12);

  ctx.fillStyle = '#0f172a';
  for (let ry = y + 16; ry < y + h - 14; ry += 28) {
    ctx.beginPath();
    ctx.arc(x + w / 2, ry, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawSpeedBoosterPad(ctx, x, y, w, h) {
  ctx.save();
  const time = performance.now() * 0.006;
  ctx.fillStyle = '#090d16';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(x, y, w, h);

  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const offset = Math.floor((time * 15) % 3);
  for (let i = 0; i < 4; i++) {
    const arrowX = x + 14 + i * 16;
    ctx.fillStyle = ((i + offset) % 3 === 0) ? '#ffffff' : '#00e5ff';
    ctx.fillText('▶▶', arrowX, y + h / 2 + 1);
  }
  ctx.restore();
}

export function drawGravityLift(ctx, x, y, w, h) {
  ctx.save();
  const time = performance.now() * 0.003;
  const pulse = 0.6 + 0.4 * Math.sin(time * 3);

  const padH = 10;
  const padY = y + h - padH;
  ctx.fillStyle = '#090d16';
  ctx.fillRect(x, padY, w, padH);
  ctx.strokeStyle = '#a855f7';
  ctx.shadowColor = '#a855f7';
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2.0;
  ctx.strokeRect(x, padY, w, padH);

  const beamGrad = ctx.createLinearGradient(x, padY, x, y);
  beamGrad.addColorStop(0, `rgba(168, 85, 247, ${0.45 * pulse})`);
  beamGrad.addColorStop(0.5, `rgba(0, 229, 255, ${0.30 * pulse})`);
  beamGrad.addColorStop(1, 'rgba(168, 85, 247, 0.0)');
  ctx.fillStyle = beamGrad;
  ctx.fillRect(x + 4, y, w - 8, h - padH);

  ctx.strokeStyle = `rgba(0, 229, 255, ${0.65 * pulse})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 4, padY); ctx.lineTo(x + 4, y);
  ctx.moveTo(x + w - 4, padY); ctx.lineTo(x + w - 4, y);
  ctx.stroke();

  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#00e5ff';
  for (let k = 0; k < 3; k++) {
    const arrowY = padY - (((time * 45 + k * 50) % (h - 20)));
    ctx.fillText('▲', x + w / 2, arrowY);
  }
  ctx.restore();
}

export function drawLaserGate(ctx, x, y, w, h) {
  ctx.save();
  const time = performance.now() * 0.005;
  const pulse = 0.7 + 0.3 * Math.sin(time * 6);

  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 1.5;
  ctx.fillRect(x - 3, y, w + 6, 8);
  ctx.strokeRect(x - 3, y, w + 6, 8);
  ctx.fillRect(x - 3, y + h - 8, w + 6, 8);
  ctx.strokeRect(x - 3, y + h - 8, w + 6, 8);

  const laserGrad = ctx.createLinearGradient(x, y, x + w, y);
  laserGrad.addColorStop(0, `rgba(244, 63, 94, ${0.75 * pulse})`);
  laserGrad.addColorStop(0.5, '#ffffff');
  laserGrad.addColorStop(1, `rgba(244, 63, 94, ${0.75 * pulse})`);
  ctx.fillStyle = laserGrad;
  ctx.shadowColor = '#f43f5e';
  ctx.shadowBlur = 0;
  ctx.fillRect(x + 2, y + 8, w - 4, h - 16);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  for (let ly = y + 14; ly < y + h - 14; ly += 14) {
    const jitter = Math.sin(time * 8 + ly) * 3;
    ctx.moveTo(x, ly);
    ctx.lineTo(x + w + jitter, ly);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawFloatingHex(ctx, x, y, w, h) {
  ctx.save();
  const time = performance.now() * 0.002;
  const pulse = 0.5 + 0.5 * Math.sin(time * 3);
  const cut = 12;

  ctx.beginPath();
  ctx.moveTo(x + cut, y);
  ctx.lineTo(x + w - cut, y);
  ctx.lineTo(x + w, y + h / 2);
  ctx.lineTo(x + w - cut, y + h);
  ctx.lineTo(x + cut, y + h);
  ctx.lineTo(x, y + h / 2);
  ctx.closePath();

  ctx.fillStyle = '#0f172a';
  ctx.fill();

  ctx.strokeStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(x + 20, y + h / 2 - 2, w - 40, 4);

  ctx.fillStyle = `rgba(0, 229, 255, ${0.35 + pulse * 0.35})`;
  ctx.shadowBlur = 0;
  ctx.fillRect(x + cut + 6, y + h, w - 2 * cut - 12, 4);

  ctx.restore();
}

export function drawCyberBumper(ctx, x, y, w, h, hitTimer = 0) {
  ctx.save();
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = (w || 40) / 2;
  const isHit = hitTimer > 0;

  ctx.fillStyle = isHit ? '#ffffff' : '#090d16';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isHit ? '#f43f5e' : '#00e5ff';
  ctx.shadowColor = isHit ? '#f43f5e' : '#00e5ff';
  ctx.shadowBlur = 0;
  ctx.lineWidth = isHit ? 3.5 : 2.5;
  ctx.stroke();

  ctx.strokeStyle = isHit ? '#ffffff' : '#38bdf8';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = isHit ? '#f43f5e' : '#00e5ff';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export const OBSTACLE_RENDERERS = {
  sandbag: drawSandbags,
  sandbags: drawSandbags,
  sand_bag: drawSandbags,
  sand_bags: drawSandbags,
  worki: drawSandbags,
  ammo: drawCrate,
  ammo_crate: drawCrate,
  ammoBox: drawCrate,
  ammobox: drawCrate,
  ammo_depot: drawCrate,
  crate: drawCrate,
  bunker_block: drawBunkerBlock,
  cyber_catwalk: drawCyberCatwalk,
  neon_barrier: drawNeonBarrier,
  jump_pad: drawJumpPad,
  cyber_pillar: drawCyberPillar,
  explosive_barrel: drawExplosiveBarrel,
  barbed_wire: drawBarbedWire,
  sniper_tower: drawSniperTower,
  tall_concrete_wall: drawTallConcreteWall,
  speed_booster_pad: drawSpeedBoosterPad,
  gravity_lift: drawGravityLift,
  laser_gate: drawLaserGate,
  floating_hex: drawFloatingHex
};

export function drawSingleObstacleByType(ctx, type, x, y, w, h, groundY = 500, hitTimer = 0) {
  const norm = normalizeObstacleType(type);

  // Słownik metod renderujących przeszkody
  const renderer = OBSTACLE_RENDERERS[type] || OBSTACLE_RENDERERS[norm];
  if (typeof renderer === 'function') {
    renderer(ctx, x, y, w, h);
    return;
  }

  // Switch / case jako gwarantowany mechanizm renderowania dla wszystkich typów i aliasów
  switch (norm) {
    case 'sandbags':
      drawSandbags(ctx, x, y, w, h);
      break;
    case 'ammo_depot':
      drawCrate(ctx, x, y, w, h);
      break;
    case 'catwalk':
      drawCatwalk(ctx, { x, w, relY: groundY - y, thickness: h }, groundY);
      break;
    case 'hedgehog':
      drawHedgehog(ctx, x + w / 2, y + h / 2, w);
      break;
    case 'bunker_block':
      drawBunkerBlock(ctx, x, y, w, h);
      break;
    case 'cyber_catwalk':
      drawCyberCatwalk(ctx, x, y, w, h);
      break;
    case 'neon_barrier':
      drawNeonBarrier(ctx, x, y, w, h);
      break;
    case 'jump_pad':
      drawJumpPad(ctx, x, y, w, h);
      break;
    case 'cyber_pillar':
      drawCyberPillar(ctx, x, y, w, h);
      break;
    case 'explosive_barrel':
      drawExplosiveBarrel(ctx, x, y, w, h);
      break;
    case 'barbed_wire':
      drawBarbedWire(ctx, x, y, w, h);
      break;
    case 'sniper_tower':
      drawSniperTower(ctx, x, y, w, h);
      break;
    case 'metal_ramp_left':
      drawMetalRamp(ctx, x, y, w, h, true);
      break;
    case 'metal_ramp_right':
      drawMetalRamp(ctx, x, y, w, h, false);
      break;
    case 'tall_concrete_wall':
      drawTallConcreteWall(ctx, x, y, w, h);
      break;
    case 'speed_booster_pad':
      drawSpeedBoosterPad(ctx, x, y, w, h);
      break;
    case 'gravity_lift':
      drawGravityLift(ctx, x, y, w, h);
      break;
    case 'laser_gate':
      drawLaserGate(ctx, x, y, w, h);
      break;
    case 'floating_hex':
      drawFloatingHex(ctx, x, y, w, h);
      break;
    case 'cyber_bumper':
      drawCyberBumper(ctx, x, y, w, h, hitTimer);
      break;
    case 'wooden_ladder':
      drawWoodenLadder(ctx, x, y, w, h);
      break;
    case 'jungle_hut':
      drawJungleHutObstacle(ctx, x, y, w, h);
      break;
    case 'jungle_rock':
      drawJungleRockObstacle(ctx, x, y, w, h);
      break;
    default:
      if (type === 'sandbag' || type === 'sandbags' || type === 'sand_bag' || type === 'sand_bags') {
        drawSandbags(ctx, x, y, w, h);
      } else if (
        type === 'ammo' ||
        type === 'ammo_crate' ||
        type === 'ammoBox' ||
        type === 'ammobox' ||
        type === 'ammo_depot' ||
        type === 'crate'
      ) {
        drawCrate(ctx, x, y, w, h);
      }
      break;
  }
}

/**
 * Procedura renderowania sztucznych konstrukcji drewnianych.
 * Zgodnie z wytycznymi wszystkie drabiny, wieże i wiszące mosty zostały usunięte z jaskini.
 */
export function drawJungleWoodStructure(ctx, plat, groundY) {
  // Wszystkie sztuczne struktury (drabiny, pomosty, kładki wiszące, wieże) zostały usunięte na rzecz surowej, naturalnej groty skalnej
}

/**
 * Renderuje realistyczny drewniany bunkier z bali z wąską strzelnicą i nasypem ziemno-trawiastym
 */
export function drawWoodenLogBunker(ctx, x, y, w, h) {
  ctx.save();
  const logCount = 4;
  const logH = Math.round(h / (logCount + 0.6));

  // Cień bunkra na gruncie
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.fillRect(x + 4, y + h - 2, w - 8, 4);

  // 1. Ściany z ułożonych wzdłużnie bali sosnowych
  for (let i = 0; i < logCount; i++) {
    const ly = y + h - (i + 1) * logH;
    const logGrad = ctx.createLinearGradient(0, ly, 0, ly + logH);
    logGrad.addColorStop(0.0, '#3a2315');
    logGrad.addColorStop(0.35, '#5c3a23');
    logGrad.addColorStop(0.70, '#754b2d');
    logGrad.addColorStop(1.0, '#311d11');
    ctx.fillStyle = logGrad;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, ly, w, logH - 1, 3) : ctx.rect(x, ly, w, logH - 1);
    ctx.fill();

    // Głęboka szczelina / mszyste uszczelnienie między balami
    ctx.strokeStyle = '#180e07';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, ly + logH - 1);
    ctx.lineTo(x + w, ly + logH - 1);
    ctx.stroke();

    // Słoje drewna i spękania
    ctx.strokeStyle = 'rgba(24, 14, 7, 0.55)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(x + 12, ly + logH * 0.45);
    ctx.lineTo(x + w * 0.45, ly + logH * 0.48);
    ctx.moveTo(x + w * 0.6, ly + logH * 0.52);
    ctx.lineTo(x + w - 16, ly + logH * 0.46);
    ctx.stroke();

    // Końcówki bali (czopowe zaciosy na rogach z widocznymi słojami)
    ctx.fillStyle = '#6d4529';
    ctx.beginPath();
    ctx.ellipse(x + 6, ly + logH * 0.5, 4.5, logH * 0.42, 0, 0, Math.PI * 2);
    ctx.ellipse(x + w - 6, ly + logH * 0.5, 4.5, logH * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#24140a';
    ctx.stroke();
  }

  // 2. Pozioma szczelina strzelecka (embrasure)
  const slitW = Math.round(w * 0.44);
  const slitH = Math.round(logH * 0.95);
  const slitX = x + Math.round((w - slitW) / 2);
  const slitY = y + Math.round(h * 0.36);

  // Wnętrze ciemnego bunkra
  ctx.fillStyle = '#0a0d12';
  ctx.fillRect(slitX, slitY, slitW, slitH);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.0;
  ctx.strokeRect(slitX, slitY, slitW, slitH);

  // Stalowa płyta opancerzenia otworu strzelniczego
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(slitX - 2, slitY - 1, slitW + 4, slitH + 2);

  // Stalowe nity opancerzenia
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(slitX - 1, slitY - 1, 2.5, 2.5);
  ctx.fillRect(slitX + slitW - 1.5, slitY - 1, 2.5, 2.5);
  ctx.fillRect(slitX - 1, slitY + slitH - 1.5, 2.5, 2.5);
  ctx.fillRect(slitX + slitW - 1.5, slitY + slitH - 1.5, 2.5, 2.5);

  // 3. Ciężki strop z bali i warstwa skalnego kruszywa / płyt stalowych
  const roofH = 14;
  const roofY = y - 4;
  const roofGrad = ctx.createLinearGradient(0, roofY - roofH, 0, roofY);
  roofGrad.addColorStop(0.0, '#334155');
  roofGrad.addColorStop(0.4, '#1e293b');
  roofGrad.addColorStop(0.85, '#0f172a');
  roofGrad.addColorStop(1.0, '#26160d');
  ctx.fillStyle = roofGrad;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x - 8, roofY - roofH, w + 16, roofH + 6, [4, 4, 2, 2]) : ctx.rect(x - 8, roofY - roofH, w + 16, roofH + 6);
  ctx.fill();

  // Poszarpane odłamki skalnego kruszywa i stalowe nakładki na stropie schronu
  ctx.fillStyle = '#64748b';
  for (let bx = x - 4; bx <= x + w + 4; bx += 10) {
    const th = 4 + ((bx * 17) % 6);
    ctx.beginPath();
    ctx.moveTo(bx, roofY - roofH);
    ctx.lineTo(bx + 2, roofY - roofH - th);
    ctx.lineTo(bx + 4.5, roofY - roofH);
    ctx.closePath();
    ctx.fill();
  }

  // Stalowe okucia i nity stropowe
  ctx.fillStyle = '#94a3b8';
  for (let rx = x; rx <= x + w; rx += 24) {
    ctx.fillRect(rx - 2, roofY - roofH + 2, 4, 3);
  }

  ctx.restore();
}

export function drawSniperTowerStructure(ctx, groundY) {
  // Całkowicie usunięto wieżę szybową / strażniczą na życzenie użytkownika
}

/**
 * Renderuje wagonik górniczy ze stalową kolebą i urobkiem skalnym
 */
export function drawMineOreCart(ctx, x, y) {
  // Koła wagonika
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(x + 10, y + 20, 7, 0, Math.PI * 2);
  ctx.arc(x + 44, y + 20, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Podwozie
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 2, y + 14, 50, 4);

  // Korpus stalowej koleby na urobek
  const cartGrad = ctx.createLinearGradient(x, y, x, y + 15);
  cartGrad.addColorStop(0.0, '#334155');
  cartGrad.addColorStop(0.5, '#1e293b');
  cartGrad.addColorStop(1.0, '#0f172a');
  ctx.fillStyle = cartGrad;

  ctx.beginPath();
  ctx.moveTo(x, y + 1);
  ctx.lineTo(x + 54, y + 1);
  ctx.lineTo(x + 48, y + 14);
  ctx.lineTo(x + 6, y + 14);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Urobek skalny w wagoniku (ciemne bryły antracytu z błyskiem)
  ctx.fillStyle = '#090d14';
  ctx.beginPath();
  ctx.arc(x + 14, y + 1, 8, Math.PI, 0);
  ctx.arc(x + 27, y - 2, 10, Math.PI, 0);
  ctx.arc(x + 40, y + 1, 8, Math.PI, 0);
  ctx.fill();
}

/**
 * Renderuje skrzynkę z dynamitem (TNT)
 */
export function drawDynamiteCrate(ctx, x, y) {
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x, y, 28, 22);
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x, y, 28, 22);

  // Stalowe taśmy spinające
  ctx.fillStyle = '#334155';
  ctx.fillRect(x + 4, y, 3, 22);
  ctx.fillRect(x + 21, y, 3, 22);

  // Czerwone pole ostrzegawcze
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(x + 8, y + 8, 12, 6);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 5px sans-serif';
  ctx.fillText('TNT', x + 9, y + 13);
}

/**
 * Renderuje elementy infrastruktury górniczej, szańce, skrzynie i wagoniki w jaskini
 */
export function drawJungleCanyonProps(ctx, groundY) {
  // 1. Lewy bastion - okop i skrzynia z dynamitem (x: 200, y: 420)
  drawSandbags(ctx, 200, 420 - 26, 100, 26);
  drawDynamiteCrate(ctx, 160, 420 - 22);

  // 2. Szczyt wzgórza / grzbiet pomostu - okop z worków z piaskiem (x: 1720, y: 355)
  drawSandbags(ctx, 1720, 355 - 26, 90, 26);

  // 3. Półka dolna urwiska (Step 1) - szaniec z worków i wagonik z urobkiem (x: 2640, y: 480)
  drawSandbags(ctx, 2640, 480 - 28, 140, 28);
  drawMineOreCart(ctx, 2790, 480 - 26);

  // 4. Półka środkowa urwiska (Step 2) - drewniany schron kopalniany (x: 2890, y: 440)
  drawWoodenLogBunker(ctx, 2890, 440 - 74, 180, 74);
  drawDynamiteCrate(ctx, 3080, 440 - 22);

  // 5. Prawy bastion - okop z worków z piaskiem (x: 3320, y: 420)
  drawSandbags(ctx, 3320, 420 - 26, 110, 26);

  // 6. Wagonik i skrzynia z dynamitem na dnie dolnej sali bojowej (y: 1180)
  drawMineOreCart(ctx, 1450, 1180 - 26);
  drawDynamiteCrate(ctx, 1120, 1180 - 22);
}
export const drawMineCavernProps = drawJungleCanyonProps;

export function drawSubterraneanCorridors(ctx, groundY) {
  // Usunięto sztuczne czarne prostokątne boksy podziemne na życzenie użytkownika
}

export function drawWoodenStiltsAndOverhangBrackets(ctx, groundY) {
  // Usunięto pojedyncze wiszące słupy i wsporniki pod skałami na życzenie użytkownika
}

/**
 * Renderuje organiczne skały dżungli z gradientem (#2A323D do #1A1F26),
 * wtopionymi głazami, pęknięciami, skalnym kruszywem i fundamentami zintegrowanymi z rzeźbą terenu
 */
export function drawJungleRockPlatform(ctx, plat, groundY) {
  ctx.save();
  const time = performance.now() * 0.001;
  const x = plat.x;
  const w = plat.w;
  const bedrockBottomY = groundY + 180; // Lity masyw schodzący w dół w fundamenty

  // 1. ZBUDOWANIE ŚCIEŻKI GÓRNEJ KRAWĘDZI I KORPUSU WIELOKĄTA SKALNEGO
  let polyPoints = [];
  let minY = groundY;

  if (Array.isArray(plat.surfacePoints) && plat.surfacePoints.length >= 2) {
    polyPoints = plat.surfacePoints.map(p => ({
      x: p.x,
      y: p.y !== undefined ? p.y : (groundY - (p.relY || 0))
    }));
  } else if (plat.isSlope) {
    polyPoints = [
      { x: x, y: groundY - plat.startRelY },
      { x: x + w, y: groundY - plat.endRelY }
    ];
  } else {
    const topY = groundY - (plat.relY || 100);
    polyPoints = [
      { x: x, y: topY },
      { x: x + w, y: topY }
    ];
  }

  for (const pt of polyPoints) {
    if (pt.y < minY) minY = pt.y;
  }

  // 2. PROCEDURALNA TEKSTURA LITEJ SKAŁY, WARSTWY OSADOWE I KRAWĘDZIE GZYMSU
  // Zastąpiono powtarzalne owale/głazy i trójkątne zęby jednolitym systemem geologicznym
  drawCaveTerrain(ctx, polyPoints, bedrockBottomY, groundY);

  // 3. RENDEROWANIE PROPSÓW PRZYPISANYCH DO PLATFORMY (BUNKER, SANDBAGS)
  if (plat.props) {
    for (const prop of plat.props) {
      const px = x + prop.rx;
      let propTopY = groundY - (plat.relY || 100);
      if (polyPoints.length >= 2) {
        if (px <= polyPoints[0].x) propTopY = polyPoints[0].y;
        else if (px >= polyPoints[polyPoints.length - 1].x) propTopY = polyPoints[polyPoints.length - 1].y;
        else {
          for (let i = 0; i < polyPoints.length - 1; i++) {
            const p0 = polyPoints[i];
            const p1 = polyPoints[i + 1];
            if (px >= p0.x && px <= p1.x) {
              const dx = p1.x - p0.x;
              propTopY = dx > 0 ? p0.y + ((px - p0.x) / dx) * (p1.y - p0.y) : p0.y;
              break;
            }
          }
        }
      }
      const bx = x + prop.rx;
      const by = propTopY - prop.h;

      if (prop.type === 'sandbag_trench') {
        drawSandbags(ctx, bx, by, prop.w, prop.h);
      } else if (prop.type === 'wooden_log_bunker') {
        drawWoodenLogBunker(ctx, bx, by, prop.w, prop.h);
      }
    }
  }

  ctx.restore();
}

export function drawWoodenLadder(ctx, x, y, w, h) {
  // Całkowicie usunięto szczeble i konstrukcję drabin na życzenie użytkownika
}

export function drawJungleHutObstacle(ctx, x, y, w, h) {
  drawJungleWoodStructure(ctx, { x, w, relY: 500 - y, thickness: h, isJungleHut: true }, 500);
}

export function drawJungleRockObstacle(ctx, x, y, w, h) {
  drawJungleRockPlatform(ctx, { x, w, relY: 500 - y, thickness: h, theme: 'jungle' }, 500);
}

export function drawRockIsland(ctx, plat, groundY) {
  if (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY') {
    return;
  }
  if (plat.theme === 'jungle') {
    drawJungleRockPlatform(ctx, plat, groundY);
    return;
  }
  const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
  const thick = plat.thickness || 20;

  ctx.save();

  if (plat.isCyberBastion || plat.isBastion) {
    const isCyan = plat.theme === 'cyan';
    const accentCol = isCyan ? '#06b6d4' : '#f97316';
    const accentCore = isCyan ? '#00e5ff' : '#ff7700';

    ctx.fillStyle = '#090d16';
    ctx.fillRect(plat.x, topY, plat.w, thick);
    ctx.strokeStyle = isCyan ? 'rgba(6, 182, 212, 0.4)' : 'rgba(249, 115, 22, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plat.x, topY, plat.w, thick);

    // Jaskrawa neonowa krawędź nawierzchni
    ctx.save();
    ctx.strokeStyle = accentCol;
    ctx.shadowColor = accentCore;
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();

    ctx.strokeStyle = isCyan ? '#a5f3fc' : '#fed7aa';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();
    ctx.restore();

    drawHazardStripes(ctx, plat.x, topY + thick - 5, plat.w, 4);
  } else if (plat.theme === 'foundry') {
    // Korpus platformy zardzewiały
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(plat.x, topY, plat.w, thick);
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plat.x, topY, plat.w, thick);

    // Górna linia i poświata imitujące gorącą stal / ostrzegawcze paski
    const accentCol = '#ea580c';
    const accentCore = '#f97316';

    ctx.save();
    ctx.strokeStyle = accentCol;
    ctx.shadowColor = accentCore;
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();

    ctx.strokeStyle = '#fef08a';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();
    ctx.restore();

    drawHazardStripes(ctx, plat.x, topY + thick - 5, plat.w, 4);
  } else if (plat.isAltar || plat.type === 'altar_island') {
    ctx.fillStyle = '#080c14';
    ctx.fillRect(plat.x, topY, plat.w, thick);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(plat.x, topY, plat.w, thick);

    // Jaskrawa neonowa krawędź ołtarza
    ctx.save();
    ctx.strokeStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();
    ctx.restore();

    drawHazardStripes(ctx, plat.x, topY + thick - 5, plat.w, 4);
  } else {
    const isCyan = (plat.x + plat.w / 2 < 1760);
    const accentCol = isCyan ? '#06b6d4' : '#f97316';
    const accentCore = isCyan ? '#00e5ff' : '#ff7700';

    ctx.fillStyle = '#090d16';
    ctx.fillRect(plat.x, topY, plat.w, thick);
    ctx.strokeStyle = isCyan ? 'rgba(6, 182, 212, 0.4)' : 'rgba(249, 115, 22, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plat.x, topY, plat.w, thick);

    // Jaskrawa neonowa krawędź platformy
    ctx.save();
    ctx.strokeStyle = accentCol;
    ctx.shadowColor = accentCore;
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();

    ctx.strokeStyle = isCyan ? '#a5f3fc' : '#fed7aa';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();
    ctx.restore();

    drawHazardStripes(ctx, plat.x, topY + thick - 4, plat.w, 4);
  }

  if (plat.props) {
    for (let prop of plat.props) {
      const px = plat.x + prop.rx;
      if (prop.type === 'altar_pedestal') {
        const by = topY - prop.h;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px, by, prop.w, prop.h);
        ctx.strokeStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 0;
        ctx.lineWidth = 2.0;
        ctx.strokeRect(px, by, prop.w, prop.h);
        ctx.shadowBlur = 0;
        drawHazardStripes(ctx, px + 8, by + prop.h - 6, prop.w - 16, 4);

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.fillText('ALTAR OF WAR', px + prop.w / 2, by + 16);
      }
    }
  }

  // Poszarpane, okopcone krawędzie krateru i wystające pręty zbrojeniowe
  if (plat.scorchMark || plat.scorchLeft || plat.scorchRight) {
    drawPlatformScorchEdges(ctx, plat.x, topY, plat.w, thick, plat.scorchLeft, plat.scorchRight);
  }

  ctx.restore();
}

/**
 * Rysowanie okopconych, postrzępionych brzegów ocalałej platformy po wybuchu HE
 * wraz z ciemnym gradientem oraz wystającymi metalowymi kikutami/prętami o grubości 1–2px
 */
export function drawPlatformScorchEdges(ctx, x, y, w, h, scorchLeft, scorchRight) {
  if (!scorchLeft && !scorchRight) return;

  ctx.save();

  // 1. Lewa krawędź – poszarpana, okopcona, z wystającymi prętami zbrojeniowymi
  if (scorchLeft) {
    const sootW = Math.min(24, Math.max(12, w * 0.45));
    const grad = ctx.createLinearGradient(x, y, x + sootW, y);
    grad.addColorStop(0.0, 'rgba(10, 15, 26, 0.98)');
    grad.addColorStop(0.45, 'rgba(23, 29, 44, 0.75)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y - 1, sootW, h + 2);

    // Poszarpany profil zniszczonego betonu
    ctx.fillStyle = '#0b0f19';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 3.5, y + h * 0.22);
    ctx.lineTo(x - 1.2, y + h * 0.52);
    ctx.lineTo(x + 4.0, y + h * 0.82);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x - 3, y + h);
    ctx.lineTo(x - 3, y);
    ctx.closePath();
    ctx.fill();

    // Wystające pręty zbrojeniowe / kikuty metalu (1–2px grubości)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + 1, y + h * 0.28);
    ctx.lineTo(x - 6, y + h * 0.20);
    ctx.lineTo(x - 10, y + h * 0.36);
    ctx.moveTo(x + 2, y + h * 0.72);
    ctx.lineTo(x - 7, y + h * 0.80);
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 11, y + h * 0.34, 2.5, 2.5);
    ctx.fillRect(x - 8, y + h * 0.78, 2.5, 2.5);
  }

  // 2. Prawa krawędź – poszarpana, okopcona, z wystającymi prętami
  if (scorchRight) {
    const sootW = Math.min(24, Math.max(12, w * 0.45));
    const rightEdge = x + w;
    const grad = ctx.createLinearGradient(rightEdge, y, rightEdge - sootW, y);
    grad.addColorStop(0.0, 'rgba(10, 15, 26, 0.98)');
    grad.addColorStop(0.45, 'rgba(23, 29, 44, 0.75)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(rightEdge - sootW, y - 1, sootW, h + 2);

    // Poszarpany profil zniszczonego betonu
    ctx.fillStyle = '#0b0f19';
    ctx.beginPath();
    ctx.moveTo(rightEdge, y);
    ctx.lineTo(rightEdge - 3.5, y + h * 0.22);
    ctx.lineTo(rightEdge + 1.2, y + h * 0.52);
    ctx.lineTo(rightEdge - 4.0, y + h * 0.82);
    ctx.lineTo(rightEdge, y + h);
    ctx.lineTo(rightEdge + 3, y + h);
    ctx.lineTo(rightEdge + 3, y);
    ctx.closePath();
    ctx.fill();

    // Wystające pręty zbrojeniowe (1–2px)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(rightEdge - 1, y + h * 0.26);
    ctx.lineTo(rightEdge + 7, y + h * 0.18);
    ctx.lineTo(rightEdge + 11, y + h * 0.34);
    ctx.moveTo(rightEdge - 2, y + h * 0.68);
    ctx.lineTo(rightEdge + 8, y + h * 0.76);
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(rightEdge + 10, y + h * 0.32, 2.5, 2.5);
    ctx.fillRect(rightEdge + 7, y + h * 0.74, 2.5, 2.5);
  }

  ctx.restore();
}

export function drawCatwalk(ctx, cat, groundY) {
  const topY = (cat.y !== undefined) ? cat.y : (groundY - (cat.relY || 0));
  const isFoundry = (cat.theme === 'foundry');
  const isCyan = !isFoundry && (cat.x + cat.w / 2 < 1760);
  const neonCol = isFoundry ? '#ea580c' : (isCyan ? '#06b6d4' : '#f97316');
  const neonCore = isFoundry ? '#f97316' : (isCyan ? '#00e5ff' : '#ff7700');

  ctx.save();

  // Teksturowany korpus kładki z blachy ryflowanej / stali
  drawTexturedPlatformBox(ctx, cat.x, topY, cat.w, cat.thickness, isFoundry ? 'steel' : 'diamond', { hasBrackets: true });

  // Wewnętrzne szczeliny techniczne z podświetleniem huty
  ctx.fillStyle = isFoundry
    ? 'rgba(234, 88, 12, 0.22)'
    : (isCyan ? 'rgba(6, 182, 212, 0.14)' : 'rgba(249, 115, 22, 0.14)');
  for (let hx = cat.x + 8; hx < cat.x + cat.w - 8; hx += 16) {
    ctx.fillRect(hx, topY + 4, 10, cat.thickness - 7);
  }

  // Zewnętrzny obrys techniczny
  ctx.strokeStyle = isFoundry
    ? 'rgba(234, 88, 12, 0.45)'
    : (isCyan ? 'rgba(6, 182, 212, 0.45)' : 'rgba(249, 115, 22, 0.45)');
  ctx.lineWidth = 1.4;
  ctx.strokeRect(cat.x, topY, cat.w, cat.thickness);

  // =========================================================================
  // JASKRAWA, NEONOWA KRAWĘDŹ NAWIERZCHNI PLATFORMY
  // =========================================================================
  ctx.save();
  ctx.strokeStyle = neonCol;
  ctx.shadowColor = neonCore;
  ctx.shadowBlur = 0;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(cat.x, topY);
  ctx.lineTo(cat.x + cat.w, topY);
  ctx.stroke();

  // Wewnętrzny biało-żółty rdzeń świetlny
  ctx.strokeStyle = isFoundry ? '#fef08a' : (isCyan ? '#a5f3fc' : '#fed7aa');
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cat.x, topY);
  ctx.lineTo(cat.x + cat.w, topY);
  ctx.stroke();
  ctx.restore();

  drawHazardStripes(ctx, cat.x, topY + cat.thickness - 4, cat.w, 4);

  // Poszarpane, okopcone krawędzie krateru i wystające pręty zbrojeniowe
  if (cat.scorchMark || cat.scorchLeft || cat.scorchRight) {
    drawPlatformScorchEdges(ctx, cat.x, topY, cat.w, cat.thickness, cat.scorchLeft, cat.scorchRight);
  }

  ctx.restore();
}

function drawBastionSubstructure(ctx, startX, width, topY, bottomY, accentColor) {
  // Wyłączono pionowe słupy i linie akcentowe areny
}

function drawCyberStadiumStructures(ctx, groundY) {
  // Wyłączono pionowe struktury koloseum
}

// =========================================================================
// RENDEROWANIE BRAMEK SPORTOWYCH (CYAN & ORANGE NEON GOALS)
// =========================================================================
export function drawNeonGoals(ctx, groundY, goals) {
  if (!goals || goals.length === 0) return;

  for (const g of goals) {
    if (!g || !g.team) continue;
    const topY = (g.y !== undefined) ? g.y : (groundY - (g.relY || 0));
    const h = g.h || 140;
    const bottomY = (g.bottomY !== undefined) ? g.bottomY : ((g.y !== undefined) ? (g.y + h) : (groundY - (g.relY || 0) + h));
    const leftX = g.x;
    const rightX = g.x + (g.w || 220);
    const w = rightX - leftX;
    const isCyan = g.team === 'CYAN';
    const mainCol = isCyan ? '#00F0FF' : '#FF8800';
    const glowCol = isCyan ? 'rgba(0, 240, 255, 0.85)' : 'rgba(255, 136, 0, 0.85)';

    ctx.save();
    ctx.shadowBlur = 0; // Strictly 0 for 60 FPS

    // 1. Poświata siatki bramki (Neon Net Glow)
    const netGlow = ctx.createLinearGradient(
      g.facing === 1 ? leftX : rightX, bottomY,
      g.facing === 1 ? rightX : leftX, bottomY
    );
    netGlow.addColorStop(0.0, isCyan ? 'rgba(0, 240, 255, 0.28)' : 'rgba(255, 136, 0, 0.28)');
    netGlow.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = netGlow;
    ctx.fillRect(leftX, topY, w, h);

    // 2. Fizyczna siatka bramki (Physical Net Mesh)
    ctx.save();
    ctx.strokeStyle = isCyan ? 'rgba(0, 240, 255, 0.42)' : 'rgba(255, 136, 0, 0.42)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const netStep = 14;
    for (let x = leftX; x <= rightX; x += netStep) {
      ctx.moveTo(x, topY);
      ctx.lineTo(x + (g.facing === 1 ? -10 : 10), bottomY);
    }
    for (let y = topY; y <= bottomY; y += netStep) {
      ctx.moveTo(leftX, y);
      ctx.lineTo(rightX, y);
    }
    ctx.stroke();
    ctx.restore();

    // 3. Neonowe słupki i poprzeczka (Neon Cage Frame)
    ctx.save();
    ctx.strokeStyle = mainCol;
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3.6;

    const mouthX = g.facing === 1 ? rightX : leftX;
    const backX = g.facing === 1 ? leftX : rightX;

    // Klatka bramkowa: wlot, poprzeczka do tyłu, tylny słupek
    ctx.beginPath();
    ctx.moveTo(mouthX, bottomY);
    ctx.lineTo(mouthX, topY);
    ctx.lineTo(backX, topY);
    ctx.lineTo(backX, bottomY);
    ctx.stroke();

    // Dolna poprzeczka
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(backX, bottomY);
    ctx.lineTo(mouthX, bottomY);
    ctx.stroke();

    // Wewnętrzny biały rdzeń
    ctx.strokeStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(mouthX, bottomY);
    ctx.lineTo(mouthX, topY);
    ctx.lineTo(backX, topY);
    ctx.lineTo(backX, bottomY);
    ctx.stroke();
    ctx.restore();

    // 4. Linia bramkowa na wlocie (Goal Line)
    ctx.save();
    ctx.strokeStyle = isCyan ? '#00F0FF' : '#FF8800';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(mouthX, topY);
    ctx.lineTo(mouthX, bottomY);
    ctx.stroke();
    ctx.restore();

    // 5. Etykieta drużyny nad bramką
    ctx.save();
    ctx.fillStyle = mainCol;
    ctx.shadowBlur = 0;
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'center';
    const tagText = isCyan ? '◄ CYAN GOAL' : 'ORANGE GOAL ►';
    ctx.fillText(tagText, (leftX + rightX) / 2, topY - 8);
    ctx.restore();

    ctx.restore();
  }
}

export function drawAltarSpotlightAndLevitation(ctx, groundY) {
  const centerX = ARENA_WIDTH / 2; // 1800
  const altarX = arena1State.altarX || centerX;
  const platformY = arena1State.altarPlatformY || 680;
  const hoverBaseY = arena1State.altarY || 570;
  const hoverY = hoverBaseY + Math.sin(performance.now() * 0.003) * 5;
  const gantryY = 0;
  const time = performance.now() * 0.001;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.shadowBlur = 0; // Strictly 0 for 60 FPS

  const beamTopW = 60;
  const beamBottomW = 260;

  // Pionowy snop światła (spotlight) - oś musi pokrywać się dokładnie ze środkiem platformy (altarX)
  const beamGrad = ctx.createLinearGradient(altarX, gantryY, altarX, platformY);
  beamGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.65)');
  beamGrad.addColorStop(0.12, 'rgba(186, 230, 253, 0.40)');
  beamGrad.addColorStop(0.50, 'rgba(56, 189, 248, 0.22)');
  beamGrad.addColorStop(0.85, 'rgba(0, 240, 255, 0.12)');
  beamGrad.addColorStop(1.0, 'rgba(0, 240, 255, 0.01)');

  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(altarX - beamTopW / 2, gantryY);
  ctx.lineTo(altarX + beamTopW / 2, gantryY);
  ctx.lineTo(altarX + beamBottomW / 2, platformY + 4);
  ctx.lineTo(altarX - beamBottomW / 2, platformY + 4);
  ctx.closePath();
  ctx.fill();

  const coreGrad = ctx.createLinearGradient(altarX, gantryY, altarX, platformY);
  coreGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.85)');
  coreGrad.addColorStop(0.35, 'rgba(224, 242, 254, 0.38)');
  coreGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.moveTo(altarX - 16, gantryY);
  ctx.lineTo(altarX + 16, gantryY);
  ctx.lineTo(altarX + 70, platformY);
  ctx.lineTo(altarX - 70, platformY);
  ctx.closePath();
  ctx.fill();

  // Plama świetlna na cokole (pedestal light pool)
  const poolGrad = ctx.createRadialGradient(altarX, platformY, 10, altarX, platformY, 130);
  poolGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.60)');
  poolGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.35)');
  poolGrad.addColorStop(0.80, 'rgba(0, 240, 255, 0.10)');
  poolGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = poolGrad;
  ctx.beginPath();
  ctx.ellipse(altarX, platformY, 130, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#00F0FF';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(altarX, gantryY + 12, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  if (arena1State.waitingForKickoff) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 3.5);

    ctx.save();
    ctx.shadowBlur = 0;
    const bubbleGrad = ctx.createRadialGradient(altarX, hoverY, 4, altarX, hoverY, 32 + pulse * 6);
    bubbleGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.65)');
    bubbleGrad.addColorStop(0.4, 'rgba(0, 240, 255, 0.35)');
    bubbleGrad.addColorStop(0.8, 'rgba(0, 240, 255, 0.10)');
    bubbleGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bubbleGrad;
    ctx.beginPath();
    ctx.arc(altarX, hoverY, 32 + pulse * 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(0, 240, 255, ${0.75 + pulse * 0.25})`;
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.ellipse(altarX, hoverY, 28 + pulse * 3, 9, time * 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(altarX, hoverY, 28 + pulse * 3, 9, -time * 2.2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 0;
    ctx.fillText('KICKOFF READY', altarX, hoverY - 26);
    ctx.restore();
  }

  for (let i = altarShockwaves.length - 1; i >= 0; i--) {
    const sw = altarShockwaves[i];
    sw.radius += 3.5;
    sw.alpha -= 0.035;

    ctx.save();
    ctx.strokeStyle = sw.color;
    ctx.shadowColor = sw.color;
    ctx.shadowBlur = 0;
    ctx.globalAlpha = Math.max(0, sw.alpha);
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
      altarShockwaves.splice(i, 1);
    }
  }
}

