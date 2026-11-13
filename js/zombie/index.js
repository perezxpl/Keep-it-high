// =========================================================================
// ZOMBIE/INDEX.JS - GŁÓWNY PUNKT WEJŚCIA MODUŁU TRYBU ZOMBIE
// Eksportuje API dla pętli gry, obsługi śmierci, zrzutów i interfejsu UI.
// =========================================================================

import {
  zombieState,
  ZOMBIE_CONFIG,
  isZombieModeActive,
  setZombieModeActive,
  resetZombieState,
  createZombieInstance,
  registerCorpseForReanimation
} from './state.js';

import {
  updateZombieSystem,
  getActiveZombies,
  onCharacterRespawnCorpse,
  cureInfection
} from './logic.js';

import {
  drawZombieSystem,
  drawZombieHUD
} from './renderer.js';

import {
  serializeZombiesState,
  sendZombiesState,
  applyRemoteZombiesState,
  applyRemoteZombieDamage
} from './network.js';

export {
  zombieState,
  ZOMBIE_CONFIG,
  isZombieModeActive,
  setZombieModeActive,
  resetZombieState,
  createZombieInstance,
  registerCorpseForReanimation
};

export {
  updateZombieSystem,
  getActiveZombies,
  onCharacterRespawnCorpse,
  cureInfection
};

export {
  drawZombieSystem,
  drawZombieHUD,
  serializeZombiesState,
  sendZombiesState,
  applyRemoteZombiesState,
  applyRemoteZombieDamage
};

// Synchroniczna ekspozycja globalna dla systemów walki wręcz i konsoli deweloperskiej
if (typeof window !== 'undefined') {
  window.getActiveZombies = getActiveZombies;
  window.cureInfection = cureInfection;
  window.isZombieModeActive = isZombieModeActive;
  window.setZombieModeActive = setZombieModeActive;
  window.zombieState = zombieState;
  window.sendZombiesState = sendZombiesState;
  window.serializeZombiesState = serializeZombiesState;
}
