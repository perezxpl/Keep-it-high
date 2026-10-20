// =========================================================================
// ARENAS/ARENA3/RENDERER.JS - RENDEROWANIE TŁA I PIERWSZEGO PLANU ARENY 3
// Wydzielony moduł z js/arenas/arena3.js
// =========================================================================

import {
  animTime,
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
  ARENA_3_PLATFORMS,
  GROUND_LEFT_POINTS,
  GROUND_RIGHT_POINTS,
  LEFT_OVAL_POINTS,
  RIGHT_OVAL_POINTS,
  GROUND_WATER_TABLE_Y,
  GROUND_BEDROCK_Y
} from './state.js';

import { drawArena3Background } from './background.js';
export { drawArena3Background };

function drawGroundwaterPool(ctx, seg) {
  if (!seg || seg.length < 2) return;
  const xStart = seg[0].x - 2;
  const xEnd = seg[seg.length - 1].x + 2;

  ctx.save();
  // Woda podziemna / gruntowa
  const poolGrad = ctx.createLinearGradient(0, GROUND_WATER_TABLE_Y, 0, GROUND_BEDROCK_Y);
  poolGrad.addColorStop(0, 'rgba(10, 42, 48, 0.88)');
  poolGrad.addColorStop(1, 'rgba(4, 18, 22, 0.98)');
  ctx.fillStyle = poolGrad;

  ctx.beginPath();
  ctx.moveTo(xStart, GROUND_WATER_TABLE_Y);
  for (let i = 0; i < seg.length; i++) {
    ctx.lineTo(seg[i].x, seg[i].y);
  }
  ctx.lineTo(xEnd, GROUND_WATER_TABLE_Y);
  ctx.closePath();
  ctx.fill();

  // Tafla wody z seledynowo-wodnym rimem
  ctx.strokeStyle = 'rgba(125, 215, 235, 0.75)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(xStart, GROUND_WATER_TABLE_Y);
  ctx.lineTo(xEnd, GROUND_WATER_TABLE_Y);
  ctx.stroke();

  // Ciemny mulisty brzeg przy krawędzi wody
  ctx.fillStyle = '#0a1012';
  ctx.fillRect(xStart - 1, GROUND_WATER_TABLE_Y - 1, 3, 3);
  ctx.fillRect(xEnd - 2, GROUND_WATER_TABLE_Y - 1, 3, 3);

  ctx.restore();
}

function drawCraterWalls(ctx, ovalPoints) {
  if (!ovalPoints || ovalPoints.length < 2) return;

  let inCrater = false;
  let seg = [];

  for (let i = 0; i < ovalPoints.length; i++) {
    const pt = ovalPoints[i];
    const origY = (pt.origY !== undefined) ? pt.origY : 1200;
    if (pt.y > origY + 1.8) {
      if (!inCrater) {
        inCrater = true;
        if (i > 0) seg.push(ovalPoints[i - 1]);
      }
      seg.push(pt);
    } else {
      if (inCrater) {
        seg.push(pt);
        renderCraterSegment(ctx, seg);
        seg = [];
        inCrater = false;
      }
    }
  }
  if (seg.length >= 2) {
    renderCraterSegment(ctx, seg);
  }
}

