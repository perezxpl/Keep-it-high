// =========================================================================
// MENUSHOWCASE.JS - ŻYWY ZEWIASZ ROZGRYWKI W TLE MENU GŁÓWNEGO (LIVE MENU SHOWCASE)
// Rotacja po 5 arenach, hot-drop botów, pre-symulacja (pre-warm 45 klatek),
// kamera akcji (director camera) oraz taktyczny efekt przejścia (Tactical Feed Cut).
// ZERO ctx.shadowBlur, stałe 60 FPS w Chrome, brak emotikonów.
// =========================================================================

import { 
  bots, 
  getActiveBots, 
  setBotEnabled, 
  isBotEnabled, 
  getBotCount, 
  setBotCount, 
  applyBotClassAndConfig, 
  updateBotBrain 
} from './bot.js';
import { deathmatchState } from './deathmatch/state.js';
import { drawPlayer } from './player/renderer.js';
import { evaluateSpawnSafety, findDynamicSafeSpawns } from './player/spawnSafety.js';
import { extinguishCombatant } from './weapons/flamethrower.js';
import { checkPlayerPlatformLanding } from './obstacles/playerPhysics.js';
import { 
  switchArena, 
  activeArenaId, 
  drawObstacles, 
  ARENA_PLATFORMS, 
  customObstacles 
} from './obstacles.js';
import { 
  updateBullets, 
  bullets, 
  drawBullets, 
  drawBurningEffects 
} from './weapons.js';
import { 
  updateProjectiles, 
  activeProjectiles, 
  drawProjectiles 
} from './projectiles.js';
import { ball, updateBall, drawBall } from './ball.js';
import { drawGround } from './world/terrain.js';
import { 
  updateParticles, 
  drawParticles, 
  updateJetpackParticles, 
  drawJetpackParticles 
} from './world/state.js';
import { 
  updateGore, 
  drawGore, 
  drawBloodDecals 
} from './world/gore.js';
import { 
  updateLighting, 
  drawLighting, 
  drawShockwaves, 
  drawCinematicVignette 
} from './lighting/index.js';
import { 
  renderArenaBackground, 
  renderArenaForeground, 
  getActiveArena 
} from './renderer.js';
import { 
  camera, 
  getCanvasLogicalWidth, 
  getCanvasLogicalHeight, 
  setCameraArenaId 
} from './camera.js';
import { updateArena2 } from './arenas/arena2/state.js';
import { updateArena3 } from './arenas/arena3.js';

// Cykl aren: wszystkie 5 aren
export const SHOWCASE_ARENAS = ['ARENA_1', 'ARENA_2', 'ARENA_3', 'ARENA_4', 'ARENA_5'];

