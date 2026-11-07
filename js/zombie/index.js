// =========================================================================
// ZOMBIE/INDEX.JS - GŁÓWNY PUNKT WEJŚCIA MODUŁU TRYBU ZOMBIE
// Eksportuje API dla pętli gry, obsługi śmierci, zrzutów i interfejsu UI.
// =========================================================================

export {
  zombieState,
  ZOMBIE_CONFIG,
  isZombieModeActive,
  setZombieModeActive,
  resetZombieState,
  createZombieInstance,
  registerCorpseForReanimation
} from './state.js';

export {
  updateZombieSystem,
  getActiveZombies,
  onCharacterRespawnCorpse,
  cureInfection
} from './logic.js';

export {
  drawZombieSystem,
  drawZombieHUD
} from './renderer.js';

// Ekspozycja globalna dla wygody systemów walki wręcz i konsoli deweloperskiej
if (typeof window !== 'undefined') {
  import('./logic.js').then(m => {
    window.getActiveZombies = m.getActiveZombies;
    window.cureInfection = m.cureInfection;
  }).catch(() => {});
  import('./state.js').then(m => {
    window.isZombieModeActive = m.isZombieModeActive;
    window.setZombieModeActive = m.setZombieModeActive;
    window.zombieState = m.zombieState;
  }).catch(() => {});
}
