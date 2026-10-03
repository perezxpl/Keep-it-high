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
  { id: 'floor_l1', x: 320, w: 460, y: 900, h: 70, solid: true, isPlatform: true },
  { id: 'floor_l2', x: 920, w: 930, y: 900, h: 70, solid: true, isPlatform: true },
  { id: 'floor_r1', x: 2550, w: 930, y: 900, h: 70, solid: true, isPlatform: true },
  { id: 'floor_r2', x: 3620, w: 460, y: 900, h: 70, solid: true, isPlatform: true },
  // Luki zrzutowe do tunelu (Drop-Through, oneWay)
  { id: 'hatch_l', x: 780, w: 140, y: 900, h: 10, oneWay: true, isPlatform: true },
  { id: 'hatch_r', x: 3480, w: 140, y: 900, h: 10, oneWay: true, isPlatform: true },
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
  // Podłoga dolnego tunelu
  { id: 'tunnel_floor', x: 160, w: 4080, y: 1270, h: 130, solid: true, isPlatform: true }
];

// Aliasy dla zachowania wstecznej kompatybilności
export const ARENA_FOUNDRY_PLATFORMS = ARENA_3_PLATFORMS;
export const ARENA_FOUNDRY_WALLS = [];

// =========================================================================
// OBIEKTY SPECYFICZNE DLA ARENY 3 (ARENA_3_CUSTOM_OBJECTS)
// Tylko bramki wbudowane w narysowane wnęki ścian szczytowych
// =========================================================================
export const ARENA_3_CUSTOM_OBJECTS = [
  { id: 'goal_cyan', team: 'CYAN', x: 40, y: 640, w: 220, h: 260, facing: 1 },
  { id: 'goal_orange', team: 'ORANGE', x: 4130, y: 640, w: 220, h: 260, facing: -1 }
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

  // 3. Animowana płynna surówka w kadzi i pionowy strumień w trybie 'lighter'
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const cx = 2200;
  const ladleTopY = 780; // ramp_top = 800, ladle_top_y = 780

  // (A) Fale sinusoidalne w czarze kadzi (X = 2200, Y = 780..820)
  for (let layer = 0; layer < 3; layer++) {
    const waveSpeed = time * (2.8 + layer * 1.3);
    const amp = 4.2 - layer * 1.0;
    const waveW = 95 - layer * 16;
    const baseLavaY = ladleTopY + 12 + layer * 8;

    ctx.beginPath();
    ctx.moveTo(cx - waveW, baseLavaY);
    for (let wx = -waveW; wx <= waveW; wx += 4) {
      const wy = baseLavaY + Math.sin((wx * 0.07) + waveSpeed) * amp + Math.cos((wx * 0.14) - waveSpeed * 0.6) * (amp * 0.45);
      ctx.lineTo(cx + wx, wy);
    }
    ctx.lineTo(cx + waveW, baseLavaY + 22);
    ctx.lineTo(cx - waveW, baseLavaY + 22);
    ctx.closePath();

    if (layer === 0) {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.75)'; // Jasnożółty rdzeń ciekłego metalu
    } else if (layer === 1) {
      ctx.fillStyle = 'rgba(249, 115, 22, 0.65)';  // Płynna pomarańczowa surówka
    } else {
      ctx.fillStyle = 'rgba(234, 88, 12, 0.45)';   // Żar termiczny
    }
    ctx.fill();
  }

  // Radialna łuna termiczna wokół kadzi
  const ladleGlow = ctx.createRadialGradient(cx, ladleTopY + 20, 20, cx, ladleTopY + 20, 180);
  ladleGlow.addColorStop(0.0, 'rgba(255, 180, 50, 0.45)');
  ladleGlow.addColorStop(0.4, 'rgba(234, 88, 12, 0.22)');
  ladleGlow.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = ladleGlow;
  ctx.fillRect(cx - 180, ladleTopY - 70, 360, 210);

  // (B) Ciągły strumień ciekłego żelaza z dyszy kadzi w dół do spągu tunelu (Y = 1270)
  const streamW = 14 + Math.sin(time * 9.0) * 2;
  const streamTop = ladleTopY + 40;
  const streamBottom = 1270;

  const streamGrad = ctx.createLinearGradient(cx - streamW, 0, cx + streamW, 0);
  streamGrad.addColorStop(0.0, 'rgba(234, 88, 12, 0.4)');
  streamGrad.addColorStop(0.28, 'rgba(249, 115, 22, 0.85)');
  streamGrad.addColorStop(0.50, 'rgba(254, 240, 138, 0.95)');
  streamGrad.addColorStop(0.72, 'rgba(249, 115, 22, 0.85)');
  streamGrad.addColorStop(1.0, 'rgba(234, 88, 12, 0.4)');

  ctx.fillStyle = streamGrad;
  ctx.fillRect(cx - streamW * 0.5, streamTop, streamW, streamBottom - streamTop);

  // (C) Opadające punkty żaru i iskry wzdłuż pionowego strumienia
  for (let i = 0; i < 45; i++) {
    const seed = i * 41.27;
    const dropSpeed = 360 + (seed % 190);
    const dropY = streamTop + ((time * dropSpeed + seed * 43) % (streamBottom - streamTop));
    const spreadX = (Math.sin(seed + time * 3.5) * 8.5) + (Math.sin(i * 8.7) * 5.0);
    const sparkX = cx + spreadX;
    const sparkR = 1.8 + (seed % 2.5);

    ctx.fillStyle = (i % 2 === 0) ? '#fef08a' : '#f97316';
    ctx.beginPath();
    ctx.arc(sparkX, dropY, sparkR, 0, Math.PI * 2);
    ctx.fill();

    // Drobne rozbryzgi żaru przy uderzeniu w spąg tunelu
    if (dropY > 1245) {
      const splashX = cx + Math.sin(seed + time * 7.5) * (18 + (seed % 34));
      const splashY = 1268 - (seed % 14);
      ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
      ctx.fillRect(splashX, splashY, 2.2, 2.2);
    }
  }

  // Rozbłysk uderzenia surówki o podłoże tunelu
  const splashGlow = ctx.createRadialGradient(cx, 1270, 10, cx, 1270, 95);
  splashGlow.addColorStop(0.0, 'rgba(255, 220, 110, 0.65)');
  splashGlow.addColorStop(0.45, 'rgba(249, 115, 22, 0.32)');
  splashGlow.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = splashGlow;
  ctx.beginPath();
  ctx.arc(cx, 1270, 95, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.restore();
}

// =========================================================================
// RENDEROWANIE ELEMENTÓW PIERWSZOPLANOWYCH
// =========================================================================
export function drawArena3Foreground(ctx, camera) {
  // Dynamiczne obiekty pierwszoplanowe (bramki wypalone bezpośrednio w tła PNG jako portale 3D)
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
    { x: 2200, y: 740 }   // Piłka (środek nad kadzią)
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
