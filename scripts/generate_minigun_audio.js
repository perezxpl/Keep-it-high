// scripts/generate_minigun_audio.js
// Procedural synthesis of authentic, deep, gut-shaking M134 Minigun audio assets:
// 1. assets/audio/minigun_loop.wav - Seamless continuous Gatling roar (60 Hz cyclic rate, deep sub-bass, blended supersonic shear)
// 2. assets/audio/weapon_minigun_1.wav & _2.wav - Deep, punchy low-frequency discrete shots for fallbacks/tests
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT_DIR, 'assets', 'audio');

const SAMPLE_RATE = 44100;

function createWavBuffer(samples) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(1, 22);  // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24); // sample rate
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32);  // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1.0, Math.min(1.0, samples[i]));
    const intVal = s < 0 ? Math.round(s * 32768) : Math.round(s * 32767);
    buffer.writeInt16LE(intVal, 44 + i * 2);
  }

  return buffer;
}

// Biquad filter implementation
class Biquad {
  constructor(type, freq, Q = 1.0, gainDb = 0) {
    this.x1 = 0; this.x2 = 0;
    this.y1 = 0; this.y2 = 0;
    this.set(type, freq, Q, gainDb);
  }

  reset() {
    this.x1 = 0; this.x2 = 0;
    this.y1 = 0; this.y2 = 0;
  }

  set(type, freq, Q = 1.0, gainDb = 0) {
    const w0 = 2 * Math.PI * freq / SAMPLE_RATE;
    const alpha = Math.sin(w0) / (2 * Q);
    const cosw0 = Math.cos(w0);

    if (type === 'lowpass') {
      const b0 = (1 - cosw0) / 2;
      const b1 = 1 - cosw0;
      const b2 = (1 - cosw0) / 2;
      const a0 = 1 + alpha;
      const a1 = -2 * cosw0;
      const a2 = 1 - alpha;
      this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0;
      this.a1 = a1 / a0; this.a2 = a2 / a0;
    } else if (type === 'bandpass') {
      const b0 = alpha;
      const b1 = 0;
      const b2 = -alpha;
      const a0 = 1 + alpha;
      const a1 = -2 * cosw0;
      const a2 = 1 - alpha;
      this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0;
      this.a1 = a1 / a0; this.a2 = a2 / a0;
    } else if (type === 'highpass') {
      const b0 = (1 + cosw0) / 2;
      const b1 = -(1 + cosw0);
      const b2 = (1 + cosw0) / 2;
      const a0 = 1 + alpha;
      const a1 = -2 * cosw0;
      const a2 = 1 - alpha;
      this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0;
      this.a1 = a1 / a0; this.a2 = a2 / a0;
    } else if (type === 'peaking') {
      const A = Math.pow(10, gainDb / 40);
      const b0 = 1 + alpha * A;
      const b1 = -2 * cosw0;
      const b2 = 1 - alpha * A;
      const a0 = 1 + alpha / A;
      const a1 = -2 * cosw0;
      const a2 = 1 - alpha / A;
      this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0;
      this.a1 = a1 / a0; this.a2 = a2 / a0;
    }
  }

  process(sample) {
    const out = this.b0 * sample + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = sample;
    this.y2 = this.y1;
    this.y1 = out;
    return out;
  }
}

/**
 * Generates continuous seamless Minigun loop:
 * Rate: 60 Hz cyclic rate (3,600 RPM).
 * Cycle length: exactly 735 samples at 44.1 kHz.
 * 72 cycles = 52,920 samples (1.2000s).
 */
