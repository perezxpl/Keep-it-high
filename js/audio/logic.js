// =============================================================================
// JS/AUDIO/LOGIC.JS - SILNIK AUDIO, MIKSER, PRZESTRZEN 2D I PETLE STANOW
// =============================================================================

import { AUDIO_CONFIG, SOUND_CATALOG, WEAPON_FIRE_SOUND_MAP, audioState } from './state.js';
import {
  loadAudioManifest,
  preloadConfiguredSamples,
  getReadySampleForSound,
  playDecodedSample
} from './samples.js';
import { playSynthSound, createSynthJetpackVoice } from './synth.js';

function applyGainLevels() {
  const ctx = audioState.ctx;
  if (!ctx) return;
  const now = ctx.currentTime;
  const headroom = AUDIO_CONFIG.MASTER_HEADROOM ?? 1.0;
  const masterVal = audioState.muted ? 0 : Math.max(0, Math.min(1.5, audioState.masterVolume * headroom));
  const sfxVal = Math.max(0, Math.min(1.5, audioState.sfxVolume));

  if (audioState.masterGain) {
    audioState.masterGain.gain.setValueAtTime(masterVal, now);
  }
  if (audioState.sfxGain) {
    audioState.sfxGain.gain.setValueAtTime(sfxVal, now);
  }
  if (audioState.uiGain) {
    audioState.uiGain.gain.setValueAtTime(sfxVal, now);
  }
}

export function ensureAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  if (!audioState.ctx) {
    try {
      const ctx = new AudioCtx();
      const masterGain = ctx.createGain();
      const compressor = ctx.createDynamicsCompressor();
      const sfxGain = ctx.createGain();
      const uiGain = ctx.createGain();

      compressor.threshold.setValueAtTime(-6, ctx.currentTime);
      compressor.knee.setValueAtTime(8, ctx.currentTime);
      compressor.ratio.setValueAtTime(3.5, ctx.currentTime);
      compressor.attack.setValueAtTime(0.002, ctx.currentTime);
      compressor.release.setValueAtTime(0.10, ctx.currentTime);

      sfxGain.connect(compressor);
      uiGain.connect(compressor);
      compressor.connect(masterGain);
      masterGain.connect(ctx.destination);

      audioState.ctx = ctx;
      audioState.masterGain = masterGain;
      audioState.compressor = compressor;
      audioState.sfxGain = sfxGain;
      audioState.uiGain = uiGain;

      applyGainLevels();

      if (!audioState.manifestLoaded && !audioState.manifestLoading) {
        loadAudioManifest();
      } else if (audioState.manifestLoaded) {
        preloadConfiguredSamples();
      }
    } catch (_) {
      return null;
    }
  }

  return audioState.ctx;
}

function unlockAudioFromGesture() {
  audioState.hasUserGesture = true;
  const ctx = ensureAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  if (!audioState.manifestLoaded && !audioState.manifestLoading) {
    loadAudioManifest();
  }
}

function bindUnlockListeners() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (audioState.unlockListenersBound) return;
  audioState.unlockListenersBound = true;

  const events = ['pointerdown', 'mousedown', 'keydown', 'touchstart'];
  for (const evt of events) {
    window.addEventListener(evt, unlockAudioFromGesture, { passive: true });
  }
}

export function initAudio() {
  audioState.initialized = true;
  bindUnlockListeners();
  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    loadAudioManifest();
  }
}

export function syncAudioSettings(settings) {
  if (!settings || typeof settings !== 'object') return;
  if (typeof settings.masterVolume === 'number') {
    audioState.masterVolume = Math.max(0, Math.min(1, settings.masterVolume / 100));
  }
  if (typeof settings.sfxVolume === 'number') {
    audioState.sfxVolume = Math.max(0, Math.min(1, settings.sfxVolume / 100));
  }
  if (typeof settings.muteAll === 'boolean') {
    audioState.muted = settings.muteAll;
  }
  if (typeof settings.acidSiren === 'boolean') {
    audioState.acidSirenEnabled = settings.acidSiren;
  }
  applyGainLevels();
}

