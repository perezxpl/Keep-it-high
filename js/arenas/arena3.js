// =========================================================================
// ARENAS/ARENA3.JS - JUNGLE ARENA / MILITARNA DŻUNGLA (4400x1400 PX)
// Autonomiczny moduł areny (Plugin / Lifecycle Hooks Pattern)
// Ściśle przestrzega reguł AGENT.md (Strict DAG: Warstwa 1)
//
// Architektura:
// - Statyczne tło: wygenerowane w grafice PNG (assets/jungle_arena_bg.png)
// - Geometria, platformy, bramki i kolidery: generowane w kodzie (Canvas 2D)
// - Ruchome elementy: falująca rzeka, cząsteczki liści, promienie słońca, pulsujące kielichy
// =========================================================================

// 1. ZASOBY GRAFICZNE PNG (Statyczne tło)
const bgImg = new Image();
bgImg.src = 'assets/jungle_arena_bg.png';

// =========================================================================
// 2. STAN ANIMACJI I EFEKTY RUCHOME
// =========================================================================
let animTime = 0;

// Cząsteczki opadających liści dżungli
const LEAF_PARTICLES = [];
const MAX_LEAVES = 24;
for (let i = 0; i < MAX_LEAVES; i++) {
  LEAF_PARTICLES.push({
    x: Math.random() * 4400,
    y: Math.random() * 1200 + 50,
    vx: -(0.6 + Math.random() * 1.4),
    vy: 0.4 + Math.random() * 0.6,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 2.0,
    size: 7 + Math.random() * 9,
    alpha: 0.45 + Math.random() * 0.45,
    color: ['#2d6e2d', '#3a7c3a', '#4a9e4a', '#5aae3a', '#78b832', '#99a826'][Math.floor(Math.random() * 6)]
  });
}

// Bąbelki / pluski w strefie wody
const WATER_RIPPLES = [];
for (let i = 0; i < 14; i++) {
  WATER_RIPPLES.push({
    x: 1650 + Math.random() * 1100,
    y: 1300 + Math.random() * 80,
    r: 3 + Math.random() * 7,
    speed: 0.3 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2
  });
}

