// =========================================================================
// ARENAS/ARENA4/STATE.JS - OBSIDIAN CALDERA (SEKTOR 04)
// Konfiguracja, definicje geometrii, stan gejzerów i strefy śmierci
// =========================================================================

import { addPlayerXP, recordDeath } from '../../progression.js';
import { combatFeedState } from '../../ui/combatFeed.js';

export const ARENA_4_WIDTH = 3800;
export const ARENA_4_HEIGHT = 1500;
export const ARENA_4_DEATH_Y = 1400;
export const ARENA_4_MAIN_DECK_Y = 1040;

export const CALDERA_SPAWN_POINTS = [
  { x: 980,  y: 970,  facing: 1,  team: 'CYAN',   label: 'STACJA_ZACHÓD',       isGround: true },
  { x: 2220, y: 970,  facing: -1, team: 'ORANGE', label: 'STACJA_WSCHÓD',       isGround: true },
  { x: 1480, y: 450,  facing: 1,  team: 'CYAN',   label: 'MOST_GÓRNY_ZACHÓD',   isGround: true },
  { x: 1720, y: 450,  facing: -1, team: 'ORANGE', label: 'MOST_GÓRNY_WSCHÓD',   isGround: true },
  { x: 1600, y: 850,  facing: 1,  team: 'CYAN',   label: 'POMOST_POŚREDNI',     isGround: true }
];

export const CALDERA_GEYSERS = [
  {
    id: 'geyser_west',
    x: 1300,
    y: 1400,
    width: 60,
    height: 450,
    state: 'DORMANT',
    timer: 4.0,
    dormantTime: 9.5,
    telegraphTime: 1.5,
    eruptTime: 1.2
  },
  {
    id: 'geyser_east',
    x: 2500,
    y: 1400,
    width: 60,
    height: 450,
    state: 'DORMANT',
    timer: 8.5,
    dormantTime: 11.0,
    telegraphTime: 1.5,
    eruptTime: 1.2
  }
];

export const CALDERA_PLATFORMS = [
  // -------------------------------------------------------------------------
  // FLANKI: ZASTYGŁE BAZALTOWE RAMPY LAWOWE (KĄT 32.1° - PŁYNNY WŚLIZG)
  // -------------------------------------------------------------------------
  {
    id: 'caldera_slope_west',
    name: 'RAMPA LAWOWA ZACHÓD',
    x: 150,
    y: 600,
    width: 700,
    height: 440,
    w: 700,
    h: 440,
    thickness: 34,
    isSlope: true,
    startY: 600,
    endY: 1040,
    surfacePoints: [
      { x: 150, y: 600 },
      { x: 850, y: 1040 }
    ],
    isGround: true,
    solid: true,
    type: 'ramp'
  },
  {
    id: 'caldera_shelf_west',
    name: 'GÓRNA PÓŁKA ZACHÓD',
    x: 40,
    y: 600,
    width: 160,
    height: 28,
    w: 160,
    h: 28,
    thickness: 28,
    isGround: true,
    solid: true,
    type: 'basalt_shelf'
  },
  {
    id: 'caldera_lower_shelf_west',
    name: 'DOLNA STACJA ZACHÓD',
    x: 850,
    y: 1040,
    width: 270,
    height: 28,
    w: 270,
    h: 28,
    thickness: 28,
    isGround: true,
    solid: true,
    type: 'station_shelf'
  },

  // -------------------------------------------------------------------------
  // CENTRUM: MONUMENTALNE BAZALTOWE KOLUMNY OBSYDIANU (isWall: true, solid: true)
  // -------------------------------------------------------------------------
  {
    id: 'caldera_pillar_west',
    name: 'LEWA KOLUMNA OBSYDIANU',
    x: 1120,
    y: 420,
    width: 140,
    height: 1060,
    w: 140,
    h: 1060,
    thickness: 1060,
    isWall: true,
    solid: true,
    isCoverWall: true,
    type: 'basalt_pillar'
  },
  {
    id: 'caldera_pillar_east',
    name: 'PRAWA KOLUMNA OBSYDIANU',
    x: 1940,
    y: 420,
    width: 140,
    height: 1060,
    w: 140,
    h: 1060,
    thickness: 1060,
    isWall: true,
    solid: true,
    isCoverWall: true,
    type: 'basalt_pillar'
  },

  // -------------------------------------------------------------------------
  // WYSOKI POZIOM: PODWIESZANE KŁADKI TECHNOLOGICZNE NA ŁAŃCUCHACH
  // -------------------------------------------------------------------------
  {
    id: 'caldera_bridge_high',
    name: 'GÓRNY MOST WISZĄCY',
    x: 1360,
    y: 520,
    width: 480,
    height: 24,
    w: 480,
    h: 24,
    thickness: 24,
    isGround: true,
    solid: true,
    oneWay: true,
    isDropThrough: true,
    type: 'catwalk'
  },
  {
    id: 'caldera_bridge_low',
    name: 'POMOST POŚREDNI',
    x: 1400,
    y: 920,
    width: 400,
    height: 22,
    w: 400,
    h: 22,
    thickness: 22,
    isGround: true,
    solid: true,
    oneWay: true,
    isDropThrough: true,
    type: 'catwalk'
  },

  // -------------------------------------------------------------------------
  // FLANKA WSCHODNIA
  // -------------------------------------------------------------------------
  {
    id: 'caldera_lower_shelf_east',
    name: 'DOLNA STACJA WSCHÓD',
    x: 2080,
    y: 1040,
    width: 270,
    height: 28,
    w: 270,
    h: 28,
    thickness: 28,
    isGround: true,
    solid: true,
    type: 'station_shelf'
  },
  {
    id: 'caldera_slope_east',
    name: 'RAMPA LAWOWA WSCHÓD',
    x: 2350,
    y: 600,
    width: 700,
    height: 440,
    w: 700,
    h: 440,
    thickness: 34,
    isSlope: true,
    startY: 1040,
    endY: 600,
    surfacePoints: [
      { x: 2350, y: 1040 },
      { x: 3050, y: 600 }
    ],
    isGround: true,
    solid: true,
    type: 'ramp'
  },
  {
    id: 'caldera_shelf_east',
    name: 'GÓRNA PÓŁKA WSCHÓD',
    x: 3000,
    y: 600,
    width: 160,
    height: 28,
    w: 160,
    h: 28,
    thickness: 28,
    isGround: true,
    solid: true,
    type: 'basalt_shelf'
  },

  // -------------------------------------------------------------------------
  // TWARDE OSŁONY TERENOWE (COVERS)
  // -------------------------------------------------------------------------
  {
    id: 'caldera_cover_container',
    name: 'KONTENER VULCAN-01',
    type: 'vulcan_container',
    x: 920,
    y: 975,
    width: 85,
    height: 65,
    w: 85,
    h: 65,
    thickness: 65,
    isCover: true,
    solid: true,
    hp: 120
  },
  {
    id: 'caldera_cover_boulder',
    name: 'GŁAZ OBSYDIANOWY',
    type: 'obsidian_boulder',
    x: 1550,
    y: 470,
    width: 80,
    height: 50,
    w: 80,
    h: 50,
    thickness: 50,
    isCover: true,
    solid: true,
    hp: 180
  },
  {
    id: 'caldera_cover_crates',
    name: 'SKRZYNIE SEJSMICZNE',
    type: 'seismic_crate',
    x: 2160,
    y: 985,
    width: 70,
    height: 55,
    w: 70,
    h: 55,
    thickness: 55,
    isCover: true,
    solid: true,
    hp: 90
  }
];

