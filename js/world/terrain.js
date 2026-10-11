// =========================================================================
// WORLD/TERRAIN.JS - PROFILE JASKIŃ, KANIONÓW, PODŁOŻE I GRANICE ARENY
// Wydzielony moduł z js/world.js
// =========================================================================

import { ARENA_LEFT, ARENA_RIGHT, ARENA_WIDTH } from '../config.js';
import {
  GROUND_Y,
  GROUND_SLAB_HEIGHT,
  PILLAR_SPACING,
  groundSegments,
  activeArenaId
} from './state.js';

/**
 * Renderuje poszarpane krawędzie i wystające zbrojenie na ocalałych brzegach wyrwy
 */
export function drawSeveredGroundEdge(ctx, edgeX, groundY, direction = 'RIGHT') {
  ctx.save();
  const slabH = GROUND_SLAB_HEIGHT;

  if (direction === 'RIGHT') {
    // 1. Profil boczny zniszczonej płyty (grubość 36 px) z ciemnym wnętrzem przekroju
    ctx.fillStyle = '#080c14';
    ctx.fillRect(edgeX - 5, groundY, 5, slabH);

    // Ciemny rdzeń metalowo-kompozytowy
    ctx.fillStyle = '#141c2c';
    ctx.fillRect(edgeX - 4, groundY + 4, 3, slabH - 8);

    // Przypalony brzeg krawędzi
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(edgeX - 1.5, groundY, 1.5, slabH);

    // 2. Poszarpany metal (3 nieregularne zęby wyrwanej blachy)
    ctx.fillStyle = '#2d3748';
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 3);
    ctx.lineTo(edgeX + 5, groundY + 8);
    ctx.lineTo(edgeX, groundY + 13);

    ctx.moveTo(edgeX, groundY + 15);
    ctx.lineTo(edgeX + 7, groundY + 21);
    ctx.lineTo(edgeX, groundY + 26);

    ctx.moveTo(edgeX, groundY + 28);
    ctx.lineTo(edgeX + 4, groundY + 33);
    ctx.lineTo(edgeX, groundY + 36);
    ctx.fill();

    // Wewnętrzny cień na poszarpanym metalu
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 5);
    ctx.lineTo(edgeX + 3, groundY + 8);
    ctx.lineTo(edgeX, groundY + 11);

    ctx.moveTo(edgeX, groundY + 17);
    ctx.lineTo(edgeX + 4, groundY + 21);
    ctx.lineTo(edgeX, groundY + 24);
    ctx.fill();

    // 3. Wystające zbrojenie (2–3 krótkie pomarańczowe/szare pręty)
    // Pręt 1 (górny): zgięty szary pręt ze stopionym, rozżarzonym czubkiem
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 8);
    ctx.lineTo(edgeX + 8, groundY + 9);
    ctx.lineTo(edgeX + 15, groundY + 13);
    ctx.stroke();

    ctx.strokeStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(edgeX + 11, groundY + 11);
    ctx.lineTo(edgeX + 15, groundY + 13);
    ctx.stroke();

    // Pręt 2 (środkowy): stalowy szary prosty pręt
    ctx.strokeStyle = '#94a3b8';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 20);
    ctx.lineTo(edgeX + 6, groundY + 19);
    ctx.lineTo(edgeX + 11, groundY + 21);
    ctx.stroke();

    // Pręt 3 (dolny): rozgrzany pręt pomarańczowy wygięty ku górze
    ctx.strokeStyle = '#ea580c';
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 29);
    ctx.lineTo(edgeX + 9, groundY + 29);
    ctx.lineTo(edgeX + 16, groundY + 26);
    ctx.stroke();

    ctx.strokeStyle = '#fdba74';
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(edgeX + 13, groundY + 27);
    ctx.lineTo(edgeX + 16, groundY + 26);
    ctx.stroke();
  } else {
    // Krawędź lewa (kierunek LEFT, brzeg po prawej stronie wyrwy)
    // 1. Profil boczny zniszczonej płyty (grubość 36 px)
    ctx.fillStyle = '#080c14';
    ctx.fillRect(edgeX, groundY, 5, slabH);

    ctx.fillStyle = '#141c2c';
    ctx.fillRect(edgeX + 1, groundY + 4, 3, slabH - 8);

    ctx.fillStyle = '#1c1917';
    ctx.fillRect(edgeX, groundY, 1.5, slabH);

    // 2. Poszarpany metal
    ctx.fillStyle = '#2d3748';
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 3);
    ctx.lineTo(edgeX - 5, groundY + 8);
    ctx.lineTo(edgeX, groundY + 13);

    ctx.moveTo(edgeX, groundY + 15);
    ctx.lineTo(edgeX - 7, groundY + 21);
    ctx.lineTo(edgeX, groundY + 26);

    ctx.moveTo(edgeX, groundY + 28);
    ctx.lineTo(edgeX - 4, groundY + 33);
    ctx.lineTo(edgeX, groundY + 36);
    ctx.fill();

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 5);
    ctx.lineTo(edgeX - 3, groundY + 8);
    ctx.lineTo(edgeX, groundY + 11);

    ctx.moveTo(edgeX, groundY + 17);
    ctx.lineTo(edgeX - 4, groundY + 21);
    ctx.lineTo(edgeX, groundY + 24);
    ctx.fill();

    // 3. Wystające zbrojenie
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 8);
    ctx.lineTo(edgeX - 8, groundY + 9);
    ctx.lineTo(edgeX - 15, groundY + 13);
    ctx.stroke();

    ctx.strokeStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(edgeX - 11, groundY + 11);
    ctx.lineTo(edgeX - 15, groundY + 13);
    ctx.stroke();

    ctx.strokeStyle = '#94a3b8';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 20);
    ctx.lineTo(edgeX - 6, groundY + 19);
    ctx.lineTo(edgeX - 11, groundY + 21);
    ctx.stroke();

    ctx.strokeStyle = '#ea580c';
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 29);
    ctx.lineTo(edgeX - 9, groundY + 29);
    ctx.lineTo(edgeX - 16, groundY + 26);
    ctx.stroke();

    ctx.strokeStyle = '#fdba74';
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(edgeX - 13, groundY + 27);
    ctx.lineTo(edgeX - 16, groundY + 26);
    ctx.stroke();
  }

  ctx.restore();
}