// =========================================================================
// 3. STATYCZNA GEOMETRIA I PLATFORMY KOLIZYJNE (ARENA_3_PLATFORMS)
//
// Układ współrzędnych: [0,0] w lewym górnym rogu; [4400, 1400] w prawym dolnym.
// =========================================================================
export const ARENA_3_PLATFORMS = [

  // -----------------------------------------------------------------------
  // GRANICE ŚWIATA (Ściany boczne zapobiegające wypadnięciu poza canvas 4400 px)
  // -----------------------------------------------------------------------
  {
    id: 'world_boundary_left',
    name: 'Lewa Krawędź Świata',
    x: -60,
    y: 0,
    w: 60,
    h: 1400,
    solid: true,
    isPlatform: false,
    isWall: true,
    pushSide: 'right'
  },
  {
    id: 'world_boundary_right',
    name: 'Prawa Krawędź Świata',
    x: 4400,
    y: 0,
    w: 60,
    h: 1400,
    solid: true,
    isPlatform: false,
    isWall: true,
    pushSide: 'left'
  },

  // -----------------------------------------------------------------------
  // A. PODŁOŻE: LEWY BRZEG (X: 0 do 1600)
  // Twardy, kamienno-ziemisty grunt. Y zaczyna się na 1200 px, opadając uskokami
  // -----------------------------------------------------------------------
  {
    id: 'ground_left_seg1',
    name: 'Lewy Brzeg - Półka Główna (Y: 1200)',
    x: 0,
    y: 1200,
    w: 454,
    h: 200,
    thickness: 200,
    solid: true,
    isPlatform: true
  },
  {
    id: 'ground_left_seg2',
    name: 'Lewy Brzeg - Uskok 1 (Y: 1230)',
    x: 450,
    y: 1230,
    w: 404,
    h: 170,
    thickness: 170,
    solid: true,
    isPlatform: true
  },
  {
    id: 'ground_left_seg3',
    name: 'Lewy Brzeg - Uskok 2 (Y: 1260)',
    x: 850,
    y: 1260,
    w: 404,
    h: 140,
    thickness: 140,
    solid: true,
    isPlatform: true
  },
  {
    id: 'ground_left_seg4',
    name: 'Lewy Brzeg - Skraj Rzeki (Y: 1280)',
    x: 1250,
    y: 1280,
    w: 350,
    h: 120,
    thickness: 120,
    solid: true,
    isPlatform: true
  },

  // -----------------------------------------------------------------------
  // A. PODŁOŻE: PRAWY BRZEG (X: 2800 do 4400)
  // Symetryczny do lewego, pnący się uskokami w stronę prawej krawędzi
  // -----------------------------------------------------------------------
  {
    id: 'ground_right_seg4',
    name: 'Prawy Brzeg - Skraj Rzeki (Y: 1280)',
    x: 2800,
    y: 1280,
    w: 354,
    h: 120,
    thickness: 120,
    solid: true,
    isPlatform: true
  },
  {
    id: 'ground_right_seg3',
    name: 'Prawy Brzeg - Uskok 2 (Y: 1260)',
    x: 3150,
    y: 1260,
    w: 404,
    h: 140,
    thickness: 140,
    solid: true,
    isPlatform: true
  },
  {
    id: 'ground_right_seg2',
    name: 'Prawy Brzeg - Uskok 1 (Y: 1230)',
    x: 3550,
    y: 1230,
    w: 404,
    h: 170,
    thickness: 170,
    solid: true,
    isPlatform: true
  },
  {
    id: 'ground_right_seg1',
    name: 'Prawy Brzeg - Półka Główna (Y: 1200)',
    x: 3950,
    y: 1200,
    w: 450,
    h: 200,
    thickness: 200,
    solid: true,
    isPlatform: true
  },

  // -----------------------------------------------------------------------
  // A. STREFA WODY (TRIGGER AREA - X: 1600 do 2800, Y: 1300 do 1400)
  // Zwiększony drag o 40%, spowolnienie piłki i gracza, nie zabija
  // -----------------------------------------------------------------------
  {
    id: 'water_zone',
    name: 'Rzeka / Strefa Wody (Trigger)',
    type: 'water',
    x: 1600,
    y: 1300,
    w: 1200,
    h: 100,
    solid: false,
    isPlatform: false,
    passBall: true,
    waterDrag: 0.6
  },

  // -----------------------------------------------------------------------
  // B. DREWNIANE WIEŻE NOŚNE BRAMEK (X: 200 oraz X: 4200)
  // Konstrukcje startujące od poziomu gruntu, na których osadzone są bramki
  // -----------------------------------------------------------------------
  // Wieża Lewa (Cyan - Team A):
  {
    id: 'tower_cyan_stem',
    name: 'Drewniana Wieża Lewa - Filar Nośny',
    x: 185,
    y: 600,
    w: 30,
    h: 600,
    solid: true,
    isPlatform: false,
    isWall: true
  },
  {
    id: 'tower_cyan_deck',
    name: 'Wieża Lewa - Pomost Inspekcyjny',
    x: 120,
    y: 600,
    w: 160,
    h: 24,
    thickness: 24,
    solid: true,
    isPlatform: true
  },

  // Wieża Prawa (Orange - Team B):
  {
    id: 'tower_orange_stem',
    name: 'Drewniana Wieża Prawa - Filar Nośny',
    x: 4185,
    y: 600,
    w: 30,
    h: 600,
    solid: true,
    isPlatform: false,
    isWall: true
  },
  {
    id: 'tower_orange_deck',
    name: 'Wieża Prawa - Pomost Inspekcyjny',
    x: 4120,
    y: 600,
    w: 160,
    h: 24,
    thickness: 24,
    solid: true,
    isPlatform: true
  },

  // -----------------------------------------------------------------------
  // B. GŁÓWNE PLATFORMY SNAJPERSKIE (X: 800, Y: 800 oraz X: 3600, Y: 800)
  // Solidne półki skalne porośnięte mchem, szerokość ok. 400 px
  // -----------------------------------------------------------------------
  {
    id: 'sniper_shelf_left',
    name: 'Platforma Snajperska Lewa (Team A)',
    x: 600,
    y: 800,
    w: 400,
    h: 34,
    thickness: 34,
    solid: true,
    isPlatform: true
  },
  {
    id: 'sniper_shelf_right',
    name: 'Platforma Snajperska Prawa (Team B)',
    x: 3400,
    y: 800,
    w: 400,
    h: 34,
    thickness: 34,
    solid: true,
    isPlatform: true
  },

  // -----------------------------------------------------------------------
  // B. WISZĄCY MOST (X: 1800 do 2600, Y: 1000)
  // Kilka sąsiadujących cienkich platform typu One-Way nad rzeką
  // -----------------------------------------------------------------------
  {
    id: 'bridge_segment_1',
    name: 'Wiszący Most - Segment 1',
    type: 'catwalk',
    x: 1800,
    y: 1000,
    w: 200,
    h: 18,
    thickness: 18,
    solid: true,
    isPlatform: true,
    oneWay: true
  },
  {
    id: 'bridge_segment_2',
    name: 'Wiszący Most - Segment 2',
    type: 'catwalk',
    x: 2000,
    y: 1000,
    w: 200,
    h: 18,
    thickness: 18,
    solid: true,
    isPlatform: true,
    oneWay: true
  },
  {
    id: 'bridge_segment_3',
    name: 'Wiszący Most - Segment 3',
    type: 'catwalk',
    x: 2200,
    y: 1000,
    w: 200,
    h: 18,
    thickness: 18,
    solid: true,
    isPlatform: true,
    oneWay: true
  },
  {
    id: 'bridge_segment_4',
    name: 'Wiszący Most - Segment 4',
    type: 'catwalk',
    x: 2400,
    y: 1000,
    w: 200,
    h: 18,
    thickness: 18,
    solid: true,
    isPlatform: true,
    oneWay: true
  },

  // -----------------------------------------------------------------------
  // C. BRAMKI W KSZTAŁCIE "Y" (Kielichy)
  //
  // Bramka Lewa (Team A / CYAN na X: 200):
  // - Trzon: pionowy słupek X: 200, Y: 400 do 600
  // - Lewe ramię: odchylone o -45° (od 200,400 do 60,260) - blokuje wylot poza mapę
  // - Prawe ramię: odchylone o +45° (od 200,400 do 340,260)
  // -----------------------------------------------------------------------
  {
    id: 'goal_cyan_stem_top',
    name: 'Bramka Cyan - Trzon Kielicha (Y: 400-600)',
    x: 185,
    y: 400,
    w: 30,
    h: 200,
    solid: true,
    isPlatform: false,
    isWall: true
  },
  {
    id: 'goal_cyan_arm_left',
    name: 'Bramka Cyan - Lewe Ramię (-45°)',
    x: 60,
    y: 260,
    w: 140,
    h: 140,
    solid: true,
    isPlatform: true,
    surfacePoints: [
      { x: 60, y: 260 },
      { x: 200, y: 400 }
    ]
  },
  {
    id: 'goal_cyan_arm_right',
    name: 'Bramka Cyan - Prawe Ramię (+45°)',
    x: 200,
    y: 260,
    w: 140,
    h: 140,
    solid: true,
    isPlatform: true,
    surfacePoints: [
      { x: 200, y: 400 },
      { x: 340, y: 260 }
    ]
  },

  // -----------------------------------------------------------------------
  // Bramka Prawa (Team B / ORANGE na X: 4200 - Lustrzane odbicie):
  // - Trzon: pionowy słupek X: 4200, Y: 400 do 600
  // - Lewe ramię: odchylone o +45° (od 4060,260 do 4200,400)
  // - Prawe ramię: odchylone o -45° (od 4200,400 do 4340,260) - blokuje wylot
  // -----------------------------------------------------------------------
  {
    id: 'goal_orange_stem_top',
    name: 'Bramka Orange - Trzon Kielicha (Y: 400-600)',
    x: 4185,
    y: 400,
    w: 30,
    h: 200,
    solid: true,
    isPlatform: false,
    isWall: true
  },
  {
    id: 'goal_orange_arm_left',
    name: 'Bramka Orange - Lewe Ramię (+45°)',
    x: 4060,
    y: 260,
    w: 140,
    h: 140,
    solid: true,
    isPlatform: true,
    surfacePoints: [
      { x: 4060, y: 260 },
      { x: 4200, y: 400 }
    ]
  },
  {
    id: 'goal_orange_arm_right',
    name: 'Bramka Orange - Prawe Ramię (-45°)',
    x: 4200,
    y: 260,
    w: 140,
    h: 140,
    solid: true,
    isPlatform: true,
    surfacePoints: [
      { x: 4200, y: 400 },
      { x: 4340, y: 260 }
    ]
  }
];