function generateMinigunLoop() {
  const cyclicRate = 60.0;
  const cycleSamples = Math.round(SAMPLE_RATE / cyclicRate); // 735 samples
  const numCycles = 72;
  const totalSamples = cycleSamples * numCycles; // 52920

  const out = new Float32Array(totalSamples);

  // Filters
  const tearBpFilter = new Biquad('bandpass', 480, 1.1);
  const tearLpFilter = new Biquad('lowpass', 1150, 0.9);
  const subBassFilter = new Biquad('lowpass', 180, 1.4);
  const thumpFilter = new Biquad('lowpass', 240, 1.2);
  const midGrowlFilter = new Biquad('peaking', 160, 2.0, 4.5);

  // Warm-up filters with noise so loop starts without initial transient
  for (let i = 0; i < 2000; i++) {
    const n = Math.random() * 2 - 1;
    tearBpFilter.process(n);
    tearLpFilter.process(n);
    subBassFilter.process(n);
    thumpFilter.process(n);
    midGrowlFilter.process(n);
  }

  // Generate pinkish noise buffer for smooth supersonic air shear
  let b0 = 0, b1 = 0, b2 = 0;
  const noiseBuf = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    noiseBuf[i] = (b0 + b1 + b2 + white * 0.5362) * 0.28;
  }

  // Pre-calculate phase accumulators
  let motorPhase1 = 0;
  let motorPhase2 = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const sampleInCycle = i % cycleSamples;
    const cycleFrac = sampleInCycle / cycleSamples; // 0.0 to 1.0

    // 1. SUB-BASS ROTOR DRONE & CAVITY RESONANCE (60 Hz + 120 Hz + 180 Hz)
    // Deep gut-shaking continuous drone
    const phase60 = 2 * Math.PI * cyclicRate * t;
    const drone = 0.52 * Math.sin(phase60)
                + 0.35 * Math.sin(phase60 * 2)
                + 0.18 * Math.sin(phase60 * 3)
                + 0.08 * Math.sin(phase60 * 4);
    const subBass = subBassFilter.process(Math.tanh(drone * 1.7));

    // 2. OVERLAPPING CYCLIC MUZZLE BLAST THUMPS (Continuous low-end punch)
    // In each cycle of 16.6ms, a muzzle blast sweeps 120Hz -> 42Hz with 24ms tail.
    // Because 24ms > 16.6ms, it naturally overlaps with the preceding blast!
    const tThis = cycleFrac * (cycleSamples / SAMPLE_RATE);
    const tPrev = tThis + (cycleSamples / SAMPLE_RATE);

    // Muzzle blast 1 (current)
    const env1 = Math.exp(-tThis * 75);
    const f1 = 110 * Math.exp(-tThis * 65) + 40;
    const p1 = 2 * Math.PI * f1 * tThis;
    const b1Val = Math.sin(p1) * env1;

    // Muzzle blast 2 (tail of previous barrel)
    const env2 = Math.exp(-tPrev * 75);
    const f2 = 110 * Math.exp(-tPrev * 65) + 40;
    const p2 = 2 * Math.PI * f2 * tPrev;
    const b2Val = Math.sin(p2) * env2;

    const rawThump = (b1Val + b2Val) * 0.95;
    const thump = thumpFilter.process(midGrowlFilter.process(rawThump));

    // 3. CONTINUOUS SUPERSONIC AIR SHEAR (The "Tearing Canvas / Buzzsaw" roar)
    // Modulated at 60 Hz, but with a high floor (minimum 0.38) so it NEVER cuts out!
    const rawNoise = noiseBuf[i];
    const filteredNoise = tearLpFilter.process(tearBpFilter.process(rawNoise));
    // Asymmetric tear envelope (sharp front, gradual decay)
    const tearMod = 0.40 + 0.60 * Math.pow(Math.max(0, Math.sin(phase60 - 0.35)), 1.6);
    const tear = Math.tanh(filteredNoise * tearMod * 3.4) * 0.85;

    // 4. ELECTRIC ROTARY MOTOR & GEAR TRAIN WHINE (480 Hz & 720 Hz)
    motorPhase1 += (480 / SAMPLE_RATE) * Math.PI * 2;
    motorPhase2 += (720 / SAMPLE_RATE) * Math.PI * 2;
    const motor = (0.07 * Math.sin(motorPhase1) + 0.03 * Math.sin(motorPhase2));

    // 5. MASTER SUM & WARM ANALOG SATURATION
    // Low-end dominated (subBass + thump), glued together with tear & motor
    let mixed = (subBass * 0.82) + (thump * 0.92) + (tear * 0.88) + (motor * 0.35);

    // Tape saturation curve
    mixed = Math.tanh(mixed * 1.35) * 0.92;

    out[i] = mixed;
  }

  // Seamless crossfade across the seam (256 samples) to ensure zero discontinuity
  const xfadeLen = 256;
  for (let j = 0; j < xfadeLen; j++) {
    const frac = j / xfadeLen;
    // Blend start with tail
    const startVal = out[j];
    const endVal = out[totalSamples - xfadeLen + j];
    out[j] = startVal * frac + endVal * (1 - frac);
    out[totalSamples - xfadeLen + j] = out[j];
  }

  return out;
}

