// =========================================================================
// OBSTACLES.JS - WIELOPOZIOMOWE WYSPY ARENY I OBSŁUGA KOLIZJI PLATFORM
// =========================================================================

import { ARENA_LEFT, ARENA_RIGHT, START_X, ARENA_WIDTH } from './config.js';
import { triggerScreenShake, triggerGoalCelebration } from './world.js';
import { bot } from './bot.js';

export const obstacles = [];

// =========================================================================
// ARENA 1: SOLDAT NIGHT OPS (TAKTYCZNA BAZA WOJSKOWA 3200 PX)
// Szerokość: ARENA_WIDTH = 3200 px (od START_X: 160 do 3360). Środek / Ołtarz: 1760.
// =========================================================================
export const ARENA_1_PLATFORMS = [
  // --- KONDYGNACJA 1: BASTIONY WOJSKOWE I OŁTARZ CENTRALNY (relY: 110 - 190) ---
  // 1. Lewy Bastion Twierdzy (Baza Cyan z bramką)
  {
    id: 'west_bastion_fortress',
    type: 'rock_platform',
    isBastion: true,
    theme: 'cyan',
    x: START_X + 20, // 180
    w: 380,
    relY: 130,
    thickness: 22,
    props: [
      { type: 'bunker_tier', rx: 150, w: 140, h: 30 },
      { type: 'sandbags', rx: 310, w: 50, h: 20 },
      { type: 'crate', rx: 40, w: 36, h: 26 }
    ]
  },
  // 2. Lewy Taktyczny Posterunek Obronny
  {
    id: 'west_flank_outpost',
    type: 'rock_platform',
    x: START_X + 720, // 880
    w: 280,
    relY: 110,
    thickness: 18,
    props: [
      { type: 'sandbags', rx: 30, w: 50, h: 20 },
      { type: 'crate', rx: 190, w: 36, h: 26 }
    ]
  },
  // 3. GŁÓWNY OŁTARZ CENTRALNY (CENTRAL ALTAR - X: 1600 do 1920, Środek: 1760)
  {
    id: 'central_altar_platform',
    type: 'altar_island',
    isAltar: true,
    x: START_X + 1440, // 1600
    w: 320,
    relY: 190,
    thickness: 24,
    props: [
      { type: 'altar_pedestal', rx: 90, w: 140, h: 32 },
      { type: 'sandbags', rx: 20, w: 45, h: 20 },
      { type: 'sandbags', rx: 255, w: 45, h: 20 }
    ]
  },
  // 4. Prawy Taktyczny Posterunek Obronny
  {
    id: 'east_flank_outpost',
    type: 'rock_platform',
    x: START_X + 2200, // 2360
    w: 280,
    relY: 110,
    thickness: 18,
    props: [
      { type: 'crate', rx: 50, w: 36, h: 26 },
      { type: 'sandbags', rx: 200, w: 50, h: 20 }
    ]
  },
  // 5. Prawy Bastion Twierdzy (Baza Orange z bramką)
  {
    id: 'east_bastion_fortress',
    type: 'rock_platform',
    isBastion: true,
    theme: 'orange',
    x: START_X + 2800, // 2960
    w: 380,
    relY: 130,
    thickness: 22,
    props: [
      { type: 'sandbags', rx: 20, w: 50, h: 20 },
      { type: 'bunker_tier', rx: 90, w: 140, h: 30 },
      { type: 'crate', rx: 300, w: 36, h: 26 }
    ]
  },

  // --- KONDYGNACJA 2: KŁADKI STALOWE I MOSTY PRZERZUTOWE (relY: 320 - 450) ---
  {
    id: 'catwalk_west_tier2',
    type: 'catwalk',
    x: START_X + 160, // 320
    w: 260,
    relY: 320,
    thickness: 14,
    chains: [30, 230]
  },
  {
    id: 'catwalk_west_mid',
    type: 'catwalk',
    x: START_X + 580, // 740
    w: 280,
    relY: 410,
    thickness: 14,
    chains: [35, 245]
  },
  // Środkowa kładka wisząca bezpośrednio nad Ołtarzem Centralnym
  {
    id: 'catwalk_central_over_altar',
    type: 'catwalk',
    x: START_X + 1400, // 1560
    w: 400,
    relY: 450,
    thickness: 16,
    chains: [40, 360]
  },
  {
    id: 'catwalk_east_mid',
    type: 'catwalk',
    x: START_X + 2340, // 2500
    w: 280,
    relY: 410,
    thickness: 14,
    chains: [35, 245]
  },
  {
    id: 'catwalk_east_tier2',
    type: 'catwalk',
    x: START_X + 2780, // 2940
    w: 260,
    relY: 320,
    thickness: 14,
    chains: [30, 230]
  },

  // --- KONDYGNACJA 3: GNIAZDA SNAJPERSKIE I STACJE ZAWIESZONE (relY: 620 - 680) ---
  {
    id: 'sniper_nest_west',
    type: 'catwalk',
    x: START_X + 320, // 480
    w: 240,
    relY: 620,
    thickness: 14,
    chains: [25, 215]
  },
  {
    id: 'station_mid_west',
    type: 'catwalk',
    x: START_X + 960, // 1120
    w: 320,
    relY: 680,
    thickness: 14,
    chains: [40, 280]
  },
  {
    id: 'station_mid_east',
    type: 'catwalk',
    x: START_X + 1920, // 2080
    w: 320,
    relY: 680,
    thickness: 14,
    chains: [40, 280]
  },
  {
    id: 'sniper_nest_east',
    type: 'catwalk',
    x: START_X + 2640, // 2800
    w: 240,
    relY: 620,
    thickness: 14,
    chains: [25, 215]
  },

  // --- KONDYGNACJA 4 & 5: APEX CYTADELA ORBITALNA I POMOST JUPITERA (relY: 860 - 1050) ---
  {
    id: 'apex_orbital_fortress',
    type: 'citadel_island',
    x: START_X + 1350, // 1510
    w: 500,
    relY: 860,
    thickness: 22,
    props: [
      { type: 'bunker_tier', rx: 160, w: 180, h: 36 },
      { type: 'antenna', rx: 250, h: 75 },
      { type: 'sandbags', rx: 40, w: 50, h: 20 },
      { type: 'crate', rx: 410, w: 36, h: 26 }
    ]
  },
  // Najwyższy podwieszany pomost z reflektorem jupitera rzucającym snop światła na ołtarz
  {
    id: 'apex_spotlight_gantry',
    type: 'catwalk',
    x: START_X + 1460, // 1620
    w: 280,
    relY: 1050,
    thickness: 16,
    chains: [30, 250]
  }
];

