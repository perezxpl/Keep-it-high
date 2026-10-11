// =========================================================================
// ARENAS/ARENA2.JS - SEKTOR X // INDUSTRIAL FOUNDRY & WASTE FACILITY
// Profesjonalna arena turniejowa w układzie „X / Klepsydra” w stylu SOLDAT
// Wymiary: 4000 x 1600 px
// =========================================================================

import { triggerScreenShake } from '../../camera.js';

// =========================================================================
// 1. KONFIGURACJA ARENY (ARENA_2_CONFIG)
// =========================================================================
export const ARENA_2_CONFIG = {
  id: 'ARENA_2',
  alias: 'ARENA_2_SECTOR_X',
  name: 'Toksyczna Rafineria',
  subtitle: 'Sektor X // Ciężki przemysłowy kompleks',
  width: 4000,
  height: 1600,
  bounds: { minX: 0, maxX: 4000, minY: 0, maxY: 1600 },
  hazardZoneY: 1440, // Poziom lustra toksycznego kwasu
  abyssDeathY: 1530,
  spawns: [
    { x: 530,  y: 350,  facing: 1 },  // Platforma A (Góra-Lewo)
    { x: 3470, y: 350,  facing: -1 }, // Platforma B (Góra-Prawo - lustrzane odbicie)
    { x: 540,  y: 1010, facing: 1 },  // Platforma C (Dół-Lewo)
    { x: 3460, y: 1010, facing: -1 }  // Platforma D (Dół-Prawo - lustrzane odbicie)
  ]
};

export const ARENA_2_SECTOR_X = ARENA_2_CONFIG;
export const ARENA_2_PANDORA = ARENA_2_CONFIG; // Alias wstecznej kompatybilności

// =========================================================================
// 2. TABLICA FIZYCZNYCH PLATFORM (ARENA_2_PLATFORMS)
// Turniejowy układ „X / Klepsydra” ze zjazdami pochyłymi (slopes) - 100% symetria X = 2000
// =========================================================================
export const ARENA_2_PLATFORMS = [
  // 1. SUFIT: Wąskie belki techniczne i kratownice (drop-through)
  {
    id: 'ceil_pipe_left',
    name: 'Kratownica Sufitowa Lewa',
    x: 650,
    y: 180,
    w: 550,
    h: 16,
    isPlatform: true,
    isDropThrough: true,
    oneWay: true
  },
  {
    id: 'ceil_pipe_mid',
    name: 'Magistrala Sufitowa Środek',
    x: 1700,
    y: 150,
    w: 600,
    h: 16,
    isPlatform: true,
    isDropThrough: true,
    oneWay: true
  },
  {
    id: 'ceil_pipe_right',
    name: 'Kratownica Sufitowa Prawa',
    x: 2800,
    y: 180,
    w: 550,
    h: 16,
    isPlatform: true,
    isDropThrough: true,
    oneWay: true
  },

  // 2. GÓRNE BASTIONY A i B (Lite, solidne platformy)
  {
    id: 'plat_A_top_left',
    name: 'Bastion Górny A (Lewy)',
    x: 180,
    y: 420,
    w: 700,
    h: 32,
    isSolid: true,
    solid: true,
    isPlatform: true
  },
  {
    id: 'plat_B_top_right',
    name: 'Bastion Górny B (Prawy)',
    x: 3120,
    y: 420,
    w: 700,
    h: 32,
    isSolid: true,
    solid: true,
    isPlatform: true
  },

  // 3. RAMPY GÓRNE (Ukośne zjazdy łączące bastiony ze środkiem)
  // Z Platformy A ku centrum: od (880, 420) do (1560, 720)
  {
    id: 'ramp_top_left',
    name: 'Rampa Górna Lewa',
    x1: 880,
    y1: 420,
    x2: 1560,
    y2: 720,
    thickness: 18,
    isSlope: true,
    isPlatform: true,
    oneWay: true,
    x: 880,
    w: 680,
    y: 420,
    h: 300,
    startY: 420,
    endY: 720,
    surfacePoints: [
      { x: 880, y: 420 },
      { x: 1560, y: 720 }
    ]
  },
  // Z Platformy B ku centrum (lustrzane odbicie): od (3120, 420) do (2440, 720)
  {
    id: 'ramp_top_right',
    name: 'Rampa Górna Prawa',
    x1: 3120,
    y1: 420,
    x2: 2440,
    y2: 720,
    thickness: 18,
    isSlope: true,
    isPlatform: true,
    oneWay: true,
    x: 2440,
    w: 680,
    y: 420,
    h: 300,
    startY: 720,
    endY: 420,
    surfacePoints: [
      { x: 2440, y: 720 },
      { x: 3120, y: 420 }
    ]
  },

  // 4. [ŚRODEK] - Centralny hub taktyczny (kratownica drop-through, idealnie wyśrodkowany X: 1560-2440)
  {
    id: 'center_hub',
    name: 'Centralny Hub Taktyczny',
    x: 1560,
    y: 720,
    w: 880,
    h: 26,
    isPlatform: true,
    isDropThrough: true,
    oneWay: true
  },

  // 5. RAMPY DOLNE (Ukośne zjazdy ze środka na dolne platformy)
  // Ze Środka do Platformy C: od (1560, 720) do (900, 1080)
  {
    id: 'ramp_bot_left',
    name: 'Rampa Dolna Lewa',
    x1: 1560,
    y1: 720,
    x2: 900,
    y2: 1080,
    thickness: 18,
    isSlope: true,
    isPlatform: true,
    oneWay: true,
    x: 900,
    w: 660,
    y: 720,
    h: 360,
    startY: 1080,
    endY: 720,
    surfacePoints: [
      { x: 900, y: 1080 },
      { x: 1560, y: 720 }
    ]
  },
  // Ze Środka do Platformy D (lustrzane odbicie): od (2440, 720) do (3100, 1080)
  {
    id: 'ramp_bot_right',
    name: 'Rampa Dolna Prawa',
    x1: 2440,
    y1: 720,
    x2: 3100,
    y2: 1080,
    thickness: 18,
    isSlope: true,
    isPlatform: true,
    oneWay: true,
    x: 2440,
    w: 660,
    y: 720,
    h: 360,
    startY: 720,
    endY: 1080,
    surfacePoints: [
      { x: 2440, y: 720 },
      { x: 3100, y: 1080 }
    ]
  },

  // 6. DOLNE BASTIONY C i D (Pozycje obronne nad kwasem)
  {
    id: 'plat_C_bot_left',
    name: 'Bastion Dolny C (Lewy)',
    x: 180,
    y: 1080,
    w: 720,
    h: 32,
    isSolid: true,
    solid: true,
    isPlatform: true
  },
  {
    id: 'plat_D_bot_right',
    name: 'Bastion Dolny D (Prawy)',
    x: 3100,
    y: 1080,
    w: 720,
    h: 32,
    isSolid: true,
    solid: true,
    isPlatform: true
  }
];