// =========================================================================
// ARENA 3: CIĄGŁY PROFIL GEOMETRII KANIONU (SOLID CANYON PROFILE)
// =========================================================================
export const LOWER_CAVERN_FLOOR_Y = 1180;
export const LOWER_CAVERN_CEILING_Y = 780;
export const LOWER_CAVERN_BOUNDS = {
  left: 950,
  right: 2300,
  ceilY: 780,
  floorY: 1180
};

// =========================================================================
// ARENA 3: NATURALNE PROFILE GEOMETRII JASKINI (DWUPOZIOMOWY UKŁAD)
// =========================================================================
// 1. Lewy masyw z pochyłą rampą zejściową (kąt ~35°) schodzącą do podziemia (x: 700 do 950)
export const LEFT_MASSIF_AND_RAMP_PROFILE = [
  { x: ARENA_LEFT - 320, y: 420 },
  { x: 0, y: 420 },
  { x: 360, y: 420 },
  { x: 480, y: 460 },
  { x: 620, y: 520 },
  { x: 700, y: 580 }, // Górny brzeg rampy zejściowej
  // Naturalna pochyła rampa skalna schodząca ze zbocza pod kątem ~35° w głąb pieczary
  { x: 750, y: 700 },
  { x: 800, y: 820 },
  { x: 860, y: 950 },
  { x: 910, y: 1060 },
  { x: 950, y: 1180 }  // Płynne połączenie z podłogą dolnej pieczary (y = 1180)
];

// 2. Pomost Środkowy (Płyta główna / Grzbiety): gruba lita platforma skalna (x: 950 do 2300)
export const CENTRAL_HILL_PROFILE = [
  { x: 950, y: 580 },
  { x: 1160, y: 520 },
  { x: 1360, y: 460 },
  { x: 1540, y: 400 },
  { x: 1700, y: 360 },
  { x: 1800, y: 340 }, // Szczyt wzgórza
  { x: 1940, y: 400 },
  { x: 2040, y: 440 },
  { x: 2120, y: 480 },
  { x: 2300, y: 580 }  // Krawędź prawej pionowej rozpadliny
];

// 3. Prawy masyw skalny za pionową rozpadliną (x: 2480 do ARENA_RIGHT + 320)
export const RIGHT_MASSIF_PROFILE = [
  { x: 2480, y: 580 }, // Prawa krawędź rozpadliny
  { x: 2560, y: 520 },
  { x: 2640, y: 480 },
  { x: 2820, y: 480 },
  { x: 2900, y: 440 },
  { x: 3220, y: 440 },
  { x: 3300, y: 420 },
  { x: 3600, y: 420 },
  { x: ARENA_RIGHT + 320, y: 420 }
];

export const JUNGLE_CANYON_PROFILE = [
  { x: ARENA_LEFT - 320, relY: 580, y: 420 },
  { x: 0, relY: 580, y: 420 },
  { x: 360, relY: 580, y: 420 },
  { x: 480, relY: 540, y: 460 },
  { x: 620, relY: 480, y: 520 },
  { x: 700, relY: 420, y: 580 },
  { x: 950, relY: 420, y: 580 },
  { x: 1160, relY: 480, y: 520 },
  { x: 1360, relY: 540, y: 460 },
  { x: 1540, relY: 600, y: 400 },
  { x: 1700, relY: 640, y: 360 },
  { x: 1800, relY: 660, y: 340 },
  { x: 1940, relY: 600, y: 400 },
  { x: 2040, relY: 560, y: 440 },
  { x: 2120, relY: 520, y: 480 },
  { x: 2300, relY: 420, y: 580 },
  { x: 2480, relY: 420, y: 580 },
  { x: 2560, relY: 480, y: 520 },
  { x: 2640, relY: 520, y: 480 },
  { x: 2820, relY: 520, y: 480 },
  { x: 2900, relY: 560, y: 440 },
  { x: 3220, relY: 560, y: 440 },
  { x: 3300, relY: 580, y: 420 },
  { x: 3600, relY: 580, y: 420 },
  { x: ARENA_RIGHT + 320, relY: 580, y: 420 }
];

