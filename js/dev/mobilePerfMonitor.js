// =========================================================================
// DEV/MOBILEPERFMONITOR.JS - REJESTRATOR WYDAJNOŚCI MOBILNEJ (PERF BLACKBOX)
// Ultra-lekki monitor wydajności mobilnej (< 0.05ms na klatkę),
// profilowanie podziału klatki (update, bg, fg, players, fx, hud),
// detekcja opóźnień kompozytora/GPU (gpuGapMs) oraz rejestrator zacięć.
// =========================================================================

import { bullets, bulletParticles } from '../weapons/transform.js';
import { bulletHoles } from '../weapons/bulletRenderer.js';
import { bloodParticles, bloodDecals, headGibs, bodyGibs, droppedWeapons as droppedGoreWeapons } from '../world/gore.js';
import { rubbleParticles, explosionCraters } from '../projectiles.js';
import { pickupState } from '../pickup/state.js';
import { lightingState } from '../lighting/state.js';
import { bulletCasings } from '../particles.js';
import { hazardsState } from '../hazards/state.js';

const RING_BUFFER_SIZE = 120;
const MAX_RECORDED_SPIKES = 20;

export const perfState = {
  enabled: false,
  frameCount: 0,
  lastFrameTime: 0,
  lastDrawEndTime: 0,
  roundStartTime: 0,
  lastGameState: '',

  // Bufor pierścieniowy czasów klatek do kalkulacji FPS i 1% Low
  frameDeltas: new Float32Array(RING_BUFFER_SIZE),
  deltaIndex: 0,
  deltaCount: 0,

  // Bieżące statystyki klatki
  currentFps: 60,
  onePercentLowFps: 60,
  currentFrameDelta: 16.6,
  currentGpuGapMs: 0,
  currentExecTotalMs: 0,

  // Uśrednione wartości do wyświetlania w mini-HUD
  smoothedFps: 60,
  smoothedExecMs: 4.0,
  smoothedGpuWaitMs: 0,
  slowestPhasesText: 'FG 0.0ms | PLAYERS 0.0ms',

  // Sekcje i ich pomiary w bieżącej klatce
  sectionStarts: {
    update: 0,
    bg: 0,
    fg: 0,
    players: 0,
    fx: 0,
    hud: 0
  },
  currentTimings: {
    updateMs: 0,
    bgMs: 0,
    fgMs: 0,
    playersMs: 0,
    fxMs: 0,
    hudMs: 0
  },
  lastTimings: {
    updateMs: 0,
    bgMs: 0,
    fgMs: 0,
    playersMs: 0,
    fxMs: 0,
    hudMs: 0
  },

  // Czarna skrzynka zacięć (Lag Spike Recorder)
  spikes: [],
  lastSpikeTimeMs: 0,
  lastRecentSpike: null,

  // Referencje DOM
  copyBtnEl: null
};

/**
 * Sprawdza czy monitor jest włączony
 */
export function isPerfMonitorEnabled() {
  return perfState.enabled;
}

/**
 * Włącza lub wyłącza monitor wydajności
 */
export function setPerfMonitorEnabled(val) {
  const nextVal = Boolean(val);
  if (perfState.enabled === nextVal) return;
  perfState.enabled = nextVal;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem('mobile_perf_monitor', nextVal ? '1' : '0');
    } catch (_) {}
  }

  syncCopyButtonVisibility();

  if (typeof window !== 'undefined' && typeof window.syncDevPerfButtonUI === 'function') {
    window.syncDevPerfButtonUI();
  }
}

/**
 * Przełącza stan monitora
 */
export function togglePerfMonitor() {
  setPerfMonitorEnabled(!perfState.enabled);
}

/**
 * Resetuje czas startu rundy przy rozpoczęciu nowego meczu
 */
export function notifyRoundStart() {
  perfState.roundStartTime = performance.now();
  perfState.lastSpikeTimeMs = 0;
  perfState.lastRecentSpike = null;
}

/**
 * Inicjalizacja automatycznej aktywacji z URL (?perf=1 / ?debug=1) lub localStorage
 */