// Aliasy wstecznej kompatybilności dla fizyki i orkiestratora
export const ARENA_2_PANDORA_PLATFORMS = ARENA_2_PLATFORMS;
export const ARENA_CYBER_STADIUM_PLATFORMS = ARENA_2_PLATFORMS;
export const ARENA_2_PANDORA_GOALS = [];
export const ARENA_CYBER_STADIUM_GOALS = [];
export const ARENA_CYBER_STADIUM_BARRICADES = [];
export const ARENA_2_BRIDGES = [];
export const LEFT_VINE_BRIDGE_POINTS = [];
export const RIGHT_VINE_BRIDGE_POINTS = [];

export function resetArena2Bridges() {}
export function applyPandoraUpdraft() { return false; }
export function checkPandoraUpdraft() { return false; }

// =========================================================================
// 2B. ELEMENTY TAKTYCZNE I OSŁONY (LEVEL DESIGN - SEKTOR X)
// =========================================================================

// 1. METALOWE SKRZYNIE / OSŁONY BALISTYCZNE (Blokują pociski i graczy - symetria X = 2000)
export const ARENA_2_COVERS = [
  // Bastion górny lewy (A) - osłona od strony środka
  { id: 'cover_A', x: 740, y: 378, w: 54, h: 42, isSolid: true, blocksBullets: true },
  // Bastion górny prawy (B) - osłona od strony środka (idealny mirror: 4000 - (740 + 54) = 3206)
  { id: 'cover_B', x: 3206, y: 378, w: 54, h: 42, isSolid: true, blocksBullets: true },
  // Bastion dolny lewy (C)
  { id: 'cover_C', x: 580, y: 1038, w: 54, h: 42, isSolid: true, blocksBullets: true },
  // Bastion dolny prawy (D) (idealny mirror: 4000 - (580 + 54) = 3366)
  { id: 'cover_D', x: 3366, y: 1038, w: 54, h: 42, isSolid: true, blocksBullets: true }
];

// 2. WYBUCHOWE BECZKI Z TOKSYNAMI (Niszczalne przeszkody środowiskowe - symetria X = 2000)
export const ARENA_2_BARRELS = [
  { id: 'barrel_A_edge', x: 830, y: 384, w: 26, h: 36, hp: 30, maxHp: 30, exploded: false },
  { id: 'barrel_B_edge', x: 3144, y: 384, w: 26, h: 36, hp: 30, maxHp: 30, exploded: false },
  { id: 'barrel_C_mid',  x: 820, y: 1044, w: 26, h: 36, hp: 30, maxHp: 30, exploded: false },
  { id: 'barrel_D_mid',  x: 3154, y: 1044, w: 26, h: 36, hp: 30, maxHp: 30, exploded: false }
];

// 3. CENTRALNY TERMINAL ZAOPATRZENIA (Pick-up w sercu areny: X = 2000)
export const ARENA_2_SUPPLY = {
  x: 1982,
  y: 700,
  w: 36,
  h: 20,
  type: 'AMMO_MEDKIT',
  isAvailable: true,
  respawnTimer: 0,
  respawnDelay: 1200 // 20 sekund przy 60 FPS
};