// =========================================================================
// 4. BRAMKI (CUSTOM OBJECTS - GOAL TRIGGERS)
// Obszary punktowania wewnątrz kielichów "Y"
// =========================================================================
export const ARENA_3_CUSTOM_OBJECTS = [
  // Bramka Lewa - Team A (Cyan): obszar pomiędzy ramionami (X: 120-280, Y: 250-400)
  {
    id: 'goal_cyan_trigger',
    type: 'goal',
    team: 'CYAN',
    isCupGoal: true,
    x: 120,
    y: 250,
    w: 160,
    h: 150,
    facing: 1,
    targetX: 200,
    targetY: 410
  },
  // Bramka Prawa - Team B (Orange): lustrzane odbicie na X: 4200
  {
    id: 'goal_orange_trigger',
    type: 'goal',
    team: 'ORANGE',
    isCupGoal: true,
    x: 4120,
    y: 250,
    w: 160,
    h: 150,
    facing: -1,
    targetX: 4200,
    targetY: 410
  }
];

// =========================================================================
// PUNKTY ODRODZEŃ (SPAWNERS)
// =========================================================================
export const ARENA_3_SPAWNS = {
  teamA: [
    { x: 600, y: 1130 },  // Na gruncie Y: 1200
    { x: 800, y: 730 }    // Na platformie snajperskiej Y: 800
  ],
  teamB: [
    { x: 3800, y: 1130 }, // Na gruncie Y: 1200
    { x: 3600, y: 730 }   // Na platformie snajperskiej Y: 800
  ],
  ball: { x: 2200, y: 700 } // Środek mapy, tuż nad wiszącym mostem
};