export function initMobilePerfMonitor() {
  if (typeof window === 'undefined') return;

  let shouldEnable = false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('perf') === '1' || params.get('debug') === '1' || params.get('aiTest') === '1') {
      shouldEnable = true;
    } else if (window.localStorage && window.localStorage.getItem('mobile_perf_monitor') === '1') {
      shouldEnable = true;
    }
  } catch (_) {}

  if (shouldEnable) {
    setPerfMonitorEnabled(true);
  }

  initMobilePerfCopyButton();
}

/**
 * Rozpoczęcie nowej klatki w pętli gry loop(now)
 */
export function beginFrame(now) {
  if (!perfState.enabled) return;

  const tNow = (typeof now === 'number' && now > 0) ? now : performance.now();
  perfState.frameCount++;

  if (perfState.lastFrameTime > 0) {
    const delta = tNow - perfState.lastFrameTime;
    perfState.currentFrameDelta = delta;

    if (delta > 0) {
      const rawFps = 1000 / delta;
      perfState.currentFps = rawFps;

      // Zapis do bufora pierścieniowego
      perfState.frameDeltas[perfState.deltaIndex] = delta;
      perfState.deltaIndex = (perfState.deltaIndex + 1) % RING_BUFFER_SIZE;
      if (perfState.deltaCount < RING_BUFFER_SIZE) {
        perfState.deltaCount++;
      }

      // 1% Low FPS obliczany co 15 klatek, aby nie sortować bufora w każdej klatce
      if (perfState.frameCount % 15 === 0 && perfState.deltaCount >= 10) {
        calculateOnePercentLow();
      }

      // Wygładzanie FPS do wskaźnika
      perfState.smoothedFps = perfState.smoothedFps * 0.9 + rawFps * 0.1;
    }

    // Obliczanie GPU Gap (czas pomiędzy zakończeniem draw a startem rAF - idealnie ok. 16.6ms przy 60Hz)
    if (perfState.lastDrawEndTime > 0) {
      const timeSinceLastDraw = tNow - perfState.lastDrawEndTime;
      // Jeśli czas od ostatniego draw przekracza standardowy interwał klatki, kompozytor/GPU dławił wątek
      perfState.currentGpuGapMs = Math.max(0, timeSinceLastDraw - 16.66);
      perfState.smoothedGpuWaitMs = perfState.smoothedGpuWaitMs * 0.85 + perfState.currentGpuGapMs * 0.15;
    }
  }

  perfState.lastFrameTime = tNow;

  // Zerowanie czasów bieżącej klatki
  perfState.currentTimings.updateMs = 0;
  perfState.currentTimings.bgMs = 0;
  perfState.currentTimings.fgMs = 0;
  perfState.currentTimings.playersMs = 0;
  perfState.currentTimings.fxMs = 0;
  perfState.currentTimings.fx_obstaclesMs = 0;
  perfState.currentTimings.fx_particlesMs = 0;
  perfState.currentTimings.fx_decalsMs = 0;
  perfState.currentTimings.fx_bulletsMs = 0;
  perfState.currentTimings.fx_projectilesMs = 0;
  perfState.currentTimings.fx_jetpackMs = 0;
  perfState.currentTimings.fx_goreMs = 0;
  perfState.currentTimings.fx_pickupsMs = 0;
  perfState.currentTimings.fx_zombiesMs = 0;
  perfState.currentTimings.fx_hazardsMs = 0;
  perfState.currentTimings.fx_miscMs = 0;
  perfState.currentTimings.fx_lightingMs = 0;
  perfState.currentTimings.fx_vignetteMs = 0;
  perfState.currentTimings.hudMs = 0;
}

/**
 * Rozpoczęcie pomiaru wybranego etapu
 */
export function beginSection(name) {
  if (!perfState.enabled) return;
  perfState.sectionStarts[name] = performance.now();
}

/**
 * Zakończenie pomiaru wybranego etapu
 */
export function endSection(name) {
  if (!perfState.enabled) return;
  const start = perfState.sectionStarts[name];
  if (start > 0) {
    const elapsed = performance.now() - start;
    const key = name.endsWith('Ms') ? name : `${name}Ms`;
    perfState.currentTimings[key] = (perfState.currentTimings[key] || 0) + elapsed;
    if (name.startsWith('fx_')) {
      perfState.currentTimings.fxMs = (perfState.currentTimings.fxMs || 0) + elapsed;
    }
    perfState.sectionStarts[name] = 0;
  }
}