/**
 * Inicjalizuje listę pływających kier bazaltowych na powierzchni magmy
 */
export function createMagmaCrusts() {
  const crusts = [];
  const count = 18;
  for (let i = 0; i < count; i++) {
    const baseX = (i * (ARENA_4_WIDTH / count)) + (Math.sin(i * 13.7) * 45);
    const width = 60 + Math.abs(Math.sin(i * 9.1)) * 75;
    const height = 12 + Math.abs(Math.cos(i * 4.3)) * 14;
    crusts.push({
      baseX,
      x: baseX,
      width,
      height,
      phase: (i * 0.73) % (Math.PI * 2),
      driftSpeed: 0.15 + (Math.sin(i * 2.2) * 0.1),
      roughness: [
        { dx: -width * 0.5, dy: 0 },
        { dx: -width * 0.35, dy: -3 - (i % 3) },
        { dx: 0, dy: -4 - ((i * 2) % 4) },
        { dx: width * 0.35, dy: -2 - ((i * 3) % 3) },
        { dx: width * 0.5, dy: 0 },
        { dx: width * 0.4, dy: height },
        { dx: -width * 0.4, dy: height }
      ]
    });
  }
  return crusts;
}

/**
 * Bezpieczna eliminacja postaci przez hazard środowiskowy (magma, gejzer)
 */
export function killByHazard(entity, reason = "JEZIORO MAGMY // OBSIDIAN CALDERA") {
  if (!entity || entity.isDead) return;

  entity.hp = 0;
  entity.isDead = true;
  entity.respawnTimer = 180;
  entity.vx = (Math.random() - 0.5) * 6;
  entity.vy = -12;

  if (typeof entity.die === 'function') {
    entity.die();
  }

  if (combatFeedState && typeof combatFeedState.addFeedMessage === 'function') {
    combatFeedState.addFeedMessage({
      type: 'HAZARD',
      victim: entity.name || (entity.isBot ? 'BOT' : 'OPERATOR'),
      killer: reason,
      team: entity.team || 'ORANGE'
    });
  }

  if (typeof window !== 'undefined' && typeof window.sendKillBroadcast === 'function' &&
      typeof window.isMatchActive === 'function' && window.isMatchActive()) {
    window.sendKillBroadcast({
      killerId: 'HAZARD',
      killerName: reason,
      killerTeam: null,
      victimId: entity.isRemote ? (entity.peerId || 'remotePlayer') : 'player',
      victimName: entity.name || 'OPERATOR',
      victimTeam: entity.team || null
    });
  }

  recordDeath();
}