export function stopAllJetpackVoices() {
  for (const [entity, entry] of audioState.jetpackVoices.entries()) {
    try {
      entry?.voice?.stop?.();
    } catch (_) {}
    audioState.jetpackVoices.delete(entity);
  }
}

export function setAudioGameState(newState) {
  const prevState = audioState.gameState;
  audioState.gameState = newState || 'MENU';
  if (prevState !== audioState.gameState && audioState.gameState !== 'PLAYING') {
    stopAllJetpackVoices();
  }
}

const BACKGROUND_SFX_IDS = new Set([
  'player_jump',
  'player_land',
  'weapon_reload_start',
  'weapon_reload_end',
  'weapon_pump',
  'weapon_dry_fire',
  'weapon_melee_swing',
  'grenade_throw',
  'hit_ricochet'
]);

function computeSpatialAttenuation(x, y, maxDistance, soundId = '') {
  if (typeof x !== 'number' || typeof y !== 'number' || Number.isNaN(x) || Number.isNaN(y)) {
    return { gainScale: 1.0, pan: 0, audible: true };
  }

  let listenerX = x;
  let listenerY = y;
  let halfViewW = 720;
  let isNearLocalPlayer = false;

  if (typeof window !== 'undefined') {
    const cam = window.camera;
    const localPlayer = window.player;
    if (localPlayer && typeof localPlayer.x === 'number') {
      const px = localPlayer.x + (localPlayer.w || 24) * 0.5;
      const py = localPlayer.y + (localPlayer.h || 70) * 0.5;
      if (Math.hypot(x - px, y - py) <= 95) {
        isNearLocalPlayer = true;
      }
    }
    if (cam && typeof cam.viewWidth === 'number' && typeof cam.x === 'number') {
      const zoom = cam.zoom || 1;
      const worldViewW = cam.viewWidth / zoom;
      const worldViewH = (cam.viewHeight || 720) / zoom;
      listenerX = cam.x + worldViewW * 0.5;
      listenerY = cam.y + worldViewH * 0.5;
      halfViewW = Math.max(380, worldViewW * 0.5);
    } else if (localPlayer && typeof localPlayer.x === 'number') {
      listenerX = localPlayer.x + (localPlayer.w || 24) * 0.5;
      listenerY = localPlayer.y + (localPlayer.h || 70) * 0.5;
    }
  }

  if (isNearLocalPlayer) {
    return { gainScale: 1.0, pan: 0, audible: true };
  }

  const dx = x - listenerX;
  const dy = y - listenerY;
  const dist = Math.hypot(dx, dy);
  const radius = maxDistance || AUDIO_CONFIG.DEFAULT_HEARING_RADIUS;

  if (dist >= radius) {
    return { gainScale: 0, pan: 0, audible: false };
  }

  const t = Math.max(0, 1 - dist / radius);
  let gainScale = Math.pow(t, 1.65);
  if (BACKGROUND_SFX_IDS.has(soundId)) {
    gainScale *= 0.55;
  }
  const pan = Math.max(-AUDIO_CONFIG.PAN_MAX, Math.min(AUDIO_CONFIG.PAN_MAX, dx / halfViewW));
  return { gainScale, pan, audible: true };
}

function getNowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

