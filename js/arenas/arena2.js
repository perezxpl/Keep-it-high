// =========================================================================
// ARENAS/ARENA2.JS - CYBER STADIUM (CYBERPUNKOWE KOLOSEUM 1920 PX)
// Autonomiczny moduł areny (Plugin / Lifecycle Hooks Pattern)
// Zawiera m.in. dynamiczną kładkę wiszącą na łańcuchach z fizyką kołysania
// =========================================================================

// =========================================================================
// STATYCZNA GEOMETRIA I PLATFORMY
// =========================================================================
export const ARENA_CYBER_STADIUM_PLATFORMS = [
  {
    id: 'cyber_bastion_west',
    type: 'rock_platform',
    isCyberBastion: true,
    theme: 'cyan',
    x: 160,
    w: 280,
    h: 22,
    relY: 240,
    thickness: 22,
    props: []
  },
  {
    id: 'cyber_bastion_east',
    type: 'rock_platform',
    isCyberBastion: true,
    theme: 'orange',
    x: 1480,
    w: 280,
    h: 22,
    relY: 240,
    thickness: 22,
    props: []
  },
  {
    id: 'chain_catwalk',
    type: 'catwalk',
    isHanging: true,
    x: 780,
    y: 280,
    baseY: 280,
    relY: 220,
    w: 360,
    h: 18,
    thickness: 18,
    swingAngle: 0,
    swingVel: 0,
    chains: [
      { anchorX: 820, anchorY: 30 },
      { anchorX: 1100, anchorY: 30 }
    ]
  }
];

export const ARENA_CYBER_STADIUM_BARRICADES = [];

export const ARENA_CYBER_STADIUM_GOALS = [
  {
    id: 'goal_cyan',
    team: 'CYAN',
    x: 180,
    relY: 240,
    w: 90,
    h: 110,
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.85)',
    facing: 1
  },
  {
    id: 'goal_orange',
    team: 'ORANGE',
    x: 1650,
    relY: 240,
    w: 90,
    h: 110,
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.85)',
    facing: -1
  }
];