/**
 * Zakończenie klatki po wykonaniu draw()
 */
export function endFrame() {
  if (!perfState.enabled) return;

  const now = performance.now();
  perfState.lastDrawEndTime = now;

  const t = perfState.currentTimings;
  const execTotal = t.updateMs + t.bgMs + t.fgMs + t.playersMs + t.fxMs + t.hudMs;
  perfState.currentExecTotalMs = execTotal;
  perfState.smoothedExecMs = perfState.smoothedExecMs * 0.85 + execTotal * 0.15;

  // Wyznaczenie 2 najwolniejszych etapów dla mini-HUD
  const phases = [
    { name: 'UPDATE', ms: t.updateMs },
    { name: 'BG', ms: t.bgMs },
    { name: 'FG', ms: t.fgMs },
    { name: 'PLAYERS', ms: t.playersMs },
    { name: 'FX', ms: t.fxMs },
    { name: 'HUD', ms: t.hudMs }
  ];
  phases.sort((a, b) => b.ms - a.ms);
  perfState.slowestPhasesText = `${phases[0].name} ${phases[0].ms.toFixed(1)}ms | ${phases[1].name} ${phases[1].ms.toFixed(1)}ms`;

  // Monitorowanie zmiany stanu rundy
  const currentGameState = (typeof window !== 'undefined' && window.GAME_STATE && window.GAME_STATE.current) || '';
  if (currentGameState === 'PLAYING' && perfState.lastGameState !== 'PLAYING') {
    perfState.roundStartTime = now;
  }
  perfState.lastGameState = currentGameState;

  // Detekcja zacięcia (Lag Spike Recorder)
  // Próg: delta > 26ms (< ~38.4 FPS), tryb PLAYING, min. 2s po starcie rundy
  const roundElapsedMs = (perfState.roundStartTime > 0) ? (now - perfState.roundStartTime) : 0;
  if (currentGameState === 'PLAYING' && roundElapsedMs >= 2000 && perfState.currentFrameDelta >= 26.0) {
    recordLagSpike(now);
  }

  // Zapisujemy lastTimings tylko gdy klatka wykonała rzeczywiste rysowanie/fizykę
  if (execTotal > 0) {
    Object.assign(perfState.lastTimings, t);
  }
}

/**
 * Rejestruje szczegółowy zrzut kontekstu zacięcia (Lag Spike)
 */
