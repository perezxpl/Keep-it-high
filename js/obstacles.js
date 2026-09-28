// =========================================================================
// OBSTACLES.JS - WIELOPOZIOMOWE WYSPY ARENY I OBSŁUGA KOLIZJI PLATFORM
// =========================================================================

import { ARENA_LEFT, ARENA_RIGHT, START_X } from './config.js';
import { resolveSegmentCollision, triggerScreenShake } from './world.js';

export const obstacles = [];

export const ARENA_1_PLATFORMS = [
  // Kondygnacja 1: 8-15 m (relY: 110-210)
  {
    id: 'west_bastion',
    type: 'rock_platform',
    x: START_X + 20,
    w: 340,
    relY: 110,
    thickness: 18,
    depth: 75,
    underbelly: [
      { rx: 0, ry: 0 }, { rx: 40, ry: 35 }, { rx: 110, ry: 70 },
      { rx: 220, ry: 75 }, { rx: 290, ry: 40 }, { rx: 340, ry: 0 }
    ],
    vines: [{ rx: 65, len: 38 }, { rx: 170, len: 52 }, { rx: 270, len: 34 }],
    props: [
      { type: 'bunker_tier', rx: 20, w: 110, h: 26 },
      { type: 'sandbags', rx: 155, w: 54, h: 20 },
      { type: 'crate', rx: 260, w: 36, h: 26 }
    ]
  },
  {
    id: 'ramp_west',
    type: 'slope_ramp',
    x: START_X + 380,
    w: 160,
    relYLeft: 110,
    relYRight: 210,
    thickness: 16,
    depth: 60
  },
  {
    id: 'citadel_main',
    type: 'citadel_island',
    x: START_X + 530,
    w: 540,
    relY: 220,
    thickness: 20,
    depth: 110,
    underbelly: [
      { rx: 0, ry: 0 }, { rx: 50, ry: 45 }, { rx: 140, ry: 85 },
      { rx: 220, ry: 105 }, { rx: 270, ry: 115 }, { rx: 320, ry: 105 },
      { rx: 400, ry: 85 }, { rx: 490, ry: 45 }, { rx: 540, ry: 0 }
    ],
    vines: [{ rx: 90, len: 44 }, { rx: 190, len: 68 }, { rx: 350, len: 62 }, { rx: 460, len: 40 }],
    props: [
      { type: 'bunker_tier', rx: 170, w: 200, h: 36 },
      { type: 'antenna', rx: 270, h: 65 },
      { type: 'sandbags', rx: 45, w: 50, h: 20 },
      { type: 'sandbags', rx: 445, w: 50, h: 20 }
    ]
  },
  {
    id: 'ramp_east',
    type: 'slope_ramp',
    x: START_X + 1060,
    w: 160,
    relYLeft: 210,
    relYRight: 110,
    thickness: 16,
    depth: 60
  },
  {
    id: 'east_outpost',
    type: 'rock_platform',
    x: START_X + 1220,
    w: 340,
    relY: 110,
    thickness: 18,
    depth: 75,
    underbelly: [
      { rx: 0, ry: 0 }, { rx: 50, ry: 40 }, { rx: 120, ry: 75 },
      { rx: 230, ry: 70 }, { rx: 300, ry: 35 }, { rx: 340, ry: 0 }
    ],
    vines: [{ rx: 70, len: 35 }, { rx: 170, len: 55 }, { rx: 280, len: 40 }],
    props: [
      { type: 'crate', rx: 40, w: 36, h: 26 },
      { type: 'sandbags', rx: 135, w: 54, h: 20 },
      { type: 'bunker_tier', rx: 210, w: 110, h: 26 }
    ]
  },

  // Kondygnacja 2: 22-33 m (relY: 310-460)
  {
    id: 'skybridge_west_low',
    type: 'catwalk',
    x: START_X + 180,
    w: 220,
    relY: 310,
    thickness: 12,
    chains: [25, 195]
  },
  {
    id: 'citadel_skybridge',
    type: 'catwalk',
    x: START_X + 680,
    w: 240,
    relY: 375,
    thickness: 14,
    chains: [30, 210]
  },
  {
    id: 'apex_bridge_low',
    type: 'catwalk',
    x: START_X + 725,
    w: 150,
    relY: 460,
    thickness: 12,
    chains: [20, 130]
  },
  {
    id: 'skybridge_east_low',
    type: 'catwalk',
    x: START_X + 1200,
    w: 220,
    relY: 310,
    thickness: 12,
    chains: [25, 195]
  },

  // Kondygnacja 3: 38-46 m (relY: 540-640)
  {
    id: 'station_west_mid',
    type: 'catwalk',
    x: START_X + 320,
    w: 260,
    relY: 540,
    thickness: 14,
    chains: [25, 235]
  },
  {
    id: 'bridge_central_mid',
    type: 'catwalk',
    x: START_X + 650,
    w: 300,
    relY: 640,
    thickness: 16,
    chains: [35, 265]
  },
  {
    id: 'station_east_mid',
    type: 'catwalk',
    x: START_X + 1020,
    w: 260,
    relY: 540,
    thickness: 14,
    chains: [25, 235]
  },

  // Kondygnacja 4: 53-60 m (relY: 750-840)
  {
    id: 'sniper_perch_west',
    type: 'catwalk',
    x: START_X + 220,
    w: 200,
    relY: 750,
    thickness: 12,
    chains: [20, 180]
  },
  {
    id: 'high_gantry_center',
    type: 'catwalk',
    x: START_X + 680,
    w: 240,
    relY: 840,
    thickness: 14,
    chains: [30, 210]
  },
  {
    id: 'sniper_perch_east',
    type: 'catwalk',
    x: START_X + 1180,
    w: 200,
    relY: 750,
    thickness: 12,
    chains: [20, 180]
  },

  // Kondygnacja 5: 68-72 m (relY: 950-1020)
  {
    id: 'apex_flank_west',
    type: 'catwalk',
    x: START_X + 440,
    w: 160,
    relY: 950,
    thickness: 12,
    chains: [15, 145]
  },
  {
    id: 'apex_orbital_deck',
    type: 'rock_platform',
    x: START_X + 630,
    w: 340,
    relY: 1020,
    thickness: 20,
    depth: 85,
    underbelly: [
      { rx: 0, ry: 0 }, { rx: 40, ry: 30 }, { rx: 110, ry: 65 },
      { rx: 170, ry: 85 }, { rx: 230, ry: 65 }, { rx: 300, ry: 30 }, { rx: 340, ry: 0 }
    ],
    vines: [{ rx: 80, len: 45 }, { rx: 260, len: 45 }],
    props: [
      { type: 'bunker_tier', rx: 90, w: 160, h: 32 },
      { type: 'antenna', rx: 170, h: 75 },
      { type: 'crate', rx: 25, w: 36, h: 26 },
      { type: 'sandbags', rx: 275, w: 50, h: 20 }
    ]
  },
  {
    id: 'apex_flank_east',
    type: 'catwalk',
    x: START_X + 1000,
    w: 160,
    relY: 950,
    thickness: 12,
    chains: [15, 145]
  }
];