// =========================================================================
// RENDEROWANIE TŁA ARENY 2 (CYBERPUNK SKYLINE)
// =========================================================================
export function drawArena2Background(ctx, camera) {
  if (!ctx) return;
  const W = ctx.canvas?.width || 1920;
  const H = ctx.canvas?.height || 1080;
  const camX = camera ? (camera.x + (camera.viewWidth || (W / (camera.zoom || 1))) / 2) : 960;
  const time = performance.now() * 0.001;

  // 1. Ciemnoniebieski / purpurowy gradient nieba
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0.0, '#030712');
  sky.addColorStop(0.42, '#090d16');
  sky.addColorStop(0.75, '#0f172a');
  sky.addColorStop(1.0, '#1e1b4b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // 2. Neonowe wieżowce w tle (paralaksa)
  ctx.save();
  const buildings = [
    { x: 100, w: 120, h: 480, color: '#090e1a' },
    { x: 260, w: 80, h: 360, color: '#0c1222' },
    { x: 380, w: 160, h: 520, color: '#080d18' },
    { x: 580, w: 110, h: 420, color: '#0a101f' },
    { x: 740, w: 140, h: 490, color: '#0c1326' },
    { x: 920, w: 90, h: 380, color: '#090e1a' },
    { x: 1050, w: 150, h: 540, color: '#080d18' },
    { x: 1240, w: 100, h: 440, color: '#0a101f' },
    { x: 1380, w: 130, h: 470, color: '#0c1222' },
    { x: 1560, w: 120, h: 410, color: '#090e1a' },
    { x: 1720, w: 140, h: 500, color: '#080d18' }
  ];

  const parallax = 0.05;
  const offset = ((camX * parallax) % 1920 + 1920) % 1920;

  for (let loop = -1; loop <= 1; loop++) {
    const shift = loop * 1920 - offset;
    for (const b of buildings) {
      const bx = b.x + shift;
      if (bx + b.w < 0 || bx > W) continue;
      const by = H - b.h;

      ctx.fillStyle = b.color;
      ctx.fillRect(bx, by, b.w, b.h);

      // Neonowe obrysy dachów
      ctx.strokeStyle = (b.x % 2 === 0) ? 'rgba(6, 182, 212, 0.25)' : 'rgba(249, 115, 22, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + b.w, by);
      ctx.stroke();
    }
  }
  ctx.restore();

  // 3. Cybernetyczne reflektory stadionowe
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const beamLen = H * 0.90;
  const spots = [
    { x: W * 0.15, angle: 0.30, color: 'rgba(6, 182, 212, ' },
    { x: W * 0.85, angle: -0.30, color: 'rgba(249, 115, 22, ' }
  ];

  for (let i = 0; i < spots.length; i++) {
    const sp = spots[i];
    const sway = Math.sin(time * 0.9 + i * 2.0) * 0.15;
    ctx.save();
    ctx.translate(sp.x, H * 0.70);
    ctx.rotate(sp.angle + sway);

    const grad = ctx.createLinearGradient(0, 0, 0, -beamLen);
    grad.addColorStop(0.0, `${sp.color}0.45)`);
    grad.addColorStop(0.6, `${sp.color}0.08)`);
    grad.addColorStop(1.0, `${sp.color}0.0)`);
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-120, -beamLen);
    ctx.lineTo(120, -beamLen);
    ctx.lineTo(18, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// =========================================================================
// RENDEROWANIE FOREGROUND (ŁAŃCUCHY KŁADKI I DETALE NEONOWE)
// =========================================================================
export function drawArena2Foreground(ctx, camera) {
  if (!ctx) return;
  const catwalk = ARENA_CYBER_STADIUM_PLATFORMS.find(p => p.id === 'chain_catwalk');
  if (!catwalk) return;

  ctx.save();

  // 1. Rysowanie stalowych łańcuchów podtrzymujących kładkę
  const chains = catwalk.chains || [];
  const cx = catwalk.x;
  const cy = catwalk.y;

  for (let i = 0; i < chains.length; i++) {
    const ch = chains[i];
    const topX = ch.anchorX;
    const topY = ch.anchorY;
    const botX = (i === 0) ? (cx + 35) : (cx + catwalk.w - 35);
    const botY = cy;

    // Kotwica sufitowa
    ctx.fillStyle = '#374151';
    ctx.fillRect(topX - 8, topY - 6, 16, 10);
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(topX - 8, topY - 6, 16, 10);

    // Ogniwa łańcucha
    const linkCount = 14;
    for (let l = 0; l <= linkCount; l++) {
      const t = l / linkCount;
      const lx = topX + (botX - topX) * t;
      const ly = topY + (botY - topY) * t;

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(catwalk.swingAngle * 0.4);

      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 7, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Stalowy błysk
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(-1, -2, 2, 0, Math.PI);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 2. Neonowe oznaczenie kładki i pasy ostrzegawcze
  ctx.save();
  ctx.translate(catwalk.x + catwalk.w / 2, catwalk.y + catwalk.h / 2);
  ctx.rotate(catwalk.swingAngle);
  ctx.translate(-(catwalk.x + catwalk.w / 2), -(catwalk.y + catwalk.h / 2));

  // Neonowa krawędź kładki
  ctx.strokeStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 8;
  ctx.lineWidth = 2;
  ctx.strokeRect(catwalk.x, catwalk.y, catwalk.w, catwalk.h);

  // Nitowane okucia
  ctx.fillStyle = '#fbbf24';
  ctx.shadowBlur = 0;
  ctx.fillRect(catwalk.x + 8, catwalk.y + 4, 4, 4);
  ctx.fillRect(catwalk.x + catwalk.w - 12, catwalk.y + 4, 4, 4);
  ctx.restore();

  ctx.restore();
}

// =========================================================================
// PĘTLA AKTUALIZACJI FIZYKI ARENY 2 (KOŁYSANIE KŁADKI NA ŁAŃCUCHACH)
// =========================================================================
export function updateArena2(dt, players) {
  const catwalk = ARENA_CYBER_STADIUM_PLATFORMS.find(p => p.id === 'chain_catwalk');
  if (!catwalk) return;

  let playerOnCatwalkWeight = 0;
  let horizontalImpulse = 0;

  if (Array.isArray(players)) {
    for (const p of players) {
      if (!p || p.isDead) continue;
      const px = p.x + (p.w || 24) / 2;
      const py = p.y + (p.h || 70);

      // Sprawdź czy gracz stoi na lub bezpośrednio nad wiszącą kładką
      if (px >= catwalk.x && px <= catwalk.x + catwalk.w && Math.abs(py - catwalk.y) < 14) {
        playerOnCatwalkWeight += 1;
        horizontalImpulse += (p.vx || 0) * 0.003;
      }
    }
  }

  // Siła sprężystości powrotnej i tłumienie wahadła
  const springConstant = 0.06;
  const damping = 0.94;

  const targetAngle = horizontalImpulse;
  const springForce = -springConstant * (catwalk.swingAngle - targetAngle);

  catwalk.swingVel = (catwalk.swingVel + springForce) * damping;
  catwalk.swingAngle += catwalk.swingVel;

  // Ugięcie pionowe przy obciążeniu
  const dip = Math.min(10, playerOnCatwalkWeight * 4 + Math.abs(catwalk.swingAngle) * 8);
  catwalk.y = catwalk.baseY + dip;
}

// =========================================================================
// HAKI CYKLU ŻYCIA: TRAFIENIE KULI I SPARTAN KICK
// =========================================================================
export function onArena2BulletHit(bullet) {
  if (!bullet) return false;
  const catwalk = ARENA_CYBER_STADIUM_PLATFORMS.find(p => p.id === 'chain_catwalk');
  if (!catwalk) return false;

  // Sprawdź kolizję pocisku z łańcuchami
  for (const ch of (catwalk.chains || [])) {
    if (Math.abs(bullet.x - ch.anchorX) < 12 && bullet.y >= ch.anchorY && bullet.y <= catwalk.y) {
      // Pocisk trafił w stalowy łańcuch – wzbudza lekkie kołysanie kładki
      catwalk.swingVel += (bullet.vx > 0 ? 0.015 : -0.015);
      return true; // Kula zrykoszetowała i została pochłonięta
    }
  }

  // Trafienie w samą kładkę
  if (bullet.x >= catwalk.x && bullet.x <= catwalk.x + catwalk.w &&
      bullet.y >= catwalk.y && bullet.y <= catwalk.y + catwalk.h) {
    catwalk.swingVel += (bullet.vx > 0 ? 0.02 : -0.02);
    return true;
  }

  return false;
}

export function onArena2KickHit(player, kickBox) {
  if (!player || !kickBox) return false;
  const catwalk = ARENA_CYBER_STADIUM_PLATFORMS.find(p => p.id === 'chain_catwalk');
  if (!catwalk) return false;

  const pFootX = kickBox.footX || (player.x + (player.facing === 1 ? 40 : -20));
  const pFootY = kickBox.footY || (player.y + 35);

  if (pFootX >= catwalk.x - 20 && pFootX <= catwalk.x + catwalk.w + 20 &&
      Math.abs(pFootY - (catwalk.y + catwalk.h / 2)) < 35) {
    // Spartan Kick z potężną siłą wprawia kładkę w silne kołysanie
    catwalk.swingVel = player.facing * 0.08;
    return true;
  }

  return false;
}

// =========================================================================
// KONTRAKT ARENY 2 (PLUGIN DEFINITION)
// =========================================================================
const arena2 = {
  id: 'arena-2',
  name: 'Cyber Stadium',
  spawns: [
    { x: 750, y: 430 }, // Spawn gracza (Cyan)
    { x: 1170, y: 430 }, // Spawn bota (Orange)
    { x: 960, y: 488 } // Piłka na środku
  ],
  platforms: ARENA_CYBER_STADIUM_PLATFORMS,
  customObjects: [
    ...ARENA_CYBER_STADIUM_GOALS
  ],
  drawBackground(ctx, camera) {
    drawArena2Background(ctx, camera);
  },
  draw(ctx, camera) {
    drawArena2Foreground(ctx, camera);
  },
  update(dt, players) {
    updateArena2(dt, players);
  },
  onBulletHit(bullet) {
    return onArena2BulletHit(bullet);
  },
  onKickHit(player, kickBox) {
    return onArena2KickHit(player, kickBox);
  }
};

export default arena2;