export function playSound(soundId, opts = {}) {
  const def = SOUND_CATALOG[soundId];
  if (!def) return false;

  if (audioState.muted) return false;
  if (!def.allowInAnyState && !opts.force && audioState.gameState !== 'PLAYING') {
    return false;
  }

  // Ochrona przed brakiem gestu (Autoplay Policy w Chrome/Opera GX)
  if (!audioState.hasUserGesture && !opts.force) {
    return false;
  }

  const ctx = ensureAudioContext();
  if (!ctx) return false;
  if (ctx.state === 'suspended') {
    if (audioState.hasUserGesture) {
      ctx.resume().catch(() => {});
    }
    if (ctx.state === 'suspended') return false;
  }

  const nowMs = getNowMs();
  const cooldownMs = opts.cooldownMs !== undefined ? opts.cooldownMs : (def.cooldownMs || 0);
  if (cooldownMs > 0) {
    const lastMs = audioState.lastPlayedAt.get(soundId) || 0;
    if (nowMs - lastMs < cooldownMs) return false;
  }

  if (audioState.activeVoiceCount >= AUDIO_CONFIG.MAX_ACTIVE_VOICES) {
    return false;
  }

  let spatialGain = 1.0;
  let pan = typeof opts.pan === 'number' ? opts.pan : 0;
  if (def.spatial && opts.spatial !== false) {
    const spatial = computeSpatialAttenuation(opts.x, opts.y, opts.maxDistance || def.maxDistance, soundId);
    if (!spatial.audible) return false;
    spatialGain = spatial.gainScale;
    if (typeof opts.pan !== 'number') {
      pan = spatial.pan;
    }
  }

  const gainScale = typeof opts.gainScale === 'number' ? opts.gainScale : 1.0;
  const finalGain = Math.max(0.001, Math.min(1.4, def.volume * spatialGain * gainScale));
  if (finalGain < 0.008) return false;

  const destNode = (def.bus === 'ui') ? audioState.uiGain : audioState.sfxGain;
  if (!destNode) return false;

  const jitter = (typeof opts.pitchJitter === 'number') ? opts.pitchJitter : (def.pitchJitter || 0);
  const randPitch = jitter > 0 ? (1 + (Math.random() * 2 - 1) * jitter) : 1.0;
  const pitch = (typeof opts.pitch === 'number' ? opts.pitch : 1.0) * randPitch;

  // 1. Najpierw sprawdzamy czy skonfigurowano zewnetrzny plik w manifest.json / runtimeOverride
  const customSample = getReadySampleForSound(soundId);
  if (customSample) {
    const played = playDecodedSample({
      buffer: customSample.buffer,
      entry: customSample.entry,
      ctx,
      destNode,
      gainValue: finalGain,
      pitchJitter: jitter,
      pitchMultiplier: typeof opts.pitch === 'number' ? opts.pitch : 1.0,
      pan,
      loop: false
    });
    if (played) {
      audioState.lastPlayedAt.set(soundId, nowMs);
      return true;
    }
  }

  // 2. Jesli brak zewnetrznego pliku (lub jeszcze sie laduje) -> brak syntezy w rozgrywce (tylko opcjonalny fallback UI)
  const allowSynth = (def.bus === 'ui')
    ? AUDIO_CONFIG.ENABLE_UI_SYNTH_FALLBACK
    : AUDIO_CONFIG.ENABLE_GAMEPLAY_SYNTH;
  if (!allowSynth) {
    return false;
  }

  const synthOk = playSynthSound(soundId, ctx, destNode, {
    gain: finalGain,
    pitch,
    pan,
    power: opts.power,
    impactVy: opts.impactVy,
    isSprintJump: opts.isSprintJump
  });
  if (synthOk) {
    audioState.lastPlayedAt.set(soundId, nowMs);
  }
  return synthOk;
}

export function playWeaponFireSound(weaponId, x, y, opts = {}) {
  const soundId = WEAPON_FIRE_SOUND_MAP[weaponId];
  if (!soundId) return false;
  return playSound(soundId, { ...opts, x, y });
}

export function testSound(soundId, opts = {}) {
  audioState.hasUserGesture = true;
  return playSound(soundId, { ...opts, force: true, cooldownMs: 0, spatial: false });
}

// =============================================================================
// INTERFEJS ZGODNY Z ISTNIEJACYMI FUNKCJAMI W UIMANAGER I ARENA 2
// =============================================================================

export function playUiClick() {
  audioState.hasUserGesture = true;
  playSound('ui_click', { force: true });
}