export const ARENA_1_BARRICADES = [
  { type: 'sandbags', x: START_X + 140, w: 55, h: 22 },
  { type: 'hedgehog', x: START_X + 370, size: 30 },
  { type: 'ammo_depot', x: START_X + 570, w: 42, h: 28 },
  { type: 'hedgehog', x: START_X + 800, size: 32 },
  { type: 'ammo_depot', x: START_X + 980, w: 42, h: 28 },
  { type: 'hedgehog', x: START_X + 1200, size: 30 },
  { type: 'sandbags', x: START_X + 1440, w: 55, h: 22 }
];

// =========================================================================
// ARENA 2: CYBERPUNKOWE KOLOSEUM (CYBER STADIUM)
// Szerokość i granice: START_X (160) do START_X + 1600 (1760). Środek: 960.
// =========================================================================
export const ARENA_CYBER_STADIUM_PLATFORMS = [
  // 1. Lewy betonowy bastion z bramką CYAN (x: 160, w: 280, relY: 240)
  {
    id: 'cyber_bastion_west',
    type: 'rock_platform',
    isCyberBastion: true,
    theme: 'cyan',
    x: 160,
    w: 280,
    relY: 240,
    thickness: 22,
    depth: 95,
    underbelly: [
      { rx: 0, ry: 0 }, { rx: 50, ry: 35 }, { rx: 140, ry: 65 },
      { rx: 220, ry: 70 }, { rx: 280, ry: 0 }
    ],
    props: [
      { type: 'bunker_tier', rx: 20, w: 90, h: 28 },
      { type: 'sandbags', rx: 130, w: 50, h: 20 }
    ]
  },
  // 2. Prawy betonowy bastion z bramką ORANGE (x: 1480, w: 280, relY: 240)
  {
    id: 'cyber_bastion_east',
    type: 'rock_platform',
    isCyberBastion: true,
    theme: 'orange',
    x: 1480,
    w: 280,
    relY: 240,
    thickness: 22,
    depth: 95,
    underbelly: [
      { rx: 0, ry: 0 }, { rx: 60, ry: 70 }, { rx: 140, ry: 65 },
      { rx: 230, ry: 35 }, { rx: 280, ry: 0 }
    ],
    props: [
      { type: 'sandbags', rx: 100, w: 50, h: 20 },
      { type: 'bunker_tier', rx: 170, w: 90, h: 28 }
    ]
  },
  // 3. Schody/rampy zejściowe z bastionów (x: 440 do 600 oraz x: 1320 do 1480)
  {
    id: 'cyber_ramp_west',
    type: 'slope_ramp',
    x: 440,
    w: 160,
    relYLeft: 240,
    relYRight: 0,
    thickness: 18,
    depth: 55
  },
  {
    id: 'cyber_ramp_east',
    type: 'slope_ramp',
    x: 1320,
    w: 160,
    relYLeft: 0,
    relYRight: 240,
    thickness: 18,
    depth: 55
  },
  // 4. Środkowy pomost stalowy (x: 680, w: 560, relY: 140) z niższym balkonem (x: 820, w: 280, relY: 85)
  {
    id: 'cyber_bridge_center',
    type: 'catwalk',
    x: 680,
    w: 560,
    relY: 140,
    thickness: 16,
    chains: [50, 230, 330, 510]
  },
  {
    id: 'cyber_balcony_center',
    type: 'catwalk',
    x: 820,
    w: 280,
    relY: 85,
    thickness: 14,
    chains: [30, 250]
  },
  // 5. Stalowe zadaszenia/okapy nad bastionami (relY: 520, w: 380) blokujące loby z góry
  {
    id: 'cyber_canopy_west',
    type: 'catwalk',
    x: 160,
    w: 380,
    relY: 520,
    thickness: 20,
    chains: [40, 190, 340]
  },
  {
    id: 'cyber_canopy_east',
    type: 'catwalk',
    x: 1380,
    w: 380,
    relY: 520,
    thickness: 20,
    chains: [40, 190, 340]
  }
];

export const ARENA_CYBER_STADIUM_BARRICADES = [
  // Worki z piaskiem na skrzydłach (x: 480, 620, 1240, 1380)
  { type: 'sandbags', x: 480, w: 55, h: 22 },
  { type: 'sandbags', x: 620, w: 55, h: 22 },
  { type: 'sandbags', x: 1240, w: 55, h: 22 },
  { type: 'sandbags', x: 1380, w: 55, h: 22 },
  // 3 stalowe jeże przeciwczołgowe w centrum boiska (x: 880, 960, 1040)
  { type: 'hedgehog', x: 880, size: 30 },
  { type: 'hedgehog', x: 960, size: 34 },
  { type: 'hedgehog', x: 1040, size: 30 }
];

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

// Aktywny zestaw platform i barykad
export let activeArenaId = 'ARENA_1';
export const ARENA_PLATFORMS = [...ARENA_1_PLATFORMS];
export const GROUND_BARRICADES = [...ARENA_1_BARRICADES];
export const GOALS = [];
export const arenaScore = { cyan: 0, orange: 0 };
export let goalCelebrationTimer = 0;

export function setGoalCelebrationTimer(val) {
  goalCelebrationTimer = val;
}

