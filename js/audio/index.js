// =============================================================================
// JS/AUDIO/INDEX.JS - PUBLICZNE API SYSTEMU AUDIO ORAZ REJESTR OKNA TESTÓW
// =============================================================================

import { AUDIO_CONFIG, SOUND_CATALOG, WEAPON_FIRE_SOUND_MAP, audioState } from './state.js';
import {
  loadAudioManifest,
  setCustomSoundOverride,
  clearCustomSoundOverride
} from './samples.js';
import {
  initAudio,
  updateAudio,
  playSound,
  playWeaponFireSound,
  syncAudioSettings,
  setAudioGameState,
  stopAllJetpackVoices,
  testSound,
  playUiClick,
  playUiHover,
  playUiPause,
  playUiResume,
  playTestTone,
  playAcidSurgeSiren
} from './logic.js';

export {
  AUDIO_CONFIG,
  SOUND_CATALOG,
  WEAPON_FIRE_SOUND_MAP,
  audioState,
  initAudio,
  updateAudio,
  playSound,
  playWeaponFireSound,
  syncAudioSettings,
  setAudioGameState,
  stopAllJetpackVoices,
  testSound,
  loadAudioManifest,
  setCustomSoundOverride,
  clearCustomSoundOverride,
  playUiClick,
  playUiHover,
  playUiPause,
  playUiResume,
  playTestTone,
  playAcidSurgeSiren
};

// Ulatwienie dla gracza/moddera w konsoli przegladarki (podmiana lub test w locie)
if (typeof window !== 'undefined') {
  window.KeepItHighAudio = {
    test: (soundId, opts) => testSound(soundId, opts),
    list: () => Object.keys(SOUND_CATALOG),
    setOverride: (soundId, sourceSpec) => setCustomSoundOverride(soundId, sourceSpec),
    clearOverride: (soundId) => clearCustomSoundOverride(soundId),
    reloadManifest: () => loadAudioManifest(true)
  };
}