export function playUiHover() {
  if (!audioState.hasUserGesture) return;
  playSound('ui_hover', { force: true });
}

export function playUiPause() {
  audioState.hasUserGesture = true;
  playSound('ui_pause', { force: true });
}

export function playUiResume() {
  audioState.hasUserGesture = true;
  playSound('ui_resume', { force: true });
}

export function playTestTone() {
  audioState.hasUserGesture = true;
  playSound('ui_test_tone', { force: true, cooldownMs: 50 });
}

export function playAcidSurgeSiren() {
  if (!audioState.acidSirenEnabled) return false;
  return playSound('acid_siren');
}

// =============================================================================
// AKTUALIZACJA KLATKOWA: CIAGLY JETPACK ORAZ LADOWANIE I ZGONY POSTACI
// =============================================================================

function createJetpackVoice(ctx, destNode, pan, initialGain) {
  const customSample = getReadySampleForSound('jetpack_loop');
  if (customSample) {
    const sampleVoice = playDecodedSample({
      buffer: customSample.buffer,
      entry: customSample.entry,
      ctx,
      destNode,
      gainValue: Math.max(0.0001, initialGain),
      pitchJitter: 0,
      pitchMultiplier: 1.0,
      pan,
      loop: true
    });
    if (sampleVoice) {
      return {
        type: 'sample',
        gainNode: sampleVoice.gainNode,
        panner: sampleVoice.panner,
        entryVolume: customSample.entry?.volume ?? 1.0,
        stop: () => {
          try { sampleVoice.source.stop(); } catch (_) {}
          try { sampleVoice.source.disconnect(); } catch (_) {}
          try { sampleVoice.gainNode.disconnect(); } catch (_) {}
          if (sampleVoice.panner) {
            try { sampleVoice.panner.disconnect(); } catch (_) {}
          }
        }
      };
    }
  }
  if (!AUDIO_CONFIG.ENABLE_GAMEPLAY_SYNTH) {
    return null;
  }
  return createSynthJetpackVoice(ctx, destNode);
}

function updateEntityJetpack(entity, isPlaying, dt) {
  const shouldPlay = isPlaying
    && !audioState.muted
    && !entity.isDead
    && !!entity.isJetpacking
    && audioState.hasUserGesture;

  let record = audioState.jetpackVoices.get(entity);

  if (!shouldPlay) {
    if (!record) return;
    record.releaseTimer += dt;
    const ctx = audioState.ctx;
    if (ctx && record.voice?.gainNode) {
      record.voice.gainNode.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.02);
    }
    if (record.releaseTimer >= 0.09) {
      try { record.voice.stop(); } catch (_) {}
      audioState.jetpackVoices.delete(entity);
    }
    return;
  }

  const ctx = ensureAudioContext();
  if (!ctx || ctx.state !== 'running' || !audioState.sfxGain) return;

  const def = SOUND_CATALOG.jetpack_loop;
  const ex = entity.x + (entity.w || 24) * 0.5;
  const ey = entity.y + (entity.h || 70) * 0.5;
  const spatial = computeSpatialAttenuation(ex, ey, def.maxDistance);

  if (!spatial.audible) {
    if (record) {
      record.releaseTimer += dt;
      record.voice.gainNode.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.02);
      if (record.releaseTimer >= 0.09) {
        try { record.voice.stop(); } catch (_) {}
        audioState.jetpackVoices.delete(entity);
      }
    }
    return;
  }

  const power = Math.max(0.25, Math.min(1.4, entity.jetpackPower ?? 1.0));
  const isLocalEntity = (typeof window !== 'undefined' && window.player && entity === window.player);
  const entityWeight = isLocalEntity ? 1.0 : 0.45;
  const targetGain = def.volume * spatial.gainScale * entityWeight * (0.55 + 0.55 * power);

  if (!record) {
    const voice = createJetpackVoice(ctx, audioState.sfxGain, spatial.pan, 0.0001);
    if (!voice) return;
    record = { voice, releaseTimer: 0 };
    audioState.jetpackVoices.set(entity, record);
  }

  record.releaseTimer = 0;
  const now = ctx.currentTime;
  const v = record.voice;
  const effectiveGain = v.type === 'sample' ? (targetGain * (v.entryVolume || 1.0)) : targetGain;
  v.gainNode.gain.setTargetAtTime(Math.max(0.0001, effectiveGain), now, 0.03);

  if (v.panner) {
    v.panner.pan.setTargetAtTime(spatial.pan, now, 0.03);
  }
  if (v.type === 'synth') {
    if (v.filter) {
      v.filter.frequency.setTargetAtTime(380 + power * 420, now, 0.04);
    }
    if (v.humOsc) {
      v.humOsc.frequency.setTargetAtTime(72 + power * 36, now, 0.04);
    }
  }
}