export function getCanyonSurfaceInfo(px, groundY) {
  // 1. Lewy masyw i rampa wejściowa 35° (x <= 950)
  if (px <= 950) {
    const pts = LEFT_MASSIF_AND_RAMP_PROFILE;
    if (px <= pts[0].x) return { surfaceY: pts[0].y, slope: 0 };
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      if (px >= p0.x && px <= p1.x) {
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const t = dx > 0 ? (px - p0.x) / dx : 0;
        return { surfaceY: p0.y + t * dy, slope: -dy / (dx || 1) };
      }
    }
    return { surfaceY: 1180, slope: 0 };
  }
  // 2. Pomost środkowy / szczyt wzgórza (x: 950 do 2300)
  if (px <= 2300) {
    const pts = CENTRAL_HILL_PROFILE;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      if (px >= p0.x && px <= p1.x) {
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const t = dx > 0 ? (px - p0.x) / dx : 0;
        return { surfaceY: p0.y + t * dy, slope: -dy / (dx || 1) };
      }
    }
    return { surfaceY: 580, slope: 0 };
  }
  // 3. Prawa pionowa rozpadlina (x: 2300 do 2480) - otwarta przestrzeń szybu, dno na dole 1180
  if (px < 2480) {
    return { surfaceY: 1180, slope: 0 };
  }
  // 4. Prawy masyw skalny (x >= 2480)
  const pts = RIGHT_MASSIF_PROFILE;
  if (px >= pts[pts.length - 1].x) return { surfaceY: pts[pts.length - 1].y, slope: 0 };
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    if (px >= p0.x && px <= p1.x) {
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const t = dx > 0 ? (px - p0.x) / dx : 0;
      return { surfaceY: p0.y + t * dy, slope: -dy / (dx || 1) };
    }
  }
  return { surfaceY: 420, slope: 0 };
}

export function getCanyonSurfaceY(px, groundY) {
  return getCanyonSurfaceInfo(px, groundY).surfaceY;
}

export const MINE_CAVERN_PROFILE = CENTRAL_HILL_PROFILE;

// =========================================================================
// STROP DOLNEJ PIECZARY BOJOWEJ (NATURALNY, NIEREGULARNY PROFIL SKALNY)
// Wysokość stropu podziemia y ≈ 780, grubość platformy pomostu 200–440 px
// =========================================================================
export const LOWER_CAVERN_CEILING_PROFILE = [
  { x: 950, y: 780 },
  { x: 1080, y: 775 },
  { x: 1220, y: 785 },
  { x: 1380, y: 770 },
  { x: 1560, y: 785 },
  { x: 1740, y: 775 },
  { x: 1920, y: 785 },
  { x: 2100, y: 775 },
  { x: 2220, y: 780 },
  { x: 2300, y: 780 }
];

export function getLowerCavernCeilingY(px) {
  const pts = LOWER_CAVERN_CEILING_PROFILE;
  if (px <= pts[0].x) return pts[0].y;
  if (px >= pts[pts.length - 1].x) return pts[pts.length - 1].y;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    if (px >= p0.x && px <= p1.x) {
      const dx = p1.x - p0.x;
      const t = dx > 0 ? (px - p0.x) / dx : 0;
      return p0.y + t * (p1.y - p0.y);
    }
  }
  return 780;
}

// =========================================================================
// NATURALNE PÓŁKI SKALNE W DOLNEJ PIECZARZE (ONE-WAY PLATFORMS)
// =========================================================================
export const LOWER_CAVERN_SHELVES = [
  {
    id: 'lower_shelf_left',
    type: 'rock_shelf',
    theme: 'jungle',
    name: 'Lewa Półka Skalna',
    x: 1050,
    y: 950,
    w: 220,
    h: 28,
    oneWay: true,
    solid: false
  },
  {
    id: 'lower_dais_center',
    type: 'rock_shelf',
    theme: 'jungle',
    name: 'Centralny Cokół Skalny',
    x: 1600,
    y: 1040,
    w: 350,
    h: 45,
    oneWay: true,
    solid: false
  },
  {
    id: 'lower_shelf_right',
    type: 'rock_shelf',
    theme: 'jungle',
    name: 'Prawa Półka Skalna',
    x: 2150,
    y: 920,
    w: 240,
    h: 28,
    oneWay: true,
    solid: false
  },
  {
    id: 'right_shaft_cushion_shelf',
    type: 'rock_shelf',
    theme: 'jungle',
    name: 'Półka Amortyzująca Szybu',
    x: 2320,
    y: 880,
    w: 90,
    h: 22,
    oneWay: true,
    solid: false
  }
];

