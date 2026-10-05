// =========================================================================
// ARENAS/ARENA3.JS - THE FOUNDRY (4400x1400 PX INDUSTRIAL FACILITY)
// Autonomiczny moduł areny (Plugin / Lifecycle Hooks Pattern)
// Ściśle przestrzega reguł AGENT.md (Strict DAG: Warstwa 1, zero importów z wyższych warstw)
// =========================================================================

import { spawnStretchedSparks, spawnRicochetSparks } from '../particles.js';

// 1. Obraz tła hali przemysłowej generowany skryptem Python (foundry_bg.png)
const foundryBgImage = new Image();
foundryBgImage.src = 'foundry_bg.png';

// 2. Modułowe zasoby graficzne wagoników kopalnianych (PNG z przezroczystością)
const cartBodyImg = new Image();
cartBodyImg.src = 'assets/minecart_body.png';

const cartWheelImg = new Image();
cartWheelImg.src = 'assets/minecart_wheel.png';

const cartInteriorImg = new Image();
cartInteriorImg.src = 'assets/minecart_interior_back.png';

const cartFrontImg = new Image();
cartFrontImg.src = 'assets/minecart_front_chassis.png';

// =========================================================================
// STATYCZNA GEOMETRIA I PLATFORMY (ARENA_3_PLATFORMS)
// =========================================================================
export const ARENA_3_PLATFORMS = [
  // Płyta główna (poziom Y = 900, grubość 70 px)
  { id: 'floor_l1', x: 0, w: 780, y: 900, h: 70, solid: true, isPlatform: true },
  { id: 'floor_l2', x: 920, w: 930, y: 900, h: 70, solid: true, isPlatform: true },
  { id: 'floor_r1', x: 2550, w: 930, y: 900, h: 70, solid: true, isPlatform: true },
  { id: 'floor_r2', x: 3620, w: 780, y: 900, h: 70, solid: true, isPlatform: true },
  // Otwarte pionowe szyby zrzutowe do dolnego tunelu (gracze mogą zeskoczyć, piłka swobodnie przelatuje)
  { id: 'hatch_l', x: 780, w: 140, y: 900, h: 10, oneWay: true, isPlatform: true, passBall: true, isHatch: true },
  { id: 'hatch_r', x: 3480, w: 140, y: 900, h: 10, oneWay: true, isPlatform: true, passBall: true, isHatch: true },
  // Rampa najazdowa i pomost kadzi (Y = 800)
  {
    id: 'ramp_left',
    type: 'ramp',
    x: 1850,
    y: 800,
    w: 130,
    h: 100,
    isPlatform: true,
    isSlope: true,
    startY: 900,
    endY: 800,
    surfacePoints: [{ x: 1850, y: 900 }, { x: 1980, y: 800 }]
  },
  {
    id: 'ramp_right',
    type: 'ramp',
    x: 2420,
    y: 800,
    w: 130,
    h: 100,
    isPlatform: true,
    isSlope: true,
    startY: 800,
    endY: 900,
    surfacePoints: [{ x: 2420, y: 800 }, { x: 2550, y: 900 }]
  },
  { id: 'furnace_deck', x: 1980, w: 440, y: 800, h: 20, solid: true, isPlatform: true },
  // Posadzka dolnego szybu / tunelu (pełna szerokość hali 4400 px bez martwych stref)
  { id: 'tunnel_floor', x: 0, w: 4400, y: 1270, h: 130, solid: true, isPlatform: true }
];

// Aliasy dla zachowania wstecznej kompatybilności
export const ARENA_FOUNDRY_PLATFORMS = ARENA_3_PLATFORMS;
export const ARENA_FOUNDRY_WALLS = [];

// =========================================================================
// OBIEKTY SPECYFICZNE DLA ARENY 3 (ARENA_3_CUSTOM_OBJECTS)
// Okrągłe bramki przemysłowe wbudowane w ściany hali (średnica 340 px)
// =========================================================================
export const ARENA_3_CUSTOM_OBJECTS = [
  { id: 'goal_cyan', team: 'CYAN', x: 20, y: 560, w: 340, h: 340, facing: 1, holeCx: 190, holeCy: 730, holeR: 170 },
  { id: 'goal_orange', team: 'ORANGE', x: 4040, y: 560, w: 340, h: 340, facing: -1, holeCx: 4210, holeCy: 730, holeR: 170 }
];