function updateEntityTrackers(entity, isPlaying) {
  let tracker = audioState.entityTrackers.get(entity);
  const onGround = !!entity.onGround;
  const isDead = !!entity.isDead;

  if (!tracker) {
    audioState.entityTrackers.set(entity, {
      wasOnGround: onGround,
      airborneFrames: 0,
      maxFallVy: 0,
      wasDead: isDead
    });
    return;
  }

  if (!isPlaying) {
    tracker.wasOnGround = onGround;
    tracker.airborneFrames = 0;
    tracker.maxFallVy = 0;
    tracker.wasDead = isDead;
    return;
  }

  // 1. Zgon postaci (jednorazowo na krawedzi przejscia zywy -> martwy)
  if (isDead && !tracker.wasDead) {
    const ex = entity.x + (entity.w || 24) * 0.5;
    const ey = entity.y + (entity.h || 70) * 0.35;
    playSound('player_death', { x: ex, y: ey });
  }
  tracker.wasDead = isDead;

  if (isDead) {
    tracker.wasOnGround = onGround;
    tracker.airborneFrames = 0;
    tracker.maxFallVy = 0;
    return;
  }

  // 2. Ladowanie na podlozu lub platformie (bez duplikowania Ground Slam Enforcera)
  if (!onGround) {
    tracker.airborneFrames++;
    const vy = entity.vy || 0;
    if (vy > tracker.maxFallVy) {
      tracker.maxFallVy = vy;
    }
  } else {
    if (!tracker.wasOnGround && tracker.airborneFrames >= 4 && tracker.maxFallVy > 3.2 && !entity.isGroundSlamming) {
      const ex = entity.x + (entity.w || 24) * 0.5;
      const ey = entity.y + (entity.h || 70);
      const scale = Math.min(1.35, Math.max(0.55, tracker.maxFallVy / 10));
      playSound('player_land', { x: ex, y: ey, impactVy: tracker.maxFallVy, gainScale: scale });
    }
    tracker.airborneFrames = 0;
    tracker.maxFallVy = 0;
  }

  tracker.wasOnGround = onGround;
}

export function updateAudio(dt = 1 / 60, context = {}) {
  const isPlaying = (context.gameState ? context.gameState : audioState.gameState) === 'PLAYING';
  const activeEntities = new Set();

  if (context.player) activeEntities.add(context.player);
  if (Array.isArray(context.bots)) {
    for (const bot of context.bots) {
      if (bot) activeEntities.add(bot);
    }
  }
  if (Array.isArray(context.remotePlayers)) {
    for (const rp of context.remotePlayers) {
      if (rp) activeEntities.add(rp);
    }
  }

  for (const entity of activeEntities) {
    updateEntityTrackers(entity, isPlaying);
    updateEntityJetpack(entity, isPlaying, dt);
  }

  // Sprzatanie glosow jetpacka dla postaci usunietych z areny
  for (const [entity, record] of audioState.jetpackVoices.entries()) {
    if (!activeEntities.has(entity)) {
      try { record?.voice?.stop?.(); } catch (_) {}
      audioState.jetpackVoices.delete(entity);
    }
  }
}
