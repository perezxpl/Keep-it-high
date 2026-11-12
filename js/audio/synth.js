// =============================================================================
// JS/AUDIO/SYNTH.JS - PROCEDURALNY SYNTEZATOR WEB AUDIO API (ETAP 1)
// Wielowarstwowa synteza broni, wybuchow, trafien, klas, pilki i UI
// =============================================================================

import { audioState } from './state.js';

function getNoiseBuffer(ctx) {
  if (audioState.noiseBuffer && audioState.noiseBuffer.sampleRate === ctx.sampleRate) {
    return audioState.noiseBuffer;
  }
  const length = Math.floor(ctx.sampleRate * 1.5);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Lekko ocieplony szum (mieszanka bialego i rozowego dla naturalniejszego uderzenia)
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.997 * b0 + white * 0.029;
    b1 = 0.985 * b1 + white * 0.032;
    b2 = 0.950 * b2 + white * 0.048;
    const pink = (b0 + b1 + b2 + white * 0.18) * 1.35;
    data[i] = Math.max(-1, Math.min(1, white * 0.62 + pink * 0.38));
  }
  audioState.noiseBuffer = buffer;
  return buffer;
}

function createVoiceStage(ctx, destNode, pan = 0, duration = 0.5) {
  const now = ctx.currentTime;
  const stageGain = ctx.createGain();
  let outputNode = stageGain;

  if (typeof ctx.createStereoPanner === 'function' && Math.abs(pan) > 0.02) {
    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);
    stageGain.connect(panner);
    outputNode = panner;
  }

  outputNode.connect(destNode);
  audioState.activeVoiceCount++;

  // Bezpieczne odlaczenie i zwolnienie licznika glosow po zakonczeniu czasu brzmienia
  const trackerOsc = ctx.createConstantSource ? null : ctx.createOscillator();
  const cleanupMs = Math.max(40, Math.round(duration * 1000) + 60);
  if (typeof setTimeout === 'function') {
    setTimeout(() => {
      audioState.activeVoiceCount = Math.max(0, audioState.activeVoiceCount - 1);
      try { stageGain.disconnect(); } catch (_) {}
      if (outputNode !== stageGain) {
        try { outputNode.disconnect(); } catch (_) {}
      }
    }, cleanupMs);
  } else if (trackerOsc) {
    trackerOsc.onended = () => {
      audioState.activeVoiceCount = Math.max(0, audioState.activeVoiceCount - 1);
    };
  }

  return { now, out: stageGain };
}

function scheduleTone(ctx, out, {
  type = 'sine',
  startTime = ctx.currentTime,
  duration = 0.1,
  freqStart = 200,
  freqEnd = 60,
  gain = 0.3,
  attack = 0.003,
  expFreq = true,
  filterType = null,
  filterFreq = 1200,
  filterQ = 1.0
}) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;

  const f0 = Math.max(20, freqStart);
  const f1 = Math.max(20, freqEnd);
  osc.frequency.setValueAtTime(f0, startTime);
  if (f1 !== f0) {
    if (expFreq) {
      osc.frequency.exponentialRampToValueAtTime(f1, startTime + duration);
    } else {
      osc.frequency.linearRampToValueAtTime(f1, startTime + duration);
    }
  }

  g.gain.setValueAtTime(0.0001, startTime);
  g.gain.linearRampToValueAtTime(Math.max(0.0001, gain), startTime + Math.min(attack, duration * 0.4));
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  if (filterType) {
    const flt = ctx.createBiquadFilter();
    flt.type = filterType;
    flt.frequency.setValueAtTime(filterFreq, startTime);
    flt.Q.setValueAtTime(filterQ, startTime);
    osc.connect(flt);
    flt.connect(g);
  } else {
    osc.connect(g);
  }

  g.connect(out);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
  return osc;
}