export const SHOWCASE_ARENA_CONFIG = {
  ARENA_1: {
    id: 'ARENA_1',
    name: 'CYBER STADION // NEONOWE MIASTO',
    tag: 'LIVE FEED // SEKTOR 01: CYBER STADION',
    deathY: 1300,
    safeFloorY: 1200,
    minX: 400,
    maxX: 3200,
    centerX: 1800,
    centerY: 950,
    zoom: 0.86,
    hasBall: true,
    spawns: [
      { x: 1450, y: 770, facing: 1, classKey: 'RAPTOR', team: 'CYAN' },
      { x: 1650, y: 610, facing: 1, classKey: 'STRIKER', team: 'CYAN' },
      { x: 1720, y: 1128, facing: 1, classKey: 'ENFORCER', team: 'CYAN' },
      { x: 1880, y: 1128, facing: -1, classKey: 'ENFORCER', team: 'ORANGE' },
      { x: 1950, y: 610, facing: -1, classKey: 'STRIKER', team: 'ORANGE' },
      { x: 2150, y: 770, facing: -1, classKey: 'RAPTOR', team: 'ORANGE' }
    ]
  },
  ARENA_2: {
    id: 'ARENA_2',
    name: 'TOKSYCZNA RAFINERIA // SEKTOR X',
    tag: 'LIVE FEED // SEKTOR 02: TOKSYCZNA RAFINERIA',
    deathY: 1500,
    safeFloorY: 720,
    minX: 1400,
    maxX: 2600,
    centerX: 2000,
    centerY: 750,
    zoom: 0.86,
    hasBall: false,
    spawns: [
      { x: 1620, y: 648, facing: 1, classKey: 'RAPTOR', team: 'CYAN' },
      { x: 1780, y: 648, facing: 1, classKey: 'STRIKER', team: 'CYAN' },
      { x: 1920, y: 648, facing: 1, classKey: 'ENFORCER', team: 'CYAN' },
      { x: 2080, y: 648, facing: -1, classKey: 'ENFORCER', team: 'ORANGE' },
      { x: 2220, y: 648, facing: -1, classKey: 'STRIKER', team: 'ORANGE' },
      { x: 2380, y: 648, facing: -1, classKey: 'RAPTOR', team: 'ORANGE' }
    ]
  },
  ARENA_3: {
    id: 'ARENA_3',
    name: 'MILITARNA DŻUNGLA // ZAPOMNIANY SEKTOR',
    tag: 'LIVE FEED // SEKTOR 03: MILITARNA DŻUNGLA',
    deathY: 1350,
    safeFloorY: 1000,
    minX: 1600,
    maxX: 2800,
    centerX: 2200,
    centerY: 950,
    zoom: 0.86,
    hasBall: false,
    spawns: [
      { x: 1820, y: 928, facing: 1, classKey: 'RAPTOR', team: 'CYAN' },
      { x: 1980, y: 928, facing: 1, classKey: 'STRIKER', team: 'CYAN' },
      { x: 2120, y: 928, facing: 1, classKey: 'ENFORCER', team: 'CYAN' },
      { x: 2280, y: 928, facing: -1, classKey: 'ENFORCER', team: 'ORANGE' },
      { x: 2420, y: 928, facing: -1, classKey: 'STRIKER', team: 'ORANGE' },
      { x: 2580, y: 928, facing: -1, classKey: 'RAPTOR', team: 'ORANGE' }
    ]
  },
  ARENA_4: {
    id: 'ARENA_4',
    name: 'OBSIDIAN CALDERA // KRATER MAGMOWY',
    tag: 'LIVE FEED // SEKTOR 04: OBSIDIAN CALDERA',
    deathY: 1400,
    safeFloorY: 960,
    minX: 700,
    maxX: 2500,
    centerX: 1600,
    centerY: 850,
    zoom: 0.86,
    hasBall: false,
    spawns: [
      { x: 1000, y: 968, facing: 1, classKey: 'RAPTOR', team: 'CYAN' },
      { x: 1450, y: 448, facing: 1, classKey: 'STRIKER', team: 'CYAN' },
      { x: 1480, y: 848, facing: 1, classKey: 'ENFORCER', team: 'CYAN' },
      { x: 1720, y: 848, facing: -1, classKey: 'ENFORCER', team: 'ORANGE' },
      { x: 1750, y: 448, facing: -1, classKey: 'STRIKER', team: 'ORANGE' },
      { x: 2200, y: 968, facing: -1, classKey: 'RAPTOR', team: 'ORANGE' }
    ]
  },
  ARENA_5: {
    id: 'ARENA_5',
    name: 'PREFABRYKATOR ORBITALNY // SEKTOR 05',
    tag: 'LIVE FEED // SEKTOR 05: PREFABRYKATOR ORBITALNY',
    deathY: 1450,
    safeFloorY: 1200,
    minX: 200,
    maxX: 1400,
    centerX: 800,
    centerY: 950,
    zoom: 0.84,
    hasBall: false,
    spawns: [
      { x: 350, y: 1128, facing: 1, classKey: 'RAPTOR', team: 'CYAN' },
      { x: 550, y: 1128, facing: 1, classKey: 'STRIKER', team: 'CYAN' },
      { x: 720, y: 1128, facing: 1, classKey: 'ENFORCER', team: 'CYAN' },
      { x: 880, y: 1128, facing: -1, classKey: 'ENFORCER', team: 'ORANGE' },
      { x: 1050, y: 1128, facing: -1, classKey: 'STRIKER', team: 'ORANGE' },
      { x: 1250, y: 1128, facing: -1, classKey: 'RAPTOR', team: 'ORANGE' }
    ]
  }
};