// =========================================================================
// SYSTEM ZRZUTU I ZALANIA KWASEM (TOXIC ACID SURGE SYSTEM)
// =========================================================================

let _acidSirenCtx = null;

/**
 * Odtwarza syntetyczną dwutonową przemysłową syrenę alarmową (Web Audio API)
 */
export function playAcidSurgeSiren() {
  if (typeof window === 'undefined') return;
  if (window.ACID_SIREN_ENABLED === false) return;
  if (window.uiManager && window.uiManager.settings && window.uiManager.settings.muteAll) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!_acidSirenCtx) {
      _acidSirenCtx = new AudioCtx();
    }
    if (_acidSirenCtx.state === 'suspended') {
      _acidSirenCtx.resume();
    }

    const now = _acidSirenCtx.currentTime;
    const osc = _acidSirenCtx.createOscillator();
    const gain = _acidSirenCtx.createGain();

    osc.type = 'sawtooth';
    // Modulacja częstotliwości: dwutonowa syrena przemysłowa (wznosząca i opadająca)
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.linearRampToValueAtTime(780, now + 0.6);
    osc.frequency.linearRampToValueAtTime(420, now + 1.2);
    osc.frequency.linearRampToValueAtTime(780, now + 1.8);
    osc.frequency.linearRampToValueAtTime(420, now + 2.4);
    osc.frequency.linearRampToValueAtTime(780, now + 3.0);
    osc.frequency.linearRampToValueAtTime(360, now + 3.5);

    // Filtr dolnoprzepustowy nadający surowy, industrialny rezonans
    const filter = _acidSirenCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    const masterVol = (window.uiManager?.settings?.masterVolume ?? 80) / 100;
    const targetGain = 0.18 * masterVol;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(targetGain, now + 0.1);
    gain.gain.setValueAtTime(targetGain, now + 3.0);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(_acidSirenCtx.destination);

    osc.start(now);
    osc.stop(now + 3.5);
  } catch (err) {
    // Bezpieczne wyciszenie w przypadku blokady autoplay
  }
}

export const ACID_SURGE_SYSTEM = {
  // Poziomy kwasu (wysokość świata = 1600 px)
  baseY: 1440,       // Poziom spoczynkowy
  peakY: 600,        // Kulminacyjny moment zalań: poziom Y = 600 (zalewa kładkę środkową Y = 720 i zmusza do ucieczki na bastiony Y = 420)
  currentY: 1440,    // Aktualny poziom Y (interpolowany)

  // Maszyna stanów: 'CALM' | 'WARNING' | 'RISING' | 'FLOODED' | 'DRAINING'
  state: 'CALM',
  timer: 30.0,       // Odliczanie (w sekundach)

  durations: {
    calm: 30.0,      // 30 sekund normalnego stanu
    warning: 3.5,    // 3.5 sekundy alarmu ostrzegawczego przed zalaniem
    rising: 3.5,     // 3.5 sekundy płynnego podnoszenia się cieczy
    flooded: 15.0,   // 15 sekund utrzymywania wysokiego stanu
    draining: 4.0    // 4 sekundy spływania kwasu
  },

  // Easing dla płynnego ruchu cieczy
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  },

  update(dt) {
    this.timer -= dt;

    switch (this.state) {
      case 'CALM':
        this.currentY = this.baseY;
        if (this.timer <= 0) {
          this.state = 'WARNING';
          this.timer = this.durations.warning;
          playAcidSurgeSiren();
        }
        break;

      case 'WARNING':
        this.currentY = this.baseY;
        // Wstrząsy zapowiadające zalanie
        if (Math.random() < 0.25 && typeof triggerScreenShake === 'function') {
          triggerScreenShake(2);
        }
        if (this.timer <= 0) {
          this.state = 'RISING';
          this.timer = this.durations.rising;
        }
        break;

      case 'RISING': {
        const progress = 1 - (this.timer / this.durations.rising);
        this.currentY = this.baseY - (this.baseY - this.peakY) * this.easeInOutQuad(progress);
        if (this.timer <= 0) {
          this.state = 'FLOODED';
          this.timer = this.durations.flooded;
          this.currentY = this.peakY;
        }
        break;
      }

      case 'FLOODED':
        this.currentY = this.peakY;
        if (this.timer <= 0) {
          this.state = 'DRAINING';
          this.timer = this.durations.draining;
        }
        break;

      case 'DRAINING': {
        const progress = 1 - (this.timer / this.durations.draining);
        this.currentY = this.peakY + (this.baseY - this.peakY) * this.easeInOutQuad(progress);
        if (this.timer <= 0) {
          this.state = 'CALM';
          this.timer = this.durations.calm;
          this.currentY = this.baseY;
        }
        break;
      }
    }
  }
};