export function switchArena(arenaId, playerObj, botObj, ballObj) {
  activeArenaId = (arenaId === 'ARENA_2' || arenaId === 2 || arenaId === 'CYBER_STADIUM') ? 'ARENA_2' : 'ARENA_1';

  ARENA_PLATFORMS.length = 0;
  GROUND_BARRICADES.length = 0;
  GOALS.length = 0;

  const groundY = (typeof window !== 'undefined' && window.innerHeight) ? (window.innerHeight - 75) : 500;

  if (activeArenaId === 'ARENA_2') {
    ARENA_PLATFORMS.push(...ARENA_CYBER_STADIUM_PLATFORMS);
    GROUND_BARRICADES.push(...ARENA_CYBER_STADIUM_BARRICADES);
    GOALS.push(...ARENA_CYBER_STADIUM_GOALS);

    // Pozycjonowanie graczy i piłki na środku boiska Cyber Stadium
    if (playerObj) {
      playerObj.x = 750;
      playerObj.y = groundY - playerObj.h;
      playerObj.vx = 0;
      playerObj.vy = 0;
      playerObj.facing = 1;
      playerObj.isIntro = false;
      playerObj.isJumping = false;
      playerObj.isSliding = false;
      playerObj.gaitMode = 'IDLE';
    }
    if (botObj) {
      botObj.active = true;
      botObj.x = 1170;
      botObj.y = groundY - botObj.h;
      botObj.vx = 0;
      botObj.vy = 0;
      botObj.facing = -1;
      botObj.isJumping = false;
      botObj.isSliding = false;
      botObj.gaitMode = 'IDLE';
    }
    if (ballObj) {
      ballObj.x = 960;
      ballObj.y = groundY - ballObj.colRadius;
      ballObj.vx = 0;
      ballObj.vy = 0;
      ballObj.spin = 0;
      ballObj.trail = [];
    }
  } else {
    ARENA_PLATFORMS.push(...ARENA_1_PLATFORMS);
    GROUND_BARRICADES.push(...ARENA_1_BARRICADES);

    if (playerObj) {
      playerObj.x = START_X - 60;
      playerObj.y = groundY - playerObj.h;
      playerObj.vx = 0;
      playerObj.vy = 0;
      playerObj.facing = 1;
      playerObj.isIntro = true;
      playerObj.juggleTimer = 0;
    }
    if (botObj) {
      botObj.x = START_X + 450;
      botObj.y = groundY - botObj.h;
      botObj.vx = 0;
      botObj.vy = 0;
      botObj.facing = -1;
    }
    if (ballObj) {
      ballObj.x = START_X - 38;
      ballObj.y = groundY - ballObj.colRadius;
      ballObj.vx = 0;
      ballObj.vy = 0;
      ballObj.spin = 0;
      ballObj.trail = [];
    }
  }

  return activeArenaId;
}

export function getPlatformSurfaceY(plat, px, groundY) {
  if (plat.type === 'slope_ramp') {
    const t = Math.max(0, Math.min(1, (px - plat.x) / plat.w));
    const currentRelY = plat.relYLeft + t * (plat.relYRight - plat.relYLeft);
    return groundY - currentRelY;
  }
  return groundY - plat.relY;
}

let isDownPressed = false;
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      isDownPressed = true;
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      isDownPressed = false;
    }
  });
}

// Obsługa lądowania na każdym z pięter do 72 m oraz zeskoku (drop-through)
export function checkPlayerPlatformLanding(p, groundY) {
  if (!p || p.isIntro) return;

  const feetY = p.y + p.h;
  const centerX = p.x + p.w / 2;

  // Zeskok w dół (drop-through): gracz stoi na platformie/rampie/bunkrze i wciska S/strzałkę w dół, kuca lub aktywował dropThroughTimer
  const isHuman = !p.isBot;
  const wantDrop = (isHuman && (isDownPressed || p.isCrouching)) || (p.dropThroughTimer > 0);

  if (wantDrop) {
    for (const plat of ARENA_PLATFORMS) {
      if (centerX >= plat.x - 6 && centerX <= plat.x + plat.w + 6) {
        const topY = getPlatformSurfaceY(plat, centerX, groundY);

        // 1. Zeskok z powierzchni platformy / kładki / rampy
        if (Math.abs(feetY - topY) <= 14 && p.y < groundY - p.h - 2) {
          p.y = topY - p.h + 12;
          p.vy = 2.8;
          p.isJumping = true;
          p.isCrouching = false;
          p.airVx = p.vx;
          p.currentGroundY = groundY;
          return;
        }

        // 2. Zeskok z tarasu bunkra
        if (plat.props) {
          const tier = plat.props.find(pr => pr.type === 'bunker_tier');
          if (tier) {
            const tierLeft = plat.x + tier.rx;
            const tierRight = tierLeft + tier.w;
            if (centerX >= tierLeft - 4 && centerX <= tierRight + 4) {
              const tierTopY = topY - tier.h;
              if (Math.abs(feetY - tierTopY) <= 14 && p.y < groundY - p.h - 2) {
                p.y = tierTopY - p.h + 12;
                p.vy = 2.8;
                p.isJumping = true;
                p.isCrouching = false;
                p.airVx = p.vx;
                p.currentGroundY = groundY;
                return;
              }
            }
          }
        }
      }
    }

    // Dopóki klawisz 'S' / strzałka w dół jest trzymany, pomijamy lądowanie na platformach
    // (umożliwiając swobodne opadanie w dół aż do poziomu ziemi)
    p.currentGroundY = groundY;
    return;
  }

  let landedSurface = null;

  for (const plat of ARENA_PLATFORMS) {
    if (centerX >= plat.x - 4 && centerX <= plat.x + plat.w + 4) {
      const topY = getPlatformSurfaceY(plat, centerX, groundY);

      const prevFeetY = feetY - p.vy;
      const isLanding = p.vy >= 0 && prevFeetY <= topY + 12 && feetY >= topY - 10 && feetY <= topY + Math.max(20, p.vy + 10);
      const isWalkingOnSlope = plat.type === 'slope_ramp' && !p.isJumping && Math.abs(feetY - topY) < 16;

      if (isLanding || isWalkingOnSlope) {
        landedSurface = topY;
        break;
      }
    }
  }

  if (landedSurface === null) {
    for (const plat of ARENA_PLATFORMS) {
      if (plat.props) {
        const tier = plat.props.find(pr => pr.type === 'bunker_tier');
        if (tier) {
          const tierLeft = plat.x + tier.rx;
          const tierRight = tierLeft + tier.w;
          if (centerX >= tierLeft - 3 && centerX <= tierRight + 3) {
            const tierTopY = getPlatformSurfaceY(plat, centerX, groundY) - tier.h;
            const prevFeetY = feetY - p.vy;
            if (p.vy >= 0 && prevFeetY <= tierTopY + 12 && feetY >= tierTopY - 8 && feetY <= tierTopY + Math.max(18, p.vy + 10)) {
              landedSurface = tierTopY;
              break;
            }
          }
        }
      }
    }
  }

  if (landedSurface !== null) {
    p.y = landedSurface - p.h;
    p.vy = 0;
    p.isJumping = false;
    p.airVx = 0;
    p.currentGroundY = landedSurface;
    if (p.jetFuel < p.jetMax) {
      p.jetFuel = Math.min(p.jetMax, p.jetFuel + 2.5);
    }
  } else {
    p.currentGroundY = groundY;
  }
}