const ARENA_CYCLE_DURATION = 9.0; // 9 sekund dynamicznej bitwy na arenie
const TRANSITION_OUT_DURATION = 0.20; // 200ms wyjście (glitch + zaciemnienie)
const TRANSITION_IN_DURATION = 0.35; // 350ms wejście (flash)
const TRANSITION_TOTAL_DURATION = TRANSITION_OUT_DURATION + TRANSITION_IN_DURATION; // 0.55s

export const menuShowcaseState = {
  active: false,
  initialized: false,
  currentArenaId: 'ARENA_1',
  arenaTimer: 0,
  totalTime: 0,
  savedSettings: {
    botEnabled: true,
    botCount: 1
  },
  transition: {
    phase: 'NONE', // 'NONE', 'OUT', 'IN'
    timer: 0,
    hasSwapped: false,
    nextArenaId: 'ARENA_2',
    scanlines: []
  },
  badge: {
    text: '',
    timer: 0
  },
  camera: {
    currentX: 1800,
    currentY: 950,
    targetX: 1800,
    targetY: 950
  }
};

export function isMenuShowcaseActive() {
  return menuShowcaseState.active;
}

/**
 * Rozmieszcza boty na kluczowych centralnych platformach danej mapy
 */
export function deployShowcaseBots(arenaId) {
  const config = SHOWCASE_ARENA_CONFIG[arenaId] || SHOWCASE_ARENA_CONFIG.ARENA_1;
  const activeBots = getActiveBots();
  const spawns = config.spawns;

  for (let i = 0; i < spawns.length && i < activeBots.length; i++) {
    const b = activeBots[i];
    const sp = spawns[i];
    if (!b || !sp) continue;

    applyBotClassAndConfig(b, sp.classKey, sp.team);
    b.difficulty = 'hard';

    b.x = sp.x + (Math.random() - 0.5) * 40;
    b.y = sp.y;
    b.vx = (Math.random() - 0.5) * 2;
    b.vy = 0;
    b.facing = sp.facing;

    // Podwyższona wytrzymałość dla widowiskowych, ciągłych starć w menu
    b.hp = 220;
    b.maxHp = 220;
    b.hasVest = true;
    b.vestHp = 100;
    b.vestMaxHp = 100;
    b.hasHelmet = true;
    b.helmetHits = 2;

    b.isDead = false;
    b.isAcidDying = false;
    b.acidDeath = null;
    b.respawnTimer = 0;
    b.spawnProtectionTimer = 0;
    b.frozen = false;
    b.decisionTimer = 0;

    b.jetFuel = 100;
    b.jetMax = 100;
    b.isJetpacking = false;

    if (b.ammo) {
      for (const wKey of Object.keys(b.ammo)) {
        if (b.ammo[wKey]) {
          b.ammo[wKey].currentAmmo = b.ammo[wKey].magSize || 30;
          b.ammo[wKey].reserveAmmo = 999;
          b.ammo[wKey].isReloading = false;
        }
      }
    }
    b.reloadTimer = 0;
    b.shootCooldown = Math.floor(Math.random() * 8);
  }

  // Obsługa piłki na Arenie 1 (Cyber Stadion)
  if (config.hasBall && ball) {
    ball.active = true;
    ball.x = 1800;
    ball.y = 800;
    ball.vx = (Math.random() - 0.5) * 6;
    ball.vy = -5;
    ball.goalAnimation = null;
  } else if (ball) {
    ball.active = false;
    ball.goalAnimation = null;
  }
}

/**
 * Wykonuje pre-symulację w tle (pre-warm ~45 klatek),
 * aby gracz po mignięciu od razu widział toczącą się bitwę w locie.
 */