// =========================================================================
// RENDEROWANIE TŁA ARENY 3 (BACKGROUND: OBRAZ, ŁOPATKI WENTYLATORA, PŁYNNA SURÓWKA)
// =========================================================================
export function drawArena3Background(ctx, camera) {
  if (!ctx) return;

  ctx.save();
  if (camera) {
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
  }

  // 1. Główny obraz tła hali 4400x1400
  if (foundryBgImage && foundryBgImage.complete && foundryBgImage.naturalWidth > 0) {
    ctx.drawImage(foundryBgImage, 0, 0, 4400, 1400);
  } else {
    // Gradient awaryjny w razie dłuższego wczytywania zasobu graficznego
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1400);
    bgGrad.addColorStop(0.0, '#060910');
    bgGrad.addColorStop(0.7, '#111722');
    bgGrad.addColorStop(1.0, '#2d180f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 4400, 1400);
  }

  const time = performance.now() * 0.001;

  // 2. Obracające się łopatki wentylatora sufitowego (X = 2200, Y = 220, promień R = 210)
  const fanX = 2200;
  const fanY = 220;
  const fanR = 210;
  const fanAngle = performance.now() * 0.0018;

  ctx.save();
  ctx.translate(fanX, fanY);
  ctx.rotate(fanAngle);

  const numBlades = 6;
  for (let b = 0; b < numBlades; b++) {
    const bladeAngle = (b * Math.PI * 2) / numBlades;
    ctx.save();
    ctx.rotate(bladeAngle);

    // Aerodynamiczny płat łopatki stalowej
    ctx.beginPath();
    ctx.moveTo(-16, 32);
    ctx.lineTo(-26, fanR - 16);
    ctx.quadraticCurveTo(0, fanR, 26, fanR - 16);
    ctx.lineTo(16, 32);
    ctx.closePath();

    const bladeGrad = ctx.createLinearGradient(-26, 0, 26, 0);
    bladeGrad.addColorStop(0.0, '#0d131a');
    bladeGrad.addColorStop(0.35, '#1e293b');
    bladeGrad.addColorStop(0.75, '#334155');
    bladeGrad.addColorStop(1.0, '#0f172a');
    ctx.fillStyle = bladeGrad;
    ctx.fill();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Centralne żebro usztywniające i nity montażowe
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 36);
    ctx.lineTo(0, fanR - 22);
    ctx.stroke();

    ctx.restore();
  }

  // Centralna osłona piasty wentylatora z nitami
  const hubGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 38);
  hubGrad.addColorStop(0.0, '#475569');
  hubGrad.addColorStop(0.6, '#1e293b');
  hubGrad.addColorStop(1.0, '#0b0f17');
  ctx.fillStyle = hubGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Osiowa śruba nośna
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();

  // 3. Realistyczna, organiczna płynna surówka w kadzi i pionowy strumień (całkowicie bez kwadratowych zakończeń)
  const cx = 2200;
  const cy = 802;       // Osiowe centrum eliptycznego zwierciadła surówki
  const rx = 104;       // Promień poziomy dopasowany do eliptycznego kołnierza kadzi
  const ry = 17;        // Promień pionowy

  // (A) Otwarte pionowe szyby zrzutowe do dolnego tunelu (X = 780..920 oraz 3480..3620)
  ctx.save();
  for (const shaftX of [780, 3480]) {
    const shaftW = 140;
    const shaftTopY = 900;
    const shaftBotY = 1270;
    const shaftH = shaftBotY - shaftTopY;

    // Ciemne wnętrze pionowego szybu
    const shaftGrad = ctx.createLinearGradient(shaftX, shaftTopY, shaftX + shaftW, shaftTopY);
    shaftGrad.addColorStop(0.0, '#03060a');
    shaftGrad.addColorStop(0.15, '#070b12');
    shaftGrad.addColorStop(0.50, '#0a0f18');
    shaftGrad.addColorStop(0.85, '#070b12');
    shaftGrad.addColorStop(1.0, '#03060a');
    ctx.fillStyle = shaftGrad;
    ctx.fillRect(shaftX, shaftTopY, shaftW, shaftH);

    // Stalowe ramy szybu
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(shaftX, shaftTopY, shaftW, shaftH);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(shaftX + 22, shaftTopY);
    ctx.lineTo(shaftX + 22, shaftBotY);
    ctx.moveTo(shaftX + shaftW - 22, shaftTopY);
    ctx.lineTo(shaftX + shaftW - 22, shaftBotY);
    ctx.stroke();

    // Pulsujące strzałki wskazujące przejście do dolnego szybu
    const pulse = 0.55 + 0.45 * Math.sin(time * 3.5);
    ctx.fillStyle = `rgba(249, 115, 22, ${0.45 * pulse})`;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let ay = shaftTopY + 45; ay < shaftBotY - 20; ay += 75) {
      ctx.fillText('▼', shaftX + shaftW / 2, ay);
    }
  }
  ctx.restore();

  // (B) Ograniczenie płynnego metalu do idealnej krzywizny eliptycznej czary kadzi (Zero kwadratowych narożników!)
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip(); // Maskowanie elipsą: perfekcyjne organiczne zaokrąglenie w perspektywie 3D

  // Baza termiczna cieczy: wielostopniowy gradient radialno-eliptyczny
  const lavaGrad = ctx.createRadialGradient(cx, cy - 3, 2, cx, cy, rx);
  lavaGrad.addColorStop(0.00, '#ffffff'); // Oślepiający biały rdzeń
  lavaGrad.addColorStop(0.20, '#fef08a'); // Żółty ciekły metal
  lavaGrad.addColorStop(0.50, '#f97316'); // Płynna pomarańczowa surówka
  lavaGrad.addColorStop(0.78, '#c2410c'); // Karminowa magma
  lavaGrad.addColorStop(0.92, '#7f1d1d'); // Zastygający brzeg
  lavaGrad.addColorStop(1.00, '#1c1917'); // Ciemna skorupa żużlu na styku ze ścianką
  ctx.fillStyle = lavaGrad;
  ctx.fillRect(cx - rx - 10, cy - ry - 10, (rx + 10) * 2, (ry + 10) * 2);

  // Harmoniczne fale konwekcyjne o płynnym zaniku ku brzegom elipsy
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let layer = 0; layer < 3; layer++) {
    const wSpeed = time * (2.2 + layer * 1.4);
    const layerAmp = 3.0 - layer * 0.7;
    const col = (layer === 0)
      ? 'rgba(254, 240, 138, 0.65)'
      : (layer === 1 ? 'rgba(249, 115, 22, 0.45)' : 'rgba(234, 88, 12, 0.30)');
    ctx.fillStyle = col;

    ctx.beginPath();
    ctx.moveTo(cx - rx, cy);
    for (let wx = -rx; wx <= rx; wx += 3) {
      const normX = wx / rx;
      const ellipseHeight = ry * Math.sqrt(Math.max(0, 1 - normX * normX));
      const edgeFactor = Math.sin(Math.acos(Math.max(-1, Math.min(1, normX))));
      const waveOffset = (Math.sin(wx * 0.08 + wSpeed) * layerAmp + Math.cos(wx * 0.16 - wSpeed * 0.7) * (layerAmp * 0.4)) * edgeFactor;
      ctx.lineTo(cx + wx, cy - ellipseHeight * 0.2 + waveOffset);
    }
    for (let wx = rx; wx >= -rx; wx -= 4) {
      const normX = wx / rx;
      const ellipseHeight = ry * Math.sqrt(Math.max(0, 1 - normX * normX));
      ctx.lineTo(cx + wx, cy + ellipseHeight * 0.85);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Pływające organiczne wysepki krzepnącego żużlu (slag crusts)
  const numCrusts = 5;
  for (let i = 0; i < numCrusts; i++) {
    const seed = i * 47.19;
    const driftSpeed = 0.35 + (i % 3) * 0.15;
    const driftX = Math.sin(time * driftSpeed + seed) * (rx * 0.55);
    const driftY = Math.cos(time * driftSpeed * 0.8 + seed * 1.5) * (ry * 0.45);
    const patchX = cx + driftX;
    const patchY = cy + driftY;
    const patchRx = 10 + (seed % 8);
    const patchRy = 3.5 + (seed % 3);

    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(patchX, patchY, patchRx, patchRy, (seed % 10) * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(254, 240, 138, 0.75)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(patchX - patchRx * 0.6, patchY);
    ctx.lineTo(patchX, patchY - 1);
    ctx.lineTo(patchX + patchRx * 0.6, patchY + 0.5);
    ctx.stroke();
  }

  // Pęcherze wrzącej surówki (convection bubbles)
  for (let b = 0; b < 4; b++) {
    const bSeed = b * 31.8;
    const bPhase = (time * (1.2 + (b % 3) * 0.4) + bSeed) % 1.0;
    const bX = cx + Math.sin(bSeed * 3.3) * (rx * 0.6);
    const bY = cy + Math.cos(bSeed * 2.1) * (ry * 0.45);
    const bR = Math.sin(bPhase * Math.PI) * (3.8 + (b % 3));

    if (bR > 0.5) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bX, bY, bR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }
  }

  ctx.restore(); // Koniec clip elipsy

  // (C) Świecący menisk i kołnierz kadzi
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(255, 200, 80, 0.85)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Promienista łuna cieplna unosząca się nad kadzią
  const heatBloom = ctx.createRadialGradient(cx, cy - 14, 10, cx, cy - 14, 150);
  heatBloom.addColorStop(0.0, 'rgba(255, 180, 50, 0.45)');
  heatBloom.addColorStop(0.4, 'rgba(234, 88, 12, 0.18)');
  heatBloom.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = heatBloom;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 14, 160, 80, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // (D) Naturalny pionowy strumień płynnego metalu do spągu tunelu (Y = 1270)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const streamTop = cy + ry + 2;
  const streamBottom = 1270;
  const streamW = 12 + Math.sin(time * 8.0) * 2;

  const streamGrad = ctx.createLinearGradient(cx - streamW, 0, cx + streamW, 0);
  streamGrad.addColorStop(0.0, 'rgba(234, 88, 12, 0.35)');
  streamGrad.addColorStop(0.28, 'rgba(249, 115, 22, 0.85)');
  streamGrad.addColorStop(0.50, '#fef08a');
  streamGrad.addColorStop(0.72, 'rgba(249, 115, 22, 0.85)');
  streamGrad.addColorStop(1.0, 'rgba(234, 88, 12, 0.35)');
  ctx.fillStyle = streamGrad;
  ctx.fillRect(cx - streamW * 0.5, streamTop, streamW, streamBottom - streamTop);

  // Iskry i opadający żar wzdłuż strugi
  for (let i = 0; i < 35; i++) {
    const seed = i * 41.27;
    const dropSpeed = 380 + (seed % 180);
    const dropY = streamTop + ((time * dropSpeed + seed * 43) % (streamBottom - streamTop));
    const spreadX = (Math.sin(seed + time * 3.5) * 7.5);
    const sparkX = cx + spreadX;
    const sparkR = 1.6 + (seed % 2.0);

    ctx.fillStyle = (i % 2 === 0) ? '#fef08a' : '#f97316';
    ctx.beginPath();
    ctx.arc(sparkX, dropY, sparkR, 0, Math.PI * 2);
    ctx.fill();

    if (dropY > 1248) {
      const splashX = cx + Math.sin(seed + time * 7.5) * (16 + (seed % 28));
      const splashY = 1268 - (seed % 12);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(splashX, splashY, 2.2, 2.2);
    }
  }

  // Rozbłysk uderzenia surówki o posadzkę tunelu
  const splashGlow = ctx.createRadialGradient(cx, 1270, 8, cx, 1270, 90);
  splashGlow.addColorStop(0.0, 'rgba(255, 220, 110, 0.65)');
  splashGlow.addColorStop(0.45, 'rgba(249, 115, 22, 0.25)');
  splashGlow.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = splashGlow;
  ctx.beginPath();
  ctx.arc(cx, 1270, 90, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // (E) Stalowe torowisko kopalniane w dolnym tunelu (Y = 1270)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(160, 1268, 4080, 2);
  ctx.fillStyle = '#475569';
  ctx.fillRect(160, 1267, 4080, 1);
  for (let rx = 175; rx < 4230; rx += 28) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(rx, 1268, 12, 2);
  }

  // Rysowanie wnętrza i kół wagoników z pasażerem (warstwa pod postacią w przestrzeni świata)
  for (const cart of ARENA_3_MINECARTS) {
    if (cart.passenger) {
      drawMinecartBackAndWheels(ctx, cart);
    }
  }

  ctx.restore();
}

// =========================================================================
// RENDEROWANIE ELEMENTÓW PIERWSZOPLANOWYCH (DRAW FOREGROUND)
// =========================================================================
export function drawArena3Foreground(ctx, camera) {
  if (!ctx) return;
  ctx.save();

  // 1. Krawędzie ostrzegawcze (Hazard Stripes) wlotów pionowych szybów na płycie głównej (Y = 900)
  for (const sx of [780, 3480]) {
    const sw = 140;
    ctx.fillStyle = '#eab308';
    ctx.fillRect(sx - 10, 900, 10, 8);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(sx - 7, 900, 4, 8);

    ctx.fillStyle = '#eab308';
    ctx.fillRect(sx + sw, 900, 10, 8);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(sx + sw + 3, 900, 4, 8);
  }

  // 2. Przednie obramowania (Steel Flange & Bezel Ring) okrągłych bramek w ścianach hali
  // Ponieważ renderowanie pierwszoplanowe następuje PO narysowaniu piłki (drawBall),
  // piłka wpadająca w tunel chowa się ZA przednim kołnierzem ściany, dając idealną iluzję 3D wpadania do środka dziury!
  for (const goal of ARENA_3_CUSTOM_OBJECTS) {
    const cx = goal.holeCx || (goal.x + goal.w / 2);
    const cy = goal.holeCy || (goal.y + goal.h / 2);
    const rOuter = 170;
    const rInner = 125;
    const isCyan = (goal.team === 'CYAN');
    const neonCol = isCyan ? '#06b6d4' : '#f97316';
    const neonCore = isCyan ? '#00e5ff' : '#ff7700';

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, 0, Math.PI * 2, false);
    ctx.arc(cx, cy, rInner, 0, Math.PI * 2, true); // Otwór w środku
    ctx.closePath();

    const flangeGrad = ctx.createLinearGradient(cx - rOuter, cy - rOuter, cx + rOuter, cy + rOuter);
    flangeGrad.addColorStop(0.0, '#334155');
    flangeGrad.addColorStop(0.35, '#1e293b');
    flangeGrad.addColorStop(0.70, '#0f172a');
    flangeGrad.addColorStop(1.0, '#090d16');
    ctx.fillStyle = flangeGrad;
    ctx.fill();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Nity przemysłowe wokół obwodu kołnierza
    ctx.fillStyle = '#94a3b8';
    const numRivets = 16;
    const rRivet = (rOuter + rInner) * 0.5;
    for (let i = 0; i < numRivets; i++) {
      const ang = (i * Math.PI * 2) / numRivets;
      const rx = cx + Math.cos(ang) * rRivet;
      const ry = cy + Math.sin(ang) * rRivet;
      ctx.beginPath();
      ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Neonowy wewnętrzny pierścień świetlny z łuną
    ctx.strokeStyle = neonCol;
    ctx.shadowColor = neonCore;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, cy, rInner + 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Ciemny cień głębi otworu (Depth Shadow)
    const inShadow = ctx.createRadialGradient(cx, cy, rInner - 8, cx, cy, rInner + 2);
    inShadow.addColorStop(0.0, 'rgba(0, 0, 0, 0.0)');
    inShadow.addColorStop(1.0, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = inShadow;
    ctx.beginPath();
    ctx.arc(cx, cy, rInner + 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 3. Odbojnice torowiska na krańcach dolnego tunelu (X = 165 oraz X = 4235)
  drawBufferStop(ctx, 165, true);
  drawBufferStop(ctx, 4235, false);

  // 4. Mobilne wagoniki kopalniane w dolnym tunelu
  for (const cart of ARENA_3_MINECARTS) {
    if (cart.passenger) {
      // Pasażer został narysowany pomiędzy warstwami; nakładamy przednią pancerną burtę i resory
      drawMinecartFront(ctx, cart);
    } else {
      // Pusty wagonik bez pasażera: rysujemy koła i pełny korpus
      drawMinecartComplete(ctx, cart);
    }
  }

  ctx.restore();
}

// =========================================================================
// ODBOJNICE KRAŃCOWE I RENDEROWANIE WARSTW WAGONIKÓW
// =========================================================================
function drawBufferStop(ctx, x, isLeft) {
  ctx.save();
  const floorY = 1270;
  const h = 56;
  const w = 18;
  const bx = isLeft ? x : x - w;

  // Stalowy słupek odbojowy
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(bx, floorY - h, w, h);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, floorY - h, w, h);

  // Paski ostrzegawcze (hazard stripes)
  for (let y = floorY - h + 5; y < floorY - 6; y += 12) {
    ctx.fillStyle = '#eab308';
    ctx.fillRect(bx + 2, y, w - 4, 6);
  }

  // Gumowo-stalowy odbojnik sprężynowy
  const padX = isLeft ? bx + w : bx - 10;
  ctx.fillStyle = '#18181b';
  ctx.fillRect(padX, floorY - 44, 10, 24);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(padX, floorY - 44, 10, 24);

  ctx.restore();
}

function drawCartWheels(ctx, cart, bounceY) {
  const r = cart.wheelR;
  const wheelY = cart.y + cart.wheelYOffset + bounceY;
  const w1X = cart.x + cart.wheel1XOffset;
  const w2X = cart.x + cart.wheel2XOffset;

  if (cartWheelImg && cartWheelImg.complete && cartWheelImg.naturalWidth > 0) {
    // Koło 1 (lewe) - obrót wokół własnej osi
    ctx.save();
    ctx.translate(w1X, wheelY);
    ctx.rotate(cart.wheelAngle);
    ctx.drawImage(cartWheelImg, -r, -r, r * 2, r * 2);
    ctx.restore();

    // Koło 2 (prawe) - obrót wokół własnej osi
    ctx.save();
    ctx.translate(w2X, wheelY);
    ctx.rotate(cart.wheelAngle);
    ctx.drawImage(cartWheelImg, -r, -r, r * 2, r * 2);
    ctx.restore();
  } else {
    // Awaryjny wektorowy rysunek kół ze szprychami
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(w1X, wheelY, r, 0, Math.PI * 2);
    ctx.arc(w2X, wheelY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

function drawMinecartComplete(ctx, cart) {
  const bounceY = (cart.bounce > 0) ? Math.sin(cart.bouncePhase) * cart.bounce : 0;

  // 1. Koła kręcące się w osiach zawieszenia
  drawCartWheels(ctx, cart, bounceY);

  // 2. Cały korpus wagonika na wierzchu
  if (cartBodyImg && cartBodyImg.complete && cartBodyImg.naturalWidth > 0) {
    ctx.drawImage(cartBodyImg, cart.x, cart.y + bounceY, cart.w, cart.h);
  }
}

function drawMinecartBackAndWheels(ctx, cart) {
  const bounceY = (cart.bounce > 0) ? Math.sin(cart.bouncePhase) * cart.bounce : 0;

  // 1. Wnętrze i tylna krawędź wagonika (za plecami gracza)
  if (cartInteriorImg && cartInteriorImg.complete && cartInteriorImg.naturalWidth > 0) {
    ctx.drawImage(cartInteriorImg, cart.x, cart.y + bounceY, cart.w, cart.h);
  }

  // 2. Koła za zawieszeniem
  drawCartWheels(ctx, cart, bounceY);
}

function drawMinecartFront(ctx, cart) {
  const bounceY = (cart.bounce > 0) ? Math.sin(cart.bouncePhase) * cart.bounce : 0;

  // Przednia stalowa burta osłaniająca postać i resory
  if (cartFrontImg && cartFrontImg.complete && cartFrontImg.naturalWidth > 0) {
    ctx.drawImage(cartFrontImg, cart.x, cart.y + bounceY, cart.w, cart.h);
  } else if (cartBodyImg && cartBodyImg.complete && cartBodyImg.naturalWidth > 0) {
    ctx.drawImage(cartBodyImg, cart.x, cart.y + bounceY, cart.w, cart.h);
  }
}

// =========================================================================
// DEFINICJA WAGONIKÓW KOPALNIANYCH ARENY 3
// =========================================================================
export const ARENA_3_MINECARTS = [
  {
    id: 'minecart_left',
    startX: 520,
    startY: 1270 - 84,
    x: 520,
    y: 1270 - 84,
    w: 122,
    h: 84,
    vx: 0,
    vy: 0,
    wheelAngle: 0,
    wheelR: 14.2,
    wheel1XOffset: 33.6,
    wheel2XOffset: 92.8,
    wheelYOffset: 70.0,
    passenger: null,
    bounce: 0,
    bouncePhase: 0,
    facing: 1
  },
  {
    id: 'minecart_right',
    startX: 3750,
    startY: 1270 - 84,
    x: 3750,
    y: 1270 - 84,
    w: 122,
    h: 84,
    vx: 0,
    vy: 0,
    wheelAngle: 0,
    wheelR: 14.2,
    wheel1XOffset: 33.6,
    wheel2XOffset: 92.8,
    wheelYOffset: 70.0,
    passenger: null,
    bounce: 0,
    bouncePhase: 0,
    facing: -1
  }
];

export function resetArena3Minecarts() {
  for (const c of ARENA_3_MINECARTS) {
    c.x = c.startX;
    c.y = c.startY;
    c.vx = 0;
    c.vy = 0;
    c.wheelAngle = 0;
    c.bounce = 0;
    c.bouncePhase = 0;
    c.passenger = null;
  }
}

// =========================================================================
// PĘTLA AKTUALIZACJI MECHANIZMÓW ARENY 3 (FIZYKA WAGONIKÓW)
// =========================================================================
export function updateArena3(dt, players, ball) {
  const floorY = 1270;
  const minX = 165;
  const maxX = 4235;

  for (let i = 0; i < ARENA_3_MINECARTS.length; i++) {
    const cart = ARENA_3_MINECARTS[i];

    // 1. Fizyka ruchu i pozycji
    cart.x += cart.vx * dt;
    cart.y += cart.vy * dt;

    // Grawitacja (w razie podbicia przez eksplozję)
    const targetY = floorY - cart.h;
    if (cart.y < targetY) {
      cart.vy += 850 * dt;
    } else {
      if (cart.vy > 25) {
        cart.bounce = Math.min(6, cart.vy * 0.02);
        spawnStretchedSparks(cart.x + cart.w / 2, floorY, 4);
      }
      cart.y = targetY;
      cart.vy = 0;
    }

    // Tarcie toczne kół o torowisko
    const friction = Math.pow(0.988, dt * 60);
    cart.vx *= friction;
    if (Math.abs(cart.vx) < 0.6) cart.vx = 0;

    // Płynny obrót kół proporcjonalny do prędkości (efekt jazdy)
    cart.wheelAngle += (cart.vx * dt) / cart.wheelR;

    // Wygaszanie drgań zawieszenia
    if (cart.bounce > 0.05) {
      cart.bouncePhase += dt * 25;
      cart.bounce *= Math.pow(0.92, dt * 60);
    } else {
      cart.bounce = 0;
      cart.bouncePhase = 0;
    }

    // Iskry spod kół przy szybkiej jeździe
    if (Math.abs(cart.vx) > 160 && Math.random() < 0.28) {
      const sparkX = cart.vx > 0 ? (cart.x + cart.wheel1XOffset) : (cart.x + cart.wheel2XOffset);
      spawnStretchedSparks(sparkX, floorY, 2);
    }

    // 2. Odbicie od krańcowych odbojnic tunelu
    if (cart.x < minX) {
      cart.x = minX;
      cart.vx = -cart.vx * 0.65;
      cart.bounce = 5;
      spawnStretchedSparks(minX + 8, floorY - 25, 8);
    } else if (cart.x + cart.w > maxX) {
      cart.x = maxX - cart.w;
      cart.vx = -cart.vx * 0.65;
      cart.bounce = 5;
      spawnStretchedSparks(maxX - 8, floorY - 25, 8);
    }

    // 3. Obsługa pasażera jadącego wewnątrz wagonika
    if (cart.passenger) {
      const p = cart.passenger;
      const pFootX = p.x + (p.w || 24) / 2;
      const pFootY = p.y + (p.h || 70);
      const cartFloorY = cart.y + cart.h - 18;

      // Sprawdzenie czy gracz nie wyskoczył lub nie wyszedł z wagonika
      const isStillInside = !p.isDead &&
        pFootX >= cart.x - 12 && pFootX <= cart.x + cart.w + 12 &&
        Math.abs(pFootY - cartFloorY) < 32 &&
        (p.vy >= -2);

      if (isStillInside) {
        p.onGround = true;
        p.currentGroundY = cartFloorY;
        p.y = cartFloorY - (p.h || 70);
        p.vy = 0;
        p.x += cart.vx * dt;

        // Sterowanie / napędzanie wagonika od środka
        const moveLeft = p.keys?.left || p.keys?.KeyA || p.keys?.ArrowLeft || (p.leftStick && p.leftStick.x < -0.3);
        const moveRight = p.keys?.right || p.keys?.KeyD || p.keys?.ArrowRight || (p.leftStick && p.leftStick.x > 0.3);

        if (moveLeft) cart.vx -= 180 * dt;
        if (moveRight) cart.vx += 180 * dt;
      } else {
        cart.passenger = null;
        if (p.currentGroundY === cartFloorY) {
          p.currentGroundY = floorY;
        }
      }
    }

    // 4. Detekcja wejścia postaci do środka oraz kolizji zewnętrznych
    if (Array.isArray(players)) {
      for (const p of players) {
        if (!p || p.isDead) continue;
        const pCenterX = p.x + (p.w || 24) / 2;
        const pFootY = p.y + (p.h || 70);
        const cartFloorY = cart.y + cart.h - 18;

        // (A) Wskoczenie / wejście do pustego wagonika
        if (!cart.passenger &&
            pCenterX >= cart.x + 14 && pCenterX <= cart.x + cart.w - 14 &&
            pFootY >= cart.y + 12 && pFootY <= cartFloorY + 20 &&
            p.vy >= -1) {
          cart.passenger = p;
          p.onGround = true;
          p.currentGroundY = cartFloorY;
          p.y = cartFloorY - (p.h || 70);
          p.vy = 0;
          cart.bounce = 3;
          continue;
        }

        // (B) Kolizje z postaciami na zewnątrz wagonika
        if (cart.passenger !== p) {
          const charW = p.w || 24;
          const charH = p.h || 70;

          if (pFootY >= cart.y && p.y <= cart.y + cart.h) {
            // Popchnięcie od boku
            if (p.x + charW >= cart.x && p.x + charW <= cart.x + 18 && p.vx > 0.3) {
              cart.vx += p.vx * 0.5;
            }
            if (p.x <= cart.x + cart.w && p.x >= cart.x + cart.w - 18 && p.vx < -0.3) {
              cart.vx += p.vx * 0.5;
            }

            // Taranowanie przy dużej prędkości wagonika
            if (Math.abs(cart.vx) > 130) {
              const cartCenter = cart.x + cart.w / 2;
              const dist = Math.abs(pCenterX - cartCenter);
              if (dist < (cart.w + charW) * 0.5) {
                p.vx = cart.vx * 1.15;
                p.vy = -160;
                cart.vx *= 0.82;
                spawnStretchedSparks(pCenterX, cart.y + cart.h / 2, 8);
                if (Math.abs(cart.vx) > 220 && p.hp !== undefined) {
                  p.hp = Math.max(0, p.hp - Math.round(Math.abs(cart.vx) * 0.04));
                }
              }
            }
          }
        }
      }
    }

    // 5. Interakcja z piłką w tunelu
    if (ball && ball.y + (ball.colRadius || ball.radius || 10) >= cart.y && ball.y <= floorY) {
      const bRad = ball.colRadius || ball.radius || 10;
      if (ball.x + bRad >= cart.x && ball.x - bRad <= cart.x + cart.w) {
        ball.vx = -ball.vx * 0.7 + cart.vx * 1.25;
        ball.vy = -Math.abs(ball.vy || -3) * 0.85 - 2.5;
        cart.vx -= (ball.vx || 0) * 0.04;
        cart.bounce = 3;
        spawnStretchedSparks(ball.x, ball.y, 6);
      }
    }
  }

  // 6. Kolizja elastyczna pomiędzy dwoma wagonikami
  if (ARENA_3_MINECARTS.length >= 2) {
    const c1 = ARENA_3_MINECARTS[0];
    const c2 = ARENA_3_MINECARTS[1];
    if (c1.x + c1.w > c2.x && c1.x < c2.x + c2.w) {
      const overlap = (c1.x + c1.w) - c2.x;
      c1.x -= overlap * 0.5;
      c2.x += overlap * 0.5;
      const vRel = c1.vx - c2.vx;
      if (vRel > 0) {
        const e = 0.75;
        const avg = (c1.vx + c2.vx) * 0.5;
        c1.vx = avg - (vRel * e * 0.5);
        c2.vx = avg + (vRel * e * 0.5);
        c1.bounce = 6;
        c2.bounce = 6;
        spawnStretchedSparks((c1.x + c1.w + c2.x) * 0.5, floorY - 35, 12);
      }
    }
  }
}

// =========================================================================
// HAKI KOLIZJI POCISKÓW, KOPNIĘCIA I EKSPLOZJI
// =========================================================================
export function onArena3BulletHit(bullet) {
  if (!bullet || !bullet.alive) return false;

  for (const cart of ARENA_3_MINECARTS) {
    const cartRight = cart.x + cart.w;
    const cartBottom = cart.y + cart.h;

    if (bullet.x >= cart.x && bullet.x <= cartRight &&
        bullet.y >= cart.y && bullet.y <= cartBottom) {

      // Przekazanie pędu pocisku na masę wagonika
      const bulletImpulse = (bullet.vx || 0) * 0.32;
      cart.vx += bulletImpulse;
      cart.bounce = 2.5;

      // Jeśli trafienie w stalową burtę lub podwozie (pancerz)
      if (bullet.y >= cart.y + 18) {
        const nx = bullet.vx > 0 ? -1 : 1;
        spawnRicochetSparks(bullet.x, bullet.y, nx, -0.3, 6);
        return true; // Kula zablokowana przez stalowy pancerz
      }

      // Jeśli trafienie powyżej rantu (otwarte wnętrze)
      if (cart.passenger) {
        // Jeśli pasażer kuca, jest w pełni schowany za burtą
        if (cart.passenger.isCrouching) {
          spawnRicochetSparks(bullet.x, bullet.y, 0, -1, 4);
          return true;
        }
        // Jeśli pasażer stoi, pocisk trafia jego wystającą sylwetkę
        return false;
      } else {
        spawnRicochetSparks(bullet.x, bullet.y, 0, -1, 4);
        return true;
      }
    }
  }
  return false;
}

export function onArena3KickHit(player, kickBox) {
  if (!kickBox) return false;
  let hitAny = false;

  for (const cart of ARENA_3_MINECARTS) {
    const boxRight = kickBox.x + kickBox.w;
    const boxBottom = kickBox.y + kickBox.h;
    const cartRight = cart.x + cart.w;
    const cartBottom = cart.y + cart.h;

    const overlap = kickBox.x <= cartRight && boxRight >= cart.x &&
                    kickBox.y <= cartBottom && boxBottom >= cart.y;

    if (overlap) {
      const dir = (player.facing !== undefined) ? player.facing : (kickBox.x < cart.x + cart.w / 2 ? 1 : -1);
      const force = (player.kickForce || 1.0) * 640;
      cart.vx += dir * force;
      cart.bounce = 8;
      spawnStretchedSparks(kickBox.x + kickBox.w / 2, kickBox.y + kickBox.h / 2, 16);
      hitAny = true;
    }
  }
  return hitAny;
}

export function onArena3Explosion(expX, expY, radius) {
  let hit = false;
  for (const cart of ARENA_3_MINECARTS) {
    const cx = cart.x + cart.w / 2;
    const cy = cart.y + cart.h / 2;
    const dist = Math.hypot(cx - expX, cy - expY);
    const maxRadius = radius * 1.35;

    if (dist <= maxRadius) {
      const factor = Math.max(0, 1 - (dist / maxRadius));
      const dirX = dist > 1 ? (cx - expX) / dist : (Math.random() > 0.5 ? 1 : -1);
      const blastForce = factor * 760;

      cart.vx += dirX * blastForce;
      cart.vy -= factor * 220; // Podbicie wagonika do góry
      cart.bounce = 10;
      spawnStretchedSparks(cx, cy, 18);
      hit = true;
    }
  }
  return hit;
}

// =========================================================================
// KONTRAKT ARENY 3 (PLUGIN DEFINITION / LIFECYCLE HOOKS)
// =========================================================================
const arena3 = {
  id: 'arena-3',
  name: 'The Foundry',
  spawns: [
    { x: 600, y: 830 },   // Gracz Cyan (płyta Y = 900)
    { x: 3800, y: 830 },  // Bot Orange (płyta Y = 900)
    { x: 2200, y: 680 }   // Piłka (środek nad kotłem - lewitująca)
  ],
  platforms: ARENA_3_PLATFORMS,
  customObjects: ARENA_3_CUSTOM_OBJECTS,
  minecarts: ARENA_3_MINECARTS,
  reset() {
    resetArena3Minecarts();
  },
  drawBackground(ctx, camera) {
    drawArena3Background(ctx, camera);
  },
  draw(ctx, camera) {
    drawArena3Foreground(ctx, camera);
  },
  update(dt, players, ball) {
    updateArena3(dt, players, ball);
  },
  onBulletHit(bullet) {
    return onArena3BulletHit(bullet);
  },
  onKickHit(player, kickBox) {
    return onArena3KickHit(player, kickBox);
  },
  onExplosion(expX, expY, radius) {
    return onArena3Explosion(expX, expY, radius);
  }
};

export default arena3;
