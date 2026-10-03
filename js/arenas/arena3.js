// =========================================================================
// ARENAS/ARENA3.JS - MINING CAVERN & FOUNDRY (3600x1300 PX)
// Autonomiczny moduł areny (Plugin / Lifecycle Hooks Pattern)
// Podziemna sztolnia kopalniana z wózkami rudy, kładkami i przeszkodami
// =========================================================================

import { ARENA_LEFT, ARENA_RIGHT } from '../config.js';
import {
  LEFT_MASSIF_AND_RAMP_PROFILE,
  CENTRAL_HILL_PROFILE,
  RIGHT_MASSIF_PROFILE,
  LOWER_CAVERN_FLOOR,
  LOWER_CAVERN_SHELVES
} from '../world.js';

// =========================================================================
// STATYCZNA GEOMETRIA I PLATFORMY
// =========================================================================
export const ARENA_FOUNDRY_WALLS = [
  {
    id: 'left_shaft_bridge_wall',
    name: 'Ściana Pomostu Lewego Szybu',
    x: 944,
    y: 580,
    w: 12,
    h: 200,
    solid: true,
    isWall: true,
    pushSide: 'left'
  },
  {
    id: 'right_shaft_bridge_wall',
    name: 'Ściana Pomostu Prawego Szybu',
    x: 2294,
    y: 580,
    w: 12,
    h: 200,
    solid: true,
    isWall: true,
    pushSide: 'right'
  },
  {
    id: 'right_shaft_cliff_wall',
    name: 'Ściana Urwiska Prawego Szybu',
    x: 2476,
    y: 580,
    w: 16,
    h: 600,
    solid: true,
    isWall: true,
    pushSide: 'left'
  }
];

export const ARENA_3_PLATFORMS = [
  {
    id: 'jungle_canyon_left_terrain',
    type: 'rock_platform',
    theme: 'jungle',
    isCanyonTerrain: true,
    solid: true,
    x: ARENA_LEFT - 320,
    w: 950 - (ARENA_LEFT - 320),
    surfacePoints: LEFT_MASSIF_AND_RAMP_PROFILE,
    props: [
      { type: 'sandbag_trench', rx: 200 - (ARENA_LEFT - 320), w: 100, h: 26 }
    ]
  },
  {
    id: 'jungle_canyon_central_hill',
    type: 'rock_platform',
    theme: 'jungle',
    isCanyonTerrain: true,
    solid: true,
    x: 950,
    w: 1350,
    surfacePoints: CENTRAL_HILL_PROFILE,
    thickness: 240,
    props: [
      { type: 'sandbag_trench', rx: 770, w: 90, h: 26 }
    ]
  },
  {
    id: 'jungle_canyon_right_terrain',
    type: 'rock_platform',
    theme: 'jungle',
    isCanyonTerrain: true,
    solid: true,
    x: 2480,
    w: (ARENA_RIGHT + 320) - 2480,
    surfacePoints: RIGHT_MASSIF_PROFILE,
    props: [
      { type: 'sandbag_trench', rx: 160, w: 140, h: 28 },
      { type: 'wooden_log_bunker', rx: 410, w: 180, h: 74 },
      { type: 'sandbag_trench', rx: 840, w: 110, h: 26 }
    ]
  },
  ...ARENA_FOUNDRY_WALLS,
  ...LOWER_CAVERN_SHELVES,
  LOWER_CAVERN_FLOOR
];

export const ARENA_FOUNDRY_PLATFORMS = ARENA_3_PLATFORMS;

export const ARENA_3_CUSTOM_OBJECTS = [
  {
    id: 'mine_cart_central',
    type: 'ore_cart',
    x: 1750,
    y: 546,
    w: 64,
    h: 34,
    vx: 0,
    weight: 250
  },
  {
    id: 'dynamite_cache',
    type: 'explosive_cache',
    x: 720,
    y: 832,
    w: 40,
    h: 28
  }
];