export function runPreWarmSimulation(arenaId, frameCount = 45) {
  const config = SHOWCASE_ARENA_CONFIG[arenaId] || SHOWCASE_ARENA_CONFIG.ARENA_1;
  const effectiveGroundY = config.deathY + 100;
  const activeBots = getActiveBots();

  // Oczyszczenie starych pocisków i rakiet
  if (Array.isArray(bullets)) bullets.length = 0;
  if (Array.isArray(activeProjectiles)) activeProjectiles.length = 0;

  const dt = 1 / 60;
  for (let step = 0; step < frameCount; step++) {
    // 1. Decyzje sztucznej inteligencji i fizyka botów
    for (let i = 0; i < activeBots.length; i++) {
      const b = activeBots[i];
      if (!b || !b.active || b.isDead) continue;
      updateBotBrain(config.hasBall ? ball : null, null, effectiveGroundY, null, b, activeBots);
      checkPlayerPlatformLanding(b, effectiveGroundY);
    }

    // 2. Balistyka pocisków i rakiet
    updateBullets(effectiveGroundY, ARENA_PLATFORMS, null, activeBots);
    updateProjectiles(effectiveGroundY, ARENA_PLATFORMS, customObstacles, activeBots, null);

    // 3. Piłka na Arenie 1
    if (config.hasBall && ball && ball.active) {
      updateBall(effectiveGroundY);
    }

    // 4. Mechaniki specyficzne dla map
    if (arenaId === 'ARENA_2') {
      try { updateArena2(dt, activeBots); } catch (_) {}
    } else if (arenaId === 'ARENA_3') {
      try { updateArena3(dt, activeBots, ball); } catch (_) {}
    } else {
      try {
        const curArena = getActiveArena();
        if (curArena && typeof curArena.update === 'function') {
          curArena.update(dt, activeBots, ball);
        }
      } catch (_) {}
    }
  }
}

/**
 * Generuje proceduralne paski zakłóceń dla efektu glitch/scanline
 */
function generateGlitchScanlines() {
  const lines = [];
  const count = 4 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    lines.push({
      yRel: Math.random(),
      hRel: 0.01 + Math.random() * 0.05,
      alpha: 0.35 + Math.random() * 0.55,
      isCyan: Math.random() > 0.45
    });
  }
  return lines;
}

/**
 * Utrzymuje kamerę w całkowitym bezruchu (Stationary Camera) wycentrowaną na arenie.
 * Zero drgań, zero przesunięć, zero wstrząsów – pełna stabilność widoku w menu.
 */
export function updateStationaryCamera(arenaId) {
  const config = SHOWCASE_ARENA_CONFIG[arenaId] || SHOWCASE_ARENA_CONFIG.ARENA_1;
  const canvasWidth = (typeof getCanvasLogicalWidth === 'function') ? getCanvasLogicalWidth() : 1920;
  const canvasHeight = (typeof getCanvasLogicalHeight === 'function') ? getCanvasLogicalHeight() : 1080;
  const targetZoom = config.zoom || 0.86;

  camera.zoom = targetZoom;
  camera.targetZoom = targetZoom;
  camera.minZoom = targetZoom;

  const viewWidth = canvasWidth / targetZoom;
  const viewHeight = canvasHeight / targetZoom;
  camera.viewWidth = viewWidth;
  camera.viewHeight = viewHeight;

  // Całkowity bezruch: stała, nieruchoma pozycja wycentrowana na arenie
  const stationaryX = config.centerX - viewWidth * 0.5;
  const stationaryY = config.centerY - viewHeight * 0.55;

  camera.x = stationaryX;
  camera.y = stationaryY;
  camera.targetX = stationaryX;
  camera.targetY = stationaryY;

  // Całkowite wyzerowanie wstrząsów kamery w menu showcase, aby UI nie drgało
  camera.shakeIntensity = 0;
  camera.shakeDecay = 0;
  camera.shakeX = 0;
  camera.shakeY = 0;
}

/**
 * Uruchamia Live Menu Showcase
 */
