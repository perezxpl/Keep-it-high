// scripts/generate_impact_and_piston_audio.js
// Generowanie czystych, wyrazistych próbek WAV dla:
// 1. Odgłosów trafień / zadawanych obrażeń (hit_flesh, hit_headshot, hit_armor, hit_helmet_break)
// 2. Układu tłoków pneumatycznych Enforcera (enforcer_piston_jump, enforcer_ground_slam)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT_DIR, 'assets', 'audio');
const SAMPLE_RATE = 44100;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Biquad {
  constructor(type, freq, Q = 1.0, gainDb = 0) {
    this.x1 = 0; this.x2 = 0;
    this.y1 = 0; this.y2 = 0;
    this.set(type, freq, Q, gainDb);
  }

  set(type, freq, Q = 1.0, gainDb = 0) {
    const f = Math.max(20, Math.min(SAMPLE_RATE * 0.45, freq));
    const w0 = (2 * Math.PI * f) / SAMPLE_RATE;
    const alpha = Math.sin(w0) / (2 * Math.max(0.1, Q));
    const cosw0 = Math.cos(w0);

    let b0, b1, b2, a0, a1, a2;
    if (type === 'lowpass') {
      b0 = (1 - cosw0) / 2;
      b1 = 1 - cosw0;
      b2 = (1 - cosw0) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cosw0;
      a2 = 1 - alpha;
    } else if (type === 'highpass') {
      b0 = (1 + cosw0) / 2;
      b1 = -(1 + cosw0);
      b2 = (1 + cosw0) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cosw0;
      a2 = 1 - alpha;
    } else if (type === 'bandpass') {
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
      a0 = 1 + alpha;
      a1 = -2 * cosw0;
      a2 = 1 - alpha;
    } else {
      const A = Math.pow(10, gainDb / 40);
      b0 = 1 + alpha * A;
      b1 = -2 * cosw0;
      b2 = 1 - alpha * A;
      a0 = 1 + alpha / A;
      a1 = -2 * cosw0;
      a2 = 1 - alpha / A;
    }
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = a1 / a0;
    this.a2 = a2 / a0;
  }

  process(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

function finalizeSamples(samples, targetPeak = 0.86, fadeOutSec = 0.015) {
  const n = samples.length;
  // Usuń stałą składową (DC offset)
  let mean = 0;
  for (let i = 0; i < n; i++) mean += samples[i];
  mean /= n;

  let maxAbs = 0;
  for (let i = 0; i < n; i++) {
    samples[i] -= mean;
    const a = Math.abs(samples[i]);
    if (a > maxAbs) maxAbs = a;
  }
  const scale = maxAbs > 1e-6 ? targetPeak / maxAbs : 1.0;

  const fadeInLen = Math.min(Math.floor(0.002 * SAMPLE_RATE), n);
  const fadeOutLen = Math.min(Math.floor(fadeOutSec * SAMPLE_RATE), n);

  for (let i = 0; i < n; i++) {
    let s = samples[i] * scale;
    // Miękki saturator bez twardego obcinania
    s = Math.tanh(s * 1.15) / Math.tanh(1.15);
    if (i < fadeInLen) s *= i / fadeInLen;
    if (i >= n - fadeOutLen) s *= (n - 1 - i) / fadeOutLen;
    samples[i] = Math.max(-0.98, Math.min(0.98, s));
  }
  return samples;
}

function writeWav(filePath, samples) {
  const n = samples.length;
  const buffer = Buffer.alloc(44 + n * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + n * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(s < 0 ? Math.round(s * 32768) : Math.round(s * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buffer);
}

/**
 * Zwarty, mięsisty odgłos trafienia w ciało (130 ms):
 * - Krótki perkusyjny punch klatki piersiowej (165 -> 58 Hz)
 * - Wyraźne, krótkie mlaśnięcie/trzaśnięcie trafienia pocisku (680-1450 Hz)
 * - Zero przeciągniętego 600 ms dudnienia
 */
function genHitFlesh(variant = 0) {
  const dur = 0.135;
  const n = Math.floor(dur * SAMPLE_RATE);
  const out = new Float32Array(n);
  const rand = mulberry32(1010 + variant * 137);
  const pitchShift = 1 + (variant - 1) * 0.06;

  const snapFilter = new Biquad('bandpass', 1150 * pitchShift, 1.3);
  const wetFilter = new Biquad('bandpass', 580 * pitchShift, 1.5);

  let phaseBody = 0;
  let phasePunch = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;

    // 1. Zwarte uderzenie masy (55 ms decay)
    const bodyFreq = (56 + 115 * Math.exp(-t / 0.016)) * pitchShift;
    phaseBody += (2 * Math.PI * bodyFreq) / SAMPLE_RATE;
    const body = Math.sin(phaseBody) * Math.exp(-t / 0.028) * 0.72;

    // 2. Średniotemperaturowy trzask wejścia pocisku (25 ms)
    const punchFreq = (120 + 240 * Math.exp(-t / 0.008)) * pitchShift;
    phasePunch += (2 * Math.PI * punchFreq) / SAMPLE_RATE;
    const punch = Math.sin(phasePunch) * Math.exp(-t / 0.014) * 0.42;

    // 3. Krótki organiczny szum trafienia (bez syczenia wysokich tonów)
    const white = rand() * 2 - 1;
    snapFilter.set('bandpass', (1350 - 700 * Math.min(1, t / 0.04)) * pitchShift, 1.4);
    const snap = snapFilter.process(white) * Math.exp(-t / 0.018) * 0.85;
    const wet = wetFilter.process(white) * Math.exp(-t / 0.036) * 0.55;

    out[i] = body + punch + snap + wet;
  }
  return finalizeSamples(out, 0.84, 0.02);
}

/**
 * Wyraziste, satysfakcjonujące trafienie w głowę (headshot, 165 ms):
 * - Czysty trzask trafienia (crisp transient) + krótki wyrazisty rezonans potwierdzenia
 * - Płynnie wygasająca obwiednia bez podwójnego uderzenia
 */
function genHitHeadshot() {
  const dur = 0.165;
  const n = Math.floor(dur * SAMPLE_RATE);
  const out = new Float32Array(n);
  const rand = mulberry32(4409);

  const crackFlt = new Biquad('bandpass', 1850, 1.6);
  const lowFlt = new Biquad('lowpass', 950, 0.9);

  let ph1 = 0, ph2 = 0, ph3 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;

    // Zwarty cios uderzenia
    const fBody = 68 + 210 * Math.exp(-t / 0.011);
    ph1 += (2 * Math.PI * fBody) / SAMPLE_RATE;
    const body = Math.sin(ph1) * Math.exp(-t / 0.025) * 0.65;

    // Wyrazisty klik/chrupnięcie kości i hełmu (1120 Hz + 1680 Hz, miękki harmoniczny akcent)
    const fPing1 = 1120 - 140 * Math.min(1, t / 0.09);
    const fPing2 = 1680 - 200 * Math.min(1, t / 0.09);
    ph2 += (2 * Math.PI * fPing1) / SAMPLE_RATE;
    ph3 += (2 * Math.PI * fPing2) / SAMPLE_RATE;
    const dink = (Math.sin(ph2) * 0.42 + Math.sin(ph3) * 0.24) * Math.exp(-t / 0.042);

    // Chrupki trzask wejścia pocisku
    const w = rand() * 2 - 1;
    const crack = crackFlt.process(w) * Math.exp(-t / 0.015) * 1.15;
    const rumble = lowFlt.process(w) * Math.exp(-t / 0.030) * 0.35;

    out[i] = body + dink + crack + rumble;
  }
  return finalizeSamples(out, 0.88, 0.025);
}

/**
 * Balistyczne uderzenie w kamizelkę kevlarową / płytę ceramiczną (135 ms):
 * - Twardy, stłumiony impuls płyty + krótki rezonans kompozytu/metalu
 */
function genHitArmor(variant = 0) {
  const dur = 0.135;
  const n = Math.floor(dur * SAMPLE_RATE);
  const out = new Float32Array(n);
  const rand = mulberry32(2205 + variant * 199);
  const shift = 1 + (variant - 1) * 0.07;

  const kevlarFlt = new Biquad('bandpass', 1480 * shift, 1.8);

  let phLow = 0, phPlate1 = 0, phPlate2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;

    const fLow = (78 + 135 * Math.exp(-t / 0.012)) * shift;
    phLow += (2 * Math.PI * fLow) / SAMPLE_RATE;
    const low = Math.sin(phLow) * Math.exp(-t / 0.026) * 0.58;

    // Krótki stłumiony rezonans płyty balistycznej (440 Hz i 715 Hz)
    phPlate1 += (2 * Math.PI * 440 * shift) / SAMPLE_RATE;
    phPlate2 += (2 * Math.PI * 715 * shift) / SAMPLE_RATE;
    const plate = (Math.sin(phPlate1) * 0.45 + Math.sin(phPlate2) * 0.32) * Math.exp(-t / 0.024);

    // Trzask włókna / ceramiki
    const w = rand() * 2 - 1;
    const snap = kevlarFlt.process(w) * Math.exp(-t / 0.016) * 0.95;

    out[i] = low + plate + snap;
  }
  return finalizeSamples(out, 0.84, 0.02);
}

/**
 * Pęknięcie i zbicie hełmu balistycznego (240 ms)
 */
function genHitHelmetBreak(variant = 0) {
  const dur = 0.24;
  const n = Math.floor(dur * SAMPLE_RATE);
  const out = new Float32Array(n);
  const rand = mulberry32(3301 + variant * 211);
  const shift = 1 + (variant - 0.5) * 0.08;

  const crackFlt = new Biquad('bandpass', 2100 * shift, 1.5);

  let ph1 = 0, ph2 = 0, ph3 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    ph1 += (2 * Math.PI * (85 + 180 * Math.exp(-t / 0.015)) * shift) / SAMPLE_RATE;
    ph2 += (2 * Math.PI * (1240 - 240 * Math.min(1, t / 0.14)) * shift) / SAMPLE_RATE;
    ph3 += (2 * Math.PI * (1920 - 380 * Math.min(1, t / 0.14)) * shift) / SAMPLE_RATE;

    const thud = Math.sin(ph1) * Math.exp(-t / 0.032) * 0.52;
    const ring = (Math.sin(ph2) * 0.48 + Math.sin(ph3) * 0.34) * Math.exp(-t / 0.075);
    const crack = crackFlt.process(rand() * 2 - 1) * Math.exp(-t / 0.028) * 1.1;
    // Krótki odłamek w 38 ms
    const shard = t > 0.032 ? crackFlt.process(rand() * 2 - 1) * Math.exp(-(t - 0.032) / 0.022) * 0.45 : 0;

    out[i] = thud + ring + crack + shard;
  }
  return finalizeSamples(out, 0.86, 0.025);
}