function recordLagSpike(now) {
  const delta = perfState.currentFrameDelta;
  const fps = perfState.currentFps;
  const execTotal = perfState.currentExecTotalMs;
  const gpuGap = perfState.currentGpuGapMs;
  const isStallFrame = (execTotal === 0);
  const timingSource = isStallFrame ? perfState.lastTimings : perfState.currentTimings;

  // Grupowanie / throttle: zapisujemy zdarzenie max raz na 500ms
  // Jeśli w oknie 500ms wystąpi gorszy lag, aktualizujemy ostatni wpis
  const timeSinceLastSpike = now - perfState.lastSpikeTimeMs;
  const isWithinWindow = timeSinceLastSpike < 500 && perfState.lastRecentSpike !== null;

  const curArenaId = (typeof window !== 'undefined' && (window.activeArenaId || (window.getActiveArena && window.getActiveArena()?.id))) || 'arena-3';
  const cam = (typeof window !== 'undefined' && window.camera) ? window.camera : { x: 0, y: 0, zoom: 1 };
  const p = (typeof window !== 'undefined' && window.player) ? window.player : { x: 0, y: 0, hp: 100 };

  // Liczniki aktywnych obiektów
  const bList = (typeof window !== 'undefined' && Array.isArray(window.bullets)) ? window.bullets : bullets;
  const bpList = (typeof window !== 'undefined' && Array.isArray(window.bulletParticles)) ? window.bulletParticles : bulletParticles;
  const bhList = (typeof window !== 'undefined' && Array.isArray(window.bulletHoles)) ? window.bulletHoles : bulletHoles;
  const bloodList = (typeof window !== 'undefined' && Array.isArray(window.bloodParticles)) ? window.bloodParticles : bloodParticles;
  const decalList = (typeof window !== 'undefined' && Array.isArray(window.bloodDecals)) ? window.bloodDecals : bloodDecals;
  const rubbleList = (typeof window !== 'undefined' && Array.isArray(window.rubbleParticles)) ? window.rubbleParticles : rubbleParticles;
  const craterList = (typeof window !== 'undefined' && Array.isArray(window.explosionCraters)) ? window.explosionCraters : explosionCraters;

  const stoneDebris = (typeof window !== 'undefined' && Array.isArray(window.STONE_DEBRIS)) ? window.STONE_DEBRIS.length : 0;
  const waterSplashes = (typeof window !== 'undefined' && Array.isArray(window.ARENA_3_WATER_SPLASHES)) ? window.ARENA_3_WATER_SPLASHES.length : 0;
  const splinters = (typeof window !== 'undefined' && Array.isArray(window.BRIDGE_SPLINTERS)) ? window.BRIDGE_SPLINTERS.length : 0;

  // Zliczanie botów widocznych w kadrze
  let botsInView = 0;
  const allBots = (typeof window !== 'undefined' && typeof window.getActiveBots === 'function')
    ? window.getActiveBots()
    : ((typeof window !== 'undefined' && Array.isArray(window.bots)) ? window.bots : []);

  const camL = cam.x - 40;
  const camR = cam.x + ((typeof window !== 'undefined' ? window.innerWidth : 1920) / (cam.zoom || 0.6)) + 40;
  const camT = cam.y - 40;
  const camB = cam.y + ((typeof window !== 'undefined' ? window.innerHeight : 1080) / (cam.zoom || 0.6)) + 40;

  for (const b of allBots) {
    if (b && !b.isDead && b.x >= camL && b.x <= camR && b.y >= camT && b.y <= camB) {
      botsInView++;
    }
  }

  // Stan mostu i pylonów na Arenie 3
  let bridgeStatus = 'N/A';
  if (curArenaId.includes('arena-3') || curArenaId.includes('ARENA_3')) {
    const pylons = (typeof window !== 'undefined' && window.ARENA_3_PYLONS) ? window.ARENA_3_PYLONS : null;
    const bridgeBlocks = (typeof window !== 'undefined' && Array.isArray(window.ARENA_3_BRIDGE_BLOCKS)) ? window.ARENA_3_BRIDGE_BLOCKS : [];
    const rampBlocks = (typeof window !== 'undefined' && Array.isArray(window.ARENA_3_RAMP_BLOCKS)) ? window.ARENA_3_RAMP_BLOCKS : [];

    const leftPylon = pylons?.left?.intact ? 'OK' : 'BROKEN';
    const rightPylon = pylons?.right?.intact ? 'OK' : 'BROKEN';
    const brokenBridge = bridgeBlocks.filter(b => b && !b.intact).length;
    const brokenRamp = rampBlocks.filter(b => b && !b.intact).length;

    bridgeStatus = `Pylony: L=${leftPylon}, R=${rightPylon} | Zniszczone belki: most=${brokenBridge}/${bridgeBlocks.length}, rampy=${brokenRamp}/${rampBlocks.length}`;
  }

  const spikeEntry = {
    timeSec: ((now - (perfState.roundStartTime || now)) / 1000).toFixed(1),
    arenaId: curArenaId,
    fps: Number(fps.toFixed(1)),
    frameDeltaMs: Number(delta.toFixed(1)),
    execTotalMs: Number(execTotal.toFixed(1)),
    gpuGapMs: Number(gpuGap.toFixed(1)),
    isStallFrame,
    cam: { x: Math.round(cam.x), y: Math.round(cam.y) },
    player: { x: Math.round(p.x), y: Math.round(p.y), hp: Math.round(p.hp || 0) },
    timings: {
      updateMs: Number(timingSource.updateMs.toFixed(1)),
      bgMs: Number(timingSource.bgMs.toFixed(1)),
      fgMs: Number(timingSource.fgMs.toFixed(1)),
      playersMs: Number(timingSource.playersMs.toFixed(1)),
      fxMs: Number(timingSource.fxMs.toFixed(1)),
      hudMs: Number(timingSource.hudMs.toFixed(1))
    },
    fxBreakdown: {
      obst: Number((timingSource.fx_obstaclesMs || 0).toFixed(1)),
      part: Number((timingSource.fx_particlesMs || 0).toFixed(1)),
      decal: Number((timingSource.fx_decalsMs || 0).toFixed(1)),
      bul: Number((timingSource.fx_bulletsMs || 0).toFixed(1)),
      proj: Number((timingSource.fx_projectilesMs || 0).toFixed(1)),
      jet: Number((timingSource.fx_jetpackMs || 0).toFixed(1)),
      gore: Number((timingSource.fx_goreMs || 0).toFixed(1)),
      pick: Number((timingSource.fx_pickupsMs || 0).toFixed(1)),
      haz: Number((timingSource.fx_hazardsMs || 0).toFixed(1)),
      zomb: Number((timingSource.fx_zombiesMs || 0).toFixed(1)),
      misc: Number((timingSource.fx_miscMs || 0).toFixed(1)),
      light: Number((timingSource.fx_lightingMs || 0).toFixed(1)),
      vig: Number((timingSource.fx_vignetteMs || 0).toFixed(1))
    },
    objects: {
      bullets: bList ? bList.length : 0,
      bulletParticles: bpList ? bpList.length : 0,
      bulletHoles: bhList ? bhList.length : 0,
      blood: bloodList ? bloodList.length : 0,
      bloodDecals: decalList ? decalList.length : 0,
      barrels: (hazardsState && Array.isArray(hazardsState.barrels)) ? hazardsState.barrels.length : 0,
      acidPools: (hazardsState && Array.isArray(hazardsState.acidPools)) ? hazardsState.acidPools.length : 0,
      rubble: rubbleList ? rubbleList.length : 0,
      craters: craterList ? craterList.length : 0,
      gibs: (headGibs ? headGibs.length : 0) + (bodyGibs ? bodyGibs.length : 0),
      droppedGore: droppedGoreWeapons ? droppedGoreWeapons.length : 0,
      droppedPickups: pickupState?.droppedWeapons ? pickupState.droppedWeapons.length : 0,
      lights: lightingState?.activeLights ? lightingState.activeLights.length : 0,
      casings: bulletCasings ? bulletCasings.length : 0,
      stoneDebris,
      waterSplashes,
      splinters,
      botsInView
    },
    bridgeStatus
  };

  if (isWithinWindow && perfState.lastRecentSpike) {
    // Nadpisz jeśli obecne zacięcie było dłuższe
    if (spikeEntry.frameDeltaMs > perfState.lastRecentSpike.frameDeltaMs) {
      Object.assign(perfState.lastRecentSpike, spikeEntry);
    }
  } else {
    perfState.spikes.push(spikeEntry);
    perfState.lastRecentSpike = spikeEntry;
    perfState.lastSpikeTimeMs = now;
    if (perfState.spikes.length > MAX_RECORDED_SPIKES) {
      // Zachowaj 20 najgorszych zacięć (usuń to z najmniejszą deltą)
      let minIdx = 0;
      let minDelta = perfState.spikes[0].frameDeltaMs;
      for (let i = 1; i < perfState.spikes.length; i++) {
        if (perfState.spikes[i].frameDeltaMs < minDelta) {
          minDelta = perfState.spikes[i].frameDeltaMs;
          minIdx = i;
        }
      }
      if (perfState.spikes[minIdx] === perfState.lastRecentSpike) {
        perfState.lastRecentSpike = null;
      }
      perfState.spikes.splice(minIdx, 1);
    }
  }
}