export function startMenuShowcase() {
  if (menuShowcaseState.active) return;

  if (typeof window !== 'undefined') {
    window.isMenuShowcase = true;
  }

  menuShowcaseState.active = true;
  menuShowcaseState.initialized = true;
  menuShowcaseState.totalTime = 0;
  menuShowcaseState.arenaTimer = 0;

  // Zapamiętaj ustawienia gracza bez ich nadpisywania w localStorage
  menuShowcaseState.savedSettings.botEnabled = (typeof isBotEnabled === 'function') ? isBotEnabled() : true;
  menuShowcaseState.savedSettings.botCount = (typeof getBotCount === 'function') ? getBotCount() : 1;

  // Włącz 6 botów na potrzeby showcase z flagą skipStorage
  setBotEnabled(true, { skipStorage: true });
  setBotCount(6, { skipStorage: true });

  // Wybierz losową arenę startową
  const randomIdx = Math.floor(Math.random() * SHOWCASE_ARENAS.length);
  const startArena = SHOWCASE_ARENAS[randomIdx];
  menuShowcaseState.currentArenaId = startArena;

  const config = SHOWCASE_ARENA_CONFIG[startArena];
  menuShowcaseState.badge.text = config.tag;
  menuShowcaseState.badge.timer = 0;

  // Załaduj mapę
  try {
    switchArena(startArena, null, getActiveBots(), ball);
    if (typeof setCameraArenaId === 'function') {
      setCameraArenaId(startArena);
    }
  } catch (_) {}

  if (deathmatchState) {
    deathmatchState.active = false;
    deathmatchState.matchPhase = 'ACTIVE';
  }

  deployShowcaseBots(startArena);
  runPreWarmSimulation(startArena, 45);

  // Skieruj kamerę w stałą nieruchomą pozycję areny
  updateStationaryCamera(startArena);
}

export function initMenuShowcase() {
  startMenuShowcase();
}

/**
 * Zatrzymuje Live Menu Showcase i przywraca stan gracza
 */
export function stopMenuShowcase() {
  if (!menuShowcaseState.active && !window?.isMenuShowcase) return;

  if (typeof window !== 'undefined') {
    window.isMenuShowcase = false;
  }

  menuShowcaseState.active = false;
  menuShowcaseState.initialized = false;
  menuShowcaseState.transition.phase = 'NONE';

  // Przywróć oryginalne ustawienia bota gracza
  try {
    setBotEnabled(menuShowcaseState.savedSettings.botEnabled, { skipStorage: true });
    setBotCount(menuShowcaseState.savedSettings.botCount, { skipStorage: true });
  } catch (_) {}

  // Wyczyść pociski ze zwiastuna
  if (Array.isArray(bullets)) bullets.length = 0;
  if (Array.isArray(activeProjectiles)) activeProjectiles.length = 0;
  if (camera) {
    camera._initialized = false;
  }
}

/**
 * Główna pętla aktualizacji Live Menu Showcase
 */