// =========================================================================
// 3. PREALOKOWANE STRUKTURY DLA 60 FPS (ZERO GC ALLOCATIONS)
// =========================================================================
// Podwodne bąble kwasu w głębi toni
const ACID_BUBBLES_COUNT = 28;
export const _acidBubbles = [];
for (let i = 0; i < ACID_BUBBLES_COUNT; i++) {
  _acidBubbles.push({
    x: 100 + (i * 135.4) % 3800,
    y: 1440 + (i * 17.8) % 120,
    size: 2.5 + (i % 4) * 1.5,
    speedY: 0.6 + (i % 3) * 0.4,
    phase: i * 0.52,
    life: Math.random() * 80
  });
}

// Cząsteczki pyłu przemysłowego w hali
const INDUSTRIAL_DUST_COUNT = 32;
export const _industrialDust = [];
for (let i = 0; i < INDUSTRIAL_DUST_COUNT; i++) {
  _industrialDust.push({
    baseX: 80 + (i * 120.5) % 3840,
    baseY: 200 + (i * 38.7) % 1150,
    size: 1.4 + (i % 3) * 0.8,
    speedX: ((i % 5) - 2) * 3.5,
    speedY: -4.0 - (i % 4) * 2.5,
    phase: i * 0.4,
    colorType: (i % 3) // 0: amber, 1: smoke, 2: cyan
  });
}

// Górne przemysłowe koguty alarmowe (Rotating Emergency Beacons) na ścianach w tle (symetria X = 2000)
export const ARENA_2_EMERGENCY_BEACONS = [
  { x: 1000, y: 560, id: 'beacon_1', label: 'BEACON-01' }, // pod górną lewą rampą
  { x: 3000, y: 560, id: 'beacon_4', label: 'BEACON-04' }  // pod górną prawą rampą (lustrzane odbicie)
];

// Stała tablica 28 cząstek unoszących się oparów toksycznych (Steam Motes)
export const TOXIC_VAPOR_COUNT = 28;
export const _toxicVaporParticles = [];
for (let i = 0; i < TOXIC_VAPOR_COUNT; i++) {
  _toxicVaporParticles.push({
    baseX: 100 + (i * 135.7) % 3800,
    radius: 14 + (i % 5) * 2.8, // promień w przedziale 14–26 px
    speed: 1.15 + (i % 4) * 0.42, // szybkość falowania poziomego
    amp: 12 + (i % 5) * 3.2, // amplituda falowania (12–25 px)
    driftSpeed: 0.12 + (i % 3) * 0.035, // pionowy dryf w górę (ok. 6–8s cykl)
    phase: i * 0.49
  });
}

// Pęcherze gazu pęczniejące na tafli kwasu i wyrzucające 2–3 mikro-kropelki cieczy
export const SURFACE_BUBBLES_COUNT = 32;
export const _surfaceBubbles = [];
for (let i = 0; i < SURFACE_BUBBLES_COUNT; i++) {
  _surfaceBubbles.push({
    x: 100 + (i * 118.5) % 3800,
    maxRadius: 2.2 + (i % 4) * 0.58, // promień 2–4 px
    cycleDuration: 1.8 + (i % 5) * 0.35, // 1.8–3.2 sekundy
    phase: i * 0.38,
    droplets: [
      { vx: -16 + (i % 7) * 4.5, vy: -38 - (i % 3) * 8, size: 1.2 },
      { vx: 2 + ((i + 1) % 5) * 3.2, vy: -48 - (i % 4) * 6, size: 1.5 },
      { vx: 15 - ((i + 2) % 6) * 4.2, vy: -34 - (i % 5) * 7, size: 1.0 }
    ]
  });
}

/** Zwraca falujące lustro toksycznego kwasu (jednolita, stała formuła fali) */
export function getAcidSurfaceY(x, time) {
  const curY = (typeof ACID_SURGE_SYSTEM !== 'undefined') ? ACID_SURGE_SYSTEM.currentY : 1440;
  return curY + Math.sin(time * 3.0 + x * 0.02) * 5.0;
}