export const ARENA_1_BARRICADES = [
  { type: 'sandbags', x: START_X + 280, w: 55, h: 22 },
  { type: 'hedgehog', x: START_X + 560, size: 32 },
  { type: 'ammo_depot', x: START_X + 820, w: 42, h: 28 },
  { type: 'sandbags', x: START_X + 1100, w: 55, h: 22 },
  { type: 'hedgehog', x: START_X + 1320, size: 32 },
  // Osłony wokół podnóża ołtarza centralnego
  { type: 'sandbags', x: START_X + 1520, w: 55, h: 22 },
  { type: 'hedgehog', x: START_X + 1600, size: 34 },
  { type: 'ammo_depot', x: START_X + 1740, w: 42, h: 28 },
  { type: 'hedgehog', x: START_X + 1880, size: 34 },
  { type: 'sandbags', x: START_X + 1960, w: 55, h: 22 },
  // Skrzydło wschodnie
  { type: 'hedgehog', x: START_X + 2180, size: 32 },
  { type: 'sandbags', x: START_X + 2400, w: 55, h: 22 },
  { type: 'ammo_depot', x: START_X + 2660, w: 42, h: 28 },
  { type: 'hedgehog', x: START_X + 2920, size: 32 },
  { type: 'sandbags', x: START_X + 3160, w: 55, h: 22 }
];

export const ARENA_1_GOALS = [
  {
    id: 'goal_arena1_west',
    team: 'CYAN',
    x: START_X + 40, // 200 (na lewym bastionie)
    relY: 130,
    w: 100,
    h: 125,
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.85)',
    facing: 1
  },
  {
    id: 'goal_arena1_east',
    team: 'ORANGE',
    x: START_X + ARENA_WIDTH - 140, // 3220 (na prawym bastionie)
    relY: 130,
    w: 100,
    h: 125,
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.85)',
    facing: -1
  }
];

