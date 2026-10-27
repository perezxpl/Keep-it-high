// =========================================================================
// LIGHTING/LOGIC.JS - AKTUALIZACJA ŚWIATEŁ I FAL UDERZENIOWYCH W CZASIE RZECZYWISTYM
// =========================================================================

import { lightingState } from './state.js';

/**
 * Główna pętla aktualizacji oświetlenia w klatce update(dt).
 */
export function updateLighting(dt = 0.016) {
  if (!lightingState.enabled) return;

  const lights = lightingState.activeLights;
  const shockwaves = lightingState.activeShockwaves;

  // 1. Aktualizacja dynamicznych świateł
  for (let i = lights.length - 1; i >= 0; i--) {
    const l = lights[i];
    l.life -= dt;

    if (l.life <= 0) {
      lights.splice(i, 1);
      continue;
    }

    // Podążanie za obiektem fizycznym (np. rakieta w locie, gracz)
    if (l.followEntity) {
      if (l.followEntity.isDead || (l.followEntity.alive === false)) {
        l.followEntity = null;
      } else {
        l.x = (typeof l.followEntity.x === 'number') ? l.followEntity.x : l.x;
        l.y = (typeof l.followEntity.y === 'number') ? l.followEntity.y : l.y;
      }
    }
  }

  // 2. Aktualizacja fal uderzeniowych (Shockwaves)
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    sw.life -= dt;

    if (sw.life <= 0) {
      shockwaves.splice(i, 1);
      continue;
    }

    // Progres od 0.0 do 1.0 z krzywą Ease-Out (szybka ekspansja na początku)
    const progress = 1 - (sw.life / sw.maxDuration);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    sw.radius = 8 + (sw.maxRadius - 8) * easeOut;
  }
}