// =========================================================================
// DETALE WIZUALNE KWASU - UNOSZĄCE SIĘ OBIEKTY (ACID FLOTSAM)
// 100% symetria osiowa względem X = 2000 (prealokowane obiekty, 0 alokacji GC w pętli renderującej)
// =========================================================================
export const _acidFlotsam = [
  // 1. Toksyczne beczki z wyciekiem i dymem (symetria X = 2000: |X - 2000| = 1580 oraz 680)
  { type: 'barrel', baseX: 420,  driftAmp: 18, driftSpeed: 0.60, phase: 0.00, tiltAmp: 0.15, size: 28, yOffset: 6 },
  { type: 'barrel', baseX: 3580, driftAmp: 18, driftSpeed: 0.60, phase: Math.PI, tiltAmp: -0.15, size: 28, yOffset: 6 },
  { type: 'barrel', baseX: 1320, driftAmp: 14, driftSpeed: 0.75, phase: 1.50, tiltAmp: 0.18, size: 26, yOffset: 5 },
  { type: 'barrel', baseX: 2680, driftAmp: 14, driftSpeed: 0.75, phase: 1.50 + Math.PI, tiltAmp: -0.18, size: 26, yOffset: 5 },

  // 2. Dryfujące ludzkie czaszki (symetria X = 2000: |X - 2000| = 1280 oraz 250)
  { type: 'skull',  baseX: 720,  driftAmp: 12, driftSpeed: 0.80, phase: 0.70, tiltAmp: 0.12, size: 18, yOffset: 4 },
  { type: 'skull',  baseX: 3280, driftAmp: 12, driftSpeed: 0.80, phase: 0.70 + Math.PI, tiltAmp: -0.12, size: 18, yOffset: 4 },
  { type: 'skull',  baseX: 1750, driftAmp: 10, driftSpeed: 0.90, phase: 2.10, tiltAmp: 0.10, size: 16, yOffset: 3 },
  { type: 'skull',  baseX: 2250, driftAmp: 10, driftSpeed: 0.90, phase: 2.10 + Math.PI, tiltAmp: -0.10, size: 16, yOffset: 3 },

  // 3. Dryfujące ludzkie kości (symetria X = 2000: |X - 2000| = 920)
  { type: 'bones',  baseX: 1080, driftAmp: 15, driftSpeed: 0.65, phase: 1.10, tiltAmp: 0.20, size: 22, yOffset: 2 },
  { type: 'bones',  baseX: 2920, driftAmp: 15, driftSpeed: 0.65, phase: 1.10 + Math.PI, tiltAmp: -0.20, size: 22, yOffset: 2 },

  // 4. Ości ryb / szkielety rybie (symetria X = 2000: |X - 2000| = 1760, 500 oraz 100)
  { type: 'fish_skeleton', baseX: 240,  driftAmp: 16, driftSpeed: 0.70, phase: 0.40, tiltAmp: 0.25, size: 24, yOffset: 2 },
  { type: 'fish_skeleton', baseX: 3760, driftAmp: 16, driftSpeed: 0.70, phase: 0.40 + Math.PI, tiltAmp: -0.25, size: 24, yOffset: 2 },
  { type: 'fish_skeleton', baseX: 1500, driftAmp: 12, driftSpeed: 0.85, phase: 2.70, tiltAmp: 0.20, size: 20, yOffset: 2 },
  { type: 'fish_skeleton', baseX: 2500, driftAmp: 12, driftSpeed: 0.85, phase: 2.70 + Math.PI, tiltAmp: -0.20, size: 20, yOffset: 2 },
  { type: 'fish_skeleton', baseX: 1900, driftAmp: 8,  driftSpeed: 1.00, phase: 3.50, tiltAmp: 0.18, size: 18, yOffset: 1 },
  { type: 'fish_skeleton', baseX: 2100, driftAmp: 8,  driftSpeed: 1.00, phase: 3.50 + Math.PI, tiltAmp: -0.18, size: 18, yOffset: 1 }
];

// =========================================================================

// =========================================================================
// 7. SYSTEM EFEKTÓW ZGONU W KWASIE (ACID DEATH FX SYSTEM)
// =========================================================================

export const _acidSplashParticles = [];
export const _acidDebrisList = [];
export const _acidSmokeParticles = [];
export const _acidBoilEmitters = [];

/**
 * 1. Gejzer kropel kwasu (Acid Splash Geyser) - limit twardy 28 cząstek
 */
export function createAcidSplash(x, y) {
  if (_acidSplashParticles.length >= 28) return;
  const count = 14;
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.15;
    const speed = 4.0 + Math.random() * 5.0;
    _acidSplashParticles.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y + (Math.random() - 0.5) * 4,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.34,
      size: 2.0 + Math.random() * 1.8,
      color: Math.random() < 0.55 ? '#4ade80' : '#86efac',
      alpha: 1.0,
      life: 0,
      maxLife: 28 + Math.random() * 10
    });
  }
}

/**
 * Mniejszy rozbryzg przy wpadnięciu odłamka/broni
 */
export function createAcidMiniSplash(x, y) {
  if (_acidSplashParticles.length >= 28) return;
  const count = 6;
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    const speed = 2.0 + Math.random() * 3.0;
    _acidSplashParticles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.34,
      size: 1.4 + Math.random() * 1.4,
      color: '#86efac',
      alpha: 0.9,
      life: 0,
      maxLife: 20 + Math.random() * 8
    });
  }
}

/**
 * 2. Cząstki ulatującego dymu/oparów toksycznych - limit twardy 18 cząstek
 */
export function spawnAcidSmoke(x, y) {
  if (_acidSmokeParticles.length >= 18) return;
  _acidSmokeParticles.push({
    x: x,
    y: y,
    vx: (Math.random() - 0.5) * 1.2,
    vy: -1.4 - Math.random() * 1.4,
    radius: 4.0 + Math.random() * 3.0,
    maxRadius: 14.0 + Math.random() * 6.0,
    alpha: 0.55,
    color: Math.random() < 0.6 ? '#4ade80' : '#86efac',
    life: 0,
    maxLife: 35 + Math.random() * 15
  });
}