/**
 * Oblicza 1% Low FPS na podstawie 99. percentyla czasu trwania klatki
 */
function calculateOnePercentLow() {
  if (perfState.deltaCount < 5) return;
  const samples = Array.from(perfState.frameDeltas.subarray(0, perfState.deltaCount));
  samples.sort((a, b) => a - b);
  const p99Index = Math.min(samples.length - 1, Math.floor(samples.length * 0.99));
  const p99Delta = samples[p99Index];
  if (p99Delta > 0) {
    perfState.onePercentLowFps = Math.round(1000 / p99Delta);
  }
}

/**
 * Renderuje kompaktowy mini-HUD w lewym górnym rogu ekranu (poniżej paska HP)
 */
export function drawMobilePerfHUD(ctx) {
  if (!perfState.enabled || !ctx) return;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Bezwzględne współrzędne ekranu (niezależne od kamery)

  const hudX = 10;
  const hudY = 36; // Poniżej mobilnego paska HP/Armor (Y: 4..24)
  const hudW = 310;
  const hudH = 50;

  // Półprzezroczyste tło ze stonowanym obrysem
  ctx.fillStyle = 'rgba(10, 15, 26, 0.85)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 1.2;

  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 6);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(hudX, hudY, hudW, hudH);
    ctx.strokeRect(hudX, hudY, hudW, hudH);
  }

  // Kolor wskaźnika FPS
  const fps = Math.round(perfState.smoothedFps);
  const lowFps = perfState.onePercentLowFps;
  let fpsColor = '#4ade80'; // Zielony (>= 52 FPS)
  if (fps < 38) fpsColor = '#f87171'; // Czerwony (< 38 FPS)
  else if (fps < 52) fpsColor = '#facc15'; // Żółty (< 52 FPS)

  ctx.font = 'bold 11px monospace';
  ctx.textBaseline = 'top';

  // Linia 1: FPS, 1% Low, Czas JS, GPU Wait
  ctx.fillStyle = fpsColor;
  ctx.fillText(`FPS: ${fps} (1% LOW: ${lowFps})`, hudX + 8, hudY + 6);

  ctx.fillStyle = '#94a3b8';
  ctx.fillText(` | JS: ${perfState.smoothedExecMs.toFixed(1)}ms | GPU: ${perfState.smoothedGpuWaitMs.toFixed(1)}ms`, hudX + 138, hudY + 6);

  // Linia 2: Najwolniejsze etapy klatki
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`NAJWOLNIEJSZE: ${perfState.slowestPhasesText}`, hudX + 8, hudY + 20);

  // Linia 3: Licznik zarejestrowanych zacięć
  const spikeCount = perfState.spikes.length;
  ctx.fillStyle = (spikeCount === 0) ? '#4ade80' : ((spikeCount < 5) ? '#fbbf24' : '#f87171');
  ctx.fillText(`ZACIĘCIA (<38 FPS): ${spikeCount}`, hudX + 8, hudY + 34);

  ctx.restore();
}