export function updateMenuShowcase(dt = 1 / 60) {
  if (!menuShowcaseState.active) {
    startMenuShowcase();
  }

  menuShowcaseState.totalTime += dt;
  menuShowcaseState.arenaTimer += dt;
  menuShowcaseState.badge.timer += dt;

  const currentArenaId = menuShowcaseState.currentArenaId || 'ARENA_1';
  const config = SHOWCASE_ARENA_CONFIG[currentArenaId] || SHOWCASE_ARENA_CONFIG.ARENA_1;
  const effectiveGroundY = config.deathY + 100;
  const activeBots = getActiveBots();

  // -------------------------------------------------------------------------
  // 1. ZARZĄDZANIE CYKLEM AREN I EFEKTEM PRZEJŚCIA (TACTICAL FEED CUT)
  // -------------------------------------------------------------------------
  if (menuShowcaseState.arenaTimer >= ARENA_CYCLE_DURATION && menuShowcaseState.transition.phase === 'NONE') {
    // Rozpoczęcie efektu przejścia (Faza OUT: 200ms)
    menuShowcaseState.transition.phase = 'OUT';
    menuShowcaseState.transition.timer = 0;
    menuShowcaseState.transition.hasSwapped = false;
    menuShowcaseState.transition.scanlines = generateGlitchScanlines();

    // Wybór następnej areny z listy (różnej od bieżącej)
    const available = SHOWCASE_ARENAS.filter(id => id !== currentArenaId);
    const nextArena = available[Math.floor(Math.random() * available.length)] || 'ARENA_2';
    menuShowcaseState.transition.nextArenaId = nextArena;
  }

  if (menuShowcaseState.transition.phase === 'OUT') {
    menuShowcaseState.transition.timer += dt;
    // W szczycie krycia (200ms) - ekran w pełni zasłonięty: następuje podmiana mapy i pre-warm
    if (menuShowcaseState.transition.timer >= TRANSITION_OUT_DURATION && !menuShowcaseState.transition.hasSwapped) {
      menuShowcaseState.transition.hasSwapped = true;
      const nextId = menuShowcaseState.transition.nextArenaId;
      menuShowcaseState.currentArenaId = nextId;

      try {
        switchArena(nextId, null, activeBots, ball);
        if (typeof setCameraArenaId === 'function') {
          setCameraArenaId(nextId);
        }
      } catch (_) {}

      if (deathmatchState) {
        deathmatchState.active = false;
        deathmatchState.matchPhase = 'ACTIVE';
      }

      deployShowcaseBots(nextId);
      runPreWarmSimulation(nextId, 45);
      updateStationaryCamera(nextId);

      const nextConfig = SHOWCASE_ARENA_CONFIG[nextId];
      menuShowcaseState.badge.text = nextConfig.tag;
      menuShowcaseState.badge.timer = 0;

      // Przejście do fazy IN (flash odsłaniający pole bitwy w trakcie wymiany ognia)
      menuShowcaseState.transition.phase = 'IN';
      menuShowcaseState.transition.timer = TRANSITION_OUT_DURATION;
    }
  } else if (menuShowcaseState.transition.phase === 'IN') {
    menuShowcaseState.transition.timer += dt;
    if (menuShowcaseState.transition.timer >= TRANSITION_TOTAL_DURATION) {
      menuShowcaseState.transition.phase = 'NONE';
      menuShowcaseState.transition.timer = 0;
      menuShowcaseState.arenaTimer = 0;
    }
  }

  // -------------------------------------------------------------------------
  // 2. AKTUALIZACJA BOTÓW (AGRESJA BOT VS BOT & SZYBKI RESPAWN)
  // -------------------------------------------------------------------------
  for (let i = 0; i < activeBots.length; i++) {
    const b = activeBots[i];
    if (!b || !b.active) continue;

    // Szybki respawn zabitego bota (50 klatek), aby arena nigdy nie pustoszała
    if (b.isDead || (b.acidDeath && b.acidDeath.dissolved)) {
      b.respawnTimer = (b.respawnTimer || 50) - 1;
      if (b.respawnTimer <= 0) {
        // Respawn na bezpiecznym punkcie platformy (bez ognia, przepaści, kwasu ani wody)
        const sps = config.spawns;
        const curArena = getActiveArena();
        const safeShowcaseSpawns = sps.filter(cand => evaluateSpawnSafety(cand, curArena, b, effectiveGroundY).safe);
        const pool = safeShowcaseSpawns.length > 0 ? safeShowcaseSpawns : findDynamicSafeSpawns(curArena, b, effectiveGroundY, sps);
        const spRaw = sps[i % sps.length];
        const sp = pool.length > 0 ? pool[i % pool.length] : spRaw;
        applyBotClassAndConfig(b, spRaw.classKey || sp.classKey, spRaw.team || sp.team);
        b.difficulty = 'hard';
        b.x = sp.x;
        b.y = sp.y;
        b.vx = 0;
        b.vy = 0;
        b.hp = 220;
        b.maxHp = 220;
        b.hasVest = true;
        b.vestHp = 100;
        b.vestMaxHp = 100;
        b.hasHelmet = true;
        b.helmetHits = 2;
        b.isDead = false;
        extinguishCombatant(b);
        b.isAcidDying = false;
        b.acidDeath = null;
        b.respawnTimer = 0;
        b.decisionTimer = 0;
        b.jetFuel = 100;
        if (b.ammo) {
          for (const wKey of Object.keys(b.ammo)) {
            if (b.ammo[wKey]) {
              b.ammo[wKey].currentAmmo = b.ammo[wKey].magSize || 30;
              b.ammo[wKey].reserveAmmo = 999;
              b.ammo[wKey].isReloading = false;
            }
          }
        }
      }
      continue;
    }

    if (b.acidDeath && b.acidDeath.active) {
      continue;
    }

    // Zabezpieczenie przed wypadnięciem pod mapę
    if (b.y > (config.safeFloorY + 110)) {
      b.botKeys.up = true;
      b.isJetpacking = true;
      b.vy = Math.min(b.vy, -8.0);
    }
    if (b.y > (config.deathY - 40)) {
      const sps = config.spawns;
      const curArena = getActiveArena();
      const safeShowcaseSpawns = sps.filter(cand => evaluateSpawnSafety(cand, curArena, b, effectiveGroundY).safe);
      const sp = safeShowcaseSpawns.length > 0 ? safeShowcaseSpawns[i % safeShowcaseSpawns.length] : sps[i % sps.length];
      extinguishCombatant(b);
      b.x = sp.x;
      b.y = sp.y;
      b.vx = 0;
      b.vy = -4.5;
      b.isJetpacking = true;
    }

    // Granice poziome
    if (b.x < config.minX) {
      b.x = config.minX;
      b.vx = Math.max(2.5, b.vx + 2.5);
      b.botKeys.left = false;
      b.botKeys.right = true;
    } else if (b.x > config.maxX) {
      b.x = config.maxX;
      b.vx = Math.min(-2.5, b.vx - 2.5);
      b.botKeys.right = false;
      b.botKeys.left = true;
    }

    // AI walki bot vs bot (humanPlayer = null, allCombatants = activeBots)
    updateBotBrain(config.hasBall ? ball : null, null, effectiveGroundY, null, b, activeBots);
    checkPlayerPlatformLanding(b, effectiveGroundY);
  }

  // -------------------------------------------------------------------------
  // 3. FIZYKA POCISKÓW, PIŁKI, CZĄSTECZEK I OŚWIETLENIA
  // -------------------------------------------------------------------------
  updateBullets(effectiveGroundY, ARENA_PLATFORMS, null, activeBots);
  updateProjectiles(effectiveGroundY, ARENA_PLATFORMS, customObstacles, activeBots, null);

  if (config.hasBall && ball && ball.active) {
    updateBall(effectiveGroundY);
  }

  updateParticles();
  updateJetpackParticles();
  updateGore(effectiveGroundY, ARENA_PLATFORMS, customObstacles);
  updateLighting(dt);

  // Aktualizacja mechanik mapy
  if (currentArenaId === 'ARENA_2') {
    try { updateArena2(dt, activeBots); } catch (_) {}
  } else if (currentArenaId === 'ARENA_3') {
    try { updateArena3(dt, activeBots, ball); } catch (_) {}
  } else {
    try {
      const curArena = getActiveArena();
      if (curArena && typeof curArena.update === 'function') {
        curArena.update(dt, activeBots, ball);
      }
    } catch (_) {}
  }

  // -------------------------------------------------------------------------
  // 4. STATYCZNA KAMERA W BEZRUCHU (STATIONARY CAMERA)
  // -------------------------------------------------------------------------
  updateStationaryCamera(currentArenaId);
}