function scheduleNoise(ctx, out, {
  startTime = ctx.currentTime,
  duration = 0.15,
  gain = 0.35,
  attack = 0.002,
  filterType = 'bandpass',
  freqStart = 1400,
  freqEnd = 450,
  Q = 1.0,
  offset = Math.random() * 0.6
}) {
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);
  const flt = ctx.createBiquadFilter();
  flt.type = filterType;
  flt.Q.setValueAtTime(Q, startTime);

  const f0 = Math.max(40, freqStart);
  const f1 = Math.max(40, freqEnd);
  flt.frequency.setValueAtTime(f0, startTime);
  if (f1 !== f0) {
    flt.frequency.exponentialRampToValueAtTime(f1, startTime + duration);
  }

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, startTime);
  g.gain.linearRampToValueAtTime(Math.max(0.0001, gain), startTime + Math.min(attack, duration * 0.35));
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  src.connect(flt);
  flt.connect(g);
  g.connect(out);
  src.start(startTime, offset % 0.85, duration + 0.02);
  src.stop(startTime + duration + 0.02);
  return src;
}

/**
 * Odtwarza wybrany efekt dzwiekowy za pomoca procedury Web Audio API.
 */
export function playSynthSound(soundId, ctx, destNode, { gain = 0.5, pitch = 1.0, pan = 0, power = 1.0, impactVy = 6.0, isSprintJump = false } = {}) {
  if (!ctx || !destNode) return false;
  const p = Math.max(0.5, Math.min(1.8, pitch));

  switch (soundId) {
    // =========================================================================
    // BRONIE PALNE I RAKIETY
    // =========================================================================
    case 'weapon_ak47': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.22);
      scheduleTone(ctx, out, { startTime: now, type: 'triangle', freqStart: 205 * p, freqEnd: 52 * p, duration: 0.09, gain: gain * 0.95 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.15, gain: gain * 1.15, filterType: 'bandpass', freqStart: 1350 * p, freqEnd: 380 * p, Q: 0.85 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.035, gain: gain * 0.85, filterType: 'highpass', freqStart: 2400 * p, freqEnd: 1600 * p, Q: 0.7 });
      scheduleTone(ctx, out, { startTime: now + 0.025, type: 'square', freqStart: 1280 * p, freqEnd: 720 * p, duration: 0.028, gain: gain * 0.16, filterType: 'bandpass', filterFreq: 1600 });
      return true;
    }

    case 'weapon_shotgun': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.34);
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 155 * p, freqEnd: 34 * p, duration: 0.16, gain: gain * 1.2 });
      scheduleTone(ctx, out, { startTime: now, type: 'sawtooth', freqStart: 110 * p, freqEnd: 40 * p, duration: 0.11, gain: gain * 0.55, filterType: 'lowpass', filterFreq: 650 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.24, gain: gain * 1.3, filterType: 'lowpass', freqStart: 3200 * p, freqEnd: 340 * p, Q: 0.7 });
      scheduleNoise(ctx, out, { startTime: now + 0.04, duration: 0.24, gain: gain * 0.42, filterType: 'bandpass', freqStart: 700, freqEnd: 260, Q: 0.8 });
      return true;
    }

    case 'weapon_sawed_off': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.30);
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 145 * p, freqEnd: 32 * p, duration: 0.17, gain: gain * 1.25 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.26, gain: gain * 1.35, filterType: 'lowpass', freqStart: 3800 * p, freqEnd: 290 * p, Q: 0.65 });
      return true;
    }

    case 'weapon_sniper': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.52);
      // Ciezki grzmot Barrett .50 + naddzwiekowy trzask + echo doliny
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 140 * p, freqEnd: 28 * p, duration: 0.22, gain: gain * 1.3 });
      scheduleTone(ctx, out, { startTime: now, type: 'sawtooth', freqStart: 195 * p, freqEnd: 46 * p, duration: 0.14, gain: gain * 0.6, filterType: 'lowpass', filterFreq: 900 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.055, gain: gain * 1.25, filterType: 'highpass', freqStart: 2800 * p, freqEnd: 1100 * p, Q: 0.6 });
      scheduleNoise(ctx, out, { startTime: now + 0.02, duration: 0.46, gain: gain * 0.9, filterType: 'lowpass', freqStart: 1900 * p, freqEnd: 220, Q: 0.75 });
      return true;
    }

    case 'weapon_glock': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.15);
      scheduleTone(ctx, out, { startTime: now, type: 'triangle', freqStart: 255 * p, freqEnd: 74 * p, duration: 0.065, gain: gain * 0.95 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.095, gain: gain * 1.05, filterType: 'bandpass', freqStart: 1900 * p, freqEnd: 520 * p, Q: 0.95 });
      return true;
    }

    case 'weapon_revolver': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.28);
      scheduleTone(ctx, out, { startTime: now, type: 'triangle', freqStart: 215 * p, freqEnd: 48 * p, duration: 0.12, gain: gain * 1.15 });
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 1580 * p, freqEnd: 940 * p, duration: 0.09, gain: gain * 0.28 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.20, gain: gain * 1.2, filterType: 'bandpass', freqStart: 2300 * p, freqEnd: 420 * p, Q: 0.8 });
      return true;
    }

    case 'weapon_rpg7': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.48);
      // Hollow tube launch "thoomp" + sustainer whoosh
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 115 * p, freqEnd: 44 * p, duration: 0.22, gain: gain * 1.1 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.42, gain: gain * 1.15, filterType: 'bandpass', freqStart: 950 * p, freqEnd: 240, Q: 1.2, attack: 0.015 });
      scheduleNoise(ctx, out, { startTime: now + 0.04, duration: 0.38, gain: gain * 0.65, filterType: 'highpass', freqStart: 1800, freqEnd: 700, Q: 0.7 });
      return true;
    }

    case 'weapon_pump': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.18);
      // Dwa szybkie klikniecia czolenka "chk-chk"
      scheduleNoise(ctx, out, { startTime: now, duration: 0.045, gain: gain * 0.8, filterType: 'bandpass', freqStart: 2200 * p, freqEnd: 1400 * p, Q: 2.2 });
      scheduleTone(ctx, out, { startTime: now, type: 'square', freqStart: 880 * p, freqEnd: 520 * p, duration: 0.025, gain: gain * 0.22, filterType: 'bandpass', filterFreq: 1300 });
      scheduleNoise(ctx, out, { startTime: now + 0.075, duration: 0.05, gain: gain * 0.9, filterType: 'bandpass', freqStart: 2550 * p, freqEnd: 1600 * p, Q: 2.4 });
      scheduleTone(ctx, out, { startTime: now + 0.075, type: 'square', freqStart: 1040 * p, freqEnd: 620 * p, duration: 0.028, gain: gain * 0.25, filterType: 'bandpass', filterFreq: 1600 });
      return true;
    }

    case 'weapon_melee_swing': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.16);
      scheduleNoise(ctx, out, { startTime: now, duration: 0.13, gain: gain * 0.95, attack: 0.02, filterType: 'bandpass', freqStart: 520 * p, freqEnd: 1850 * p, Q: 1.8 });
      return true;
    }

    case 'weapon_melee_hit': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.16);
      scheduleTone(ctx, out, { startTime: now, type: 'triangle', freqStart: 195 * p, freqEnd: 55 * p, duration: 0.09, gain: gain * 0.95 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.09, gain: gain * 1.0, filterType: 'bandpass', freqStart: 2600 * p, freqEnd: 750 * p, Q: 1.1 });
      return true;
    }

    case 'weapon_dry_fire': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.06);
      scheduleTone(ctx, out, { startTime: now, type: 'square', freqStart: 2450 * p, freqEnd: 1200 * p, duration: 0.022, gain: gain * 0.45, filterType: 'highpass', filterFreq: 1400 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.02, gain: gain * 0.45, filterType: 'highpass', freqStart: 3000, freqEnd: 2200 });
      return true;
    }

    case 'weapon_reload_start': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.14);
      scheduleNoise(ctx, out, { startTime: now, duration: 0.055, gain: gain * 0.7, filterType: 'bandpass', freqStart: 1700 * p, freqEnd: 900 * p, Q: 2.5 });
      scheduleTone(ctx, out, { startTime: now + 0.02, type: 'triangle', freqStart: 420 * p, freqEnd: 210 * p, duration: 0.045, gain: gain * 0.35 });
      return true;
    }

    case 'weapon_reload_end': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.16);
      scheduleTone(ctx, out, { startTime: now, type: 'square', freqStart: 920 * p, freqEnd: 1380 * p, duration: 0.035, gain: gain * 0.32, filterType: 'bandpass', filterFreq: 1600 });
      scheduleNoise(ctx, out, { startTime: now + 0.04, duration: 0.06, gain: gain * 0.85, filterType: 'bandpass', freqStart: 2400 * p, freqEnd: 1300 * p, Q: 2.0 });
      return true;
    }

    // =========================================================================
    // GRANATY I EKSPLOZJE
    // =========================================================================
    case 'grenade_throw': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.16);
      scheduleNoise(ctx, out, { startTime: now, duration: 0.12, gain: gain * 0.85, attack: 0.015, filterType: 'bandpass', freqStart: 480 * p, freqEnd: 1350 * p, Q: 1.5 });
      return true;
    }

    case 'grenade_bounce': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.10);
      scheduleTone(ctx, out, { startTime: now, type: 'triangle', freqStart: 1120 * p, freqEnd: 620 * p, duration: 0.05, gain: gain * 0.6 });
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 2180 * p, freqEnd: 1700 * p, duration: 0.045, gain: gain * 0.25 });
      return true;
    }

    case 'explosion_grenade':
    case 'explosion_rpg':
    case 'explosion_heavy':
    case 'explosion_toxic': {
      const isBig = (soundId === 'explosion_rpg' || soundId === 'explosion_heavy');
      const isToxic = (soundId === 'explosion_toxic');
      const dur = isBig ? 0.78 : 0.62;
      const { now, out } = createVoiceStage(ctx, destNode, pan, dur);
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: (isBig ? 105 : 120) * p, freqEnd: 22, duration: isBig ? 0.42 : 0.32, gain: gain * 1.25 });
      scheduleTone(ctx, out, { startTime: now, type: 'sawtooth', freqStart: 95 * p, freqEnd: 26, duration: 0.24, gain: gain * 0.5, filterType: 'lowpass', filterFreq: 380 });
      scheduleNoise(ctx, out, { startTime: now, duration: dur, gain: gain * 1.3, filterType: 'lowpass', freqStart: isBig ? 1750 : 1950, freqEnd: 95, Q: 0.7 });
      if (isToxic) {
        // Toksyczne syczenie kwasu po wybuchu beczki
        scheduleNoise(ctx, out, { startTime: now + 0.08, duration: 0.55, gain: gain * 0.65, filterType: 'bandpass', freqStart: 2600, freqEnd: 950, Q: 2.2, attack: 0.04 });
      }
      return true;
    }

    // =========================================================================
    // TRAFIENIA, PANCERZ I RYKOSZETY
    // =========================================================================
    case 'hit_flesh': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.11);
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 190 * p, freqEnd: 62 * p, duration: 0.07, gain: gain * 0.95 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.075, gain: gain * 0.75, filterType: 'lowpass', freqStart: 1200 * p, freqEnd: 320 });
      return true;
    }

    case 'hit_headshot': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.16);
      scheduleTone(ctx, out, { startTime: now, type: 'triangle', freqStart: 320 * p, freqEnd: 85 * p, duration: 0.085, gain: gain * 1.05 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.11, gain: gain * 1.1, filterType: 'bandpass', freqStart: 2900 * p, freqEnd: 880 * p, Q: 1.2 });
      return true;
    }

    case 'hit_armor': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.14);
      scheduleTone(ctx, out, { startTime: now, type: 'triangle', freqStart: 240 * p, freqEnd: 78 * p, duration: 0.065, gain: gain * 0.8 });
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 940 * p, freqEnd: 720 * p, duration: 0.09, gain: gain * 0.45 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.06, gain: gain * 0.65, filterType: 'bandpass', freqStart: 2100 * p, freqEnd: 950, Q: 2.0 });
      return true;
    }

    case 'hit_helmet_break': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.24);
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 1850 * p, freqEnd: 1320 * p, duration: 0.18, gain: gain * 0.62 });
      scheduleTone(ctx, out, { startTime: now, type: 'triangle', freqStart: 2740 * p, freqEnd: 2100 * p, duration: 0.14, gain: gain * 0.42 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.08, gain: gain * 0.85, filterType: 'bandpass', freqStart: 3100, freqEnd: 1200, Q: 1.6 });
      return true;
    }

    case 'hit_shield': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.15);
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 880 * p, freqEnd: 1620 * p, duration: 0.09, gain: gain * 0.55 });
      scheduleTone(ctx, out, { startTime: now, type: 'triangle', freqStart: 440 * p, freqEnd: 920 * p, duration: 0.09, gain: gain * 0.3 });
      return true;
    }

    case 'hit_ricochet': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.14);
      const baseFreq = (1950 + Math.random() * 650) * p;
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: baseFreq, freqEnd: baseFreq * 1.48, duration: 0.085, gain: gain * 0.58 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.04, gain: gain * 0.45, filterType: 'highpass', freqStart: 2800, freqEnd: 1800 });
      return true;
    }

    // =========================================================================
    // KLASY I RUCH GRACZA
    // =========================================================================
    case 'rocket_boots_dash': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.28);
      const pwr = Math.max(0.5, Math.min(1.3, power));
      scheduleTone(ctx, out, { startTime: now, type: 'sawtooth', freqStart: 185 * p * pwr, freqEnd: 58, duration: 0.18, gain: gain * 0.65, filterType: 'lowpass', filterFreq: 850 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.24, gain: gain * 1.05, filterType: 'bandpass', freqStart: 1550 * pwr, freqEnd: 340, Q: 0.9, attack: 0.008 });
      return true;
    }

    case 'enforcer_piston_jump': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.34);
      // Pneumatyczny syk zaworu + ciezki wyrzut tlokowy
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 120 * p, freqEnd: 36, duration: 0.22, gain: gain * 1.15 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.26, gain: gain * 0.95, filterType: 'highpass', freqStart: 2200, freqEnd: 650, Q: 1.4, attack: 0.004 });
      return true;
    }

    case 'enforcer_ground_slam': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.48);
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 98 * p, freqEnd: 24, duration: 0.36, gain: gain * 1.3 });
      scheduleTone(ctx, out, { startTime: now, type: 'triangle', freqStart: 75 * p, freqEnd: 28, duration: 0.24, gain: gain * 0.8 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.36, gain: gain * 1.15, filterType: 'lowpass', freqStart: 1150, freqEnd: 120, Q: 0.8 });
      return true;
    }

    case 'player_jump': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.12);
      const boost = isSprintJump ? 1.15 : 1.0;
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 125 * p, freqEnd: 230 * p * boost, duration: 0.085, gain: gain * 0.6 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.08, gain: gain * 0.45, filterType: 'bandpass', freqStart: 750, freqEnd: 1250, Q: 1.2 });
      return true;
    }

    case 'player_land': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.14);
      const strength = Math.max(0.45, Math.min(1.4, impactVy / 8.5));
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 125 * p, freqEnd: 38, duration: 0.095, gain: gain * 0.85 * strength });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.09, gain: gain * 0.65 * strength, filterType: 'lowpass', freqStart: 950, freqEnd: 240 });
      return true;
    }

    case 'player_death': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.34);
      scheduleTone(ctx, out, { startTime: now, type: 'sawtooth', freqStart: 195 * p, freqEnd: 68 * p, duration: 0.24, gain: gain * 0.55, filterType: 'lowpass', filterFreq: 780, attack: 0.01 });
      scheduleTone(ctx, out, { startTime: now + 0.04, type: 'sine', freqStart: 130, freqEnd: 42, duration: 0.22, gain: gain * 0.7 });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.16, gain: gain * 0.55, filterType: 'lowpass', freqStart: 1050, freqEnd: 260 });
      return true;
    }

    case 'gore_gib': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.28);
      scheduleNoise(ctx, out, { startTime: now, duration: 0.19, gain: gain * 1.1, filterType: 'bandpass', freqStart: 1100 * p, freqEnd: 310, Q: 1.5 });
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 220 * p, freqEnd: 58, duration: 0.12, gain: gain * 0.85 });
      scheduleTone(ctx, out, { startTime: now + 0.045, type: 'sine', freqStart: 360 * p, freqEnd: 110, duration: 0.08, gain: gain * 0.45 });
      return true;
    }

    // =========================================================================
    // PILKA I BRAMKI
    // =========================================================================
    case 'ball_kick': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.16);
      const pwr = Math.max(0.75, Math.min(1.4, power));
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 165 * p * pwr, freqEnd: 52, duration: 0.11, gain: gain * 1.15 * pwr });
      scheduleNoise(ctx, out, { startTime: now, duration: 0.06, gain: gain * 0.8 * pwr, filterType: 'bandpass', freqStart: 1200, freqEnd: 460, Q: 1.1 });
      return true;
    }

    case 'ball_bounce': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.11);
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 138 * p, freqEnd: 74 * p, duration: 0.075, gain: gain * 0.8 });
      return true;
    }

    case 'ball_post_clang': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.38);
      // Metaliczny dzwon poprzeczki bramki
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 540 * p, freqEnd: 532 * p, duration: 0.32, gain: gain * 0.68 });
      scheduleTone(ctx, out, { startTime: now, type: 'triangle', freqStart: 1095 * p, freqEnd: 1080 * p, duration: 0.24, gain: gain * 0.42 });
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 1740 * p, freqEnd: 1715 * p, duration: 0.16, gain: gain * 0.28 });
      return true;
    }

    case 'goal_horn': {
      const { now, out } = createVoiceStage(ctx, destNode, 0, 1.15);
      // Dwudzwiekowy rog stadionowy
      scheduleTone(ctx, out, { startTime: now, type: 'sawtooth', freqStart: 185, freqEnd: 183, duration: 0.95, gain: gain * 0.58, attack: 0.04, filterType: 'lowpass', filterFreq: 980, filterQ: 1.5 });
      scheduleTone(ctx, out, { startTime: now, type: 'sawtooth', freqStart: 277.18, freqEnd: 274, duration: 0.95, gain: gain * 0.46, attack: 0.04, filterType: 'lowpass', filterFreq: 1150, filterQ: 1.5 });
      return true;
    }

    // =========================================================================
    // SYRENA ARENY 2 I UI
    // =========================================================================
    case 'acid_siren': {
      const { now, out } = createVoiceStage(ctx, destNode, 0, 3.6);
      const osc = ctx.createOscillator();
      const flt = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.linearRampToValueAtTime(780, now + 0.6);
      osc.frequency.linearRampToValueAtTime(420, now + 1.2);
      osc.frequency.linearRampToValueAtTime(780, now + 1.8);
      osc.frequency.linearRampToValueAtTime(420, now + 2.4);
      osc.frequency.linearRampToValueAtTime(780, now + 3.0);
      osc.frequency.linearRampToValueAtTime(360, now + 3.5);
      flt.type = 'lowpass';
      flt.frequency.setValueAtTime(1200, now);
      const targetGain = gain * 0.34;
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(targetGain, now + 0.1);
      g.gain.setValueAtTime(targetGain, now + 3.0);
      g.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
      osc.connect(flt);
      flt.connect(g);
      g.connect(out);
      osc.start(now);
      osc.stop(now + 3.5);
      return true;
    }

    case 'ui_click': {
      const { now, out } = createVoiceStage(ctx, destNode, 0, 0.07);
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 880, freqEnd: 1320, duration: 0.05, gain: gain * 0.45, attack: 0.002 });
      return true;
    }

    case 'ui_hover': {
      const { now, out } = createVoiceStage(ctx, destNode, 0, 0.05);
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 540, freqEnd: 540, duration: 0.03, gain: gain * 0.25, attack: 0.002 });
      return true;
    }

    case 'ui_pause': {
      const { now, out } = createVoiceStage(ctx, destNode, 0, 0.16);
      scheduleTone(ctx, out, { startTime: now, type: 'triangle', freqStart: 620, freqEnd: 310, duration: 0.14, gain: gain * 0.5, attack: 0.004 });
      return true;
    }

    case 'ui_resume': {
      const { now, out } = createVoiceStage(ctx, destNode, 0, 0.14);
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 380, freqEnd: 760, duration: 0.12, gain: gain * 0.5, attack: 0.004 });
      return true;
    }

    case 'ui_test_tone': {
      const { now, out } = createVoiceStage(ctx, destNode, 0, 0.48);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      osc.frequency.setValueAtTime(1046.50, now + 0.24);
      const target = gain * 0.52;
      g.gain.setValueAtTime(target, now);
      g.gain.setValueAtTime(target, now + 0.32);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(g);
      g.connect(out);
      osc.start(now);
      osc.stop(now + 0.45);
      return true;
    }

    case 'ui_callout_multikill': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.28);
      scheduleTone(ctx, out, { startTime: now, type: 'triangle', freqStart: 587 * p, freqEnd: 880 * p, duration: 0.085, gain: gain * 0.42 });
      scheduleTone(ctx, out, { startTime: now + 0.055, type: 'sine', freqStart: 880 * p, freqEnd: 1175 * p, duration: 0.14, gain: gain * 0.48 });
      return true;
    }

    case 'ui_callout_oneshot': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.34);
      scheduleTone(ctx, out, { startTime: now, type: 'triangle', freqStart: 740 * p, freqEnd: 1480 * p, duration: 0.09, gain: gain * 0.45 });
      scheduleTone(ctx, out, { startTime: now + 0.05, type: 'sine', freqStart: 1109 * p, freqEnd: 1760 * p, duration: 0.18, gain: gain * 0.50 });
      return true;
    }

    case 'ui_callout_revenge': {
      const { now, out } = createVoiceStage(ctx, destNode, pan, 0.32);
      scheduleTone(ctx, out, { startTime: now, type: 'sawtooth', freqStart: 440 * p, freqEnd: 659 * p, duration: 0.075, gain: gain * 0.24, filterType: 'lowpass', filterFreq: 1900 });
      scheduleTone(ctx, out, { startTime: now + 0.06, type: 'triangle', freqStart: 659 * p, freqEnd: 988 * p, duration: 0.16, gain: gain * 0.45 });
      return true;
    }

    case 'ui_countdown_tick': {
      const { now, out } = createVoiceStage(ctx, destNode, 0, 0.14);
      const baseFreq = 587.33 * p;
      scheduleTone(ctx, out, { startTime: now, type: 'triangle', freqStart: baseFreq, freqEnd: baseFreq * 1.04, duration: 0.09, gain: gain * 0.52, attack: 0.002 });
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: baseFreq * 2, freqEnd: baseFreq * 2, duration: 0.07, gain: gain * 0.28, attack: 0.002 });
      return true;
    }

    case 'ui_countdown_go': {
      const { now, out } = createVoiceStage(ctx, destNode, 0, 0.55);
      scheduleTone(ctx, out, { startTime: now, type: 'triangle', freqStart: 880, freqEnd: 1760, duration: 0.18, gain: gain * 0.60, attack: 0.003 });
      scheduleTone(ctx, out, { startTime: now + 0.04, type: 'sine', freqStart: 1320, freqEnd: 1320, duration: 0.22, gain: gain * 0.42, attack: 0.002 });
      scheduleTone(ctx, out, { startTime: now, type: 'sine', freqStart: 220, freqEnd: 55, duration: 0.48, gain: gain * 0.75, attack: 0.004 });
      return true;
    }

    default:
      return false;
  }
}