export const LOWER_CAVERN_FLOOR = {
  id: 'lower_cavern_floor',
  type: 'rock_platform',
  theme: 'jungle',
  name: 'Spąg Dolnej Pieczary Bojowej',
  x: 950,
  y: 1180,
  w: 1530,
  h: 120,
  solid: true
};

// =========================================================================
// ARENA 3: SKALNY SUFIT JASKINI (LITA GRAŃ SKALNA STROPU)
// Zamknięta górna krawędź jaskini o naturalnym, nieregularnym profilu grani
// =========================================================================
export const MINE_CAVE_CEILING_PROFILE = [
  { x: ARENA_LEFT - 320, relY: 980 },
  { x: 0, relY: 980 },
  { x: 260, relY: 960 },
  { x: 520, relY: 990 },
  { x: 780, relY: 950 },
  { x: 1040, relY: 980 },
  { x: 1320, relY: 1020 },
  { x: 1680, relY: 1060 }, // Sklepienie Centralnej Groty (kopuła nad wzgórzem)
  { x: 1960, relY: 1010 },
  { x: 2240, relY: 980 },
  { x: 2540, relY: 960 },
  { x: 2860, relY: 1000 },
  { x: 3180, relY: 970 },
  { x: 3480, relY: 990 },
  { x: 3600, relY: 980 },
  { x: ARENA_RIGHT + 320, relY: 980 }
];

export function getCaveCeilingInfo(px, groundY) {
  const pts = MINE_CAVE_CEILING_PROFILE;
  if (px <= pts[0].x) {
    return { ceilingY: groundY - pts[0].relY, slope: 0 };
  }
  if (px >= pts[pts.length - 1].x) {
    return { ceilingY: groundY - pts[pts.length - 1].relY, slope: 0 };
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    if (px >= p0.x && px <= p1.x) {
      const dx = p1.x - p0.x;
      const dyRel = p1.relY - p0.relY;
      const t = dx > 0 ? (px - p0.x) / dx : 0;
      const curRelY = p0.relY + t * dyRel;
      const slope = dyRel / (dx || 1);
      return { ceilingY: groundY - curRelY, slope };
    }
  }
  return { ceilingY: groundY - 960, slope: 0 };
}

export function getCaveCeilingY(px, groundY) {
  return getCaveCeilingInfo(px, groundY).ceilingY;
}

/**
 * =========================================================================
 * PROCEDURALNA TEKSTURA LITEJ SKAŁY, WARSTWY OSADOWE I KRAWĘDZIE GZYMSU
 * =========================================================================
 * 1. Masa skalna: głęboka paleta łupku #181B20 do #111317 na dole
 * 2. Warstwowość geologiczna: pofalowane żyły skalne 2-6px (#232830, #0E1013, Math.sin)
 * 3. Pęknięcia tektoniczne: 1px #0A0C0E z obrysem 1px #2C323D
 * 4. Ambient Occlusion: miękkie cienie w zagłębieniach i wąwozach
 * 5. Krawędzie chodzone: fazowany rim 3px #3A4454 + linia światła 1px #5E6E87
 * 6. Opadający gruz: nieregularne trapezy 2x3px zwisające z krawędzi (brak ząbków)
 */