/**
 * 3. Wyrzut upuszczonej broni/hełmu z fizyką balistyczną (vy = -7, vx = random(-2, 2))
 */
export function spawnAcidDebris(x, y, weaponObj) {
  if (_acidDebrisList.length >= 3) return;
  const isHelmet = Math.random() < 0.5;
  _acidDebrisList.push({
    x: x,
    y: y,
    vx: (Math.random() - 0.5) * 4.0, // random(-2, 2)
    vy: -7.0,                       // vy = -7
    gravity: 0.35,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.28,
    isHelmet: isHelmet,
    weaponName: weaponObj ? (weaponObj.name || weaponObj.id || 'RIFLE') : 'RIFLE',
    active: true
  });
}

/**
 * 4. Emiter wrzenia małych bąbli pękających na tafli kwasu przez 2.5 sekundy
 */
export function spawnAcidBoilEmitter(x, y, duration = 2.5) {
  if (_acidBoilEmitters.length >= 3) return;
  _acidBoilEmitters.push({
    x: x,
    y: y,
    duration: duration,
    timer: 0,
    spawnCooldown: 0,
    bubbles: []
  });
}

/**
 * Aktualizacja cząstek efektów kwasu
 */
export function updateAcidDeathEffects(dt) {
  const hazardY = ARENA_2_CONFIG.hazardZoneY;

  // 1. Gejzery kropel
  for (let i = _acidSplashParticles.length - 1; i >= 0; i--) {
    const sp = _acidSplashParticles[i];
    sp.x += sp.vx;
    sp.y += sp.vy;
    sp.vy += sp.gravity;
    sp.life++;
    sp.alpha = Math.max(0, 1 - (sp.life / sp.maxLife));
    if (sp.life >= sp.maxLife || (sp.vy > 0 && sp.y >= hazardY + 15)) {
      _acidSplashParticles.splice(i, 1);
    }
  }

  // 2. Wyrzucone obiekty broni/hełmu (balistyka)
  for (let i = _acidDebrisList.length - 1; i >= 0; i--) {
    const d = _acidDebrisList[i];
    d.x += d.vx;
    d.y += d.vy;
    d.vy += d.gravity;
    d.rot += d.rotSpeed;

    // Po łuku wpada do kwasu
    if (d.y >= hazardY && d.vy > 0) {
      createAcidMiniSplash(d.x, hazardY);
      _acidDebrisList.splice(i, 1);
    }
  }

  // 3. Dym toksyczny
  for (let i = _acidSmokeParticles.length - 1; i >= 0; i--) {
    const sm = _acidSmokeParticles[i];
    sm.x += sm.vx;
    sm.y += sm.vy;
    sm.vy *= 0.98;
    sm.life++;
    const progress = sm.life / sm.maxLife;
    sm.radius += (sm.maxRadius - sm.radius) * 0.04;
    sm.currentAlpha = sm.alpha * (1 - progress);
    if (sm.life >= sm.maxLife) {
      _acidSmokeParticles.splice(i, 1);
    }
  }

  // 4. Emitery wrzenia
  for (let i = _acidBoilEmitters.length - 1; i >= 0; i--) {
    const em = _acidBoilEmitters[i];
    em.timer += dt;

    if (em.timer < em.duration) {
      em.spawnCooldown -= dt;
      if (em.spawnCooldown <= 0) {
        em.spawnCooldown = 0.08 + Math.random() * 0.06;
        em.bubbles.push({
          x: em.x + (Math.random() - 0.5) * 36,
          life: 0,
          maxLife: 18 + Math.random() * 14,
          maxR: 1.8 + Math.random() * 2.2,
          droplets: [
            { vx: -0.6 + Math.random() * 1.2, vy: -1.2 - Math.random() * 1.5, size: 1.0 },
            { vx: -0.8 + Math.random() * 1.6, vy: -1.0 - Math.random() * 1.2, size: 0.8 }
          ]
        });
      }
    }

    for (let b = em.bubbles.length - 1; b >= 0; b--) {
      const bub = em.bubbles[b];
      bub.life++;
      if (bub.life >= bub.maxLife) {
        em.bubbles.splice(b, 1);
      }
    }

    if (em.timer >= em.duration && em.bubbles.length === 0) {
      _acidBoilEmitters.splice(i, 1);
    }
  }
}

/**
 * Renderowanie efektów zgonu w kwasie
 */