export function resolveBallObstacleCollisions(ball, groundY) {
  if (!ball) return;
  const speed = Math.hypot(ball.vx, ball.vy);
  const cR = ball.colRadius !== undefined ? ball.colRadius : ball.radius;
  const prevX = ball.prevX !== undefined ? ball.prevX : (ball.x - ball.vx);
  const prevY = ball.prevY !== undefined ? ball.prevY : (ball.y - ball.vy);

  for (const plat of ARENA_PLATFORMS) {
    if (plat.type === 'slope_ramp') {
      // =====================================================================
      // 1. RAMPA SKOŚNA (SLOPE_RAMP) - Odbicie wg praw fizyki z wektorem normalnej
      // =====================================================================
      const yL = groundY - plat.relYLeft;
      const yR = groundY - plat.relYRight;
      const x1 = plat.x;
      const y1 = yL;
      const x2 = plat.x + plat.w;
      const y2 = yR;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const rampLen = Math.hypot(dx, dy);

      if (rampLen > 0) {
        // Wektor styczny (tx, ty) oraz normalna (nx, ny) skierowana ku górze powierzchni
        const tx = dx / rampLen;
        const ty = dy / rampLen;
        const nx = dy / rampLen;
        const ny = -dx / rampLen; // ny zawsze ujemne (skierowana w stronę nieba)

        // Rzut środka piłki na prostą rampy
        const t = ((ball.x - x1) * dx + (ball.y - y1) * dy) / (rampLen * rampLen);

        if (t >= -0.04 && t <= 1.04) {
          const cx = x1 + Math.max(0, Math.min(1, t)) * dx;
          const cy = y1 + Math.max(0, Math.min(1, t)) * dy;

          // Odległość wzdłuż wektora normalnego
          const distNorm = (ball.x - cx) * nx + (ball.y - cy) * ny;
          const prevDistNorm = (prevX - cx) * nx + (prevY - cy) * ny;

          // Kolizja powierzchni rampy: wyłącznie gdy piłka opada (ball.vy > 0), zapobiegając wciąganiu
          const maxPen = plat.thickness || 20;
          if (ball.vy > 0 && distNorm < cR && prevDistNorm >= -6 && distNorm >= -maxPen) {
            const vn = ball.vx * nx + ball.vy * ny;
            if (vn < 0) {
              // Wypchnięcie piłki na powierzchnię
              const pen = cR - distNorm;
              ball.x += nx * pen;
              ball.y += ny * pen;

              // Odbicie z prawem odbicia i tłumieniem (restitution = 0.70)
              const restitution = 0.70;
              const friction = 0.04;
              const jn = -(1 + restitution) * vn;
              const vt = ball.vx * tx + ball.vy * ty;
              const jt = -vt * friction;

              ball.vx += (jn * nx) + (jt * tx);
              ball.vy += (jn * ny) + (jt * ty);
              ball.spin += jt * 0.1;
              ball.rotation += ball.vx * 0.08;

              if (speed > 7.5) triggerScreenShake(2.5);
            }
          }
        }

        // Zabezpieczenie podbrzusza rampy
        const depth = plat.depth || 60;
        const b1x = x1;
        const b1y = y1 + depth * 0.5;
        const b2x = x2;
        const b2y = y2 + depth;
        resolveSegmentCollision(ball, b1x, b1y, b2x, b2y, 4, 0, 0, 0, 0, 0.70, 0.35);
      }
    } else if (plat.type === 'catwalk') {
      // =====================================================================
      // 2. KŁADKA (CATWALK) - Jednostronna platforma (One-Way Platform)
      //    Całkowicie przenikalna od dołu, odbicie tylko z góry gdy ball.vy > 0
      // =====================================================================
      const topY = groundY - plat.relY;
      const platLeft = plat.x;
      const platRight = plat.x + plat.w;

      // Odbicie od góry wyłącznie gdy piłka opada (ball.vy > 0)
      if (ball.x >= platLeft - cR && ball.x <= platRight + cR) {
        if (ball.vy > 0) {
          const prevBottomY = (ball.y - ball.vy) + cR;
          if (ball.y + cR >= topY && prevBottomY <= topY + 8) {
            ball.y = topY - cR;
            ball.vy = Math.abs(ball.vy) > 0.8 ? -ball.vy * 0.65 : 0;
            ball.vx *= 0.98;
            ball.spin *= 0.94;
            ball.rotation += ball.vx * 0.08;
            if (speed > 8.0) triggerScreenShake(2.5);
          }
        }
      }
    } else {
      // =====================================================================
      // 3. WYSPA SKALNA (ROCK_PLATFORM / CITADEL_ISLAND)
      // =====================================================================
      const topY = groundY - plat.relY;
      const platLeft = plat.x;
      const platRight = plat.x + plat.w;
      const thickness = plat.thickness || 20;

      // Sprawdzenie powierzchni platformy od góry (ball.vy > 0)
      if (ball.x >= platLeft - cR && ball.x <= platRight + cR) {
        const prevBottomY = prevY + cR;
        const curBottomY = ball.y + cR;

        if (ball.vy > 0 && prevBottomY <= topY + 14 && curBottomY >= topY && ball.y - cR <= topY + thickness + 10) {
          ball.y = topY - cR;
          ball.vy = Math.abs(ball.vy) > 0.8 ? -ball.vy * 0.65 : 0;
          ball.vx *= 0.98;
          ball.spin *= 0.94;
          ball.rotation += ball.vx * 0.08;
          if (speed > 8.0) triggerScreenShake(2.5);
        }
      }

      // Zabezpieczenie podbrzusza skalnego (underbelly) przez resolveSegmentCollision
      if (plat.underbelly && plat.underbelly.length > 1) {
        for (let i = 0; i < plat.underbelly.length - 1; i++) {
          const p1 = plat.underbelly[i];
          const p2 = plat.underbelly[i + 1];
          const x1 = plat.x + p1.rx;
          const y1 = topY + p1.ry;
          const x2 = plat.x + p2.rx;
          const y2 = topY + p2.ry;

          const hit = resolveSegmentCollision(ball, x1, y1, x2, y2, 6, 0, 0, 0, 0, 0.74, 0.35);
          if (hit && speed > 7.0) triggerScreenShake(3.0);
        }
      }

      // Rekwizyty na platformie (np. bunker_tier, crate, sandbags)
      if (plat.props) {
        for (const prop of plat.props) {
          if (prop.type === 'bunker_tier') {
            const bx = plat.x + prop.rx;
            const by = topY - prop.h;
            const bw = prop.w;
            const bh = prop.h;

            const clampX = Math.max(bx, Math.min(bx + bw, ball.x));
            const clampY = Math.max(by, Math.min(by + bh, ball.y));
            const cdx = ball.x - clampX;
            const cdy = ball.y - clampY;
            const cdist = Math.hypot(cdx, cdy);

            if (cdist < cR) {
              let cnx = 0, cny = -1;
              if (cdist > 0.001) {
                cnx = cdx / cdist;
                cny = cdy / cdist;
              }
              const pen = cR - cdist;
              ball.x += cnx * pen;
              ball.y += cny * pen;

              const bvn = ball.vx * cnx + ball.vy * cny;
              if (bvn < 0) {
                const bjn = -(1 + 0.65) * bvn;
                ball.vx += bjn * cnx;
                ball.vy += bjn * cny;
              }
            }
          }
        }
      }
    }
  }

  // =========================================================================
  // 4. BARYKADY NA ZIEMI (SANDBAGS, AMMO_DEPOT, HEDGEHOG) - Pełna depenetracja AABB
  // =========================================================================
  for (const bar of GROUND_BARRICADES) {
    if (bar.type === 'sandbags' || bar.type === 'ammo_depot') {
      const barLeft = bar.x;
      const barRight = bar.x + bar.w;
      const barTop = groundY - bar.h;
      const barBottom = groundY;

      const ballLeft = ball.x - cR;
      const ballRight = ball.x + cR;
      const ballTop = ball.y - cR;
      const ballBottom = ball.y + cR;

      if (ballRight > barLeft && ballLeft < barRight && ballBottom > barTop && ballTop < barBottom) {
        const overlapLeft = ballRight - barLeft;
        const overlapRight = barRight - ballLeft;
        const overlapTop = ballBottom - barTop;

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop);

        const isRollingFlat = Math.abs(ball.vy) < 1.0 || (ball.y + cR >= groundY - 4);

        if (minOverlap === overlapTop && ball.vy >= 0) {
          ball.y = barTop - cR;
          ball.vy = -Math.abs(ball.vy) * 0.55;
          ball.vx *= 0.88;
        } else if (minOverlap === overlapLeft) {
          ball.x = barLeft - cR;
          ball.vx = -Math.abs(ball.vx) * 0.70;
          if (isRollingFlat) ball.vy = 0;
        } else if (minOverlap === overlapRight) {
          ball.x = barRight + cR;
          ball.vx = Math.abs(ball.vx) * 0.70;
          if (isRollingFlat) ball.vy = 0;
        } else {
          if (isRollingFlat) {
            if (ball.x < (barLeft + barRight) / 2) {
              ball.x = barLeft - cR;
              ball.vx = -Math.abs(ball.vx) * 0.70;
            } else {
              ball.x = barRight + cR;
              ball.vx = Math.abs(ball.vx) * 0.70;
            }
            ball.vy = 0;
          } else {
            ball.y = barTop - cR;
            ball.vy = -Math.abs(ball.vy) * 0.55;
            ball.vx *= 0.88;
          }
        }
      }
    } else if (bar.type === 'hedgehog') {
      const hcx = bar.x;
      const hcy = groundY - bar.size / 2;
      const hr = bar.size / 2;
      const hdx = ball.x - hcx;
      const hdy = ball.y - hcy;
      const hd = Math.hypot(hdx, hdy);
      const minDistH = cR + hr;

      if (hd < minDistH) {
        const hnx = hd > 0.001 ? hdx / hd : 0;
        const hny = hd > 0.001 ? hdy / hd : -1;
        const hpen = minDistH - hd;
        ball.x += hnx * hpen;
        ball.y += hny * hpen;

        // Płaskie odbicie bez sztucznego wyrzutu pionowego
        ball.vx = -ball.vx * 0.65;
        ball.vy *= 0.5;

        // Jeśli piłka toczy się blisko podłoża, nie modyfikuj ball.vy na wartość ujemną
        if (ball.y + cR >= groundY - 4 && ball.vy < 0) {
          ball.vy = 0;
        }

        if (speed > 6.0) triggerScreenShake(2.2);
      }
    }
  }
}