/**
 * Renderuje Live Menu Showcase w przestrzeni Canvas
 */
export function drawMenuShowcase(ctx, camera) {
  if (!ctx || !camera) return;

  const canvasWidth = (typeof getCanvasLogicalWidth === 'function') ? getCanvasLogicalWidth() : ctx.canvas.width;
  const canvasHeight = (typeof getCanvasLogicalHeight === 'function') ? getCanvasLogicalHeight() : ctx.canvas.height;
  const currentArenaId = menuShowcaseState.currentArenaId || 'ARENA_1';
  const config = SHOWCASE_ARENA_CONFIG[currentArenaId] || SHOWCASE_ARENA_CONFIG.ARENA_1;
  const effectiveGroundY = config.deathY + 100;
  const activeBots = getActiveBots();

  // Żelazna gwarancja 60 FPS: zero shadowBlur
  ctx.shadowBlur = 0;

  // -------------------------------------------------------------------------
  // 1. TŁO I GEOMETRIA ARENY W PRZESTRZENI ŚWIATA
  // -------------------------------------------------------------------------
  renderArenaBackground(ctx, camera);

  ctx.save();
  ctx.shadowBlur = 0;
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  const worldLeft = camera.x;
  const worldRight = camera.x + (camera.viewWidth || (canvasWidth / camera.zoom));
  const worldWidth = worldRight - worldLeft;

  // Podłoże i platformy
  if (currentArenaId === 'ARENA_1') {
    drawGround(ctx, worldLeft, worldWidth);
  }
  drawObstacles(ctx, effectiveGroundY);
  renderArenaForeground(ctx, camera);

  // Cząsteczki, krew, smugi pocisków i rakiet
  drawParticles(ctx);
  drawBloodDecals(ctx);
  drawBullets(ctx);
  drawProjectiles(ctx);

  // Piłka (na Arenie 1)
  if (config.hasBall && ball && ball.active) {
    drawBall(ctx);
  }

  // Postacie botów bojowych (bez HUD-a, bez pasków zdrowia, bez celowników)
  for (let i = 0; i < activeBots.length; i++) {
    const b = activeBots[i];
    if (b && b.active && !b.isDead) {
      drawPlayer(ctx, effectiveGroundY, b);
    }
  }

  drawBurningEffects(ctx, activeBots, null);
  drawGore(ctx);
  drawJetpackParticles(ctx);
  drawShockwaves(ctx, camera);
  drawLighting(ctx, camera, currentArenaId);

  ctx.restore();

  // Winieta kinowa na krawędziach
  ctx.shadowBlur = 0;
  drawCinematicVignette(ctx);

  // -------------------------------------------------------------------------
  // 2. DYSKRETNY NAPIS W LEWYM DOLNYM ROGU (LIVE FEED INDICATOR)
  // -------------------------------------------------------------------------
  const badgeTimer = menuShowcaseState.badge.timer;
  if (badgeTimer < 3.8) {
    const fadeAlpha = (badgeTimer > 3.0) 
      ? Math.max(0.0, 1.0 - (badgeTimer - 3.0) / 0.8) 
      : Math.min(1.0, badgeTimer / 0.25);

    if (fadeAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = fadeAlpha;

      const badgeX = 24;
      const badgeY = canvasHeight - 34;
      const badgeH = 22;
      const isMobile = canvasWidth < 768;
      const fontSize = isMobile ? 9.5 : 11;
      const text = menuShowcaseState.badge.text || config.tag;

      ctx.font = `700 ${fontSize}px Orbitron, Rajdhani, monospace`;
      const textMetrics = ctx.measureText(text);
      const badgeW = textMetrics.width + 36;

      // Półprzezroczysty podkład
      ctx.fillStyle = 'rgba(6, 11, 20, 0.78)';
      ctx.fillRect(badgeX, badgeY, badgeW, badgeH);

      // Subtelny obrys
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

      // Migająca czerwona kropka REC/LIVE
      const dotBlink = Math.sin(menuShowcaseState.totalTime * 7) > 0;
      ctx.fillStyle = dotBlink ? '#ef4444' : '#7f1d1d';
      ctx.beginPath();
      ctx.arc(badgeX + 11, badgeY + badgeH * 0.5, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Tekst wskaźnika
      ctx.fillStyle = '#e0f2fe';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, badgeX + 22, badgeY + badgeH * 0.5 + 0.5);

      ctx.restore();
    }
  }

  // -------------------------------------------------------------------------
  // 3. EFEKT PRZEJŚCIA MIĘDZY ARENAMI (TACTICAL FEED CUT)
  // -------------------------------------------------------------------------
  const trans = menuShowcaseState.transition;
  if (trans.phase === 'OUT') {
    const p = Math.min(1.0, trans.timer / TRANSITION_OUT_DURATION);
    const darkAlpha = p * 0.98;

    ctx.save();
    // Ściemnienie ekranu
    ctx.fillStyle = `rgba(3, 7, 18, ${darkAlpha})`;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Poziome paski zakłóceń (glitch scanlines)
    for (const line of trans.scanlines) {
      const ly = line.yRel * canvasHeight;
      const lh = line.hRel * canvasHeight;
      const col = line.isCyan ? 'rgba(0, 229, 255,' : 'rgba(255, 255, 255,';
      ctx.fillStyle = `${col} ${line.alpha * p})`;
      ctx.fillRect(0, ly, canvasWidth, lh);
    }
    ctx.restore();

  } else if (trans.phase === 'IN') {
    const elapsed = trans.timer - TRANSITION_OUT_DURATION;
    const p = Math.min(1.0, Math.max(0.0, elapsed / TRANSITION_IN_DURATION));
    const flashAlpha = Math.pow(1.0 - p, 1.8);

    if (flashAlpha > 0.01) {
      ctx.save();
      // Cyjanowa poświata
      ctx.fillStyle = `rgba(0, 229, 255, ${flashAlpha * 0.38})`;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Jasny biały błysk wejścia
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.78})`;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.restore();
    }
  }
}