/**
 * Ciężkie tłoki pneumatyczne / hydrauliczne Enforcera (285 ms):
 * - Mechaniczny zatrzask i metaliczny stuk siłowników
 * - Potężny basowy wyrzut pneumatyczny (145 -> 36 Hz)
 * - Ciepły przemysłowy wydech sprężonego powietrza (1150 -> 260 Hz, bez syku 9.5 kHz!)
 */
function genEnforcerPistonJump(variant = 0) {
  const dur = 0.285;
  const n = Math.floor(dur * SAMPLE_RATE);
  const out = new Float32Array(n);
  const rand = mulberry32(7700 + variant * 313);
  const shift = 1 + (variant * 0.04);

  const airFlt = new Biquad('bandpass', 1100, 1.15);
  const mechFlt = new Biquad('bandpass', 520, 1.8);
  const warmLp = new Biquad('lowpass', 1650, 0.8);

  let phSub = 0, phDrive = 0, phClank1 = 0, phClank2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;

    // 1. Mechaniczne odblokowanie i uderzenie tłoka (0-45 ms + drugi tłok w 22 ms)
    const latchEnv1 = Math.exp(-t / 0.012);
    const latchEnv2 = t > 0.020 ? Math.exp(-(t - 0.020) / 0.015) : 0;
    phClank1 += (2 * Math.PI * 340 * shift) / SAMPLE_RATE;
    phClank2 += (2 * Math.PI * 575 * shift) / SAMPLE_RATE;
    const clank = (Math.sin(phClank1) * 0.55 + Math.sin(phClank2) * 0.38) * (latchEnv1 * 0.75 + latchEnv2 * 0.65);

    // 2. Potężny, ciężki impuls wyrzutu hydrauliczno-pneumatycznego (bas)
    const subFreq = (36 + 112 * Math.exp(-t / 0.045)) * shift;
    phSub += (2 * Math.PI * subFreq) / SAMPLE_RATE;
    const sub = Math.sin(phSub) * Math.exp(-t / 0.095) * 0.95;

    // 3. Harmoniczne brzmienie cylindra tłokowego pod obciążeniem
    const driveFreq = (68 + 165 * Math.exp(-t / 0.032)) * shift;
    phDrive += (2 * Math.PI * driveFreq) / SAMPLE_RATE;
    const drive = Math.tanh(Math.sin(phDrive) * 1.8) * Math.exp(-t / 0.075) * 0.48;

    // 4. Niskie/średnie sprężone powietrze z zaworu (1150 -> 260 Hz, ZERO pisku 9 kHz)
    const w = rand() * 2 - 1;
    const airSweep = (1180 - 920 * Math.min(1, t / 0.22)) * shift;
    airFlt.set('bandpass', airSweep, 1.25);
    const airEnv = Math.min(1, t / 0.008) * Math.exp(-t / 0.085);
    const air = airFlt.process(w) * airEnv * 0.82;
    const mechNoise = mechFlt.process(w) * (latchEnv1 * 0.4 + latchEnv2 * 0.35);

    out[i] = warmLp.process(sub + drive + clank + air + mechNoise);
  }
  return finalizeSamples(out, 0.88, 0.03);
}