export function checkObstacleCollisions(ball, groundY, p = null) {
  if (p) {
    checkPlayerPlatformLanding(p, groundY);
  }
  if (ball) {
    resolveBallObstacleCollisions(ball, groundY);
  }
}

function drawHazardStripes(ctx, x, y, w, h) {
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

function drawSandbags(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#78716c';
  ctx.strokeStyle = '#44403c';
  ctx.lineWidth = 1.2;
  const bagW = w / 2;
  const bagH = h / 2;
  for (let i = 0; i < 2; i++) {
    ctx.fillRect(x + i * bagW, y + bagH, bagW - 1, bagH);
    ctx.strokeRect(x + i * bagW, y + bagH, bagW - 1, bagH);
  }
  ctx.fillRect(x + bagW * 0.25, y, bagW * 1.5, bagH);
  ctx.strokeRect(x + bagW * 0.25, y, bagW * 1.5, bagH);
  ctx.restore();
}

function drawCrate(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#365314';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#1e3a1e';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + w, y + h);
  ctx.moveTo(x + w, y); ctx.lineTo(x, y + h);
  ctx.stroke();
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 7px monospace';
  ctx.fillText('AMMO', x + 4, y + h / 2 + 2);
  ctx.restore();
}

function drawHedgehog(ctx, x, y, size) {
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

function drawRockIsland(ctx, plat, groundY) {
  const topY = groundY - plat.relY;
  const time = performance.now() * 0.002;

  ctx.save();

  if (plat.underbelly) {
    ctx.beginPath();
    ctx.moveTo(plat.x, topY + 6);
    for (let pt of plat.underbelly) {
      ctx.lineTo(plat.x + pt.rx, topY + pt.ry);
    }
    ctx.lineTo(plat.x + plat.w, topY + 6);
    ctx.closePath();

    const rockGrad = ctx.createLinearGradient(plat.x, topY, plat.x, topY + plat.depth);
    rockGrad.addColorStop(0.0, '#334155');
    rockGrad.addColorStop(0.45, '#1e293b');
    rockGrad.addColorStop(1.0, '#090d16');
    ctx.fillStyle = rockGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let i = 0; i < plat.underbelly.length - 1; i++) {
      const p1 = plat.underbelly[i];
      const p2 = plat.underbelly[i + 1];
      ctx.beginPath();
      ctx.moveTo(plat.x + p1.rx, topY + p1.ry);
      ctx.lineTo(plat.x + plat.w / 2, topY + 15);
      ctx.lineTo(plat.x + p2.rx, topY + p2.ry);
      ctx.stroke();
    }
  }

  if (plat.vines) {
    for (let v of plat.vines) {
      const vx = plat.x + v.rx;
      const sway = Math.sin(time + v.rx) * 3.5;
      ctx.strokeStyle = '#2d4a22';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(vx, topY + 18);
      ctx.quadraticCurveTo(vx + sway, topY + v.len * 0.6, vx + sway * 1.3, topY + v.len);
      ctx.stroke();
    }
  }

  if (plat.isCyberBastion) {
    const accentCol = plat.theme === 'cyan' ? '#06b6d4' : '#f97316';
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(plat.x, topY, plat.w, 14);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plat.x, topY, plat.w, 14);

    ctx.save();
    ctx.strokeStyle = accentCol;
    ctx.shadowColor = accentCol;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();
    ctx.restore();

    drawHazardStripes(ctx, plat.x, topY + 10, plat.w, 4);
  } else {
    ctx.fillStyle = '#3f2712';
    ctx.fillRect(plat.x, topY + 2, plat.w, 12);
    ctx.fillStyle = '#166534';
    ctx.fillRect(plat.x - 2, topY - 2, plat.w + 4, 5);

    ctx.fillStyle = '#22c55e';
    for (let gx = plat.x; gx < plat.x + plat.w; gx += 10) {
      const h = (gx % 20 === 0) ? 5 : 3;
      ctx.beginPath();
      ctx.moveTo(gx, topY + 3);
      ctx.lineTo(gx + 3, topY + 3 + h);
      ctx.lineTo(gx + 6, topY + 3);
      ctx.fill();
    }
  }

  if (plat.props) {
    for (let prop of plat.props) {
      const px = plat.x + prop.rx;
      if (prop.type === 'sandbags') {
        drawSandbags(ctx, px, topY - prop.h, prop.w, prop.h);
      } else if (prop.type === 'crate') {
        drawCrate(ctx, px, topY - prop.h, prop.w, prop.h);
      } else if (prop.type === 'bunker_tier') {
        const by = topY - prop.h;
        ctx.fillStyle = '#334155';
        ctx.fillRect(px, by, prop.w, prop.h);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px, by, prop.w, prop.h);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 14, by + 8, prop.w - 28, 6);
        drawHazardStripes(ctx, px, by + prop.h - 4, prop.w, 4);
      } else if (prop.type === 'antenna') {
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, topY - 36);
        ctx.lineTo(px, topY - 36 - prop.h);
        ctx.stroke();

        const pulse = 0.4 + 0.6 * Math.sin(time * 3);
        ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, topY - 36 - prop.h, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  ctx.restore();
}