export const arena1State = {
  waitingForKickoff: true,
  kickoffCooldown: 0,
  initialSetupDone: false,
  altarX: START_X + ARENA_WIDTH / 2, // 1760 (dokładny środek areny)
  altarRelY: 245
};

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
    props: [
      { type: 'sandbags', rx: 100, w: 50, h: 20 },
      { type: 'bunker_tier', rx: 170, w: 90, h: 28 }
    ]
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
export const GOALS = [...ARENA_1_GOALS];
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
    arena1State.waitingForKickoff = false;

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
    GOALS.push(...ARENA_1_GOALS);

    arena1State.waitingForKickoff = true;
    arena1State.kickoffCooldown = 0;

    if (playerObj) {
      playerObj.x = START_X + 240; // 400 (na lewym bastionie)
      playerObj.y = groundY - 130 - playerObj.h;
      playerObj.vx = 0;
      playerObj.vy = 0;
      playerObj.facing = 1;
      playerObj.isIntro = false;
      playerObj.juggleTimer = 0;
      playerObj.isJumping = false;
      playerObj.isSliding = false;
      playerObj.gaitMode = 'IDLE';
    }
    if (botObj) {
      botObj.x = START_X + ARENA_WIDTH - 240; // 3120 (na prawym bastionie)
      botObj.y = groundY - 130 - botObj.h;
      botObj.vx = 0;
      botObj.vy = 0;
      botObj.facing = -1;
      botObj.isJumping = false;
      botObj.isSliding = false;
      botObj.gaitMode = 'IDLE';
    }
    if (ballObj) {
      ballObj.x = arena1State.altarX;
      ballObj.y = groundY - arena1State.altarRelY;
      ballObj.vx = 0;
      ballObj.vy = 0;
      ballObj.spin = 0;
      ballObj.trail = [];
    }
  }

  return activeArenaId;
}