/**
 * Inicjalizuje przycisk HTML do kopiowania raportu FPS
 */
export function initMobilePerfCopyButton() {
  if (typeof document === 'undefined') return;

  let btn = document.getElementById('perf-copy-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'perf-copy-btn';
    btn.type = 'button';
    btn.textContent = 'KOPIUJ LOG FPS';
    btn.title = 'Skopiuj pełny raport wydajności mobilnej i zacięć klatek do schowka';

    btn.style.cssText = [
      'position: fixed',
      'top: 6px',
      'left: 50%',
      'transform: translateX(-50%)',
      'z-index: 999999',
      'min-width: 140px',
      'min-height: 38px',
      'padding: 6px 14px',
      'background: rgba(15, 23, 42, 0.88)',
      'color: #38bdf8',
      'border: 1.8px solid #0284c7',
      'border-radius: 8px',
      'font-family: monospace',
      'font-size: 12px',
      'font-weight: 700',
      'letter-spacing: 0.5px',
      'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 10px rgba(56, 189, 248, 0.35)',
      'cursor: pointer',
      'user-select: none',
      'touch-action: manipulation',
      'display: none'
    ].join('; ');

    let lastCopyTriggerTime = 0;
    const handleCopy = (e) => {
      e.stopPropagation();
      e.preventDefault();
      const t = Date.now();
      if (t - lastCopyTriggerTime < 600) return;
      lastCopyTriggerTime = t;
      copyPerfReportToClipboard(btn);
    };

    btn.addEventListener('click', handleCopy);
    btn.addEventListener('touchend', handleCopy);

    document.body.appendChild(btn);
    perfState.copyBtnEl = btn;
  }

  syncCopyButtonVisibility();
}

/**
 * Synchronizuje widoczność przycisku kopiowania
 */
function syncCopyButtonVisibility() {
  const btn = perfState.copyBtnEl || (typeof document !== 'undefined' && document.getElementById('perf-copy-btn'));
  if (!btn) return;
  btn.style.display = perfState.enabled ? 'block' : 'none';
}

/**
 * Kopiuje wygenerowany raport tekstowy do schowka z uniwersalnym fallbackiem
 */
