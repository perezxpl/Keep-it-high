// =========================================================================
// ARENAS/ARENA3.JS - THE FOUNDRY (4400x1400 PX INDUSTRIAL FACILITY)
// Autonomiczny moduł areny (Plugin / Lifecycle Hooks Pattern)
// Ściśle przestrzega reguł AGENT.md (Strict DAG: Warstwa 1, zero importów z wyższych warstw)
// =========================================================================

// 1. Obraz tła hali przemysłowej generowany skryptem Python (foundry_bg.png)
const foundryBgImage = new Image();
foundryBgImage.src = 'foundry_bg.png';

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

  ctx.restore();
}

// =========================================================================
// PĘTLA AKTUALIZACJI MECHANIZMÓW ARENY 3 (CZYSTY FUNDAMENT)
// =========================================================================
export function updateArena3(dt, players) {
  // Arena 3 oczyszczona z prowizorycznych obiektów
}

// =========================================================================
// HAKI KOLIZJI POCISKÓW I KOPNIĘCIA SPARTAN KICK
// =========================================================================
export function onArena3BulletHit(bullet) {
  return false;
}

export function onArena3KickHit(player, kickBox) {
  return false;
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
  drawBackground(ctx, camera) {
    drawArena3Background(ctx, camera);
  },
  draw(ctx, camera) {
    drawArena3Foreground(ctx, camera);
  },
  update(dt, players) {
    updateArena3(dt, players);
  },
  onBulletHit(bullet) {
    return onArena3BulletHit(bullet);
  },
  onKickHit(player, kickBox) {
    return onArena3KickHit(player, kickBox);
  }
};

export default arena3;
