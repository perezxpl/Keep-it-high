// scripts/generate_minigun_wav.js
// Procedural synthesis of authentic M134 Minigun audio samples (44.1kHz 16-bit PCM WAV)
// Characteristics: High-velocity supersonic air shear (buzzsaw tear), 6-bolt rotary cam follower click, tight 65Hz chamber punch, motor whine overtone.
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

// Lowpass / bandpass filter helper
class SimpleBiquad {
  constructor(type, freq, Q = 1.0) {
    this.x1 = 0; this.x2 = 0;
    this.y1 = 0; this.y2 = 0;
    this.set(type, freq, Q);
  }

  set(type, freq, Q) {
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

function generateMinigunSample(variant = 1) {
  // Duration: ~90ms (clean, tight, fast repetition without muddiness)
  const durationSec = 0.095;
  const numSamples = Math.floor(SAMPLE_RATE * durationSec);
  const raw = new Float32Array(numSamples);

  // Filters
  const tearFilter = new SimpleBiquad('bandpass', variant === 1 ? 2600 : 2850, 1.4);
  const bodyFilter = new SimpleBiquad('lowpass', variant === 1 ? 380 : 420, 1.1);
  const mechFilter = new SimpleBiquad('bandpass', variant === 1 ? 1650 : 1850, 2.2);
  const clickFilter = new SimpleBiquad('highpass', variant === 1 ? 3400 : 3600, 1.2);

  let phaseBass = 0;
  let phaseMotor = 0;
  let phaseChirp = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;

    // 1. Supersonic air rip / tear noise transient (0 to 22ms)
    const noise = (Math.random() * 2 - 1);
    const tearEnv = Math.exp(-t * 115);
    const tearSignal = Math.tanh(tearFilter.process(noise) * 2.2) * tearEnv * 0.75;

    // 2. High-speed metallic click / cam roller strike (2ms to 18ms)
    const clickEnv = Math.max(0, Math.sin(Math.min(Math.PI, t * 180))) * Math.exp(-t * 140);
    const clickSignal = clickFilter.process(noise) * clickEnv * 0.45;

    // 3. Mechanical bolt chambering / rotor clatter (FM square/saw chirps)
    const chirpFreq = 520 - t * 4200;
    phaseChirp += (Math.max(120, chirpFreq) / SAMPLE_RATE) * Math.PI * 2;
    const chirpWave = (Math.sin(phaseChirp) > 0 ? 0.7 : -0.7);
    const mechEnv = Math.exp(-t * 90);
    const mechSignal = mechFilter.process(chirpWave) * mechEnv * 0.38;

    // 4. Punchy low-end pneumatic chamber explosion (0 to 45ms)
    // Starts at 170Hz dropping rapidly to 52Hz (tight chest kick, not loose boom)
    const bassFreq = 165 * Math.exp(-t * 42) + 50;
    phaseBass += (bassFreq / SAMPLE_RATE) * Math.PI * 2;
    const bassEnv = Math.exp(-t * 48);
    const bassWave = Math.sin(phaseBass) + 0.35 * Math.sin(phaseBass * 2);
    const bassSignal = bodyFilter.process(bassWave) * bassEnv * 0.95;

    // 5. Electric drive motor whir overtone (~640Hz)
    const motorFreq = variant === 1 ? 640 : 665;
    phaseMotor += (motorFreq / SAMPLE_RATE) * Math.PI * 2;
    const motorEnv = Math.exp(-t * 35);
    const motorSignal = Math.sin(phaseMotor) * motorEnv * 0.16;

    // Composite signal with fast saturation limiter
    let val = bassSignal + tearSignal + clickSignal + mechSignal + motorSignal;
    val = Math.tanh(val * 1.25);
    raw[i] = val;
  }

  return raw;
}

function run() {
  const sample1 = generateMinigunSample(1);
  const sample2 = generateMinigunSample(2);

  const buf1 = createWavBuffer(sample1);
  const buf2 = createWavBuffer(sample2);

  const file1 = path.join(AUDIO_DIR, 'weapon_minigun_1.wav');
  const file2 = path.join(AUDIO_DIR, 'weapon_minigun_2.wav');

  fs.writeFileSync(file1, buf1);
  fs.writeFileSync(file2, buf2);

  console.log('Generated:', file1, `(${buf1.length} bytes, ${(sample1.length / SAMPLE_RATE).toFixed(3)}s)`);
  console.log('Generated:', file2, `(${buf2.length} bytes, ${(sample2.length / SAMPLE_RATE).toFixed(3)}s)`);
}

run();