export const ARENA_3_MINECARTS = [];

export function resetArena3Minecarts() {}
export function resetArena3Breaches() {}

// =========================================================================
// 5. GŁÓWNA PĘTLA AKTUALIZACJI ARENY 3 (UPDATE TICK)
// =========================================================================
export function updateArena3(dt, players, ball) {
  animTime += dt;

  // 1. Animacja liści dżungli
  for (let i = 0; i < LEAF_PARTICLES.length; i++) {
    const leaf = LEAF_PARTICLES[i];
    leaf.x += leaf.vx * 60 * dt;
    leaf.y += leaf.vy * 60 * dt;
    leaf.rot += leaf.rotSpeed * dt;
    leaf.x += Math.sin(animTime * 1.5 + i * 0.7) * 0.35;

    if (leaf.x < -40) {
      leaf.x = 4440;
      leaf.y = Math.random() * 1000 + 40;
    }
    if (leaf.y > 1380) {
      leaf.y = -30;
      leaf.x = Math.random() * 4400;
    }
  }

  // 2. Fizyka strefy wody (Trigger Area - X: 1600 do 2800, Y: 1300 do 1400)
  // Opór ruchu (drag) rośnie o 40% (płynny opór cieczy), spowolnienie piłki i gracza.
  // Woda nie zabija - delikatny wypór pozwala na powolne wyskoczenie na brzeg.
  if (Array.isArray(players)) {
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (!p || p.isDead) continue;

      const pFeetY = p.y + (p.h || 70);
      const inWaterX = (p.x >= 1580 && p.x <= 2820);
      const inWaterY = (pFeetY >= 1300 && p.y <= 1400);

      if (inWaterX && inWaterY) {
        // Płynny opór w wodzie
        p.vx *= 0.88;
        p.vy *= 0.85;

        // Ograniczenie maksymalnej prędkości opadania w głąb rzeki
        if (p.vy > 5.5) p.vy = 5.5;

        // Wypór hydrostatyczny przy dnie rzeki - woda nie pozwala utonąć
        if (pFeetY > 1365) {
          p.vy = -7.5;
          p.onGround = false;
          p.isJumping = true;
          p.currentPlatform = null;
        }
      }
    }
  }

  // Spowolnienie i unoszenie piłki w rzece
  if (ball && !ball.goalAnimation?.active) {
    const ballInWater = (ball.x >= 1580 && ball.x <= 2820 && ball.y >= 1300 && ball.y <= 1400);
    if (ballInWater) {
      ball.vx *= 0.88;
      ball.vy *= 0.85;
      if (ball.vy > 5.5) ball.vy = 5.5;
      // Wypór wody na piłkę
      if (ball.y > 1360) {
        ball.vy = -5.5;
      }
    }
  }
}