export function copyPerfReportToClipboard(btn) {
  const report = generatePerfReportText();

  const onSuccess = () => {
    if (btn) {
      const origText = 'KOPIUJ LOG FPS';
      btn.textContent = 'SKOPIOWANO!';
      btn.style.borderColor = '#22c55e';
      btn.style.color = '#4ade80';
      btn.style.boxShadow = '0 0 14px rgba(34, 197, 94, 0.6)';

      setTimeout(() => {
        if (btn) {
          btn.textContent = origText;
          btn.style.borderColor = '#0284c7';
          btn.style.color = '#38bdf8';
          btn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 10px rgba(56, 189, 248, 0.35)';
        }
      }, 2000);
    }
  };

  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    navigator.clipboard.writeText(report).then(onSuccess).catch(() => {
      fallbackCopyText(report);
      onSuccess();
    });
  } else {
    fallbackCopyText(report);
    onSuccess();
  }
}

/**
 * Niezawodny fallback kopiowania do schowka przez ukryte textarea (kluczowe na telefonie po Wi-Fi)
 */
function fallbackCopyText(text) {
  if (typeof document === 'undefined') return;
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '0';
    ta.style.opacity = '0';
    ta.setAttribute('readonly', '');
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, 999999);
    document.execCommand('copy');
    document.body.removeChild(ta);
  } catch (err) {
    console.warn('[MOBILE PERF] Fallback copy failed:', err);
  }
}

/**
 * Generuje pełny, czytelny raport tekstowy ze specyfikacją urządzenia i zacięciami
 */