// =========================================================================
// RENDEROWANIE TŁA ARENY 3 (PODZIEMNA GROTA / MINING CAVERN)
// =========================================================================
export function drawArena3Background(ctx, camera) {
  if (!ctx) return;
  const W = ctx.canvas?.width || 1920;
  const H = ctx.canvas?.height || 1080;
  const camX = camera ? (camera.x + (camera.viewWidth || (W / (camera.zoom || 1))) / 2) : 1800;
  const time = performance.now() * 0.001;

  // 1. Ciemny gradient pionowy surowej groty skalnej (#08090C do #12151B)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0.0, '#08090C');
  bgGrad.addColorStop(0.5, '#0E1117');
  bgGrad.addColorStop(1.0, '#161922');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Paralaksa filarów skalnych w głębi
  ctx.save();
  const pillars = [
    { x: 300, w: 220, alpha: 0.4 },
    { x: 900, w: 180, alpha: 0.3 },
    { x: 1550, w: 260, alpha: 0.5 },
    { x: 2200, w: 200, alpha: 0.35 },
    { x: 2900, w: 240, alpha: 0.45 }
  ];

  const period = 2000;
  const offset = ((camX * 0.03) % period + period) % period;

  for (let loop = -1; loop <= 1; loop++) {
    const shift = loop * period - offset;
    for (const pil of pillars) {
      const px = pil.x + shift;
      if (px + pil.w < 0 || px > W) continue;

      const pGrad = ctx.createLinearGradient(px, 0, px + pil.w, 0);
      pGrad.addColorStop(0.0, 'rgba(8, 10, 14, 0.0)');
      pGrad.addColorStop(0.3, `rgba(14, 18, 24, ${pil.alpha})`);
      pGrad.addColorStop(0.7, `rgba(18, 22, 30, ${pil.alpha})`);
      pGrad.addColorStop(1.0, 'rgba(8, 10, 14, 0.0)');
      ctx.fillStyle = pGrad;
      ctx.fillRect(px, 0, pil.w, H);
    }
  }
  ctx.restore();

  // 3. Wolno unoszące się drobiny pyłu kopalnianego
  ctx.save();
  for (let i = 0; i < 35; i++) {
    const seed = i * 43.17;
    const dustX = ((seed * 123.4 + time * 12 * ((i % 2 === 0) ? 1 : -1)) % W + W) % W;
    const dustY = ((seed * 89.1 + time * 6) % H + H) % H;
    const alpha = (Math.sin(time * 1.8 + seed) * 0.15 + 0.25).toFixed(2);
    ctx.fillStyle = `rgba(203, 213, 225, ${alpha})`;
    ctx.fillRect(dustX, dustY, (i % 3 === 0) ? 2 : 1.2, (i % 3 === 0) ? 2 : 1.2);
  }
  ctx.restore();
}