/**
 * Generates a deep, low, heavy single minigun shot for fallback / one-shot test:
 * Much lower pitch (85Hz -> 36Hz sweep, dark body, warm low-end thud)
 */
function generateMinigunOneShot(variant = 1) {
  const durationSec = 0.12;
  const numSamples = Math.floor(SAMPLE_RATE * durationSec);
  const out = new Float32Array(numSamples);

  const bodyFilter = new Biquad('lowpass', variant === 1 ? 280 : 310, 1.3);
  const tearFilter = new Biquad('bandpass', variant === 1 ? 520 : 580, 1.2);
  const subFilter = new Biquad('lowpass', 140, 1.5);

  let phaseBass = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;

    // 1. Deep sub-bass sweep (starts at 95Hz, drops rapidly to 38Hz)
    const bassFreq = 95 * Math.exp(-t * 45) + 36;
    phaseBass += (bassFreq / SAMPLE_RATE) * Math.PI * 2;
    const bassEnv = Math.exp(-t * 38);
    const bassSignal = subFilter.process(Math.sin(phaseBass) + 0.4 * Math.sin(phaseBass * 2)) * bassEnv * 1.15;

    // 2. Heavy chamber body (low-mid thud)
    const noise = Math.random() * 2 - 1;
    const bodyEnv = Math.exp(-t * 52);
    const bodySignal = bodyFilter.process(noise) * bodyEnv * 0.85;

    // 3. Short supersonic tear (darkened, not shrill)
    const tearEnv = Math.exp(-t * 90);
    const tearSignal = tearFilter.process(noise) * tearEnv * 0.65;

    let val = bassSignal + bodySignal + tearSignal;
    val = Math.tanh(val * 1.4) * 0.95;
    out[i] = val;
  }

  return out;
}

function run() {
  console.log('Generating Minigun audio assets...');

  // 1. Continuous seamless loop
  const loopSamples = generateMinigunLoop();
  const loopBuf = createWavBuffer(loopSamples);
  const loopFile = path.join(AUDIO_DIR, 'minigun_loop.wav');
  fs.writeFileSync(loopFile, loopBuf);
  console.log('Generated:', loopFile, `(${loopBuf.length} bytes, ${(loopSamples.length / SAMPLE_RATE).toFixed(3)}s, 72 seamless cycles @ 60Hz)`);

  // 2. Discrete fallback one-shots
  const shot1 = generateMinigunOneShot(1);
  const shot2 = generateMinigunOneShot(2);
  const shot1Buf = createWavBuffer(shot1);
  const shot2Buf = createWavBuffer(shot2);
  const shot1File = path.join(AUDIO_DIR, 'weapon_minigun_1.wav');
  const shot2File = path.join(AUDIO_DIR, 'weapon_minigun_2.wav');
  fs.writeFileSync(shot1File, shot1Buf);
  fs.writeFileSync(shot2File, shot2Buf);
  console.log('Generated:', shot1File, `(${shot1Buf.length} bytes, ${(shot1.length / SAMPLE_RATE).toFixed(3)}s)`);
  console.log('Generated:', shot2File, `(${shot2Buf.length} bytes, ${(shot2.length / SAMPLE_RATE).toFixed(3)}s)`);
}

run();