/**
 * Sejsmiczne tąpnięcie Enforcera o podłoże (Ground Slam, 440 ms):
 * - Głęboka fala sejsmiczna (110 -> 25 Hz) + ciężki dobijający stuk tłoków + gruz skalny
 */
function genEnforcerGroundSlam(variant = 0) {
  const dur = 0.44;
  const n = Math.floor(dur * SAMPLE_RATE);
  const out = new Float32Array(n);
  const rand = mulberry32(8800 + variant * 257);
  const shift = 1 + (variant - 0.5) * 0.05;

  const rumbleFlt = new Biquad('lowpass', 780, 0.85);
  const crunchFlt = new Biquad('bandpass', 420, 1.1);

  let phSub = 0, phMid = 0, phMetal = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;

    // Głęboka fala uderzeniowa ziemi
    const fSub = (25 + 88 * Math.exp(-t / 0.055)) * shift;
    phSub += (2 * Math.PI * fSub) / SAMPLE_RATE;
    const sub = Math.sin(phSub) * Math.exp(-t / 0.145) * 1.0;

    // Ciężkie uderzenie pancerza/tłoków
    const fMid = (52 + 165 * Math.exp(-t / 0.022)) * shift;
    phMid += (2 * Math.PI * fMid) / SAMPLE_RATE;
    const mid = Math.tanh(Math.sin(phMid) * 1.6) * Math.exp(-t / 0.075) * 0.65;

    // Stłumione dobicie stalowego siłownika
    phMetal += (2 * Math.PI * 290 * shift) / SAMPLE_RATE;
    const metal = Math.sin(phMetal) * Math.exp(-t / 0.028) * 0.42;

    // Pęknięcie gruntu i pył (sweep 780 -> 110 Hz)
    const w = rand() * 2 - 1;
    rumbleFlt.set('lowpass', 780 - 660 * Math.min(1, t / 0.35), 0.85);
    const rumble = rumbleFlt.process(w) * Math.exp(-t / 0.14) * 0.85;
    const crunch = crunchFlt.process(w) * Math.exp(-t / 0.045) * 0.55;

    out[i] = sub + mid + metal + rumble + crunch;
  }
  return finalizeSamples(out, 0.90, 0.035);
}