// =========================================================================
// RENDEROWANIE FOREGROUND (DREWNIANE BELKI, LATARNIE, WÓZEK RUDY)
// =========================================================================
export function drawArena3Foreground(ctx, camera) {
  if (!ctx) return;
  const time = performance.now() * 0.001;

  ctx.save();

  // 1. Drewniane stemple i belki podtrzymujące strop
  const supports = [820, 1350, 1800, 2250, 2750];
  for (const sx of supports) {
    // Belka pionowa
    ctx.fillStyle = '#271c14';
    ctx.fillRect(sx, 500, 14, 80);
    ctx.strokeStyle = '#453225';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, 500, 14, 80);

    // Metalowe okucie belki
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(sx - 2, 570, 18, 6);
  }

  // 2. Ciepłe światło górniczych lamp naftowych
  const lanterns = [
    { x: 1357, y: 530 },
    { x: 2257, y: 530 }
  ];

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < lanterns.length; i++) {
    const lan = lanterns[i];
    const flicker = Math.sin(time * 8.0 + i * 3.7) * 0.08 + 0.92;
    const rad = 110 * flicker;

    const lanGrad = ctx.createRadialGradient(lan.x, lan.y, 4, lan.x, lan.y, rad);
    lanGrad.addColorStop(0.0, 'rgba(251, 191, 36, 0.45)');
    lanGrad.addColorStop(0.3, 'rgba(245, 158, 11, 0.18)');
    lanGrad.addColorStop(1.0, 'rgba(217, 119, 6, 0.0)');
    ctx.fillStyle = lanGrad;
    ctx.beginPath();
    ctx.arc(lan.x, lan.y, rad, 0, Math.PI * 2);
    ctx.fill();

    // Obudowa lampy
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(lan.x - 2, lan.y - 3, 4, 6);
  }
  ctx.restore();

  // 3. Wózek kopalniany (ore cart)
  const cart = ARENA_3_CUSTOM_OBJECTS.find(o => o.type === 'ore_cart');
  if (cart) {
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(cart.x, cart.y, cart.w, cart.h);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.strokeRect(cart.x, cart.y, cart.w, cart.h);

    // Bryły rudy w wózku
    ctx.fillStyle = '#78716c';
    ctx.beginPath();
    ctx.arc(cart.x + 16, cart.y - 3, 10, Math.PI, 0);
    ctx.arc(cart.x + 32, cart.y - 6, 12, Math.PI, 0);
    ctx.arc(cart.x + 48, cart.y - 4, 10, Math.PI, 0);
    ctx.fill();

    // Koła wózka
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(cart.x + 14, cart.y + cart.h + 2, 7, 0, Math.PI * 2);
    ctx.arc(cart.x + cart.w - 14, cart.y + cart.h + 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

// =========================================================================
// PĘTLA AKTUALIZACJI SPECYFICZNA DLA ARENY 3
// =========================================================================
export function updateArena3(dt, players) {
  const cart = ARENA_3_CUSTOM_OBJECTS.find(o => o.type === 'ore_cart');
  if (!cart) return;

  // Tarcie toczenia wózka kopalnianego po szynach
  if (Math.abs(cart.vx) > 0.01) {
    cart.x += cart.vx;
    cart.vx *= 0.96;

    // Granice torów na moście skalnym
    if (cart.x < 1250) {
      cart.x = 1250;
      cart.vx = -cart.vx * 0.4;
    } else if (cart.x + cart.w > 2350) {
      cart.x = 2350 - cart.w;
      cart.vx = -cart.vx * 0.4;
    }
  } else {
    cart.vx = 0;
  }
}

// =========================================================================
// HAKI TRAFIENIA KULI I SPARTAN KICK
// =========================================================================
export function onArena3BulletHit(bullet) {
  if (!bullet) return false;
  const cart = ARENA_3_CUSTOM_OBJECTS.find(o => o.type === 'ore_cart');
  if (cart) {
    if (bullet.x >= cart.x && bullet.x <= cart.x + cart.w &&
        bullet.y >= cart.y && bullet.y <= cart.y + cart.h + 10) {
      // Pocisk uderza w stalowy wózek kopalniany i lekko go popycha
      cart.vx += (bullet.vx > 0 ? 0.35 : -0.35);
      return true;
    }
  }
  return false;
}

export function onArena3KickHit(player, kickBox) {
  if (!player || !kickBox) return false;
  const cart = ARENA_3_CUSTOM_OBJECTS.find(o => o.type === 'ore_cart');
  if (cart) {
    const footX = kickBox.footX || (player.x + (player.facing === 1 ? 40 : -20));
    const footY = kickBox.footY || (player.y + 35);
    if (Math.abs(footX - (cart.x + cart.w / 2)) < 55 && Math.abs(footY - (cart.y + cart.h / 2)) < 40) {
      // Spartan Kick posyła wózek rudy wzdłuż szyn torowiska
      cart.vx = player.facing * 7.5;
      return true;
    }
  }
  return false;
}

// =========================================================================
// KONTRAKT ARENY 3 (PLUGIN DEFINITION)
// =========================================================================
const arena3 = {
  id: 'arena-3',
  name: 'Mining Cavern & Foundry',
  spawns: [
    { x: 280, y: 120 }, // Spawn gracza (Cyan)
    { x: 3320, y: 120 }, // Spawn bota (Orange)
    { x: 1800, y: 400 } // Punkt centralny
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
