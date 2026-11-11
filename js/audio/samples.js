// =============================================================================
// JS/AUDIO/SAMPLES.JS - ŁADOWANIE ZEWNĘTRZNYCH PLIKÓW AUDIO (WAV/OGG/MP3)
// Obsługuje manifest assets/audio/manifest.json oraz automatyczny fallback do syntezy
// =============================================================================

import { AUDIO_CONFIG, audioState } from './state.js';

function normalizeSampleEntry(rawEntry, basePath = audioState.manifestBasePath || AUDIO_CONFIG.DEFAULT_BASE_PATH) {
  if (!rawEntry) return null;

  const resolveUrl = (relOrUrl) => {
    if (typeof relOrUrl !== 'string') return null;
    const trimmed = relOrUrl.trim();
    if (!trimmed) return null;
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('./') ||
      trimmed.startsWith('../') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('data:')
    ) {
      return trimmed;
    }
    return `${basePath}${trimmed}`;
  };

  if (typeof rawEntry === 'string') {
    const url = resolveUrl(rawEntry);
    return url ? { urls: [url], volume: 1.0, pitchJitter: null, loop: null } : null;
  }

  if (Array.isArray(rawEntry)) {
    const urls = rawEntry.map(resolveUrl).filter(Boolean);
    return urls.length > 0 ? { urls, volume: 1.0, pitchJitter: null, loop: null } : null;
  }

  if (typeof rawEntry === 'object') {
    const src = rawEntry.src || rawEntry.url || rawEntry.files;
    const urls = Array.isArray(src) ? src.map(resolveUrl).filter(Boolean) : [resolveUrl(src)].filter(Boolean);
    if (urls.length === 0) return null;
    return {
      urls,
      volume: (typeof rawEntry.volume === 'number' && !Number.isNaN(rawEntry.volume)) ? rawEntry.volume : 1.0,
      pitchJitter: (typeof rawEntry.pitchJitter === 'number' && !Number.isNaN(rawEntry.pitchJitter)) ? rawEntry.pitchJitter : null,
      loop: (typeof rawEntry.loop === 'boolean') ? rawEntry.loop : null
    };
  }

  return null;
}

export function resolveSampleConfig(soundId) {
  if (!soundId) return null;
  if (audioState.runtimeOverrides.has(soundId)) {
    return audioState.runtimeOverrides.get(soundId);
  }
  if (audioState.manifestOverrides.has(soundId)) {
    return audioState.manifestOverrides.get(soundId);
  }
  return null;
}

export function loadAndDecodeSampleUrl(url) {
  if (!url || audioState.failedUrls.has(url)) return Promise.resolve(null);
  if (audioState.decodedBuffers.has(url)) {
    return Promise.resolve(audioState.decodedBuffers.get(url));
  }
  if (audioState.loadingUrls.has(url)) {
    return audioState.loadingUrls.get(url);
  }
  if (typeof fetch !== 'function' || !audioState.ctx) {
    return Promise.resolve(null);
  }

  const p = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.arrayBuffer();
    })
    .then((arrayBuf) => audioState.ctx.decodeAudioData(arrayBuf))
    .then((decoded) => {
      audioState.decodedBuffers.set(url, decoded);
      audioState.loadingUrls.delete(url);
      return decoded;
    })
    .catch((err) => {
      audioState.loadingUrls.delete(url);
      audioState.failedUrls.add(url);
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(`[AUDIO] Nie udało się załadować pliku "${url}", używam syntezy zapasowej:`, err?.message || err);
      }
      return null;
    });

  audioState.loadingUrls.set(url, p);
  return p;
}

export function preloadConfiguredSamples() {
  if (!audioState.ctx) return;
  const preloadEntries = [];
  for (const entry of audioState.manifestOverrides.values()) {
    if (entry && Array.isArray(entry.urls)) preloadEntries.push(...entry.urls);
  }
  for (const entry of audioState.runtimeOverrides.values()) {
    if (entry && Array.isArray(entry.urls)) preloadEntries.push(...entry.urls);
  }
  for (const url of preloadEntries) {
    loadAndDecodeSampleUrl(url);
  }
}