console.log('[AUDIO GEN] Generowanie nowych probek trafien i tlokow Enforcera...');

for (let i = 0; i < 3; i++) {
  writeWav(path.join(AUDIO_DIR, `hit_flesh_${i + 1}.wav`), genHitFlesh(i));
  writeWav(path.join(AUDIO_DIR, `hit_armor_${i + 1}.wav`), genHitArmor(i));
}

writeWav(path.join(AUDIO_DIR, 'hit_headshot.wav'), genHitHeadshot());
writeWav(path.join(AUDIO_DIR, 'hit_helmet_break_1.wav'), genHitHelmetBreak(0));
writeWav(path.join(AUDIO_DIR, 'hit_helmet_break_2.wav'), genHitHelmetBreak(1));

writeWav(path.join(AUDIO_DIR, 'enforcer_piston_jump.wav'), genEnforcerPistonJump(0));
writeWav(path.join(AUDIO_DIR, 'enforcer_piston_jump_2.wav'), genEnforcerPistonJump(1));
writeWav(path.join(AUDIO_DIR, 'enforcer_ground_slam_1.wav'), genEnforcerGroundSlam(0));
writeWav(path.join(AUDIO_DIR, 'enforcer_ground_slam_2.wav'), genEnforcerGroundSlam(1));

console.log('[AUDIO GEN] Gotowe!');