function renderCraterSegment(ctx, seg) {
  if (seg.length < 2) return;
  ctx.save();

  // 1. Głęboki gradient przypalenia i zwęglenia skały w leju wybuchu
  ctx.strokeStyle = 'rgba(5, 7, 10, 0.95)';
  ctx.lineWidth = 7.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(seg[0].x, seg[0].y);
  for (let i = 1; i < seg.length; i++) {
    ctx.lineTo(seg[i].x, seg[i].y);
  }
  ctx.stroke();

  // 2. Chropowata warstwa zwęglonego bazaltu i spalonej gleby
  ctx.strokeStyle = '#151c24';
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.moveTo(seg[0].x, seg[0].y);
  for (let i = 1; i < seg.length; i++) {
    ctx.lineTo(seg[i].x, seg[i].y);
  }
  ctx.stroke();

  // 3. Spękania geologiczne i postrzępione krawędzie odłamu
  ctx.strokeStyle = '#273444';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(seg[0].x, seg[0].y + 1);
  for (let i = 1; i < seg.length; i++) {
    const pt = seg[i];
    const jag = ((i % 2 === 0) ? 1.8 : -1.2);
    ctx.lineTo(pt.x, pt.y + 1 + jag);
  }
  ctx.stroke();

  // 4. Bryły wyrwanego bazaltu spoczywające na dnie leja
  ctx.fillStyle = '#0a0f15';
  for (let i = 1; i < seg.length - 1; i += 2) {
    const pt = seg[i];
    ctx.beginPath();
    ctx.arc(pt.x + ((i * 13) % 7 - 3), pt.y - 1, 2.5 + ((i * 7) % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Osmolone wargi wlotowe krateru na rzeczywistym poziomie wlotu leja
  const lipL = seg[0];
  const lipR = seg[seg.length - 1];
  ctx.fillStyle = 'rgba(15, 10, 5, 0.85)';
  ctx.beginPath();
  ctx.ellipse(lipL.x, lipL.y, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(lipR.x, lipR.y, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function getSurfaceYFromPoints(pts, x) {
  if (x <= pts[0].x) return pts[0].y;
  if (x >= pts[pts.length - 1].x) return pts[pts.length - 1].y;
  for (let i = 0; i < pts.length - 1; i++) {
    if (x >= pts[i].x && x <= pts[i + 1].x) {
      const dx = pts[i + 1].x - pts[i].x;
      const t = dx > 0 ? (x - pts[i].x) / dx : 0;
      return pts[i].y + t * (pts[i + 1].y - pts[i].y);
    }
  }
  return 1200;
}

function getOrigSurfaceY(x, isL) {
  if (isL) {
    if (x <= 1150) return 1200;
    if (x >= 1750) return 1335;
    for (let i = 0; i < LEFT_OVAL_POINTS.length - 1; i++) {
      const p1 = LEFT_OVAL_POINTS[i];
      const p2 = LEFT_OVAL_POINTS[i + 1];
      if (x >= p1.x && x <= p2.x) {
        const t = (x - p1.x) / (p2.x - p1.x);
        return p1.origY + t * (p2.origY - p1.origY);
      }
    }
    return 1200;
  } else {
    if (x <= 2650) return 1335;
    if (x >= 3250) return 1200;
    for (let i = 0; i < RIGHT_OVAL_POINTS.length - 1; i++) {
      const p1 = RIGHT_OVAL_POINTS[i];
      const p2 = RIGHT_OVAL_POINTS[i + 1];
      if (x >= p1.x && x <= p2.x) {
        const t = (x - p1.x) / (p2.x - p1.x);
        return p1.origY + t * (p2.origY - p1.origY);
      }
    }
    return 1200;
  }
}

// =========================================================================
// GRAFIKA ZNISZCZONYCH ELEMENTÓW (DAMAGED / DESTRUCTIBLE ASSETS)
// Poszarpane, wyszczerbione profile połamanych belek, odłupy skalne,
// zwęglenia po wybuchach i rozplecione liny
// =========================================================================

function drawSplinteredWoodRubble(ctx, cx, cy, w, h, angle, options = {}) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle || 0);

  const halfW = w / 2;
  const halfH = h / 2;
  const seed = options.seed !== undefined ? options.seed : Math.floor(Math.abs(cx * 7 + cy * 13) % 100);
  const isWet = (cy + halfH >= 1290);
  const scorchSide = options.scorchSide || (seed % 2 === 0 ? 'left' : 'right');

  // 1. Poszarpany, wyszczerbiony profil połamanej belki ze sterczącymi drzazgami
  ctx.beginPath();
  // Górna krawędź
  ctx.moveTo(-halfW + 4, -halfH + ((seed % 3) - 1));
  ctx.lineTo(-halfW * 0.3, -halfH + ((seed % 2) - 0.5));
  ctx.lineTo(0, -halfH);
  ctx.lineTo(halfW * 0.4, -halfH + (((seed + 1) % 3) - 1));
  ctx.lineTo(halfW - 3, -halfH + 1);

  // Prawy przełam z ostrymi zębami włókien drewna
  ctx.lineTo(halfW + 5, -halfH * 0.4);
  ctx.lineTo(halfW - 3, -halfH * 0.1);
  ctx.lineTo(halfW + 6, halfH * 0.2);
  ctx.lineTo(halfW - 2, halfH * 0.6);
  ctx.lineTo(halfW + 2, halfH);

  // Dolna krawędź
  ctx.lineTo(halfW * 0.5, halfH + (((seed + 2) % 3) - 1));
  ctx.lineTo(0, halfH);
  ctx.lineTo(-halfW * 0.4, halfH - (seed % 2));
  ctx.lineTo(-halfW + 3, halfH);

  // Lewy przełam ze sterczącymi drzazgami
  ctx.lineTo(-halfW - 3, halfH * 0.5);
  ctx.lineTo(-halfW + 4, halfH * 0.2);
  ctx.lineTo(-halfW - 5, -halfH * 0.2);
  ctx.lineTo(-halfW + 1, -halfH * 0.6);
  ctx.closePath();

  // 2. Wielowarstwowy gradient drewna z pociemnieniem
  const bGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
  if (isWet) {
    bGrad.addColorStop(0.0, '#3f2510');
    bGrad.addColorStop(0.5, '#2b1708');
    bGrad.addColorStop(1.0, '#160a03');
  } else {
    bGrad.addColorStop(0.0, '#664019');
    bGrad.addColorStop(0.4, '#492c10');
    bGrad.addColorStop(0.8, '#2d1807');
    bGrad.addColorStop(1.0, '#1c0d03');
  }
  ctx.fillStyle = bGrad;
  ctx.fill();

  // 3. Zwęglenie i osmolenie po wybuchu (scorch mark)
  const sx = scorchSide === 'left' ? -halfW + 4 : halfW - 4;
  const sGrad = ctx.createRadialGradient(sx, -halfH * 0.2, 2, sx, -halfH * 0.2, w * 0.65);
  sGrad.addColorStop(0.0, 'rgba(10, 5, 2, 0.95)');
  sGrad.addColorStop(0.4, 'rgba(25, 12, 4, 0.75)');
  sGrad.addColorStop(1.0, 'rgba(40, 20, 8, 0.0)');
  ctx.fillStyle = sGrad;
  ctx.fill();

  // 4. Ciemny kontur pęknięć
  ctx.strokeStyle = '#120702';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // 5. Wzdłużne rozwarstwienia słojów drewna
  ctx.strokeStyle = '#0a0401';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-halfW + 8, -halfH * 0.3);
  ctx.lineTo(halfW * 0.2, -halfH * 0.1);
  ctx.lineTo(halfW - 10, -halfH * 0.4);
  ctx.moveTo(-halfW + 12, halfH * 0.3);
  ctx.lineTo(-halfW * 0.1, halfH * 0.15);
  ctx.lineTo(halfW - 6, halfH * 0.4);
  ctx.stroke();

  // Rim light na krawędziach
  ctx.strokeStyle = 'rgba(215, 170, 85, 0.60)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-halfW + 6, -halfH + 1);
  ctx.lineTo(halfW - 6, -halfH + 1);
  ctx.stroke();

  // 6. Stalowe okucie lub wystający zgięty gwóźdź
  if (options.hasMetal !== false) {
    const metalX = (seed % 2 === 0) ? -halfW + 7 : halfW - 11;
    ctx.fillStyle = '#334155';
    ctx.fillRect(metalX, -halfH - 2, 5, 7);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(metalX, -halfH - 2, 5, 7);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(metalX + 2, -halfH - 2);
    ctx.lineTo(metalX + 3, -halfH - 6);
    ctx.lineTo(metalX + 6, -halfH - 7);
    ctx.stroke();

    ctx.fillStyle = 'rgba(146, 64, 14, 0.65)';
    ctx.fillRect(metalX + 1, -halfH + 4, 3, 2.5);
  }

  // 7. Piana wodna i falowanie, gdy leży w rzece
  if (isWet) {
    ctx.strokeStyle = 'rgba(195, 240, 255, 0.75)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, halfH + 2, halfW * 0.85, 3.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawSplinteredRockSlab(ctx, slab) {
  const cx = slab.x + slab.w / 2;
  const cy = slab.y + slab.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(slab.angle);

  const halfW = slab.w / 2;
  const halfH = slab.h / 2;

  // 1. Ostry, kanciasty wielokąt łupanego głazu dolomitowego
  ctx.beginPath();
  ctx.moveTo(-halfW + 10, -halfH + 2);
  ctx.lineTo(-halfW * 0.2, -halfH - 3);
  ctx.lineTo(halfW * 0.4, -halfH + 1);
  ctx.lineTo(halfW - 6, -halfH + 5);
  ctx.lineTo(halfW + 4, 0);
  ctx.lineTo(halfW - 4, halfH - 2);
  ctx.lineTo(halfW * 0.2, halfH + 4);
  ctx.lineTo(-halfW * 0.3, halfH + 2);
  ctx.lineTo(-halfW - 5, halfH - 4);
  ctx.lineTo(-halfW - 2, -halfH * 0.2);
  ctx.closePath();

  // 2. Główny gradient skały
  const rGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
  rGrad.addColorStop(0.0, '#4b574b');
  rGrad.addColorStop(0.35, '#343f34');
  rGrad.addColorStop(0.70, '#202820');
  rGrad.addColorStop(1.0, '#101610');
  ctx.fillStyle = rGrad;
  ctx.fill();

  // 3. Facet lighting (fasetowane cieniowanie ścian odłamu)
  ctx.fillStyle = 'rgba(125, 155, 125, 0.25)';
  ctx.beginPath();
  ctx.moveTo(-halfW + 10, -halfH + 2);
  ctx.lineTo(halfW - 6, -halfH + 5);
  ctx.lineTo(halfW * 0.3, -halfH * 0.2);
  ctx.lineTo(-halfW * 0.2, -halfH * 0.1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(5, 10, 5, 0.55)';
  ctx.beginPath();
  ctx.moveTo(-halfW - 5, halfH - 4);
  ctx.lineTo(halfW - 4, halfH - 2);
  ctx.lineTo(halfW * 0.2, halfH + 4);
  ctx.lineTo(-halfW * 0.3, halfH + 2);
  ctx.closePath();
  ctx.fill();

  // 4. Zwęglenie po wybuchu
  const scorchGrad = ctx.createRadialGradient(-halfW * 0.3, -halfH * 0.3, 3, -halfW * 0.3, -halfH * 0.3, halfW * 0.8);
  scorchGrad.addColorStop(0.0, 'rgba(8, 12, 8, 0.95)');
  scorchGrad.addColorStop(0.5, 'rgba(15, 20, 15, 0.7)');
  scorchGrad.addColorStop(1.0, 'rgba(25, 35, 25, 0.0)');
  ctx.fillStyle = scorchGrad;
  ctx.fill();

  // 5. Ciemny kontur bryły skalnej
  ctx.strokeStyle = '#0b110b';
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // 6. Głębokie spękania skalne
  ctx.strokeStyle = '#070b07';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-halfW + 12, -halfH + 6);
  ctx.lineTo(0, -halfH * 0.1);
  ctx.lineTo(halfW * 0.5, -halfH * 0.3);
  ctx.moveTo(0, -halfH * 0.1);
  ctx.lineTo(-halfW * 0.1, halfH * 0.4);
  ctx.stroke();

  // 7. Skrawki mchu
  ctx.fillStyle = '#3f7023';
  ctx.fillRect(-halfW + 14, -halfH + 3, 16, 3);
  ctx.fillStyle = '#5ca033';
  ctx.fillRect(-halfW + 16, -halfH + 3, 10, 1.8);

  ctx.restore();
}

function drawJungleGrass(ctx, ovalPoints, isL, camL, camR) {
  if (!ovalPoints || ovalPoints.length < 2) return;

  const minX = isL ? 0 : 2650;
  const maxX = isL ? 1680 : 4400; // Przed samą wodą rzeki
  const startX = Math.max(minX, camL - 20);
  const endX = Math.min(maxX, camR + 20);
  if (startX >= endX) return;

  ctx.save();

  // A. Podkładowa warstwa mchu i darni glebowej (tylko na nienaruszonym gruncie, omija kratery)
  ctx.strokeStyle = '#0a160d';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  let inTurf = false;
  for (let i = 0; i < ovalPoints.length; i++) {
    const pt = ovalPoints[i];
    const pOrigY = (pt.origY !== undefined) ? pt.origY : 1200;
    if (pt.y <= pOrigY + 2.0 && pt.y < 1315 && pt.x >= startX - 20 && pt.x <= endX + 20) {
      if (!inTurf) {
        ctx.moveTo(pt.x, pt.y);
        inTurf = true;
      } else {
        ctx.lineTo(pt.x, pt.y);
      }
    } else {
      inTurf = false;
    }
  }
  ctx.stroke();

  ctx.strokeStyle = '#142d1b';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  inTurf = false;
  for (let i = 0; i < ovalPoints.length; i++) {
    const pt = ovalPoints[i];
    const pOrigY = (pt.origY !== undefined) ? pt.origY : 1200;
    if (pt.y <= pOrigY + 2.0 && pt.y < 1315 && pt.x >= startX - 20 && pt.x <= endX + 20) {
      if (!inTurf) {
        ctx.moveTo(pt.x, pt.y - 1);
        inTurf = true;
      } else {
        ctx.lineTo(pt.x, pt.y - 1);
      }
    } else {
      inTurf = false;
    }
  }
  ctx.stroke();

  // B. Generowanie proceduralnych źdźbeł trawy (Grass Blades) i tropikalnych paproci
  const pathDark = new Path2D();
  const pathLush = new Path2D();
  const pathHighlight = new Path2D();
  const pathStubble = new Path2D();

  const ferns = [];

  for (let x = startX; x <= endX; x += 3.4) {
    const y = getSurfaceYFromPoints(ovalPoints, x);

    // Jeśli punkt jest wewnątrz krateru lub głęboko w rzece: BRAK TRAWY!
    const origY = getOrigSurfaceY(x, isL);
    if (y > origY + 2.0 || y > 1315) {
      continue;
    }

    // Sprawdzenie bliskości wargi krateru (opalone, spalone kikuty trawy na krawędzi)
    const yL = getSurfaceYFromPoints(ovalPoints, x - 10);
    const yR = getSurfaceYFromPoints(ovalPoints, x + 10);
    const origYL = getOrigSurfaceY(x - 10, isL);
    const origYR = getOrigSurfaceY(x + 10, isL);
    const isNearCraterLip = (yL > origYL + 2.0 || yR > origYR + 2.0);

    if (isNearCraterLip) {
      // Przypalone, krótkie kikuty trawy (stubble)
      const stubH = 2.5 + Math.abs(Math.sin(x * 7.7)) * 3.5;
      pathStubble.moveTo(x, y);
      pathStubble.lineTo(x + (Math.sin(x * 3.1) * 2), y - stubH);
      continue;
    }

    // Pseudolosowe deterministyczne cechy źdźbła na podstawie X
    const n1 = Math.sin(x * 12.9898 + (isL ? 0.0 : 42.1)) * 43758.5453;
    const f1 = n1 - Math.floor(n1);
    const n2 = Math.sin(x * 78.233 + (isL ? 1.0 : 53.7)) * 43758.5453;
    const f2 = n2 - Math.floor(n2);
    const n3 = Math.sin(x * 45.164 + (isL ? 2.0 : 64.3)) * 43758.5453;
    const f3 = n3 - Math.floor(n3);

    // Wysokość kępki trawy: 9px do 22px
    const bladeH = 9.0 + f1 * 13.0;

    // Falowanie na wietrze zależne od czasu animacji
    const wind = Math.sin(animTime * 2.3 + x * 0.034) * (bladeH * 0.32);
    const lean = (f2 - 0.5) * 5.0;
    const swayX = lean + wind;

    const tipX = x + swayX;
    const tipY = y - bladeH;
    const cpX = x + swayX * 0.45;
    const cpY = y - bladeH * 0.55;

    // 1. Ciemne tło / podszyt
    pathDark.moveTo(x - 0.9, y);
    pathDark.quadraticCurveTo(cpX - 0.5, cpY, tipX - 0.8, tipY + 2);

    // 2. Soczyste, nasycone źdźbło dżungli
    pathLush.moveTo(x, y);
    pathLush.quadraticCurveTo(cpX, cpY, tipX, tipY);

    // 3. Końcówka oświetlona księżycem
    pathHighlight.moveTo(x + 0.9, y - 2);
    pathHighlight.quadraticCurveTo(cpX + 0.6, cpY, tipX + 0.9, tipY - 1);

    // Kępki dzikich paproci dżungli co 38-55 px
    if (f3 > 0.74 && x > minX + 30 && x < maxX - 30) {
      ferns.push({ x, y, f1, f2 });
    }
  }

  // Wyrenderowanie spalonych kikutów przy wargach kraterów
  ctx.strokeStyle = '#1e140d';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.stroke(pathStubble);

  // Warstwa 1: Ciemne podszycie leśne
  ctx.strokeStyle = '#0d2213';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.stroke(pathDark);

  // Warstwa 2: Bogata, żywa dżunglowa zieleń
  ctx.strokeStyle = '#1b4423';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.stroke(pathLush);

  // Warstwa 3: Księżycowe rozświetlenia końcówek traw (delikatny srebrzysty seledyn)
  ctx.strokeStyle = 'rgba(126, 212, 146, 0.75)';
  ctx.lineWidth = 1.1;
  ctx.lineCap = 'round';
  ctx.stroke(pathHighlight);

  // C. Dzikie paprocie dżungli (Jungle Fern Fronds)
  for (const fn of ferns) {
    const fernH = 15 + fn.f1 * 10;
    const dir = fn.f2 > 0.5 ? 1 : -1;
    const fSway = Math.sin(animTime * 2.0 + fn.x * 0.03) * 5;

    ctx.save();
    ctx.strokeStyle = '#173c1f';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(fn.x, fn.y);
    const endFx = fn.x + (dir * (fernH * 0.65)) + fSway;
    const endFy = fn.y - fernH;
    ctx.quadraticCurveTo(fn.x + (dir * (fernH * 0.3)), fn.y - (fernH * 0.6), endFx, endFy);
    ctx.stroke();

    // Listki boczne pióropusza paproci
    ctx.strokeStyle = 'rgba(82, 168, 102, 0.85)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let step = 0.35; step <= 0.9; step += 0.22) {
      const lx = fn.x + (endFx - fn.x) * step;
      const ly = fn.y + (endFy - fn.y) * step;
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + dir * 6 + fSway * 0.3, ly - 3);
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx - dir * 4 + fSway * 0.3, ly - 2);
    }
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

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
    ...GROUND_LEFT_POINTS,
    ...LEFT_OVAL_POINTS.slice(1)
  ];

  const rightOvalPoints = [
    ...RIGHT_OVAL_POINTS.slice(0, -1),
    ...GROUND_RIGHT_POINTS
  ];

  const anchorLeftX = 1140;
  const anchorRightX = 3260;
  const pylonLeftX = 1755;
  const pylonRightX = 2645;
  const pylonTopY = 850;

  // -----------------------------------------------------------------------
  // 1. PODŁOŻE: BAZALTOWY KLIF NADRZECZNY I ZAROŚNIĘTE SKARPY (LEWY I PRAWY BRZEG)
  // Przekształcone w litą formację skalną z prastarymi korzeniami figowców,
  // blokami megalitycznymi, wylotami rurociągów i nocnym mchem z rim-lightingiem
  // -----------------------------------------------------------------------
  function drawBasaltRiverCliff(isLeft, ovalPoints) {
    const isL = isLeft;
    const startX = isL ? 0 : 4400;
    const edgeX = isL ? 1750 : 2650;
    const startY = isL ? ovalPoints[0].y : ovalPoints[ovalPoints.length - 1].y;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(startX, 1400);
    ctx.lineTo(startX, startY);
    if (isL) {
      for (let i = 1; i < ovalPoints.length; i++) {
        ctx.lineTo(ovalPoints[i].x, ovalPoints[i].y);
      }
    } else {
      for (let i = ovalPoints.length - 1; i >= 0; i--) {
        ctx.lineTo(ovalPoints[i].x, ovalPoints[i].y);
      }
    }
    ctx.lineTo(edgeX, 1400);
    ctx.closePath();

    // A. BAZOWY GRADIENT BAZALTOWO-ŁUPKOWY (Głęboka nocna czerń i chłodny grafit)
    const cliffGrad = ctx.createLinearGradient(0, 1200, 0, 1400);
    cliffGrad.addColorStop(0.00, '#131c26');
    cliffGrad.addColorStop(0.20, '#0e161f');
    cliffGrad.addColorStop(0.55, '#090e13');
    cliffGrad.addColorStop(1.00, '#04070a');
    ctx.fillStyle = cliffGrad;
    ctx.fill();

    // B. POZIOME WARSTWY GEOLOGICZNE (STRATA) I SPĘKANIA SKALNE
    // Ścisły clip do sylwetki klifu: żadne linie wewnętrzne nie pojawią się w pustym powietrzu kraterów
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(4, 7, 10, 0.70)';
    ctx.lineWidth = 2.4;
    const strataY = [1235, 1275, 1315, 1355];
    for (let sy of strataY) {
      ctx.beginPath();
      const x0 = isL ? 0 : 2700;
      const x1 = isL ? 1700 : 4400;
      ctx.moveTo(x0, sy);
      for (let sx = x0; sx <= x1; sx += 80) {
        const wave = Math.sin(sx * 0.015 + sy) * 5;
        ctx.lineTo(sx, sy + wave);
      }
      ctx.stroke();
    }
    ctx.restore();

    // C. ŚCIANY WYBITYCH KRATERÓW (Zniszczona, zwęglona skała bazaltowa w lejach)
    drawCraterWalls(ctx, ovalPoints);

    // E. TAKTYCZNA KRATA DRENAŻOWA / WYLOT RUROCIĄGU
    const drainX = isL ? 1520 : 2880;
    const drainY = 1310;
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(drainX, drainY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#020408';
    ctx.beginPath();
    ctx.arc(drainX, drainY, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(drainX - 11, drainY);
    ctx.lineTo(drainX + 11, drainY);
    ctx.moveTo(drainX, drainY - 11);
    ctx.lineTo(drainX, drainY + 11);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      ctx.fillRect(drainX + Math.cos(a) * 13 - 1, drainY + Math.sin(a) * 13 - 1, 2, 2);
    }

    ctx.strokeStyle = 'rgba(30, 80, 115, 0.40)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(drainX, drainY + 11);
    ctx.quadraticCurveTo(drainX + (isL ? 8 : -8), drainY + 25, drainX + (isL ? 15 : -15), 1345);
    ctx.stroke();
    ctx.restore();

    // F. OTOCZAKI BAZALTOWE PRZY WODZIE
    const riverStones = isL ? [
      { x: 1620, y: 1290, rx: 14, ry: 8 },
      { x: 1655, y: 1298, rx: 16, ry: 9 },
      { x: 1690, y: 1308, rx: 18, ry: 10 },
      { x: 1725, y: 1320, rx: 20, ry: 11 },
      { x: 1745, y: 1332, rx: 15, ry: 9 }
    ] : [
      { x: 2660, y: 1332, rx: 15, ry: 9 },
      { x: 2685, y: 1320, rx: 19, ry: 11 },
      { x: 2720, y: 1308, rx: 17, ry: 10 },
      { x: 2755, y: 1298, rx: 16, ry: 9 },
      { x: 2790, y: 1290, rx: 14, ry: 8 }
    ];

    ctx.save();
    for (let st of riverStones) {
      ctx.fillStyle = '#16202b';
      ctx.strokeStyle = '#090e14';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(st.x, st.y, st.rx, st.ry, isL ? 0.1 : -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(186, 230, 253, 0.25)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(st.x, st.y - 1, st.rx * 0.65, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
    ctx.restore();

    // G. KONTUR PODSTAWY
    ctx.strokeStyle = '#05080c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    if (isL) {
      for (let i = 1; i < ovalPoints.length; i++) ctx.lineTo(ovalPoints[i].x, ovalPoints[i].y);
    } else {
      for (let i = ovalPoints.length - 1; i >= 0; i--) ctx.lineTo(ovalPoints[i].x, ovalPoints[i].y);
    }
    ctx.lineTo(edgeX, 1400);
    ctx.stroke();

    // H. GĘSTA, ŻYWA TRAWA DŻUNGLI Z KOŁYSANIEM NA WIETRZE (Tylko nienaruszony grunt, omija kratery)
    drawJungleGrass(ctx, ovalPoints, isL, camL, camR);

    // I. ZALEWY WÓD GRUNTOWYCH W GŁĘBOKICH KRATERACH
    const groundPts = isL ? GROUND_LEFT_POINTS : GROUND_RIGHT_POINTS;
    let poolSeg = [];
    for (let i = 0; i < groundPts.length; i++) {
      const pt = groundPts[i];
      if (pt.y > GROUND_WATER_TABLE_Y) {
        if (poolSeg.length === 0 && i > 0) {
          const prev = groundPts[i - 1];
          const frac = (GROUND_WATER_TABLE_Y - prev.y) / (pt.y - prev.y);
          poolSeg.push({ x: prev.x + (pt.x - prev.x) * frac, y: GROUND_WATER_TABLE_Y });
        }
        poolSeg.push(pt);
      } else if (poolSeg.length > 0) {
        const prev = poolSeg[poolSeg.length - 1];
        const frac = (GROUND_WATER_TABLE_Y - prev.y) / (pt.y - prev.y);
        poolSeg.push({ x: prev.x + (pt.x - prev.x) * frac, y: GROUND_WATER_TABLE_Y });
        drawGroundwaterPool(ctx, poolSeg);
        poolSeg = [];
      }
    }
    if (poolSeg.length > 0) {
      drawGroundwaterPool(ctx, poolSeg);
    }

    ctx.restore();
  }



  function drawRiverWaterZone() {
    if (camL >= 2850 || camR <= 1550) return;

    // A. Wypełnienie toni wodnej (płycizny przy brzegach i mroczna, śmiertelna głębia w środku)
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
  function drawAnchorBlock(ax) {
    if (ax + 50 < camL || ax - 50 > camR) return;
    ctx.save();
    // 1. Monolityczny żelbetonowy filar kotwiący wkopany w lity grunt (od Y: 1180 aż do spągu Y: 1400)
    const blockTopY = 1180;
    const blockBottomY = 1400;
    const blockW = 56;
    const blockLeft = ax - blockW / 2;
    const blockH = blockBottomY - blockTopY;

    // Żelbeton z szalunkiem i chłodnym grafitem
    const aGrad = ctx.createLinearGradient(blockLeft, blockTopY, blockLeft + blockW, blockBottomY);
    aGrad.addColorStop(0.0, '#4e5650');
    aGrad.addColorStop(0.35, '#3a423d');
    aGrad.addColorStop(0.70, '#262d28');
    aGrad.addColorStop(1.0, '#151a16');
    ctx.fillStyle = aGrad;
    ctx.fillRect(blockLeft, blockTopY, blockW, blockH);
    ctx.strokeStyle = '#0f1410';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(blockLeft, blockTopY, blockW, blockH);

    // Poziome linie szalunku deskowania i nity ściągów
    ctx.strokeStyle = 'rgba(15, 20, 16, 0.75)';
    ctx.lineWidth = 1.6;
    for (let sy = blockTopY + 24; sy < blockBottomY; sy += 26) {
      ctx.beginPath();
      ctx.moveTo(blockLeft + 2, sy);
      ctx.lineTo(blockLeft + blockW - 2, sy);
      ctx.stroke();

      ctx.fillStyle = '#111612';
      ctx.fillRect(blockLeft + 8, sy - 13, 4, 4);
      ctx.fillRect(blockLeft + blockW - 12, sy - 13, 4, 4);
    }

    // Ścięta fazowana korona bloku (chamfer)
    ctx.fillStyle = '#657067';
    ctx.beginPath();
    ctx.moveTo(blockLeft, blockTopY + 5);
    ctx.lineTo(blockLeft + 5, blockTopY);
    ctx.lineTo(blockLeft + blockW - 5, blockTopY);
    ctx.lineTo(blockLeft + blockW, blockTopY + 5);
    ctx.closePath();
    ctx.fill();

    // Kute żelazne obejmy wzmacniające z nitami
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(blockLeft - 2, blockTopY + 14, blockW + 4, 10);
    ctx.fillRect(blockLeft - 2, blockTopY + 52, blockW + 4, 10);
    ctx.fillRect(blockLeft - 2, blockTopY + 104, blockW + 4, 10);
    ctx.fillRect(blockLeft - 2, blockTopY + 156, blockW + 4, 10);

    // Śruba rzymska (Turnbuckle) i stalowe ucho kotwiące
    ctx.fillStyle = '#475569';
    ctx.fillRect(ax - 8, blockTopY - 26, 16, 26);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(ax - 8, blockTopY - 26, 16, 26);

    // Otwór ściągacza kabla
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(ax, blockTopY - 14, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawTowerStructure(isLeft) {
    const sideKey = isLeft ? 'left' : 'right';
    const pillar = ARENA_3_TOWER_PILLARS[sideKey];
    const tx = isLeft ? 185 : 4185;
    const tw = 30;
    const ty = 600;
    const th = 600;
    if (tx + tw + 160 < camL || tx - 160 > camR) return;

    ctx.save();
    // A. Kamienno-betonowa podstawa i fundament w głąb gruntu (od Y: 1140 aż do Y: 1400)
    const stoneTopY = ty + th - 60; // 1140
    const stoneBottomY = 1400;
    const stoneH = stoneBottomY - stoneTopY;
    const stoneGrad = ctx.createLinearGradient(tx - 15, stoneTopY, tx + tw + 15, stoneBottomY);
    stoneGrad.addColorStop(0, '#3f4738');
    stoneGrad.addColorStop(0.35, '#2b3325');
    stoneGrad.addColorStop(0.70, '#1b2117');
    stoneGrad.addColorStop(1.0, '#10140e');
    ctx.fillStyle = stoneGrad;
    ctx.fillRect(tx - 12, stoneTopY, tw + 24, stoneH);
    ctx.strokeStyle = '#12170f';
    ctx.lineWidth = 2;
    ctx.strokeRect(tx - 12, stoneTopY, tw + 24, stoneH);

    // Poziome ciosy kamienne i spoiny fundamentu
    ctx.strokeStyle = 'rgba(10, 15, 10, 0.7)';
    ctx.lineWidth = 1.6;
    for (let by = stoneTopY + 28; by < stoneBottomY; by += 28) {
      ctx.beginPath();
      ctx.moveTo(tx - 12, by);
      ctx.lineTo(tx + tw + 12, by);
      ctx.stroke();
    }

    // Mech na cokole
    ctx.fillStyle = '#4d8028';
    ctx.fillRect(tx - 12, stoneTopY, tw + 24, 6);

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
      // A. Wyszczerbiony, postrzępiony kikut przy fundamencie
      ctx.save();
      ctx.fillStyle = '#2d1807';
      ctx.beginPath();
      ctx.moveTo(tx - 10, ty + th - 60);
      ctx.lineTo(tx - 10, ty + th - 95);
      ctx.lineTo(tx - 3, ty + th - 120);
      ctx.lineTo(tx + 5, ty + th - 90);
      ctx.lineTo(tx + 14, ty + th - 130);
      ctx.lineTo(tx + 22, ty + th - 85);
      ctx.lineTo(tx + tw + 10, ty + th - 105);
      ctx.lineTo(tx + tw + 10, ty + th - 60);
      ctx.closePath();
      ctx.fill();

      // Ciemne zwęglenie przełomu
      ctx.fillStyle = 'rgba(8, 4, 1, 0.85)';
      ctx.beginPath();
      ctx.moveTo(tx - 8, ty + th - 80);
      ctx.lineTo(tx + 14, ty + th - 120);
      ctx.lineTo(tx + tw + 8, ty + th - 75);
      ctx.lineTo(tx + tw + 5, ty + th - 60);
      ctx.lineTo(tx - 5, ty + th - 60);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#0c0501';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();

      // B. Przechylony i powalony na ziemię potężny pień słupa ze zgiętymi okuciami
      const dropY = pillar.fallDropY || 0;
      const isL = (sideKey === 'left');
      const shiftX = isL ? dropY * 0.4 : -dropY * 0.4;
      ctx.save();
      ctx.translate(tx + tw / 2 + shiftX, ty + th - 70 + dropY);
      ctx.rotate(pillar.tiltAngle);

      const logLen = th - 90;
      ctx.beginPath();
      ctx.moveTo(-tw / 2, -logLen);
      ctx.lineTo(-tw / 2 + 6, -logLen - 12);
      ctx.lineTo(0, -logLen - 4);
      ctx.lineTo(tw / 2 - 4, -logLen - 15);
      ctx.lineTo(tw / 2, -logLen);
      ctx.lineTo(tw / 2, 0);
      ctx.lineTo(tw / 2 - 6, 14);
      ctx.lineTo(0, 5);
      ctx.lineTo(-tw / 2 + 5, 18);
      ctx.lineTo(-tw / 2, 0);
      ctx.closePath();

      const fallenGrad = ctx.createLinearGradient(-tw / 2, -logLen, tw / 2, 0);
      fallenGrad.addColorStop(0, '#533418');
      fallenGrad.addColorStop(0.5, '#3b220e');
      fallenGrad.addColorStop(1, '#1e0d04');
      ctx.fillStyle = fallenGrad;
      ctx.fill();

      ctx.strokeStyle = '#120702';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Pęknięcia wzdłużne i rozwarstwienia
      ctx.strokeStyle = '#0a0401';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-tw * 0.2, -logLen + 30);
      ctx.lineTo(-tw * 0.1, -logLen * 0.5);
      ctx.lineTo(tw * 0.2, -30);
      ctx.moveTo(tw * 0.25, -logLen + 60);
      ctx.lineTo(tw * 0.15, -logLen * 0.3);
      ctx.stroke();

      // Wygięte pasy kute z nitami
      for (let my = -logLen + 70; my < -30; my += 110) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(-tw / 2 - 4, my, tw + 8, 10);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(-tw / 2 - 4, my, tw + 8, 10);

        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-tw / 2 - 2, my + 2.5, 3, 5);
        ctx.fillRect(tw / 2 - 1, my + 2.5, 3, 5);
      }

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
        drawSplinteredWoodRubble(ctx, cx, cy, b.w, b.h, b.angle, { seed: i * 37 });
      }
      ctx.restore();
    }

    // Podpory pomostu od dołu (drewniane zastrzały)


    ctx.restore();
  }



  // =========================================================================
  // WARSTWA 1: FUNDAMENTY, GŁĘBOKIE SŁUPY I KESONY ZANURZONE W ZIEMI I WODZIE
  // Rysowane PRZED podłożem i wodą - przykrywane przez nienaruszony grunt i wodę,
  // a odsłaniane w wybuchach po zniszczeniu ziemi (kratery) lub w toni rzeki!
  // =========================================================================

  // 1A. Monolityczne żelbetowe bloki kotwiące (X: 1140 oraz X: 3260)
  drawAnchorBlock(anchorLeftX);
  drawAnchorBlock(anchorRightX);

  // 1B. Główne pionowe słupy i kamienne cokoły wież (X: 185 oraz X: 4185)
  drawTowerStructure(true);
  drawTowerStructure(false);

  // 1C. Pylony mostu (wieże A-frame oraz masywne podwodne kesony fundamentowe)
  drawBridgePylon('left');
  drawBridgePylon('right');

  // 1D. Drewniane pale nośne ramp podejściowych zakotwiczone w głąb gruntu
  drawGentleApproachStilts(true);
  drawGentleApproachStilts(false);

  // =========================================================================
  // WARSTWA 2: LITOBRAZALTOWE PODŁOŻE DŻUNGLI I ZAROŚNIĘTE SKARPY
  // Przykrywa podziemne części fundamentów, słupów i kesonów.
  // Gdy wybuch tworzy krater, odsłania ukryte w ziemi struktury!
  // =========================================================================
  if (camL < 1850 && camR > -50) {
    drawBasaltRiverCliff(true, leftOvalPoints);
  }
  if (camL < 4450 && camR > 2600) {
    drawBasaltRiverCliff(false, rightOvalPoints);
  }

  // =========================================================================
  // WARSTWA 3: STREFA WODY - RZEKA I GŁĘBIA ŚMIERTELNA (X: 1600 do 2800)
  // Przykrywa podwodne części kesonów, kamieni i głębi rzeki
  // =========================================================================
  drawRiverWaterZone();

  // =========================================================================
  // WARSTWA 4: POMOSTY, KŁADKI RAMP, GNIAZDA OBSERWACYJNE I LINY NOŚNE
  // =========================================================================
  drawGentleBridgeApproach(true);
  drawGentleBridgeApproach(false);

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
        // Odłamany segment podestu gniazda snajperskiego ze szczątkami balustrady
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        drawSplinteredWoodRubble(ctx, cx, cy, b.w, b.h, b.angle, { seed: i * 43 });
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


        // F. Obrys płyty
        ctx.strokeStyle = '#1b231b';
        ctx.lineWidth = 2.2;
        ctx.strokeRect(px, py, pw, ph);
      } else {
        // Zniszczona płyta skalna - ostry łupany głaz dolomitowy
        drawSplinteredRockSlab(ctx, slab);
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
      // A. Wyszczerbione, postrzępione kikuty włókien tekowych przy szczycie kesonu
      ctx.save();
      ctx.fillStyle = '#3a210b';
      ctx.beginPath();
      ctx.moveTo(px - 26, caissonTopY);
      ctx.lineTo(px - 26, caissonTopY - 32);
      ctx.lineTo(px - 20, caissonTopY - 55);
      ctx.lineTo(px - 14, caissonTopY - 22);
      ctx.lineTo(px - 8, caissonTopY - 45);
      ctx.lineTo(px - 4, caissonTopY - 18);
      ctx.lineTo(px - 4, caissonTopY);
      ctx.closePath();
      ctx.fill();

      // Prawy kikut
      ctx.beginPath();
      ctx.moveTo(px + 4, caissonTopY);
      ctx.lineTo(px + 4, caissonTopY - 20);
      ctx.lineTo(px + 10, caissonTopY - 50);
      ctx.lineTo(px + 16, caissonTopY - 26);
      ctx.lineTo(px + 22, caissonTopY - 60);
      ctx.lineTo(px + 26, caissonTopY - 35);
      ctx.lineTo(px + 26, caissonTopY);
      ctx.closePath();
      ctx.fill();

      // Ciemne osmolenie kikutów po wybuchu
      ctx.fillStyle = 'rgba(10, 5, 2, 0.85)';
      ctx.fillRect(px - 26, caissonTopY - 14, 22, 14);
      ctx.fillRect(px + 4, caissonTopY - 14, 22, 14);

      ctx.strokeStyle = '#120702';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();

      // B. Przechylony i zapadający się w rzece korpus wieży pylonu ze złamanymi belkami
      const dropY = p.fallDropY || 0;
      const isL = (pylonKey === 'left');
      const pivotX = px + (isL ? dropY * 0.35 : -dropY * 0.35);
      const pivotY = caissonTopY - 25 + dropY;

      ctx.save();
      ctx.translate(pivotX, pivotY);
      ctx.rotate(p.tiltAngle);

      const towerLen = caissonTopY - pylonTopY;
      const pFallenGrad = ctx.createLinearGradient(-25, -towerLen, 25, 0);
      pFallenGrad.addColorStop(0, '#533418');
      pFallenGrad.addColorStop(0.5, '#3b220e');
      pFallenGrad.addColorStop(1, '#1e0d04');
      ctx.fillStyle = pFallenGrad;

      // Poszarpana lewa noga
      ctx.beginPath();
      ctx.moveTo(-24, -towerLen);
      ctx.lineTo(-6, -towerLen);
      ctx.lineTo(-6, -25);
      ctx.lineTo(-12, -10);
      ctx.lineTo(-18, -35);
      ctx.lineTo(-24, -18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#150902';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Poszarpana prawa noga
      ctx.beginPath();
      ctx.moveTo(6, -towerLen);
      ctx.lineTo(24, -towerLen);
      ctx.lineTo(24, -20);
      ctx.lineTo(18, -38);
      ctx.lineTo(12, -12);
      ctx.lineTo(6, -28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pęknięty, zwisający rygiel krzyżowy
      ctx.strokeStyle = '#3e240e';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-20, -towerLen + 50);
      ctx.lineTo(10, -towerLen + 100);
      ctx.lineTo(18, -towerLen + 130);
      ctx.stroke();

      // Siodło linowe
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-30, -towerLen - 14, 60, 16);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(-30, -towerLen - 14, 60, 16);

      // Zerwane, rozplecione stalowe liny powiewające od siodła
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-20, -towerLen - 14);
      ctx.quadraticCurveTo(-35, -towerLen + 20, -45, -towerLen + 55);
      ctx.moveTo(20, -towerLen - 14);
      ctx.quadraticCurveTo(35, -towerLen + 20, 48, -towerLen + 60);
      ctx.stroke();
      ctx.restore();

      // C. Piana wodna i fale wokół zatopionego w rzece pylonu
      if (p.collapsed || pivotY >= 1260) {
        const waterImpactX = px + (isL ? 170 : -170);
        ctx.save();
        ctx.strokeStyle = 'rgba(195, 240, 255, 0.75)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(waterImpactX, 1306, 70, 7, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(waterImpactX + (isL ? -40 : 40), 1308, 45, 4.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  }



  // B. ZNISZCZALNE MODUŁOWE RAMPY PODEJŚCIOWE NA MOST (Łączące grunt z kładką)
  function drawGentleApproachStilts(isLeft) {
    const rx1 = isLeft ? 1150 : 2650;
    const rx2 = isLeft ? 1750 : 3250;
    if (rx2 < camL || rx1 > camR) return;

    ctx.save();
    const rampBlocks = ARENA_3_RAMP_BLOCKS.filter(b => isLeft ? b.side === 'left' : b.side === 'right');
    for (let rIdx = 0; rIdx < rampBlocks.length; rIdx++) {
      const b = rampBlocks[rIdx];
      if (b.x + b.w + 40 < camL || b.x - 40 > camR) continue;

      const y1 = getApproachInclineY(b.origX, isLeft);
      const y2 = getApproachInclineY(b.origX + b.w, isLeft);
      const deckBottomY = Math.max(y1, y2) + 12;

      if (b.intact) {
        // Pal nośny (stilt) schodzący od kładki w głąb podłoża aż do spągu Y: 1400
        ctx.strokeStyle = '#38200b';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(b.stiltX, deckBottomY);
        ctx.lineTo(b.stiltX, 1400);
        ctx.stroke();

        ctx.strokeStyle = '#5a3818';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(b.stiltX - 3, deckBottomY);
        ctx.lineTo(b.stiltX - 3, 1400);
        ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.fillRect(b.stiltX - 7, deckBottomY + 6, 14, 7);
      } else {
        // Złamany kikut pala (splintered broken stilt) wkopany w podłoże aż do spągu Y: 1400
        const breakTopY = deckBottomY + 22 + ((b.seed % 17) - 8);
        ctx.strokeStyle = '#2d1808';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(b.stiltX, breakTopY);
        ctx.lineTo(b.stiltX, 1400);
        ctx.stroke();

        ctx.strokeStyle = '#44260f';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(b.stiltX - 3, breakTopY);
        ctx.lineTo(b.stiltX - 3, 1400);
        ctx.stroke();

        // Poszarpana korona złamania ze sterczącymi drzazgami i zwęgleniem
        ctx.fillStyle = '#221104';
        ctx.beginPath();
        ctx.moveTo(b.stiltX - 5, breakTopY + 2);
        ctx.lineTo(b.stiltX - 2, breakTopY - 14);
        ctx.lineTo(b.stiltX + 1, breakTopY - 4);
        ctx.lineTo(b.stiltX + 4, breakTopY - 16);
        ctx.lineTo(b.stiltX + 5, breakTopY + 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(8, 4, 1, 0.90)';
        ctx.fillRect(b.stiltX - 5, breakTopY - 3, 10, 8);
      }
    }
    ctx.restore();
  }

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
        // ZNISZCZONY SEGMENT RAMPY (Poszarpana belka podestu ze zniszczoną listwą antypoślizgową)
        const bcx = b.x + b.w / 2;
        const bcy = b.y + b.h / 2;
        drawSplinteredWoodRubble(ctx, bcx, bcy, b.w, b.h, b.angle, { seed: b.seed });

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
    const entryY = (typeof getRiverbankGroundY === 'function') ? getRiverbankGroundY(entryX) : 1200;
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

      // Nacięcia / postrzępienia jeśli lina jest uszkodzona
      if (plat.ropeLeft.hp < plat.ropeLeft.maxHp) {
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.strokeRect(attachLX - 3, attachLY - 25, 6, 12);
      }
    } else {
      // Zerwana lina powiewająca na wietrze z baldachimu z rozplecionymi włóknami konopnymi
      const vSway = Math.sin(animTime * 3.0 + px * 0.05) * 8;
      ctx.strokeStyle = '#3a200a';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(anchorLX, 0);
      ctx.quadraticCurveTo(anchorLX + vSway * 0.5, 45, anchorLX + vSway, 85);
      ctx.stroke();

      // Rozplecione włókna konopne (frayed rope end)
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(anchorLX + vSway, 85);
      ctx.lineTo(anchorLX + vSway - 5, 96);
      ctx.moveTo(anchorLX + vSway, 85);
      ctx.lineTo(anchorLX + vSway, 98);
      ctx.moveTo(anchorLX + vSway, 85);
      ctx.lineTo(anchorLX + vSway + 6, 95);
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

      if (plat.ropeRight.hp < plat.ropeRight.maxHp) {
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.strokeRect(attachRX - 3, attachRY - 25, 6, 12);
      }
    } else {
      const vSway = Math.sin(animTime * 3.0 + px * 0.05 + 1.2) * 8;
      ctx.strokeStyle = '#3a200a';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(anchorRX, 0);
      ctx.quadraticCurveTo(anchorRX + vSway * 0.5, 45, anchorRX + vSway, 85);
      ctx.stroke();

      // Rozplecione włókna konopne
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(anchorRX + vSway, 85);
      ctx.lineTo(anchorRX + vSway - 5, 96);
      ctx.moveTo(anchorRX + vSway, 85);
      ctx.lineTo(anchorRX + vSway, 98);
      ctx.moveTo(anchorRX + vSway, 85);
      ctx.lineTo(anchorRX + vSway + 6, 95);
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
        ctx.restore();
      } else {
        // Zniszczona deska kładki ze sterczącymi drzazgami
        ctx.restore();
        drawSplinteredWoodRubble(ctx, cx, cy, b.w, b.h, b.angle, { seed: Math.floor(Math.abs(cx * 3)) });
      }

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

  // Kable odciągowe od pylonów do bloków kotwiących (w powietrzu)
  function drawAnchorCables() {
    ctx.save();
    ctx.strokeStyle = '#4e3316';
    ctx.lineWidth = 5;
    ctx.beginPath();
    const anchorCableY = 1154; // Otwór w uchu ściągacza na szczycie bloku kotwiącego
    if (ARENA_3_PYLONS.left.intact) {
      ctx.moveTo(pylonLeftX, pylonTopY - 6);
      ctx.lineTo(anchorLeftX, anchorCableY);
    } else {
      const vSway = Math.sin(animTime * 2.5) * 12;
      ctx.moveTo(anchorLeftX, anchorCableY);
      ctx.quadraticCurveTo(anchorLeftX + 150, anchorCableY + 20 + vSway, anchorLeftX + 280, anchorCableY + 15);
    }
    if (ARENA_3_PYLONS.right.intact) {
      ctx.moveTo(pylonRightX, pylonTopY - 6);
      ctx.lineTo(anchorRightX, anchorCableY);
    } else {
      const vSway = Math.sin(animTime * 2.5 + 1.2) * 12;
      ctx.moveTo(anchorRightX, anchorCableY);
      ctx.quadraticCurveTo(anchorRightX - 150, anchorCableY + 20 + vSway, anchorRightX - 280, anchorCableY + 15);
    }
    ctx.stroke();

    // Druga lina odciągowa (podwójna lina stalowa)
    ctx.strokeStyle = '#2d1c0a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (ARENA_3_PYLONS.left.intact) {
      ctx.moveTo(pylonLeftX + 4, pylonTopY - 6);
      ctx.lineTo(anchorLeftX + 3, anchorCableY);
    }
    if (ARENA_3_PYLONS.right.intact) {
      ctx.moveTo(pylonRightX - 4, pylonTopY - 6);
      ctx.lineTo(anchorRightX - 3, anchorCableY);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawAnchorCables();

  // D. GŁÓWNE LINY NOŚNE PRZĘSŁA (Łuk paraboliczny od pylonu do pylonu)
  if (bridgeX2 + 80 >= camL && bridgeX1 - 80 <= camR) {
    ctx.save();
    const leftAnchorX = ARENA_3_PYLONS.left.intact ? pylonLeftX : (pylonLeftX + 40);
    const leftAnchorY = ARENA_3_PYLONS.left.intact ? (pylonTopY - 6) : Math.min(1305, 1100 + (ARENA_3_PYLONS.left.fallDropY || 0));
    const rightAnchorX = ARENA_3_PYLONS.right.intact ? pylonRightX : (pylonRightX - 40);
    const rightAnchorY = ARENA_3_PYLONS.right.intact ? (pylonTopY - 6) : Math.min(1305, 1100 + (ARENA_3_PYLONS.right.fallDropY || 0));
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


      ctx.restore();
    } else {
      // 2. ODERWANY / ZAWALONY KLOCEK FIZYCZNY (Wyszczerbiona poszarpana belka ze zwęgleniem)
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      ctx.restore();
      drawSplinteredWoodRubble(ctx, cx, cy, b.w, b.h, b.angle, { seed: i * 23 });

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

  // F. CZĄSTECZKI OSTRYCH DRZAZG DREWNIANYCH (Bridge Splinters)
  for (let i = 0; i < BRIDGE_SPLINTERS.length; i++) {
    const sp = BRIDGE_SPLINTERS[i];
    if (sp.x < camL - 20 || sp.x > camR + 20) continue;
    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.rotate(sp.rot);
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.moveTo(-sp.size * 0.7, 0);
    ctx.lineTo(sp.size * 0.7, -sp.size * 0.22);
    ctx.lineTo(sp.size * 0.25, sp.size * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#120803';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.restore();
  }

  // F2. CZĄSTECZKI OSTROKRAWĘDZIOWYCH ODŁAMKÓW SKALNYCH (Stone Debris)
  for (let i = 0; i < STONE_DEBRIS.length; i++) {
    const sd = STONE_DEBRIS[i];
    if (sd.x < camL - 20 || sd.x > camR + 20) continue;
    ctx.save();
    ctx.translate(sd.x, sd.y);
    ctx.rotate(sd.rot);
    ctx.fillStyle = sd.color;
    ctx.beginPath();
    ctx.moveTo(-sd.size / 2, -sd.size / 2);
    ctx.lineTo(sd.size * 0.6, -sd.size * 0.2);
    ctx.lineTo(sd.size * 0.3, sd.size / 2);
    ctx.lineTo(-sd.size * 0.5, sd.size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#080c08';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Jasna krawędź odłamu
    ctx.strokeStyle = 'rgba(180, 210, 180, 0.45)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-sd.size / 2, -sd.size / 2);
    ctx.lineTo(sd.size * 0.6, -sd.size * 0.2);
    ctx.stroke();
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

  ctx.restore();
}

// Pomocnicze funkcje przecięcia promienia pocisku (swept segment)