export function drawAcidDeathEffects(ctx, time) {
  ctx.save();
  ctx.shadowBlur = 0;

  // A. Emitery wrzenia na tafli kwasu
  for (let i = 0; i < _acidBoilEmitters.length; i++) {
    const em = _acidBoilEmitters[i];
    for (let b = 0; b < em.bubbles.length; b++) {
      const bub = em.bubbles[b];
      const surfaceY = getAcidSurfaceY(bub.x, time);
      const progress = bub.life / bub.maxLife;

      if (progress < 0.70) {
        const r = bub.maxR * (progress / 0.70);
        ctx.fillStyle = 'rgba(167, 243, 208, 0.85)';
        ctx.beginPath();
        ctx.arc(bub.x, surfaceY - r * 0.5, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bub.x - r * 0.3, surfaceY - r * 0.7, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const popProg = (progress - 0.70) / 0.30;
        const ringR = bub.maxR + popProg * 4.0;
        ctx.strokeStyle = `rgba(110, 231, 183, ${Math.max(0, 0.6 * (1 - popProg))})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(bub.x, surfaceY, ringR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = `rgba(167, 243, 208, ${Math.max(0, 0.8 * (1 - popProg))})`;
        for (const dr of bub.droplets) {
          const dx = bub.x + dr.vx * popProg * 8.0;
          const dy = surfaceY + dr.vy * popProg * 10.0 + 0.5 * 18.0 * popProg * popProg;
          ctx.beginPath();
          ctx.arc(dx, dy, dr.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // B. Kropelki gejzeru (Acid Splash)
  for (let i = 0; i < _acidSplashParticles.length; i++) {
    const sp = _acidSplashParticles[i];
    ctx.save();
    ctx.globalAlpha = sp.alpha;
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // C. Wyrzucone bronie / hełmy (Debris)
  for (let i = 0; i < _acidDebrisList.length; i++) {
    const d = _acidDebrisList[i];
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);

    if (d.isHelmet) {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, 7, Math.PI, 0);
      ctx.lineTo(8, 3);
      ctx.lineTo(-8, 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(-5, 0, 10, 2.5);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-10, -2.5, 20, 5);
      ctx.fillStyle = '#475569';
      ctx.fillRect(10, -1.2, 8, 2.4);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-7, 2.5, 4, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-6, -3, 8, 1.2);
    }

    ctx.restore();
  }

  // D. Cząstki ulatującego dymu (lekki render bez kosztownych radial gradientów)
  for (let i = 0; i < _acidSmokeParticles.length; i++) {
    const sm = _acidSmokeParticles[i];
    ctx.save();
    ctx.globalAlpha = Math.max(0, (sm.currentAlpha || 0.4) * 0.45);
    ctx.fillStyle = sm.color || '#4ade80';
    ctx.beginPath();
    ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Sprawdza, czy stopy postaci są fizycznie zanurzone w widocznej tafli kwasu (z marginesem zanurzenia)
 */
export function isPlayerSubmergedInAcid(p, submergeDepth = 15) {
  if (!p) return false;
  const time = performance.now() * 0.001;
  const acidY = (typeof ACID_SURGE_SYSTEM !== 'undefined') ? ACID_SURGE_SYSTEM.currentY : (ARENA_2_CONFIG.hazardZoneY || 1440);
  const px = (p.x !== undefined ? p.x : 0) + (p.w || 24) * 0.5;
  const waveOffset = Math.sin(time * 3.0 + px * 0.02) * 5.0;
  const exactSurfaceY = acidY + waveOffset;
  const playerFeetY = (p.origin === 'bottom') ? p.y : (p.y + (p.h || 70));
  return playerFeetY >= (exactSurfaceY + submergeDepth);
}

/**
 * Rozpoczyna sekwencję zgonu gracza po wpadnięciu do kwasu (Etap 1: Inicjalizacja)
 */
export function triggerPlayerAcidDeath(p, hazardZoneY) {
  if (!p) return;
  if (p.acidDeath && p.acidDeath.active) return;
  if (p.isDead) return;

  p.isAcidDying = true;
  p.acidDeath = {
    active: true,
    timer: 0,
    maxDuration: 1.2, // 1.2 sekundy trwania efektu rozpuszczania
    hazardY: hazardZoneY,
    splashTriggered: true,
    smokeCount: 0,
    dissolved: false
  };

  // Postać NIE JEST jeszcze martwa (isDead pozostaje false do końca 1.2s)
  p.isDead = false;
  p.vx = 0;
  // Spowolnienie opadania - zanurzanie w gęstym kwasie
  p.vy = Math.min(Math.max((p.vy || 0) * 0.35, 0.3), 1.0);
  p.onGround = false;
  p.currentPlatform = null;
  p.currentGroundY = null;

  // Schowaj/upuść broń w ręku
  p.isHolstered = true;
  p.holsterWeight = 1.0;

  // Zablokuj sterowanie
  p.moveLeft = false;
  p.moveRight = false;
  p.isJumping = false;
  p.isJetpacking = false;
  p.isShooting = false;
  p.isAiming = false;
  p.isCrouching = false;
  p.isProne = false;
  p.isSliding = false;
  p.isCharging = false;
  p.isJumpCharging = false;
  if (p.keys) {
    p.keys.left = false; p.keys.right = false; p.keys.up = false; p.keys.down = false;
    p.keys.KeyA = false; p.keys.KeyD = false; p.keys.KeyW = false; p.keys.KeyS = false;
    p.keys.space = false; p.keys.slide = false;
  }

  const deathX = p.x + (p.w || 24) / 2;

  // 1. Gejzer kropel (wyzwalany raz na początku zgonu)
  createAcidSplash(deathX, hazardZoneY);

  // 3. Wyrzut upuszczonej broni/hełmu z fizyką balistyczną (vy = -7, vx = random(-2, 2))
  spawnAcidDebris(deathX, p.y + 20, p.currentWeapon);

  // 4. Emiter wrzenia małych bąbli pękających na tafli kwasu przez 2.5 sekundy
  spawnAcidBoilEmitter(deathX, hazardZoneY, 2.5);
}

// =========================================================================
// 8. AKTUALIZACJA LOGIKI ARENY 2 (UPDATEARENA2)
// Obrażenia od żrącego kwasu oraz pełny 3-etapowy proces śmierci w kwasie
// =========================================================================
export function updateArena2(dt, players) {
  const safeDt = dt || (1 / 60);

  // 1. Zaktualizuj maszynę stanów kwasu
  ACID_SURGE_SYSTEM.update(safeDt);

  // 2. Dynamiczna synchronizacja poziomów w konfiguracji
  ARENA_2_CONFIG.hazardZoneY = ACID_SURGE_SYSTEM.currentY;
  ARENA_2_CONFIG.abyssDeathY = ACID_SURGE_SYSTEM.currentY + 90;

  // 3. Aktualizacja cząstek efektów zgonu w kwasie (rozbryzgi, wrzenie, dym, balistyka ekwipunku)
  updateAcidDeathEffects(safeDt);

  if (!Array.isArray(players)) return;

  const hazardZoneY = ARENA_2_CONFIG.hazardZoneY;

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    if (!p) continue;

    const feetY = p.y + (p.h || 70);

    // Etap 2: Trwający proces rozpuszczania w kwasie (przez 1.2 sekundy)
    if (p.acidDeath && p.acidDeath.active) {
      p.acidDeath.timer += safeDt;
      p.isAcidDying = true;
      p.isDead = false;

      // Blokada ruchu poziomego i spowolnione, ociężałe zanurzanie w kwasie
      p.vx = 0;
      p.vy = Math.min(Math.max((p.vy || 0) * 0.85, 0.3), 1.0);
      p.y += p.vy;
      p.onGround = false;
      p.currentPlatform = null;
      p.currentGroundY = null;

      // Całkowita blokada sterowania
      p.moveLeft = false;
      p.moveRight = false;
      p.isJumping = false;
      p.isJetpacking = false;
      p.isShooting = false;
      p.isAiming = false;
      p.isCrouching = false;
      p.isProne = false;
      p.isSliding = false;
      p.isCharging = false;
      p.isJumpCharging = false;
      if (p.keys) {
        p.keys.left = false; p.keys.right = false; p.keys.up = false; p.keys.down = false;
        p.keys.KeyA = false; p.keys.KeyD = false; p.keys.KeyW = false; p.keys.KeyS = false;
        p.keys.space = false; p.keys.slide = false;
      }

      // Płynny spadek życia w trakcie rozpuszczania
      p.hp = Math.max(0, p.maxHp * (1.0 - (p.acidDeath.timer / p.acidDeath.maxDuration)));

      // Generuj 15 cząstek ulatującego dymu proporcjonalnie w czasie trwania 1.2s
      const targetSmoke = Math.min(15, Math.floor((p.acidDeath.timer / p.acidDeath.maxDuration) * 15) + 1);
      while (p.acidDeath.smokeCount < targetSmoke && p.acidDeath.smokeCount < 15) {
        p.acidDeath.smokeCount++;
        spawnAcidSmoke(
          (p.x + (p.w || 24) / 2) + (Math.random() - 0.5) * 20,
          hazardZoneY + (Math.random() - 0.5) * 6
        );
      }

      // Etap 3: Dopiero po upływie 1.2 sekundy następuje właściwy zgon i respawn
      if (p.acidDeath.timer >= p.acidDeath.maxDuration) {
        p.isAcidDying = false;
        p.acidDeath.active = false;
        p.acidDeath.dissolved = true;
        p.hp = 0;
        p.isDead = true;
        p.respawnTimer = 90; // Respawn po rozpuszczeniu
      }
      continue;
    }

    if (p.isDead) continue;

    // Etap 1: Wykrycie rzeczywistego zanurzenia stóp w widocznej cieczy (margines zanurzenia 15 px)
    const time = performance.now() * 0.001;
    const px = (p.x !== undefined ? p.x : 0) + (p.w || 24) * 0.5;
    const waveOffset = Math.sin(time * 3.0 + px * 0.02) * 5.0;
    const exactSurfaceY = hazardZoneY + waveOffset;
    const playerFeetY = (p.origin === 'bottom') ? p.y : (p.y + (p.h || 70));
    const SUBMERGE_DEPTH = 15; // margines zanurzenia: 15 pikseli w głąb widocznego kwasu

    if (playerFeetY >= (exactSurfaceY + SUBMERGE_DEPTH)) {
      triggerPlayerAcidDeath(p, exactSurfaceY);
    }
  }
}