export async function loadAudioManifest(forceReload = false) {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  if (audioState.manifestLoaded && !forceReload) return true;
  if (audioState.manifestLoading && !forceReload) return false;

  audioState.manifestLoading = true;
  try {
    const res = await fetch(AUDIO_CONFIG.MANIFEST_URL, { cache: 'no-store' });
    if (!res.ok) {
      audioState.manifestLoading = false;
      audioState.manifestLoaded = true;
      return false;
    }
    const data = await res.json();
    const basePath = (typeof data?.basePath === 'string' && data.basePath.trim())
      ? data.basePath.trim()
      : AUDIO_CONFIG.DEFAULT_BASE_PATH;
    audioState.manifestBasePath = basePath;
    audioState.manifestOverrides.clear();

    const filesMap = (data && typeof data.files === 'object') ? data.files : {};
    for (const [soundId, raw] of Object.entries(filesMap)) {
      const normalized = normalizeSampleEntry(raw, basePath);
      if (normalized) {
        audioState.manifestOverrides.set(soundId, normalized);
      }
    }

    audioState.manifestLoaded = true;
    audioState.manifestLoading = false;
    preloadConfiguredSamples();
    return true;
  } catch (_) {
    audioState.manifestLoading = false;
    audioState.manifestLoaded = true;
    return false;
  }
}

export function setCustomSoundOverride(soundId, sourceSpec) {
  if (!soundId) return false;
  const normalized = normalizeSampleEntry(sourceSpec, audioState.manifestBasePath);
  if (!normalized) {
    audioState.runtimeOverrides.delete(soundId);
    return false;
  }
  audioState.runtimeOverrides.set(soundId, normalized);
  if (audioState.ctx) {
    for (const u of normalized.urls) {
      loadAndDecodeSampleUrl(u);
    }
  }
  return true;
}

export function clearCustomSoundOverride(soundId) {
  if (!soundId) return;
  audioState.runtimeOverrides.delete(soundId);
}

/**
 * Zwraca gotowy zdekodowany AudioBuffer dla wskazanego soundId, lub null jeśli
 * dźwięk ma zagrać z syntezatora (brak wpisu, pobieranie w toku lub błąd pliku).
 */
export function getReadySampleForSound(soundId) {
  const entry = resolveSampleConfig(soundId);
  if (!entry || !Array.isArray(entry.urls) || entry.urls.length === 0) return null;

  // Wybierz losowo jeden z gotowych wariantów; jeśli jeszcze się dekoduje, wywołaj ładowanie w tle
  const ready = [];
  for (const url of entry.urls) {
    const buf = audioState.decodedBuffers.get(url);
    if (buf) {
      ready.push(buf);
    } else if (!audioState.failedUrls.has(url) && !audioState.loadingUrls.has(url) && audioState.ctx) {
      loadAndDecodeSampleUrl(url);
    }
  }

  if (ready.length === 0) return null;
  const chosenBuffer = ready[Math.floor(Math.random() * ready.length)];
  return { buffer: chosenBuffer, entry };
}

export function playDecodedSample({ buffer, entry, ctx, destNode, gainValue, pitchJitter, pitchMultiplier = 1.0, pan = 0, loop = false }) {
  if (!buffer || !ctx || !destNode) return null;
  const now = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = !!(entry?.loop !== null ? entry.loop : loop);

  const effectiveJitter = (entry?.pitchJitter !== null && entry?.pitchJitter !== undefined)
    ? entry.pitchJitter
    : (pitchJitter || 0);
  const randOffset = effectiveJitter > 0 ? ((Math.random() * 2 - 1) * effectiveJitter) : 0;
  src.playbackRate.setValueAtTime(Math.max(0.25, Math.min(4.0, pitchMultiplier * (1 + randOffset))), now);

  const voiceGain = ctx.createGain();
  const finalGain = Math.max(0.0001, gainValue * (entry?.volume ?? 1.0));
  voiceGain.gain.setValueAtTime(finalGain, now);

  let panner = null;
  let lastNode = voiceGain;
  if (typeof ctx.createStereoPanner === 'function' && (Math.abs(pan) > 0.02 || src.loop)) {
    panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);
    voiceGain.connect(panner);
    lastNode = panner;
  }

  src.connect(voiceGain);
  lastNode.connect(destNode);

  if (!src.loop) {
    audioState.activeVoiceCount++;
    src.onended = () => {
      audioState.activeVoiceCount = Math.max(0, audioState.activeVoiceCount - 1);
      try { src.disconnect(); } catch (_) {}
      try { voiceGain.disconnect(); } catch (_) {}
      if (panner) {
        try { panner.disconnect(); } catch (_) {}
      }
    };
  }

  src.start(now);
  return { source: src, gainNode: voiceGain, panner };
}