export function drawCaveTerrain(ctx, polyPoints, mapBottomY, groundY) {
  if (!polyPoints || polyPoints.length < 2) return;

  const minX = polyPoints[0].x;
  const maxX = polyPoints[polyPoints.length - 1].x;
  let minY = polyPoints[0].y;
  for (let i = 1; i < polyPoints.length; i++) {
    if (polyPoints[i].y < minY) minY = polyPoints[i].y;
  }
  if (!Number.isFinite(minY)) minY = groundY || 500;
  const maxY = Number.isFinite(mapBottomY) ? mapBottomY : ((groundY || 500) + 2400);

  ctx.save();

  // 1. LITA MASA SKALNA (SOLID BEDROCK MASS)
  ctx.beginPath();
  ctx.moveTo(polyPoints[0].x, maxY);
  for (let i = 0; i < polyPoints.length; i++) {
    ctx.lineTo(polyPoints[i].x, polyPoints[i].y);
  }
  ctx.lineTo(polyPoints[polyPoints.length - 1].x, maxY);
  ctx.closePath();

  // Wypełnienie głęboką paletą łupku: baza #181B20 przechodząca w #111317 na dole
  const slateGrad = ctx.createLinearGradient(0, minY, 0, maxY);
  slateGrad.addColorStop(0.0, '#181B20');
  slateGrad.addColorStop(1.0, '#111317');
  ctx.fillStyle = slateGrad;
  ctx.fill();

  // 2. PROCEDURALNE WARSTWY SEDYMENTACYJNE I SZCZELINY (CLIPPED)
  ctx.save();
  ctx.clip();

  // A. Warstwowość geologiczna (Strata lines)
  // Horyzontalne, lekko pofalowane żyły skalne i warstwy osadowe (grubość 2–6px, tony #232830 i #0E1013)
  const strataStep = 22;
  const strataLimit = Math.min(maxY, minY + 1600);
  for (let sy = minY + 12; sy <= strataLimit; sy += strataStep) {
    const isDark = (Math.floor(sy / strataStep) % 2 === 0);
    const strokeCol = isDark ? '#0E1013' : '#232830';
    const thick = 2 + (Math.floor(sy * 7.19) % 5); // 2, 3, 4, 5, 6px

    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = thick;

    const phaseA = sy * 0.037;
    const phaseB = sy * 0.081;

    ctx.beginPath();
    let first = true;
    for (let sx = minX - 40; sx <= maxX + 40; sx += 40) {
      const wave = Math.sin(sx * 0.007 + phaseA) * 5.2 + Math.sin(sx * 0.023 + phaseB) * 2.4;
      const py = sy + wave;
      if (first) {
        ctx.moveTo(sx, py);
        first = false;
      } else {
        ctx.lineTo(sx, py);
      }
    }
    ctx.stroke();
  }

  // B. Proceduralne wąskie pęknięcia tektoniczne (cienkie linie 1px #0A0C0E z obrysem 1px #2C323D)
  const crackSpans = [
    { startX: minX + (maxX - minX) * 0.12, startY: minY + 60, len: 320, angle: 1.18, seed: 1.7 },
    { startX: minX + (maxX - minX) * 0.28, startY: minY + 90, len: 280, angle: 1.25, seed: 3.2 },
    { startX: minX + (maxX - minX) * 0.45, startY: minY + 40, len: 360, angle: 1.15, seed: 5.1 },
    { startX: minX + (maxX - minX) * 0.62, startY: minY + 110, len: 300, angle: 1.22, seed: 7.4 },
    { startX: minX + (maxX - minX) * 0.78, startY: minY + 70, len: 340, angle: 1.17, seed: 9.3 },
    { startX: minX + (maxX - minX) * 0.91, startY: minY + 130, len: 260, angle: 1.28, seed: 11.8 }
  ];

  for (let cIdx = 0; cIdx < crackSpans.length; cIdx++) {
    const cr = crackSpans[cIdx];
    if (cr.startX < minX - 50 || cr.startX > maxX + 50) continue;

    const pts = [{ x: cr.startX, y: cr.startY }];
    let cx = cr.startX;
    let cy = cr.startY;
    const segs = 6;
    const segLen = cr.len / segs;

    for (let s = 1; s <= segs; s++) {
      const stepAngle = cr.angle + Math.sin(cr.seed + s * 2.7) * 0.35;
      cx += Math.cos(stepAngle) * segLen;
      cy += Math.sin(stepAngle) * segLen;
      pts.push({ x: cx, y: cy });
    }

    // Jasny obrys 1px #2C323D (imitacja krawędzi szczeliny skalnej)
    ctx.strokeStyle = '#2C323D';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pts[0].x + 1, pts[0].y + 1);
    for (let p = 1; p < pts.length; p++) {
      ctx.lineTo(pts[p].x + 1, pts[p].y + 1);
    }
    ctx.stroke();

    // Wąska linia pęknięcia 1px #0A0C0E
    ctx.strokeStyle = '#0A0C0E';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let p = 1; p < pts.length; p++) {
      ctx.lineTo(pts[p].x, pts[p].y);
    }
    ctx.stroke();
  }

  // C. Wewnętrzny cień (Ambient Occlusion) w wąwozach i załamaniach terenu
  for (let i = 1; i < polyPoints.length - 1; i++) {
    const prev = polyPoints[i - 1];
    const curr = polyPoints[i];
    const next = polyPoints[i + 1];

    const dy1 = curr.y - prev.y;
    const dy2 = next.y - curr.y;
    if (dy1 > 15 || dy2 < -15 || curr.y > prev.y + 35 || curr.y > next.y + 35) {
      const aoRadius = 150;
      const aoGrad = ctx.createRadialGradient(curr.x, curr.y + 30, 10, curr.x, curr.y + 30, aoRadius);
      aoGrad.addColorStop(0.0, 'rgba(5, 7, 10, 0.65)');
      aoGrad.addColorStop(0.5, 'rgba(5, 7, 10, 0.30)');
      aoGrad.addColorStop(1.0, 'rgba(5, 7, 10, 0.0)');
      ctx.fillStyle = aoGrad;
      ctx.beginPath();
      ctx.arc(curr.x, curr.y + 30, aoRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore(); // Koniec clipa

  // 3. KRAWĘDZIE PLATFORM I POWIERZCHNIE CHODZONE (LEDGES)
  // A. Główny pasek krawędzi: kamienny błękit/grafit #3A4454 (3px)
  ctx.strokeStyle = '#3A4454';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(polyPoints[0].x, polyPoints[0].y);
  for (let i = 1; i < polyPoints.length; i++) {
    ctx.lineTo(polyPoints[i].x, polyPoints[i].y);
  }
  ctx.stroke();

  // B. Górna linia odbłysku: #5E6E87 (1px) imitująca ostre światło padające na krawędź
  ctx.strokeStyle = '#5E6E87';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(polyPoints[0].x, polyPoints[0].y - 0.7);
  for (let i = 1; i < polyPoints.length; i++) {
    ctx.lineTo(polyPoints[i].x, polyPoints[i].y - 0.7);
  }
  ctx.stroke();

  // C. Opadający gruz: drobne kanciaste odpryski skalne (trapezy 2x3px) zwisające z krawędzi
  for (let i = 0; i < polyPoints.length - 1; i++) {
    const pA = polyPoints[i];
    const pB = polyPoints[i + 1];
    const segLen = Math.hypot(pB.x - pA.x, pB.y - pA.y);
    if (segLen < 12) continue;

    const numChips = Math.floor(segLen / 44);
    for (let k = 0; k < numChips; k++) {
      const seed = ((pA.x * 19.3 + k * 41.7) % 100) / 100;
      const t = 0.15 + seed * 0.70;
      const cx = pA.x + (pB.x - pA.x) * t;
      const cy = pA.y + (pB.y - pA.y) * t;

      const chipW = 2.8;
      const chipH = 3.0;

      ctx.fillStyle = '#2A323D';
      ctx.beginPath();
      ctx.moveTo(cx - chipW * 0.5, cy + 1.0);
      ctx.lineTo(cx + chipW * 0.5, cy + 1.0);
      ctx.lineTo(cx + chipW * 0.25, cy + 1.0 + chipH);
      ctx.lineTo(cx - chipW * 0.25, cy + 1.0 + chipH);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#5E6E87';
      ctx.fillRect(cx - chipW * 0.5, cy + 1.0, 1, 1);
    }
  }

  ctx.restore();
}

// =========================================================================
// PROCEDURALNY KOD JASKINI USUNIĘTY (drawCaveCeilingAndStalactites)
// Renderowanie tła, platform i obiektów Areny 3 delegowane do js/arenas/arena3.js
// =========================================================================
export function drawCaveCeilingAndStalactites() {}

// =========================================================================
// PROCEDURALNY KOD DOLNEJ SALI USUNIĘTY
// Renderowanie tła, platform i obiektów Areny 3 delegowane do js/arenas/arena3.js
// =========================================================================
export function drawLowerCavernBackground() {}
export function drawBedrockAndSideSlopes() {}
export function drawCentralRockBridge() {}
export function drawLowerCavernPropsAndLighting() {}
export function drawLowerCavern() {}
export function drawLedgeDebris() {}

export function drawGround(ctx, worldLeft, worldWidth) {
  const startX = ARENA_LEFT - 320;
  const endX = ARENA_RIGHT + 320;
  const w = endX - startX;
  const isArena3 = (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3');
  const isArena2 = (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2');

  if (isArena3 || isArena2) {
    // Tło, obiekty i platformy Areny 2 & 3 renderowane są autonomicznie w ich modułach areny (brak płaskiego podłoża)
    return;
  }

  // =========================================================================
  // ARENY 1 & 2: INDUSTRIALNA KŁADKA / DWUTEOWNIKI / CYBER NEON
  // =========================================================================
  // 1. DOLNY KANAŁ TECHNICZNY I CZELUŚĆ POD KŁADKĄ (THE VOID & SUB-LEVEL)
  ctx.fillStyle = '#05070d';
  ctx.fillRect(startX, GROUND_Y + GROUND_SLAB_HEIGHT, w, 700);

  // Poziome magistrale i linie techniczne w tle kanału
  ctx.save();
  ctx.strokeStyle = '#0c1322';
  ctx.lineWidth = 2.5;
  for (let dy = 65; dy <= 450; dy += 90) {
    ctx.beginPath();
    ctx.moveTo(startX, GROUND_Y + dy);
    ctx.lineTo(endX, GROUND_Y + dy);
    ctx.stroke();
  }

  // 2. INDUSTRIALNE BELKI NOŚNE / FILARY PODŁOŻA CO 120 PX
  const pillarStep = PILLAR_SPACING;
  const pStart = Math.floor(startX / pillarStep) * pillarStep;
  const pEnd = Math.ceil(endX / pillarStep) * pillarStep;

  for (let px = pStart; px <= pEnd; px += pillarStep) {
    const colW = 18;
    const colLeft = px - colW / 2;
    const colTop = GROUND_Y + GROUND_SLAB_HEIGHT;
    const colH = 500;

    // Główny korpus stalowego dwuteownika
    ctx.fillStyle = '#101726';
    ctx.fillRect(colLeft, colTop, colW, colH);

    // Krawędzie pasów dwuteownika (półki)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(colLeft, colTop, 2.5, colH);
    ctx.fillRect(colLeft + colW - 2.5, colTop, 2.5, colH);

    // Środnik w cieniu
    ctx.fillStyle = '#080d16';
    ctx.fillRect(px - 1.5, colTop, 3, colH);

    // Głowica montażowa u góry filaru
    ctx.fillStyle = '#223049';
    ctx.fillRect(px - 13, colTop, 26, 6);

    // Nity montażowe wzdłuż filaru
    ctx.fillStyle = '#334155';
    for (let ry = colTop + 24; ry < colTop + 350; ry += 36) {
      ctx.fillRect(colLeft + 3.5, ry, 2, 2);
      ctx.fillRect(colLeft + colW - 5.5, ry, 2, 2);
    }

    // Skośne stężenia kratownicowe (X-bracing) pomiędzy filarami
    if (px + pillarStep <= pEnd) {
      ctx.strokeStyle = '#0d1525';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px, colTop + 16);
      ctx.lineTo(px + pillarStep, colTop + 115);
      ctx.moveTo(px, colTop + 115);
      ctx.lineTo(px + pillarStep, colTop + 16);
      ctx.stroke();
    }
  }
  ctx.restore();

  // 3. AKTYWNE SEGMENTY PODŁOŻA (36 PX PŁYTA PRZEMYSŁOWEJ KŁADKI)
  for (let i = 0; i < groundSegments.length; i++) {
    const seg = groundSegments[i];
    if (seg.destroyed) continue;

    const slabGrad = ctx.createLinearGradient(seg.x, GROUND_Y, seg.x, GROUND_Y + GROUND_SLAB_HEIGHT);
    slabGrad.addColorStop(0.0, '#151e2e');
    slabGrad.addColorStop(0.25, '#101726');
    slabGrad.addColorStop(0.75, '#0b101c');
    slabGrad.addColorStop(1.0, '#060910');

    ctx.fillStyle = slabGrad;
    ctx.fillRect(seg.x, GROUND_Y, seg.width, GROUND_SLAB_HEIGHT);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(seg.x, GROUND_Y + 12, seg.width, 1);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(seg.x, GROUND_Y + GROUND_SLAB_HEIGHT - 1.5, seg.width, 1.5);

    ctx.fillStyle = '#060911';
    ctx.fillRect(seg.x, GROUND_Y + 1, 1, GROUND_SLAB_HEIGHT - 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.fillRect(seg.x + seg.width / 2 - 1, GROUND_Y + 3, 2, 5);
  }

  // 4. NEONOWA POWIERZCHNIA PODŁOŻA – PRZERYWANA W MIEJSCACH WYRWY
  ctx.save();
  const surfaceGrad = ctx.createLinearGradient(ARENA_LEFT, GROUND_Y, ARENA_RIGHT, GROUND_Y);
  surfaceGrad.addColorStop(0.0, '#06b6d4');
  surfaceGrad.addColorStop(0.45, '#00e5ff');
  surfaceGrad.addColorStop(0.55, '#f97316');
  surfaceGrad.addColorStop(1.0, '#ff7700');

  const coreGrad = ctx.createLinearGradient(ARENA_LEFT, GROUND_Y, ARENA_RIGHT, GROUND_Y);
  coreGrad.addColorStop(0.0, '#a5f3fc');
  coreGrad.addColorStop(0.48, '#ffffff');
  coreGrad.addColorStop(0.52, '#ffffff');
  coreGrad.addColorStop(1.0, '#fed7aa');

  const legacyActiveRuns = [];
  let legacyCurrentRun = null;

  for (let i = 0; i < groundSegments.length; i++) {
    const seg = groundSegments[i];
    if (!seg.destroyed) {
      if (!legacyCurrentRun) {
        legacyCurrentRun = { start: seg.x, end: seg.x + seg.width };
      } else {
        legacyCurrentRun.end = seg.x + seg.width;
      }
    } else {
      if (legacyCurrentRun) {
        legacyActiveRuns.push(legacyCurrentRun);
        legacyCurrentRun = null;
      }
    }
  }
  if (legacyCurrentRun) {
    legacyActiveRuns.push(legacyCurrentRun);
  }

  for (const run of legacyActiveRuns) {
    const arenaStart = Math.max(ARENA_LEFT, Math.min(ARENA_RIGHT, run.start));
    const arenaEnd = Math.max(ARENA_LEFT, Math.min(ARENA_RIGHT, run.end));

    if (arenaEnd > arenaStart) {
      ctx.strokeStyle = surfaceGrad;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 0;
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      ctx.moveTo(arenaStart, GROUND_Y);
      ctx.lineTo(arenaEnd, GROUND_Y);
      ctx.stroke();

      ctx.strokeStyle = coreGrad;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(arenaStart, GROUND_Y);
      ctx.lineTo(arenaEnd, GROUND_Y);
      ctx.stroke();
    }

    if (run.start < ARENA_LEFT) {
      const bLeft = run.start;
      const bRight = Math.min(ARENA_LEFT, run.end);
      if (bRight > bLeft) {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.0;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(bLeft, GROUND_Y);
        ctx.lineTo(bRight, GROUND_Y);
        ctx.stroke();
      }
    }

    if (run.end > ARENA_RIGHT) {
      const bLeft = Math.max(ARENA_RIGHT, run.start);
      const bRight = run.end;
      if (bRight > bLeft) {
        ctx.strokeStyle = '#f97316';
        ctx.shadowColor = '#f97316';
        ctx.lineWidth = 2.0;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(bLeft, GROUND_Y);
        ctx.lineTo(bRight, GROUND_Y);
        ctx.stroke();
      }
    }
  }

  // 5. WIZUALIZACJA POSZARPANYCH KRAWĘDZI I WYSTAJĄCEGO ZBROJENIA WYRWY
  for (let i = 0; i < groundSegments.length; i++) {
    const seg = groundSegments[i];
    if (seg.destroyed) continue;

    if (seg.scorchRight) {
      drawSeveredGroundEdge(ctx, seg.x + seg.width, GROUND_Y, 'RIGHT');
    }
    if (seg.scorchLeft) {
      drawSeveredGroundEdge(ctx, seg.x, GROUND_Y, 'LEFT');
    }
  }

  drawArenaEnergyBoundaries(ctx, GROUND_Y);
  ctx.restore();
}

export function drawArenaEnergyBoundaries(ctx, groundY) {
  const isArena3 = (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3');
  const isArena2 = (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2');
  if (isArena3 || isArena2) {
    return; // W zamkniętym podziemnym systemie jaskiń i otwartym niebie Pandory brak laserowych linii granicznych
  }
  const leftX = ARENA_LEFT;
  const rightX = ARENA_RIGHT;
  const barrierH = 3000;
  const topY = groundY - barrierH;
  const time = performance.now() * 0.0012;
  const pulse = 0.82 + 0.18 * Math.sin(time * 3.5);

  const walls = [
    {
      x: leftX,
      color: '#00F0FF',
      coreColor: '#a5f3fc',
      glowColor: '#00F0FF',
      fadeDir: 1
    },
    {
      x: rightX,
      color: '#FF8800',
      coreColor: '#fed7aa',
      glowColor: '#FF8800',
      fadeDir: -1
    }
  ];

  for (const w of walls) {
    ctx.save();

    // 1. Półprzezroczysta pionowa kurtyna pola siłowego (fading 38px do wnętrza boiska)
    const fieldW = 38;
    const fieldGrad = ctx.createLinearGradient(w.x, 0, w.x + w.fadeDir * fieldW, 0);
    if (isArena3) {
      fieldGrad.addColorStop(0.0, `rgba(234, 179, 8, ${0.32 * pulse})`);
      fieldGrad.addColorStop(0.35, `rgba(250, 204, 21, ${0.14 * pulse})`);
      fieldGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    } else {
      fieldGrad.addColorStop(0.0, w.fadeDir === 1 ? `rgba(0, 240, 255, ${0.28 * pulse})` : `rgba(255, 136, 0, ${0.28 * pulse})`);
      fieldGrad.addColorStop(0.35, w.fadeDir === 1 ? `rgba(0, 240, 255, ${0.12 * pulse})` : `rgba(255, 136, 0, ${0.12 * pulse})`);
      fieldGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    }
    ctx.fillStyle = fieldGrad;
    const fx = w.fadeDir === 1 ? w.x : (w.x - fieldW);
    ctx.fillRect(fx, topY, fieldW, barrierH);

    // 2. Dynamiczne impulsy energii wznoszące się wzdłuż ściany
    const step = 50;
    const offset = (time * 75) % step;
    ctx.fillStyle = isArena3 ? 'rgba(254, 240, 138, 0.45)' : (w.fadeDir === 1 ? 'rgba(165, 243, 252, 0.38)' : 'rgba(254, 215, 170, 0.38)');
    for (let py = groundY - offset; py > topY; py -= step) {
      const rw = 16 + Math.sin(py * 0.03 + time * 3) * 6;
      const rx = w.fadeDir === 1 ? w.x : (w.x - rw);
      ctx.fillRect(rx, py, rw, 1.8);
    }

    // 3. Główna pionowa neonowa linia energetyczna z potężnym rozbłyskiem (glow)
    ctx.strokeStyle = w.color;
    ctx.shadowColor = w.glowColor;
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(w.x, groundY);
    ctx.lineTo(w.x, topY);
    ctx.stroke();

    // 4. Intensywny biały rdzeń lasera energetycznego
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = w.coreColor;
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(w.x, groundY);
    ctx.lineTo(w.x, topY);
    ctx.stroke();

    // 5. Emiter podłożowy u nasady ściany
    ctx.fillStyle = w.color;
    ctx.shadowColor = w.glowColor;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(w.x, groundY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export function drawDistanceMarkers(ctx, worldLeft, worldRight) { }
export function drawStadiumForeground() { }
export function clearDesertSandstorm() { }
export function clearWinterBlizzard() { }

