// =============================================================================
// JS/AUDIO/MUSIC.JS - TAKTYCZNA MUZYKA MENU Z PŁYNNYM ZAPĘTLANIEM I FADE
// =============================================================================

import { SOUND_CATALOG, audioState } from './state.js';
import { getReadySampleForSound } from './samples.js';

const MENU_STATES = new Set(['MENU', 'ARENA_SELECT', 'CREATOR']);
const LIVE_MATCH_STATES = new Set(['PLAYING', 'CLASS_SELECT', 'PAUSED']);

const seamlessLoopCache = new WeakMap();

/**
 * Określa, czy w bieżącym stanie gry powinna grać muzyka w tle menu / lobby.
 */
export function shouldPlayMenuMusic(gameState = audioState.gameState) {
  if (MENU_STATES.has(gameState)) {
    return true;
  }
  if (LIVE_MATCH_STATES.has(gameState)) {
    return false;
  }
  // Ekrany nakładkowe (SETTINGS / ARMORY): graj tylko wtedy, gdy nie jesteśmy w trakcie żywego meczu
  return !audioState.inLiveMatch;
}

/**
 * Buduje bezszwowy bufor pętli muzycznej na podstawie loopStart/loopEnd z manifestu,
 * nakładając łagodnie wybrzmienie końca frazy na start kolejnego powtórzenia.
 */
function getSeamlessMusicBuffer(ctx, srcBuffer, loopStartSec, loopEndSec) {
  if (!srcBuffer || typeof srcBuffer.getChannelData !== 'function' || typeof ctx.createBuffer !== 'function') {
    return srcBuffer;
  }

  const cached = seamlessLoopCache.get(srcBuffer);
  if (cached) return cached;

  const sr = srcBuffer.sampleRate || 48000;
  const startSec = (typeof loopStartSec === 'number' && loopStartSec >= 0) ? loopStartSec : 0;
  const endSec = (typeof loopEndSec === 'number' && loopEndSec > startSec && loopEndSec < srcBuffer.duration)
    ? loopEndSec
    : srcBuffer.duration;

  if (startSec <= 0.001 && Math.abs(endSec - srcBuffer.duration) < 0.05) {
    seamlessLoopCache.set(srcBuffer, srcBuffer);
    return srcBuffer;
  }

  const startIdx = Math.max(0, Math.floor(startSec * sr));
  const endIdx = Math.min(srcBuffer.length, Math.floor(endSec * sr));
  const loopFrames = Math.max(1, endIdx - startIdx);
  const fadeFrames = Math.min(Math.round(sr * 0.14), Math.floor(loopFrames * 0.05));
  const tailAvailable = Math.max(0, srcBuffer.length - endIdx);
  const declickFrames = Math.min(Math.round(sr * 0.004), fadeFrames);

  const channels = Math.max(1, srcBuffer.numberOfChannels || 1);
  const outBuf = ctx.createBuffer(channels, loopFrames, sr);

  for (let ch = 0; ch < channels; ch++) {
    const srcData = srcBuffer.getChannelData(ch);
    const dstData = outBuf.getChannelData(ch);
    dstData.set(srcData.subarray(startIdx, endIdx));

    // Nałóż naturalne wybrzmienie po endIdx na początek pętli i wyeliminuj ewentualny klik na 0s
    const overlapLen = Math.min(fadeFrames, tailAvailable);
    for (let i = 0; i < overlapLen; i++) {
      const headEnv = i < declickFrames ? (i / declickFrames) : 1.0;
      const tailEnv = Math.cos((i / overlapLen) * Math.PI * 0.5);
      dstData[i] = dstData[i] * headEnv + srcData[endIdx + i] * tailEnv;
    }
  }

  seamlessLoopCache.set(srcBuffer, outBuf);
  return outBuf;
}

/**
 * Zatrzymuje natychmiast aktywny głos muzyki menu i zwalnia węzły Web Audio.
 */
export function stopMenuMusicImmediate() {
  const voice = audioState.musicVoice;
  if (!voice) return;
  try { voice.source?.stop?.(); } catch (_) {}
  try { voice.source?.disconnect?.(); } catch (_) {}
  try { voice.fadeGain?.disconnect?.(); } catch (_) {}
  audioState.musicVoice = null;
}

/**
 * Aktualizuje stan i płynne przejścia (fade-in / fade-out) muzyki menu co klatkę.
 */
export function updateMenuMusic(dt = 1 / 60, currentGameState = audioState.gameState) {
  const ctx = audioState.ctx;
  const musicBus = audioState.musicGain;
  if (!ctx || ctx.state !== 'running' || !musicBus) return;

  const def = SOUND_CATALOG.menu_music;
  if (!def) return;

  const wantMusic = !audioState.muted
    && audioState.hasUserGesture
    && (audioState.musicVolume || 0) > 0.001
    && shouldPlayMenuMusic(currentGameState);

  const voice = audioState.musicVoice;
  const now = ctx.currentTime;

  if (!wantMusic) {
    if (!voice) return;
    voice.fadeOutTimer += dt;
    if (!voice.fadingOut) {
      voice.fadingOut = true;
      voice.fadeGain.gain.cancelScheduledValues(now);
      voice.fadeGain.gain.setValueAtTime(Math.max(0.0001, voice.fadeGain.gain.value), now);
      voice.fadeGain.gain.setTargetAtTime(0.0001, now, 0.14);
    }
    if (voice.fadeOutTimer >= 0.65) {
      stopMenuMusicImmediate();
    }
    return;
  }

  // Jeśli głos już gra (lub wcześniej zaczął się wyciszać przy szybkim powrocie do menu) -> przywróć fade-in
  if (voice) {
    if (voice.fadingOut) {
      voice.fadingOut = false;
      voice.fadeOutTimer = 0;
      const targetGain = Math.max(0.0001, def.volume * (voice.entryVolume || 1.0));
      voice.fadeGain.gain.cancelScheduledValues(now);
      voice.fadeGain.gain.setValueAtTime(Math.max(0.0001, voice.fadeGain.gain.value), now);
      voice.fadeGain.gain.setTargetAtTime(targetGain, now, 0.28);
    }
    return;
  }

  // Pobierz gotowy zdekodowany bufor menu_music (albo zainicjuj pobieranie w tle)
  const sample = getReadySampleForSound('menu_music');
  if (!sample || !sample.buffer) return;

  const loopBuffer = getSeamlessMusicBuffer(
    ctx,
    sample.buffer,
    sample.entry?.loopStart,
    sample.entry?.loopEnd
  );

  const src = ctx.createBufferSource();
  src.buffer = loopBuffer;
  src.loop = true;

  const fadeGain = ctx.createGain();
  const entryVol = (typeof sample.entry?.volume === 'number') ? sample.entry.volume : 1.0;
  const targetGain = Math.max(0.0001, def.volume * entryVol);

  fadeGain.gain.setValueAtTime(0.0001, now);
  fadeGain.gain.setTargetAtTime(targetGain, now, 0.30);

  src.connect(fadeGain);
  fadeGain.connect(musicBus);
  src.start(now);

  audioState.musicVoice = {
    source: src,
    fadeGain,
    entryVolume: entryVol,
    fadingOut: false,
    fadeOutTimer: 0
  };
}