/**
 * Tworzy ciagly glos pracy plecaka odrzutowego (synteza lub petla z zewnetrznego sampla).
 */
export function createSynthJetpackVoice(ctx, destNode) {
  if (!ctx || !destNode) return null;
  const now = ctx.currentTime;

  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = getNoiseBuffer(ctx);
  noiseSrc.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(520, now);
  filter.Q.setValueAtTime(0.85, now);

  const humOsc = ctx.createOscillator();
  humOsc.type = 'sawtooth';
  humOsc.frequency.setValueAtTime(86, now);

  const humGain = ctx.createGain();
  humGain.gain.setValueAtTime(0.22, now);

  const humFilter = ctx.createBiquadFilter();
  humFilter.type = 'lowpass';
  humFilter.frequency.setValueAtTime(340, now);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.0001, now);

  let panner = null;
  if (typeof ctx.createStereoPanner === 'function') {
    panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(0, now);
    gainNode.connect(panner);
    panner.connect(destNode);
  } else {
    gainNode.connect(destNode);
  }

  noiseSrc.connect(filter);
  filter.connect(gainNode);
  humOsc.connect(humFilter);
  humFilter.connect(humGain);
  humGain.connect(gainNode);

  noiseSrc.start(now);
  humOsc.start(now);

  return {
    type: 'synth',
    gainNode,
    panner,
    filter,
    humOsc,
    stop: () => {
      try { noiseSrc.stop(); } catch (_) {}
      try { humOsc.stop(); } catch (_) {}
      try { noiseSrc.disconnect(); } catch (_) {}
      try { humOsc.disconnect(); } catch (_) {}
      try { filter.disconnect(); } catch (_) {}
      try { humFilter.disconnect(); } catch (_) {}
      try { humGain.disconnect(); } catch (_) {}
      try { gainNode.disconnect(); } catch (_) {}
      if (panner) {
        try { panner.disconnect(); } catch (_) {}
      }
    }
  };
}
