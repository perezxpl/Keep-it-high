// =========================================================================
// ARENAS/ARENA4/STATE.JS - STAN I KONFIGURACJA PĘDZĄCEGO POCIĄGU PANCERNEGO
// Moduł Areny 4 (Soldat-like 2D Speeding Armored Train - Modern Military)
// =========================================================================

export const ARENA_4_CONFIG = {
  id: 'arena-4',
  name: 'Pędzący Pociąg Pancerny',
  codeName: 'ARMORED_TRAIN',
  mapWidth: 4000,
  mapHeight: 1300,
  roofY: 410,
  floorY: 820,
  killzoneY: 920,
  trainSpeedKmh: 180,
  trainSpeedPxSec: 2200,

  // Cykle niebezpieczeństw środowiskowych (w sekundach)
  decoupleInterval: 60.0,
  decoupleWarningDuration: 5.0,
  decoupleSlideDuration: 3.0,

  bridgeInterval: 45.0,
  bridgeWarningDuration: 4.0,
  bridgeSweepDuration: 1.4,
  bridgeHeightY: 420
};

export const wagon1 = { x: 200, width: 720 };
export const wagon2 = { x: 960, width: 760 };
export const wagon3 = { x: 1780, width: 760 };
export const wagon4 = { x: 2600, width: 760 };
export const wagon5 = { x: 3420, width: 530 };

const roofY = ARENA_4_CONFIG.roofY; // 410

export const SPAWN_POINTS = [
  // Wagon 1: Team Alpha (CYAN) - dach pierwszego wagonu (ogon / zbrojownia)
  { id: 'spawn_wagon1_roof', x: wagon1.x + wagon1.width * 0.5, y: roofY - 50, facing: 1, team: 'CYAN' },
  // Wagon 3: Team Beta (ORANGE) - dach trzeciego wagonu (centralny / ładownia)
  { id: 'spawn_wagon3_roof', x: wagon3.x + wagon3.width * 0.5, y: roofY - 50, facing: -1, team: 'ORANGE' },
  // Wagon 2: dach drugiego wagonu (sztabowy) - rotacyjny / FFA
  { id: 'spawn_wagon2_roof', x: wagon2.x + wagon2.width * 0.5, y: roofY - 50, facing: 1 },
  // Wagon 4: dach czwartego wagonu (kontenerowy) - rotacyjny / FFA
  { id: 'spawn_wagon4_roof', x: wagon4.x + wagon4.width * 0.5, y: roofY - 50, facing: -1 },
  // Lokomotywa: dach kabiny
  { id: 'spawn_loco_roof', x: wagon5.x + wagon5.width * 0.5, y: 390 - 50, facing: -1 }
];

export const ARENA_4_SPAWNS = SPAWN_POINTS;

export const WAGON_TYPES = {
  CARGO: { id: 'CARGO', name: 'Wagon Kontenerowy', color: '#334155' },
  TANKER: { id: 'TANKER', name: 'Cysterna Chemiczna', color: '#3f3f46' },
  FLAK: { id: 'FLAK', name: 'Platforma Flak', color: '#27272a' },
  COMMAND: { id: 'COMMAND', name: 'Wagon Sztabowy', color: '#1e293b' }
};

const MAX_SPARKS = 80;
const MAX_DUST = 60;

function createSparksPool() {
  const pool = [];
  for (let i = 0; i < MAX_SPARKS; i++) {
    pool.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0.25,
      size: 2,
      color: '#facc15'
    });
  }
  return pool;
}

function createDustPool() {
  const pool = [];
  for (let i = 0; i < MAX_DUST; i++) {
    pool.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0.8,
      radius: 6,
      maxRadius: 28,
      alpha: 0.35
    });
  }
  return pool;
}

export const arena4State = {
  animTime: 0,
  trackOffset: 0,
  skyOffset: 0,
  midOffset: 0,
  railSpeed: 2200,

  // Object Pools dla cząsteczek prędkości
  sparksPool: createSparksPool(),
  dustPool: createDustPool(),

  // Zagrożenie: Niski Most Pancerny
  bridge: {
    active: false,
    warning: false,
    warningTimer: 0,
    timer: 40.0,
    x: -9999,
    width: 320,
    y: 280,
    h: 135
  },

  // Zagrożenie: Odłączanie wagonu centralnego
  decouple: {
    active: false,
    warning: false,
    warningTimer: 0,
    timer: 55.0,
    wagonType: 'CARGO',
    offsetX: 0,
    phase: 'IDLE', // 'IDLE' | 'WARNING' | 'DECOUPLING' | 'INCOMING'
    incomingX: 4200
  },

  // Aktualny typ centralnego wagonu
  centralWagonType: 'CARGO'
};

export function spawnSpark(x, y, vx, vy, size = 2.5, color = '#facc15') {
  const pool = arena4State.sparksPool;
  for (let i = 0; i < pool.length; i++) {
    const sp = pool[i];
    if (!sp.active) {
      sp.active = true;
      sp.x = x;
      sp.y = y;
      sp.vx = vx;
      sp.vy = vy;
      sp.size = size;
      sp.color = color;
      sp.maxLife = 0.15 + Math.random() * 0.20;
      sp.life = sp.maxLife;
      return;
    }
  }
}

export function spawnDustPuff(x, y, vx, vy, maxRadius = 30) {
  const pool = arena4State.dustPool;
  for (let i = 0; i < pool.length; i++) {
    const dp = pool[i];
    if (!dp.active) {
      dp.active = true;
      dp.x = x;
      dp.y = y;
      dp.vx = vx;
      dp.vy = vy;
      dp.radius = 6;
      dp.maxRadius = maxRadius;
      dp.maxLife = 0.6 + Math.random() * 0.45;
      dp.life = dp.maxLife;
      dp.alpha = 0.28 + Math.random() * 0.12;
      return;
    }
  }
}

export function resetArena4State() {
  arena4State.animTime = 0;
  arena4State.trackOffset = 0;
  arena4State.skyOffset = 0;
  arena4State.midOffset = 0;

  for (let i = 0; i < arena4State.sparksPool.length; i++) {
    arena4State.sparksPool[i].active = false;
  }
  for (let i = 0; i < arena4State.dustPool.length; i++) {
    arena4State.dustPool[i].active = false;
  }

  arena4State.bridge.active = false;
  arena4State.bridge.warning = false;
  arena4State.bridge.warningTimer = 0;
  arena4State.bridge.timer = 40.0;
  arena4State.bridge.x = -9999;

  arena4State.decouple.active = false;
  arena4State.decouple.warning = false;
  arena4State.decouple.warningTimer = 0;
  arena4State.decouple.timer = 55.0;
  arena4State.decouple.offsetX = 0;
  arena4State.decouple.phase = 'IDLE';
  arena4State.decouple.incomingX = 4200;
  arena4State.centralWagonType = 'CARGO';
}