function drawSlopeRamp(ctx, ramp, groundY) {
  const yL = groundY - ramp.relYLeft;
  const yR = groundY - ramp.relYRight;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ramp.x, yL);
  ctx.lineTo(ramp.x + ramp.w, yR);
  ctx.lineTo(ramp.x + ramp.w, yR + ramp.depth);
  ctx.lineTo(ramp.x, yL + ramp.depth * 0.5);
  ctx.closePath();

  const rampGrad = ctx.createLinearGradient(ramp.x, yL, ramp.x, yL + ramp.depth);
  rampGrad.addColorStop(0.0, '#334155');
  rampGrad.addColorStop(1.0, '#0f172a');
  ctx.fillStyle = rampGrad;
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const angle = Math.atan2(yR - yL, ramp.w);
  ctx.save();
  ctx.translate(ramp.x, yL);
  ctx.rotate(angle);
  const rampLen = Math.hypot(ramp.w, yR - yL);
  ctx.fillStyle = '#166534';
  ctx.fillRect(0, -3, rampLen, 5);
  ctx.restore();

  ctx.restore();
}

function drawCatwalk(ctx, cat, groundY) {
  const topY = groundY - cat.relY;

  ctx.save();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.2;
  for (const cx of cat.chains) {
    ctx.beginPath();
    ctx.moveTo(cat.x + cx, topY);
    ctx.lineTo(cat.x + cx, topY - 260);
    ctx.stroke();
  }

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cat.x, topY, cat.w, cat.thickness);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(cat.x, topY, cat.w, cat.thickness);

  ctx.fillStyle = '#0f172a';
  for (let hx = cat.x + 8; hx < cat.x + cat.w - 8; hx += 16) {
    ctx.fillRect(hx, topY + 3, 10, cat.thickness - 6);
  }

  drawHazardStripes(ctx, cat.x, topY + cat.thickness - 4, cat.w, 4);
  ctx.restore();
}