export function generatePerfReportText() {
  const nowStr = new Date().toLocaleString('pl-PL');
  const ua = (typeof navigator !== 'undefined') ? navigator.userAgent : 'Brak danych';
  const dpr = (typeof window !== 'undefined') ? window.devicePixelRatio : 1;
  const screenW = (typeof window !== 'undefined') ? window.innerWidth : 0;
  const screenH = (typeof window !== 'undefined') ? window.innerHeight : 0;
  const canvasEl = (typeof document !== 'undefined') ? (document.getElementById('game') || document.getElementById('gameCanvas')) : null;
  const canvasW = (canvasEl && canvasEl.width) ? canvasEl.width : Math.round(screenW * dpr);
  const canvasH = (canvasEl && canvasEl.height) ? canvasEl.height : Math.round(screenH * dpr);
  const arena = (typeof window !== 'undefined' && (window.activeArenaId || (window.getActiveArena && window.getActiveArena()?.id))) || 'arena-3';

  const lines = [];
  lines.push(`========================================================================`);
  lines.push(`RAPORT WYDAJNOŚCI MOBILNEJ // KEEP-IT-HIGH (PERF BLACKBOX)`);
  lines.push(`========================================================================`);
  lines.push(`Data testu: ${nowStr}`);
  lines.push(`Urządzenie / Przeglądarka: ${ua}`);
  lines.push(`Ekran CSS: ${screenW} x ${screenH} px | DPR: ${dpr}`);
  lines.push(`Rozdzielczość Canvasu: ${canvasW} x ${canvasH} px`);
  lines.push(`Aktywna arena: ${arena}`);
  lines.push(`Przetworzonych klatek: ${perfState.frameCount}`);
  lines.push(`Bieżący uśredniony FPS: ${Math.round(perfState.smoothedFps)} | 1% Low: ${perfState.onePercentLowFps} FPS`);
  lines.push(`Średni czas wykonania JS: ${perfState.smoothedExecMs.toFixed(1)} ms`);
  lines.push(`Średni czas GPU Wait / VSync Stall: ${perfState.smoothedGpuWaitMs.toFixed(1)} ms`);
  lines.push(`Liczba zarejestrowanych zacięć (<38 FPS): ${perfState.spikes.length}`);
  lines.push(``);

  if (perfState.spikes.length === 0) {
    lines.push(`[STATUS]: BRAK ZAREJESTROWANYCH ZACIĘĆ. Rozgrywka działała płynnie powyżej 38 FPS.`);
  } else {
    lines.push(`------------------------------------------------------------------------`);
    lines.push(`ZAREJESTROWANE ZACIĘCIA KLATEK (DELTA >= 26 ms, SORTOWANE WG POWAGI):`);
    lines.push(`------------------------------------------------------------------------`);

    // Kopia posortowana wg najdłuższej delty (najgorsze zacięcia na górze)
    const sorted = [...perfState.spikes].sort((a, b) => b.frameDeltaMs - a.frameDeltaMs);

    sorted.forEach((sp, idx) => {
      lines.push(``);
      lines.push(`[#${idx + 1}] Czas: ${sp.timeSec}s rundy | Delta: ${sp.frameDeltaMs}ms (${sp.fps} FPS) | JS Exec: ${sp.execTotalMs}ms | GPU Wait: ${sp.gpuGapMs}ms`);
      lines.push(`     Współrzędne: Kamera (${sp.cam.x}, ${sp.cam.y}), Gracz (${sp.player.x}, ${sp.player.y}, HP: ${sp.player.hp})`);
      lines.push(`     Podział JS: update=${sp.timings.updateMs}ms, bg=${sp.timings.bgMs}ms, fg=${sp.timings.fgMs}ms, players=${sp.timings.playersMs}ms, fx=${sp.timings.fxMs}ms, hud=${sp.timings.hudMs}ms${sp.isStallFrame ? ' [STALL PRZED KLATKĄ / GPU WAIT]' : ''}`);
      if (sp.fxBreakdown) {
        lines.push(`     Podział FX: obst=${sp.fxBreakdown.obst}ms, part=${sp.fxBreakdown.part}ms, decal=${sp.fxBreakdown.decal}ms, bul=${sp.fxBreakdown.bul}ms, proj=${sp.fxBreakdown.proj}ms, jet=${sp.fxBreakdown.jet}ms, gore=${sp.fxBreakdown.gore}ms, pick=${sp.fxBreakdown.pick}ms, haz=${sp.fxBreakdown.haz}ms, zomb=${sp.fxBreakdown.zomb}ms, misc=${sp.fxBreakdown.misc}ms, light=${sp.fxBreakdown.light}ms, vig=${sp.fxBreakdown.vig}ms`);
      }
      lines.push(`     Obiekty: pociski=${sp.objects.bullets}, iskry=${sp.objects.bulletParticles}, dziury=${sp.objects.bulletHoles}, krew_cząstki=${sp.objects.blood}, plamy_krwi=${sp.objects.bloodDecals || 0}, beczki=${sp.objects.barrels || 0}, kałuże_kwasu=${sp.objects.acidPools || 0}, gruz=${sp.objects.rubble || 0}`);
      const extObj = [];
      if (sp.objects.gibs !== undefined) extObj.push(`gibs=${sp.objects.gibs}`);
      if (sp.objects.droppedGore !== undefined) extObj.push(`hełmy_złom=${sp.objects.droppedGore}`);
      if (sp.objects.droppedPickups !== undefined) extObj.push(`bronie_gleba=${sp.objects.droppedPickups}`);
      if (sp.objects.lights !== undefined) extObj.push(`światła=${sp.objects.lights}`);
      if (sp.objects.casings !== undefined) extObj.push(`łuski=${sp.objects.casings}`);
      if (extObj.length > 0) {
        lines.push(`              ${extObj.join(', ')}`);
      }
      lines.push(`              odłamki=${sp.objects.stoneDebris}, rozbryzgi_wody=${sp.objects.waterSplashes}, drzazgi=${sp.objects.splinters}, boty_w_kadrze=${sp.objects.botsInView}`);
      lines.push(`     Stan Areny: ${sp.bridgeStatus}`);
    });
  }

  lines.push(``);
  lines.push(`========================================================================`);
  lines.push(`KONIEC RAPORTU`);
  lines.push(`========================================================================`);

  return lines.join('\n');
}

// Udostępnienie obiektu na window do celów diagnostycznych
if (typeof window !== 'undefined') {
  window.mobilePerfMonitor = {
    isPerfMonitorEnabled,
    setPerfMonitorEnabled,
    togglePerfMonitor,
    getReportText: generatePerfReportText,
    getSpikes: () => [...perfState.spikes],
    getStats: () => ({
      fps: Math.round(perfState.smoothedFps),
      onePercentLow: perfState.onePercentLowFps,
      execMs: Number(perfState.smoothedExecMs.toFixed(1)),
      gpuWaitMs: Number(perfState.smoothedGpuWaitMs.toFixed(1)),
      spikeCount: perfState.spikes.length
    })
  };
}