export function getPlatformSurfaceY(plat, px, groundY) {
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

        // 2. Zeskok z tarasu bunkra lub ołtarza
        if (plat.props) {
          const tier = plat.props.find(pr => pr.type === 'bunker_tier' || pr.type === 'altar_pedestal');
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

      if (isLanding) {
        landedSurface = topY;
        break;
      }
    }
  }

  if (landedSurface === null) {
    for (const plat of ARENA_PLATFORMS) {
      if (plat.props) {
        const tier = plat.props.find(pr => pr.type === 'bunker_tier' || pr.type === 'altar_pedestal');
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
    if (plat.type === 'catwalk') {
      // =====================================================================
      // 1. KŁADKA (CATWALK) - Jednostronna platforma (One-Way Platform)
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
      // 2. PŁASKA WYSPA / BASTION / OŁTARZ (ROCK_PLATFORM / CITADEL_ISLAND)
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

      // Rekwizyty na platformie (np. bunker_tier, altar_pedestal, crate, sandbags)
      if (plat.props) {
        for (const prop of plat.props) {
          if (prop.type === 'bunker_tier' || prop.type === 'altar_pedestal') {
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

  // =========================================================================
  // MECHANIKA ARENY 1: OŁTARZ CENTRALNY (LEWITACJA / KICKOFF) I BRAMKI
  // =========================================================================
  if (activeArenaId === 'ARENA_1') {
    // 1. Inicjalne przygotowanie przy pierwszym uruchomieniu gry
    if (!arena1State.initialSetupDone) {
      arena1State.initialSetupDone = true;
      arena1State.waitingForKickoff = true;
      if (p) {
        p.x = START_X + 240;
        p.y = groundY - 130 - p.h;
        p.vx = 0;
        p.vy = 0;
        p.facing = 1;
        p.isIntro = false;
        p.gaitMode = 'IDLE';
      }
      if (ball) {
        ball.x = arena1State.altarX;
        ball.y = groundY - arena1State.altarRelY;
        ball.vx = 0;
        ball.vy = 0;
        ball.spin = 0;
        ball.trail = [];
      }
    }

    // 2. Obsługa restartu pozycji (np. po klawiszu 'R' lub restarcie gracza)
    if (p && p.isIntro) {
      p.isIntro = false;
      p.gaitMode = 'IDLE';
      p.x = START_X + 240;
      p.y = groundY - 130 - p.h;
      p.facing = 1;
      arena1State.waitingForKickoff = true;
      arena1State.kickoffCooldown = 0;
      if (ball) {
        ball.x = arena1State.altarX;
        ball.y = groundY - arena1State.altarRelY;
        ball.vx = 0;
        ball.vy = 0;
        ball.spin = 0;
        ball.trail = [];
      }
    }

    if (arena1State.kickoffCooldown > 0) {
      arena1State.kickoffCooldown--;
    }

    // 3. Podtrzymywanie piłki lewitującej na ołtarzu centralnym przed startem meczu
    if (arena1State.waitingForKickoff && ball) {
      const time = performance.now() * 0.003;
      const hoverY = (groundY - arena1State.altarRelY) + Math.sin(time) * 6;
      ball.x = arena1State.altarX;
      ball.y = hoverY;
      ball.vx = 0;
      ball.vy = 0;
      ball.spin = 0;
      ball.trail = [];

      // Sprawdzenie rozpoczęcia meczu (kickoff)
      if (arena1State.kickoffCooldown <= 0) {
        const pCenterX = p ? p.x + p.w / 2 : Infinity;
        const pCenterY = p ? p.y + p.h / 2 : Infinity;
        const distP = Math.hypot(ball.x - pCenterX, ball.y - pCenterY);

        const bCenterX = (bot && bot.active) ? bot.x + bot.w / 2 : Infinity;
        const bCenterY = (bot && bot.active) ? bot.y + bot.h / 2 : Infinity;
        const distB = Math.hypot(ball.x - bCenterX, ball.y - bCenterY);

        const isNear = distP < 55 || distB < 55;
        const isKicking = p && p.kickState === 'SWING' && distP < 85;

        if (isNear || isKicking) {
          arena1State.waitingForKickoff = false;
          triggerScreenShake(7);
          ball.vy = -6.2;
          ball.vx = (distP <= distB) ? ((p?.facing || 1) * 6.5) : ((bot?.facing || -1) * 6.5);
          ball.spin = (ball.vx > 0 ? 1 : -1) * 0.6;
          spawnAltarShockwave(ball.x, ball.y);
        }
      }
    }

    // 4. Detekcja goli w Arenie 1 (Bramki lewa i prawa)
    if (!arena1State.waitingForKickoff && ball) {
      for (const g of GOALS) {
        const bottomY = groundY - g.relY;
        const topY = bottomY - g.h;
        const leftX = g.x;
        const rightX = g.x + g.w;

        if (ball.x >= leftX && ball.x <= rightX && ball.y >= topY && ball.y <= bottomY) {
          const scoringTeam = (g.team === 'CYAN') ? 'ORANGE' : 'CYAN';
          if (scoringTeam === 'CYAN') {
            arenaScore.cyan++;
          } else {
            arenaScore.orange++;
          }

          triggerScreenShake(15);
          triggerGoalCelebration(scoringTeam, scoringTeam === 'CYAN' ? '#06b6d4' : '#f97316');

          // Reset piłki na ołtarz centralny w oczekiwaniu na kolejny kickoff
          arena1State.waitingForKickoff = true;
          arena1State.kickoffCooldown = 65;
          ball.x = arena1State.altarX;
          ball.y = groundY - arena1State.altarRelY;
          ball.prevX = ball.x;
          ball.prevY = ball.y;
          ball.vx = 0;
          ball.vy = 0;
          ball.spin = 0;
          ball.trail = [];
          break;
        }
      }
    }
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
  const thick = plat.thickness || 20;

  ctx.save();

  if (plat.isCyberBastion || plat.isBastion) {
    const accentCol = plat.theme === 'cyan' ? '#06b6d4' : '#f97316';
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(plat.x, topY, plat.w, thick);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plat.x, topY, plat.w, thick);

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

    drawHazardStripes(ctx, plat.x, topY + thick - 5, plat.w, 4);
  } else if (plat.isAltar || plat.type === 'altar_island') {
    // Stylistyka Ołtarza Centralnego (czysta pozioma płyta o stałej grubości)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(plat.x, topY, plat.w, thick);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(plat.x, topY, plat.w, thick);

    ctx.save();
    ctx.strokeStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();
    ctx.restore();

    drawHazardStripes(ctx, plat.x, topY + thick - 5, plat.w, 4);
  } else {
    // Czysty, płaski profil platformy o stałej grubości thickness
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(plat.x, topY, plat.w, thick);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plat.x, topY, plat.w, thick);

    ctx.fillStyle = '#334155';
    ctx.fillRect(plat.x, topY, plat.w, 3);

    drawHazardStripes(ctx, plat.x, topY + thick - 4, plat.w, 4);
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
      } else if (prop.type === 'altar_pedestal') {
        const by = topY - prop.h;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px, by, prop.w, prop.h);
        ctx.strokeStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2.0;
        ctx.strokeRect(px, by, prop.w, prop.h);
        ctx.shadowBlur = 0;
        drawHazardStripes(ctx, px + 8, by + prop.h - 6, prop.w - 16, 4);

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ ALTAR OF WAR ⚡', px + prop.w / 2, by + 16);
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

function drawAltarSpotlightAndLevitation(ctx, groundY) {
  const altarX = arena1State.altarX;
  const topY = groundY - 190;
  const pedestalY = topY - 32;
  const hoverY = (groundY - arena1State.altarRelY) + Math.sin(performance.now() * 0.003) * 6;
  const gantryY = groundY - 1050;
  const time = performance.now() * 0.001;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // 1. Zewnętrzny stożek światła z górnego pomostu na ołtarz
  const beamTopW = 40;
  const beamBottomW = 240;

  const beamGrad = ctx.createLinearGradient(altarX, gantryY, altarX, topY);
  beamGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.75)');
  beamGrad.addColorStop(0.12, 'rgba(186, 230, 253, 0.50)');
  beamGrad.addColorStop(0.50, 'rgba(56, 189, 248, 0.28)');
  beamGrad.addColorStop(0.85, 'rgba(6, 182, 212, 0.16)');
  beamGrad.addColorStop(1.0, 'rgba(6, 182, 212, 0.02)');

  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(altarX - beamTopW / 2, gantryY);
  ctx.lineTo(altarX + beamTopW / 2, gantryY);
  ctx.lineTo(altarX + beamBottomW / 2, topY + 8);
  ctx.lineTo(altarX - beamBottomW / 2, topY + 8);
  ctx.closePath();
  ctx.fill();

  // 2. Wewnętrzny jaskrawy rdzeń światła
  const coreGrad = ctx.createLinearGradient(altarX, gantryY, altarX, topY);
  coreGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.90)');
  coreGrad.addColorStop(0.35, 'rgba(224, 242, 254, 0.45)');
  coreGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.moveTo(altarX - 14, gantryY);
  ctx.lineTo(altarX + 14, gantryY);
  ctx.lineTo(altarX + 65, topY);
  ctx.lineTo(altarX - 65, topY);
  ctx.closePath();
  ctx.fill();

  // 3. Iluminacja i plama światła na cokole ołtarza
  const poolGrad = ctx.createRadialGradient(altarX, pedestalY + 4, 10, altarX, pedestalY + 4, 120);
  poolGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.70)');
  poolGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.40)');
  poolGrad.addColorStop(0.80, 'rgba(6, 182, 212, 0.14)');
  poolGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = poolGrad;
  ctx.beginPath();
  ctx.ellipse(altarX, pedestalY + 2, 115, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. Reflektor na górnym pomoście
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(altarX, gantryY, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Efekty lewitacji piłki przed startem meczu
  if (arena1State.waitingForKickoff) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 3.5);

    ctx.save();
    // Efekt poświaty / bańki ochronnej
    const bubbleGrad = ctx.createRadialGradient(altarX, hoverY, 4, altarX, hoverY, 30 + pulse * 6);
    bubbleGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.65)');
    bubbleGrad.addColorStop(0.4, 'rgba(0, 229, 255, 0.35)');
    bubbleGrad.addColorStop(0.8, 'rgba(6, 182, 212, 0.12)');
    bubbleGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bubbleGrad;
    ctx.beginPath();
    ctx.arc(altarX, hoverY, 30 + pulse * 6, 0, Math.PI * 2);
    ctx.fill();

    // Dwa obracające się neonowe pierścienie energii wokół piłki
    ctx.strokeStyle = `rgba(0, 229, 255, ${0.75 + pulse * 0.25})`;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.ellipse(altarX, hoverY, 26 + pulse * 3, 9, time * 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(altarX, hoverY, 26 + pulse * 3, 9, -time * 2.2, 0, Math.PI * 2);
    ctx.stroke();

    // Holo-wskaźnik nad piłką
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.fillText('⚡ KICKOFF READY ⚡', altarX, hoverY - 26);
    ctx.restore();
  }

  // Rysowanie fali uderzeniowej po rozpoczęciu meczu (shockwaves)
  for (let i = altarShockwaves.length - 1; i >= 0; i--) {
    const sw = altarShockwaves[i];
    sw.radius += 3.5;
    sw.alpha -= 0.035;

    ctx.save();
    ctx.strokeStyle = sw.color;
    ctx.shadowColor = sw.color;
    ctx.shadowBlur = 12;
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

export function drawObstacles(ctx, groundY) {
  if (activeArenaId === 'ARENA_1') {
    drawBastionSubstructure(ctx, START_X + 20, 380, groundY - 130, groundY, '#06b6d4');
    drawBastionSubstructure(ctx, START_X + 2800, 380, groundY - 130, groundY, '#f97316');
  } else if (activeArenaId === 'ARENA_2') {
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
    } else {
      drawRockIsland(ctx, plat, groundY);
    }
  }

  drawNeonGoals(ctx, groundY, GOALS);

  if (activeArenaId === 'ARENA_1') {
    drawAltarSpotlightAndLevitation(ctx, groundY);
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
      if (plat.type === 'rock_platform' || plat.type === 'citadel_island' || plat.type === 'altar_island') {
        const topY = groundY - plat.relY;
        const thick = plat.thickness || 20;

        // Płaska płyta platformy
        const rockHit = getSegmentAABBIntersection(x1, y1, x2, y2, plat.x, topY, plat.x + plat.w, topY + thick);
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