// =========================================================================
// 6. RENDEROWANIE TŁA (PNG + WARSTWY RUCHOME)
// =========================================================================
export function drawArena3Background(ctx, camera) {
  if (!ctx) return;

  // 1. Zmierzchowe / tropikalne niebo jako ekranowy podkład
  const W_screen = ctx.canvas?.width || (typeof window !== 'undefined' ? window.innerWidth : 1920);
  const H_screen = ctx.canvas?.height || (typeof window !== 'undefined' ? window.innerHeight : 1080);
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H_screen);
  skyGrad.addColorStop(0.0, '#78b0d0');
  skyGrad.addColorStop(0.4, '#a2cda2');
  skyGrad.addColorStop(0.8, '#3d6829');
  skyGrad.addColorStop(1.0, '#1a3a12');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W_screen, H_screen);

  ctx.save();
  if (camera) {
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
  }

  // 2. Rysowanie statycznego obrazu tła (4400 x 1400 px na współrzędnych [0, 0])
  if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
    ctx.drawImage(bgImg, 0, 0, 4400, 1400);
  } else {
    // Rezerwowy gradient gdy obraz się ładuje
    const g = ctx.createLinearGradient(0, 0, 0, 1400);
    g.addColorStop(0, '#8ec5e5');
    g.addColorStop(0.3, '#c2e0b8');
    g.addColorStop(0.65, '#3b6a2e');
    g.addColorStop(1.0, '#142e0d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4400, 1400);
  }

  // 3. Promienie słońca przebijające się przez korony drzew (God Rays)
  ctx.save();
  ctx.globalAlpha = 0.08 + Math.sin(animTime * 0.8) * 0.03;
  ctx.fillStyle = '#fffbe8';
  for (let r = 0; r < 5; r++) {
    const rx = 800 + r * 650;
    ctx.beginPath();
    ctx.moveTo(rx, 0);
    ctx.lineTo(rx + 220, 0);
    ctx.lineTo(rx + 480, 1400);
    ctx.lineTo(rx + 160, 1400);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 4. Liście opadające w tle (pomiędzy tłem a postaciami)
  for (let i = 0; i < LEAF_PARTICLES.length; i += 2) {
    const leaf = LEAF_PARTICLES[i];
    ctx.save();
    ctx.globalAlpha = leaf.alpha * 0.55;
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.rot);
    ctx.fillStyle = leaf.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, leaf.size, leaf.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
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
  if (camera) {
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
  }

  const camL = camera ? camera.x - 200 : 0;
  const camR = camera ? camera.x + (camera.viewWidth || 2000) + 200 : 4400;

  // -----------------------------------------------------------------------
  // 1. PODŁOŻE I SKAŁY: LEWY I PRAWY BRZEG (USKOKI)
  // -----------------------------------------------------------------------
  const groundSegments = [
    // Lewy brzeg
    { x: 0, y: 1200, w: 454, h: 200 },
    { x: 450, y: 1230, w: 404, h: 170 },
    { x: 850, y: 1260, w: 404, h: 140 },
    { x: 1250, y: 1280, w: 350, h: 120 },
    // Prawy brzeg
    { x: 2800, y: 1280, w: 354, h: 120 },
    { x: 3150, y: 1260, w: 404, h: 140 },
    { x: 3550, y: 1230, w: 404, h: 170 },
    { x: 3950, y: 1200, w: 450, h: 200 }
  ];

  for (let sIdx = 0; sIdx < groundSegments.length; sIdx++) {
    const seg = groundSegments[sIdx];
    if (seg.x + seg.w < camL || seg.x > camR) continue;

    // A. Kamienno-ziemisty trzon gruntu
    const gGrad = ctx.createLinearGradient(seg.x, seg.y, seg.x, seg.y + seg.h);
    gGrad.addColorStop(0.0, '#42321e');
    gGrad.addColorStop(0.15, '#2e2214');
    gGrad.addColorStop(0.5, '#1e160c');
    gGrad.addColorStop(1.0, '#100c06');
    ctx.fillStyle = gGrad;
    ctx.fillRect(seg.x, seg.y, seg.w, seg.h);

    // B. Warstwa mchu i dżunglowej trawy na górnej krawędzi (Y)
    ctx.fillStyle = '#3e7025';
    ctx.fillRect(seg.x, seg.y, seg.w, 14);
    ctx.fillStyle = '#589e34';
    ctx.fillRect(seg.x, seg.y, seg.w, 6);

    // C. Ostra krawędź komiksowa i rim lighting (światło na krawędzi)
    ctx.strokeStyle = 'rgba(125, 220, 60, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(seg.x, seg.y);
    ctx.lineTo(seg.x + seg.w, seg.y);
    ctx.stroke();

    // D. Detale kamieni / starożytnych bloków w gruncie
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let kx = seg.x + 25; kx < seg.x + seg.w - 30; kx += 70) {
      ctx.fillRect(kx, seg.y + 24, 48, 20);
      ctx.fillRect(kx + 20, seg.y + 55, 36, 18);
    }

    // E. Kontur bloku terenu
    ctx.strokeStyle = '#18120a';
    ctx.lineWidth = 3;
    ctx.strokeRect(seg.x, seg.y, seg.w, seg.h);
  }

  // -----------------------------------------------------------------------
  // 2. STREFA WODY - RZEKA (X: 1600 do 2800, Y: 1300 do 1400)
  // Falująca powierzchnia wody, głębia, odbicia
  // -----------------------------------------------------------------------
  if (camL < 2850 && camR > 1550) {
    // A. Wypełnienie toni wodnej
    const waterDepthGrad = ctx.createLinearGradient(1600, 1300, 1600, 1400);
    waterDepthGrad.addColorStop(0.0, 'rgba(28, 120, 180, 0.88)');
    waterDepthGrad.addColorStop(0.35, 'rgba(16, 85, 145, 0.94)');
    waterDepthGrad.addColorStop(1.0, 'rgba(8, 48, 92, 0.98)');
    ctx.fillStyle = waterDepthGrad;
    ctx.fillRect(1600, 1300, 1200, 100);

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

    // E. Subtelny napis strefy wody
    ctx.save();
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.textAlign = 'center';
    ctx.fillText('≈  RZEKA DŻUNGLI (DRAG +40%)  ≈', 2200, 1355);
    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // 3. DREWNIANE WIEŻE NOŚNE BRAMEK (X: 200 oraz X: 4200)
  // -----------------------------------------------------------------------
  function drawTowerStructure(isLeft) {
    const tx = isLeft ? 185 : 4185;
    const tw = 30;
    const ty = 600;
    const th = 600;
    if (tx + tw + 100 < camL || tx - 100 > camR) return;

    ctx.save();
    // A. Główny pionowy drewniany słup (filar)
    const woodGrad = ctx.createLinearGradient(tx, ty, tx + tw, ty + th);
    woodGrad.addColorStop(0, '#5a3a1a');
    woodGrad.addColorStop(0.5, '#432910');
    woodGrad.addColorStop(1, '#2c1808');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(tx, ty, tw, th);

    // B. Faktura słojów drewna
    ctx.strokeStyle = 'rgba(20, 10, 4, 0.55)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(tx + 8, ty);
    ctx.lineTo(tx + 8, ty + th);
    ctx.moveTo(tx + 20, ty);
    ctx.lineTo(tx + 20, ty + th);
    ctx.stroke();

    // C. Drewniane zastrzały / krzyżulce wzmacniające wieżę
    ctx.strokeStyle = '#432910';
    ctx.lineWidth = 8;
    for (let sy = ty + 40; sy < ty + th - 20; sy += 90) {
      ctx.beginPath();
      const spreadX = isLeft ? (tx - 50) : (tx + 50 + tw);
      ctx.moveTo(tx + tw / 2, sy);
      ctx.lineTo(spreadX, sy + 60);
      ctx.stroke();
    }

    // D. Metalowe okucia / klamry żelazne
    ctx.fillStyle = '#64748b';
    for (let by = ty + 50; by < ty + th; by += 100) {
      ctx.fillRect(tx - 3, by, tw + 6, 12);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(tx - 3, by, tw + 6, 12);
    }

    // E. Pomost inspekcyjny przy wieży (Y: 600, w: 160)
    const deckX = isLeft ? 120 : 4120;
    const deckW = 160;
    const deckY = 600;
    const deckH = 24;

    const deckGrad = ctx.createLinearGradient(deckX, deckY, deckX, deckY + deckH);
    deckGrad.addColorStop(0, '#6d4822');
    deckGrad.addColorStop(0.5, '#4f3114');
    deckGrad.addColorStop(1, '#321c08');
    ctx.fillStyle = deckGrad;
    ctx.fillRect(deckX, deckY, deckW, deckH);

    // Krawędź pomostu (rim lighting)
    ctx.strokeStyle = isLeft ? 'rgba(6, 182, 212, 0.7)' : 'rgba(249, 115, 22, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(deckX, deckY);
    ctx.lineTo(deckX + deckW, deckY);
    ctx.stroke();

    ctx.strokeStyle = '#231406';
    ctx.lineWidth = 2;
    ctx.strokeRect(deckX, deckY, deckW, deckH);

    ctx.restore();
  }

  drawTowerStructure(true);
  drawTowerStructure(false);

  // -----------------------------------------------------------------------
  // 4. BRAMKI W KSZTAŁCIE "Y" (KIELICHY ZAWIESZONE NA WYSOKOŚCI)
  // Lewa: Team A (Cyan) na X: 200, Y: 400..600
  // Prawa: Team B (Orange) na X: 4200, Y: 400..600
  // -----------------------------------------------------------------------
  function drawChaliceGoal(isLeft) {
    const cx = isLeft ? 200 : 4200;
    const stemX = isLeft ? 185 : 4185;
    const stemY = 400;
    const stemH = 200;
    const stemW = 30;

    if (cx + 250 < camL || cx - 250 > camR) return;

    ctx.save();
    const teamCol = isLeft ? '#06b6d4' : '#f97316';
    const teamGlow = isLeft ? 'rgba(6, 182, 212, 0.55)' : 'rgba(249, 115, 22, 0.55)';
    const teamName = isLeft ? 'TEAM A' : 'TEAM B';

    // A. Trzon kielicha Y (pionowy słupek X: 200, Y: 400..600)
    const stemGrad = ctx.createLinearGradient(stemX, stemY, stemX + stemW, stemY + stemH);
    stemGrad.addColorStop(0, '#5a3a1a');
    stemGrad.addColorStop(0.5, '#3e240e');
    stemGrad.addColorStop(1, '#2c1808');
    ctx.fillStyle = stemGrad;
    ctx.fillRect(stemX, stemY, stemW, stemH);
    ctx.strokeStyle = '#201105';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(stemX, stemY, stemW, stemH);

    // B. Ramiona kielicha "Y"
    // Lewe ramię: od (cx, 400) do (cx - 140, 260)
    // Prawe ramię: od (cx, 400) do (cx + 140, 260)
    const armX_left = cx - 140;
    const armY_top = 260;
    const armX_right = cx + 140;

    // Cień/poświata ramion
    ctx.shadowColor = teamCol;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = teamGlow;
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(armX_left, armY_top);
    ctx.lineTo(cx, 400);
    ctx.lineTo(armX_right, armY_top);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Solidna belka drewniana ramion
    ctx.strokeStyle = '#432910';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(armX_left, armY_top);
    ctx.lineTo(cx, 400);
    ctx.lineTo(armX_right, armY_top);
    ctx.stroke();

    // Kolorowy rdzeń / runy energetyczne wewnątrz ramion
    ctx.strokeStyle = teamCol;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(armX_left, armY_top);
    ctx.lineTo(cx, 400);
    ctx.lineTo(armX_right, armY_top);
    ctx.stroke();

    // C. Kielich - jarzące się pole punktowania (Goal Trigger)
    const pulse = 0.72 + Math.sin(animTime * 4.5) * 0.28;
    ctx.save();
    ctx.globalAlpha = 0.55 * pulse;
    const chaliceGlow = ctx.createRadialGradient(cx, 330, 20, cx, 330, 110);
    chaliceGlow.addColorStop(0.0, teamCol);
    chaliceGlow.addColorStop(0.6, teamGlow);
    chaliceGlow.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = chaliceGlow;
    ctx.beginPath();
    ctx.arc(cx, 330, 110, 0, Math.PI * 2);
    ctx.fill();

    // Wewnętrzny stożek kielicha (promień absorpcji)
    ctx.globalAlpha = 0.40 * pulse;
    ctx.fillStyle = teamCol;
    ctx.beginPath();
    ctx.moveTo(cx - 100, 260);
    ctx.lineTo(cx + 100, 260);
    ctx.lineTo(cx, 400);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // D. Oznaczenie bramki
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = teamCol;
    ctx.textAlign = 'center';
    ctx.fillText(`⚡ ${teamName} ⚡`, cx, 235);

    ctx.restore();
  }

  drawChaliceGoal(true);
  drawChaliceGoal(false);

  // -----------------------------------------------------------------------
  // 5. GŁÓWNE PLATFORMY SNAJPERSKIE (X: 800, Y: 800 oraz X: 3600, Y: 800)
  // Solidne półki skalne porośnięte mchem, szerokość ok. 400 px
  // -----------------------------------------------------------------------
  function drawSniperRock(px, py, pw, ph) {
    if (px + pw < camL || px > camR) return;

    ctx.save();
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
    ctx.fillRect(px + 10, py, pw - 20, 4);

    // C. Ostra krawędź komiksowa / rim lighting
    ctx.strokeStyle = 'rgba(135, 235, 75, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + pw, py);
    ctx.stroke();

    // D. Kamienne spękania i reliefy starożytnych ruin
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let rx = px + 25; rx < px + pw - 25; rx += 60) {
      ctx.fillRect(rx, py + 14, 40, 12);
    }

    // E. Zwieszające się pnącza (liany) pod platformą
    ctx.strokeStyle = '#3d6325';
    ctx.lineWidth = 3;
    for (let lx = px + 40; lx < px + pw - 40; lx += 80) {
      const vineLen = 35 + Math.sin(lx * 0.2) * 15;
      ctx.beginPath();
      ctx.moveTo(lx, py + ph);
      ctx.quadraticCurveTo(lx + 10, py + ph + vineLen * 0.5, lx - 5, py + ph + vineLen);
      ctx.stroke();
    }

    // F. Obrys platformy
    ctx.strokeStyle = '#1b231b';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(px, py, pw, ph);

    ctx.restore();
  }

  drawSniperRock(600, 800, 400, 34);
  drawSniperRock(3400, 800, 400, 34);

  // -----------------------------------------------------------------------
  // 6. WISZĄCY MOST (X: 1800 do 2600, Y: 1000)
  // Liny nośne, wieszaki, drewniane kładki One-Way
  // -----------------------------------------------------------------------
  const bridgeX1 = 1800;
  const bridgeX2 = 2600;
  const bridgeY = 1000;

  if (bridgeX2 + 50 >= camL && bridgeX1 - 50 <= camR) {
    ctx.save();
    // A. Główne liny nośne zwisające parabolicznie nad mostem
    ctx.strokeStyle = '#5a4225';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bridgeX1 - 40, bridgeY - 70);
    ctx.quadraticCurveTo(2200, bridgeY + 45, bridgeX2 + 40, bridgeY - 70);
    ctx.stroke();

    // Dolna linka balastowa
    ctx.strokeStyle = '#3e2a14';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bridgeX1 - 40, bridgeY + 30);
    ctx.quadraticCurveTo(2200, bridgeY + 80, bridgeX2 + 40, bridgeY + 30);
    ctx.stroke();

    // Pionowe wieszaki linowe co 50 px
    ctx.strokeStyle = 'rgba(110, 85, 50, 0.75)';
    ctx.lineWidth = 1.8;
    for (let hx = bridgeX1 + 30; hx <= bridgeX2 - 30; hx += 50) {
      const u = (hx - bridgeX1) / (bridgeX2 - bridgeX1);
      const ropeTopY = (bridgeY - 70) * (1 - u) + (bridgeY - 70) * u + Math.sin(u * Math.PI) * 85;
      ctx.beginPath();
      ctx.moveTo(hx, ropeTopY);
      ctx.lineTo(hx, bridgeY);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Segmenty drewnianego mostu (4 segmenty po 200 px)
  const bridgeSegments = [
    { x: 1800, w: 200 },
    { x: 2000, w: 200 },
    { x: 2200, w: 200 },
    { x: 2400, w: 200 }
  ];

  for (let bIdx = 0; bIdx < bridgeSegments.length; bIdx++) {
    const bSeg = bridgeSegments[bIdx];
    if (bSeg.x + bSeg.w < camL || bSeg.x > camR) continue;

    ctx.save();
    // Drewniana deska
    const bGrad = ctx.createLinearGradient(bSeg.x, bridgeY, bSeg.x, bridgeY + 18);
    bGrad.addColorStop(0.0, '#785226');
    bGrad.addColorStop(0.5, '#563814');
    bGrad.addColorStop(1.0, '#362108');
    ctx.fillStyle = bGrad;
    ctx.fillRect(bSeg.x, bridgeY, bSeg.w, 18);

    // Poszczególne szczebelki mostu
    ctx.strokeStyle = 'rgba(28, 16, 5, 0.6)';
    ctx.lineWidth = 2;
    for (let px = bSeg.x + 18; px < bSeg.x + bSeg.w - 10; px += 24) {
      ctx.beginPath();
      ctx.moveTo(px, bridgeY);
      ctx.lineTo(px, bridgeY + 18);
      ctx.stroke();
    }

    // Jasna górna krawędź (rim light)
    ctx.strokeStyle = 'rgba(215, 175, 80, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bSeg.x, bridgeY);
    ctx.lineTo(bSeg.x + bSeg.w, bridgeY);
    ctx.stroke();

    // Obrys segmentu
    ctx.strokeStyle = '#241405';
    ctx.lineWidth = 2;
    ctx.strokeRect(bSeg.x, bridgeY, bSeg.w, 18);
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

// =========================================================================
// 8. HOOKI INTERAKCJI BOJOWYCH
// =========================================================================
export function onArena3BulletHit(bullet) {
  return false;
}

export function onArena3KickHit(player, kickBox) {
  return false;
}

export function onArena3Explosion(expX, expY, radius, context) {
  return false;
}

// =========================================================================
// 9. KONTRAKT ARENY 3 (PLUGIN DEFINITION / LIFECYCLE HOOKS)
// =========================================================================
const arena3 = {
  id: 'arena-3',
  alias: 'JUNGLE_ARENA',
  mapId: 'jungle_arena_01',
  name: 'Jungle Arena (Militarna Dżungla)',
  width: 4400,
  height: 1400,
  physics: {
    gravity: 9.8,
    waterDrag: 0.6
  },
  spawns: [
    // Team A (Cyan): grunt lewy Y: 1200 (wysokość gracza 70px -> y: 1130)
    { x: 600, y: 1130 },
    // Team B (Orange): grunt prawy Y: 1200 (wysokość gracza 70px -> y: 1130)
    { x: 3800, y: 1130 },
    // Piłka: środek mapy, tuż nad wiszącym mostem (X: 2200, Y: 700)
    { x: 2200, y: 700 }
  ],
  detailedSpawns: ARENA_3_SPAWNS,
  platforms: ARENA_3_PLATFORMS,
  customObjects: ARENA_3_CUSTOM_OBJECTS,
  minecarts: ARENA_3_MINECARTS,
  reset() {
    resetArena3Minecarts();
    resetArena3Breaches();
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
  onExplosion(expX, expY, radius, context) {
    return onArena3Explosion(expX, expY, radius, context);
  }
};

export default arena3;