function drawBastionSubstructure(ctx, startX, width, topY, bottomY, accentColor) {
  const h = bottomY - topY;
  const pillarW = 28;
  const numPillars = 4;
  const span = (width - pillarW) / (numPillars - 1);

  // 1. Masywne betonowe filary nośne
  for (let i = 0; i < numPillars; i++) {
    const px = startX + i * span;
    const colGrad = ctx.createLinearGradient(px, topY, px + pillarW, topY);
    colGrad.addColorStop(0.0, '#1e293b');
    colGrad.addColorStop(0.5, '#334155');
    colGrad.addColorStop(1.0, '#0f172a');
    ctx.fillStyle = colGrad;
    ctx.fillRect(px, topY, pillarW, h);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(px, topY, pillarW, h);

    // Poziome dylatacje w betonie
    ctx.fillStyle = '#0f172a';
    for (let y = topY + 25; y < bottomY - 10; y += 32) {
      ctx.fillRect(px, y, pillarW, 2.5);
    }
  }

  // 2. Stalowe kratownice 'X-truss' łączące filary
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2.8;
  for (let i = 0; i < numPillars - 1; i++) {
    const p1X = startX + i * span + pillarW;
    const p2X = startX + (i + 1) * span;
    if (p2X <= p1X) continue;

    const numBays = 3;
    const bayH = h / numBays;
    for (let b = 0; b < numBays; b++) {
      const bayTop = topY + b * bayH;
      const bayBottom = bayTop + bayH;

      ctx.beginPath();
      ctx.moveTo(p1X, bayTop);
      ctx.lineTo(p2X, bayBottom);
      ctx.moveTo(p2X, bayTop);
      ctx.lineTo(p1X, bayBottom);
      ctx.stroke();

      // Pozioma belka
      ctx.beginPath();
      ctx.moveTo(p1X, bayBottom);
      ctx.lineTo(p2X, bayBottom);
      ctx.stroke();

      // Węzeł nitowy
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc((p1X + p2X) / 2, (bayTop + bayBottom) / 2, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Pionowy neonowy pasek akcentowy na filarze
  ctx.save();
  ctx.strokeStyle = accentColor;
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 9;
  ctx.lineWidth = 2.2;
  const accentX = (accentColor === '#06b6d4') ? (startX + width - 10) : (startX + 10);
  ctx.beginPath();
  ctx.moveTo(accentX, topY + 8);
  ctx.lineTo(accentX, bottomY - 12);
  ctx.stroke();
  ctx.restore();
}

function drawCyberStadiumStructures(ctx, groundY) {
  ctx.save();
  // Konstrukcje pod lewym bastionem (x: 160 do 440, relY: 240)
  drawBastionSubstructure(ctx, 160, 280, groundY - 240, groundY, '#06b6d4');
  // Konstrukcje pod prawym bastionem (x: 1480 do 1760, relY: 240)
  drawBastionSubstructure(ctx, 1480, 280, groundY - 240, groundY, '#f97316');
  ctx.restore();
}

function drawNeonGoals(ctx, groundY, goals) {
  if (!goals || goals.length === 0) return;

  for (const g of goals) {
    const bottomY = groundY - g.relY;
    const topY = bottomY - g.h;
    const leftX = g.x;
    const rightX = g.x + g.w;
    const isCyan = g.team === 'CYAN';

    ctx.save();

    // 1. Poświata wnętrza bramki
    const netGlow = ctx.createLinearGradient(
      g.facing === 1 ? leftX : rightX, bottomY,
      g.facing === 1 ? rightX : leftX, bottomY
    );
    netGlow.addColorStop(0.0, isCyan ? 'rgba(6, 182, 212, 0.22)' : 'rgba(249, 115, 22, 0.22)');
    netGlow.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = netGlow;
    ctx.fillRect(leftX, topY, g.w, g.h);

    // 2. Siatka bramki z laserowej plecionki
    ctx.save();
    ctx.strokeStyle = isCyan ? 'rgba(6, 182, 212, 0.35)' : 'rgba(249, 115, 22, 0.35)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    const netStep = 11;
    for (let x = leftX; x <= rightX; x += netStep) {
      ctx.moveTo(x, topY);
      ctx.lineTo(x + (g.facing === 1 ? -6 : 6), bottomY);
    }
    for (let y = topY; y <= bottomY; y += netStep) {
      ctx.moveTo(leftX, y);
      ctx.lineTo(rightX, y + 2);
    }
    ctx.stroke();
    ctx.restore();

    // 3. Neonowa rama bramki z shadowBlur (cyjan po lewej, bursztyn/orange po prawej)
    ctx.save();
    ctx.strokeStyle = g.color;
    ctx.shadowColor = g.glowColor;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 3.6;

    const mouthX = g.facing === 1 ? rightX : leftX;
    const backX = g.facing === 1 ? leftX : rightX;

    ctx.beginPath();
    ctx.moveTo(mouthX, bottomY);
    ctx.lineTo(mouthX, topY);
    ctx.lineTo(backX, topY);
    ctx.lineTo(backX, bottomY);
    ctx.stroke();

    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(backX, bottomY);
    ctx.lineTo(mouthX, bottomY);
    ctx.stroke();

    // Wewnętrzny jasny rdzeń rury neonowej
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

    // 4. Cyfrowy neonowy napis drużyny nad bramką
    ctx.save();
    ctx.fillStyle = g.color;
    ctx.shadowColor = g.color;
    ctx.shadowBlur = 8;
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'center';
    const tagText = isCyan ? '◄ CYAN GOAL' : 'ORANGE GOAL ►';
    ctx.fillText(tagText, (leftX + rightX) / 2, topY - 7);
    ctx.restore();

    ctx.restore();
  }
}

export function drawObstacles(ctx, groundY) {
  if (activeArenaId === 'ARENA_2') {
    drawCyberStadiumStructures(ctx, groundY);
  }

  for (const bar of GROUND_BARRICADES) {
    if (bar.type === 'sandbags') drawSandbags(ctx, bar.x, groundY - bar.h, bar.w, bar.h);
    else if (bar.type === 'ammo_depot') drawCrate(ctx, bar.x, groundY - bar.h, bar.w, bar.h);
    else if (bar.type === 'hedgehog') drawHedgehog(ctx, bar.x, groundY - bar.size / 2, bar.size);
  }

  for (const plat of ARENA_PLATFORMS) {
    if (plat.type === 'catwalk') {
      drawCatwalk(ctx, plat, groundY);
    } else if (plat.type === 'slope_ramp') {
      drawSlopeRamp(ctx, plat, groundY);
    } else {
      drawRockIsland(ctx, plat, groundY);
    }
  }

  if (activeArenaId === 'ARENA_2') {
    drawNeonGoals(ctx, groundY, GOALS);
  }
}

export function resetObstacles() { obstacles.length = 0; }
export function resetBirds() { }
export function updateProceduralObstacles() { }
export function updateProceduralBirds() { }
export function drawBirds() { }

// =========================================================================
// INTERSEKCJE TRAJEKTORII POCISKÓW Z PRZESZKODAMI I TERENEM
// =========================================================================

export function getSegmentAABBIntersection(x1, y1, x2, y2, left, top, right, bottom) {
  let t0 = 0.0;
  let t1 = 1.0;
  const dx = x2 - x1;
  const dy = y2 - y1;

  const p = [-dx, dx, -dy, dy];
  const q = [x1 - left, right - x1, y1 - top, bottom - y1];
  const normals = [
    [-1, 0], // lewa krawędź
    [1, 0],  // prawa krawędź
    [0, -1], // górna krawędź
    [0, 1]   // dolna krawędź
  ];

  let hitNorm = [0, -1];

  for (let k = 0; k < 4; k++) {
    if (p[k] === 0) {
      if (q[k] < 0) return null;
    } else {
      const t = q[k] / p[k];
      if (p[k] < 0) {
        if (t > t1) return null;
        if (t > t0) {
          t0 = t;
          hitNorm = normals[k];
        }
      } else {
        if (t < t0) return null;
        if (t < t1) {
          t1 = t;
        }
      }
    }
  }

  if (t0 <= t1) {
    const startInside = (x1 >= left && x1 <= right && y1 >= top && y1 <= bottom);
    const hitT = startInside ? 0 : t0;
    return {
      hit: true,
      t: hitT,
      x: x1 + dx * hitT,
      y: y1 + dy * hitT,
      nx: hitNorm[0],
      ny: hitNorm[1]
    };
  }

  return null;
}

export function getSegmentCircleIntersection(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;

  if (c <= 0) {
    const d = Math.hypot(fx, fy) || 1;
    return {
      hit: true,
      t: 0,
      x: x1,
      y: y1,
      nx: fx / d,
      ny: fy / d
    };
  }

  if (a === 0) return null;

  const discriminant = b * b - 4 * a * c;
  if (discriminant >= 0) {
    const sqrtDisc = Math.sqrt(discriminant);
    const t0 = (-b - sqrtDisc) / (2 * a);
    if (t0 >= 0 && t0 <= 1) {
      const hx = x1 + dx * t0;
      const hy = y1 + dy * t0;
      const d = Math.hypot(hx - cx, hy - cy) || 1;
      return {
        hit: true,
        t: t0,
        x: hx,
        y: hy,
        nx: (hx - cx) / d,
        ny: (hy - cy) / d
      };
    }
  }
  return null;
}

export function getSegmentSegmentIntersection(x1, y1, x2, y2, sx1, sy1, sx2, sy2) {
  const d1x = x2 - x1;
  const d1y = y2 - y1;
  const d2x = sx2 - sx1;
  const d2y = sy2 - sy1;

  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 0.0001) return null;

  const u = ((sx1 - x1) * d2y - (sy1 - y1) * d2x) / denom;
  const v = ((sx1 - x1) * d1y - (sy1 - y1) * d1x) / denom;

  if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
    const len = Math.hypot(d2x, d2y) || 1;
    let nx = -d2y / len;
    let ny = d2x / len;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    return {
      hit: true,
      t: u,
      x: x1 + d1x * u,
      y: y1 + d1y * u,
      nx,
      ny
    };
  }
  return null;
}

export function checkRayObstacleCollision(x1, y1, x2, y2, groundY, extraObstacles = null) {
  let closestHit = null;

  function recordHit(candidate, sourceName = 'unknown') {
    if (!candidate || !candidate.hit) return;
    if (!closestHit || candidate.t < closestHit.t) {
      closestHit = candidate;
      closestHit.source = sourceName;
    }
  }

  // 1. Podłoże
  if (y2 >= groundY) {
    if (y1 < groundY) {
      const dy = y2 - y1;
      const t = dy !== 0 ? Math.max(0, Math.min(1, (groundY - y1) / dy)) : 0;
      recordHit({
        hit: true,
        t,
        x: x1 + (x2 - x1) * t,
        y: groundY,
        nx: 0,
        ny: -1
      });
    } else {
      recordHit({
        hit: true,
        t: 0,
        x: x1,
        y: groundY,
        nx: 0,
        ny: -1
      });
    }
  }

  // 2. Barykady naziemne (GROUND_BARRICADES)
  if (Array.isArray(GROUND_BARRICADES)) {
    for (const bar of GROUND_BARRICADES) {
      if (bar.type === 'sandbags' || bar.type === 'ammo_depot') {
        const left = bar.x;
        const right = bar.x + bar.w;
        const top = groundY - bar.h;
        const bottom = groundY;
        const hit = getSegmentAABBIntersection(x1, y1, x2, y2, left, top, right, bottom);
        recordHit(hit);
      } else if (bar.type === 'hedgehog') {
        const cx = bar.x;
        const r = (bar.size || 30) / 2;
        const cy = groundY - r;
        const hit = getSegmentCircleIntersection(x1, y1, x2, y2, cx, cy, r);
        recordHit(hit);
      }
    }
  }

  // 3. Platformy, bunkry, skrzynki i kładki (ARENA_PLATFORMS)
  if (Array.isArray(ARENA_PLATFORMS)) {
    for (const plat of ARENA_PLATFORMS) {
      if (plat.type === 'rock_platform' || plat.type === 'citadel_island') {
        const topY = groundY - plat.relY;
        const depth = plat.depth || 80;

        // Bryła skały
        const rockHit = getSegmentAABBIntersection(x1, y1, x2, y2, plat.x, topY, plat.x + plat.w, topY + depth);
        recordHit(rockHit);

        // Rekwizyty na platformie (bunkry, worki, skrzynki)
        if (Array.isArray(plat.props)) {
          for (const prop of plat.props) {
            if (prop.w && prop.h) {
              const bx = plat.x + prop.rx;
              const by = topY - prop.h;
              const propHit = getSegmentAABBIntersection(x1, y1, x2, y2, bx, by, bx + prop.w, topY);
              recordHit(propHit);
            }
          }
        }
      } else if (plat.type === 'catwalk') {
        const topY = groundY - plat.relY;
        const thick = plat.thickness || 14;
        const catHit = getSegmentAABBIntersection(x1, y1, x2, y2, plat.x, topY, plat.x + plat.w, topY + thick);
        recordHit(catHit);
      } else if (plat.type === 'slope_ramp') {
        const yL = groundY - plat.relYLeft;
        const yR = groundY - plat.relYRight;
        // Płaszczyzna skośna rampy
        const rampSegHit = getSegmentSegmentIntersection(x1, y1, x2, y2, plat.x, yL, plat.x + plat.w, yR);
        recordHit(rampSegHit);

        // Bryła rampy poniżej
        const topMin = Math.min(yL, yR);
        const depth = plat.depth || 60;
        const rampBodyHit = getSegmentAABBIntersection(x1, y1, x2, y2, plat.x, topMin, plat.x + plat.w, Math.max(yL, yR) + depth);
        recordHit(rampBodyHit);
      }
    }
  }

  // 4. Proceduralne / dynamiczne przeszkody
  const obsList = extraObstacles || obstacles;
  if (Array.isArray(obsList)) {
    for (const obs of obsList) {
      if (obs.type === 'sandbags' || obs.type === 'ammo_depot') {
        const left = obs.x;
        const right = obs.x + obs.w;
        const top = groundY - obs.h;
        const bottom = groundY;
        const hit = getSegmentAABBIntersection(x1, y1, x2, y2, left, top, right, bottom);
        recordHit(hit);
      } else if (obs.type === 'hedgehog') {
        const cx = obs.x;
        const r = (obs.size || 30) / 2;
        const cy = groundY - r;
        const hit = getSegmentCircleIntersection(x1, y1, x2, y2, cx, cy, r);
        recordHit(hit);
      }
    }
  }

  return closestHit;
}
