// =========================================================================
// LIGHTING/STATE.JS - REJESTR DYNAMICZNYCH ŚWIATEŁ I EFEKTÓW KINOWYCH
// =========================================================================

export const LIGHT_PRESETS = {
  // Rozbłyski luf przy wystrzale (Muzzle Flashes)
  MUZZLE_SMALL: { radius: 85, color: '#ffb347', intensity: 0.90, duration: 0.05 },
  MUZZLE_MEDIUM: { radius: 130, color: '#ff9922', intensity: 1.0, duration: 0.07 },
  MUZZLE_LARGE: { radius: 190, color: '#ffaa33', intensity: 1.0, duration: 0.09 },
  MUZZLE_SNIPER: { radius: 240, color: '#ffe082', intensity: 1.0, duration: 0.10 },
  MUZZLE_SHOTGUN: { radius: 210, color: '#ff8811', intensity: 1.0, duration: 0.09 },
  MUZZLE_ROCKET: { radius: 280, color: '#ff7700', intensity: 1.0, duration: 0.12 },

  // Eksplozje (Explosion Flashes)
  EXPLOSION_GRENADE: { radius: 360, color: '#ffaa33', intensity: 1.0, duration: 0.35 },
  EXPLOSION_RPG: { radius: 440, color: '#ff9922', intensity: 1.0, duration: 0.40 },
  EXPLOSION_MORTAR: { radius: 500, color: '#ff8800', intensity: 1.0, duration: 0.45 },
  EXPLOSION_CRATE: { radius: 320, color: '#ffbb44', intensity: 0.95, duration: 0.30 },

  // Ciągłe / mobilne źródła światła
  JETPACK_ORANGE: { radius: 110, color: '#ff8800', intensity: 0.75, duration: 0.05 },
  JETPACK_BLUE: { radius: 110, color: '#00ccff', intensity: 0.75, duration: 0.05 },
  ROCKET_IN_FLIGHT: { radius: 160, color: '#ff9933', intensity: 0.85, duration: 0.06 },
  FLARE_CARE_PACKAGE: { radius: 180, color: '#ff2222', intensity: 0.85, duration: 0.20 }
};

export const lightingState = {
  enabled: true,
  activeLights: [],
  activeShockwaves: [],
  vignetteAlpha: 0.38,
  // Domyślna jasność otoczenia dla aren (0.0 = pełna czerń, 1.0 = pełne słońce)
  ambientByArena: {
    'ARENA_1': 0.78,            // Neonowe Miasto (jasne neony)
    'arena-1': 0.78,
    'ARENA_2': 0.65,            // Toksyczna Rafineria (klimatyczny półmrok)
    'arena-2': 0.65,
    'ARENA_2_SECTOR_X': 0.65,
    'ARENA_2_PANDORA': 0.65,
    'ARENA_3': 0.60,            // Nocna Dżungla (głęboki nocny półmrok)
    'arena-3': 0.60,
    'ARENA_FOUNDRY': 0.60,
    'ARENA_4': 0.55,            // Platforma Wiertnicza Tyfon (mroczny sztorm morski)
    'arena-4': 0.55,
    'OIL_RIG_TYPHOON': 0.55,
    'TYPHOON': 0.55,
    'ARMORED_TRAIN': 0.70
  }
};

/**
 * Dodaje dynamiczne źródło światła do sceny.
 */
export function addDynamicLight(lightDef) {
  if (!lightingState.enabled || !lightDef) return;

  lightingState.activeLights.push({
    x: lightDef.x || 0,
    y: lightDef.y || 0,
    radius: lightDef.radius || 100,
    color: lightDef.color || '#ffaa33',
    intensity: lightDef.intensity !== undefined ? lightDef.intensity : 1.0,
    duration: lightDef.duration || 0.1,
    maxDuration: lightDef.duration || 0.1,
    life: lightDef.duration || 0.1,
    flicker: !!lightDef.flicker,
    expand: !!lightDef.expand,
    followEntity: lightDef.followEntity || null
  });
}

/**
 * Dodaje rozszerzającą się falę uderzeniową (Shockwave).
 * Pozostawiono czystą funkcję dla kompatybilności API.
 */
export function addShockwave(x, y, maxRadius = 140, duration = 0.28, color = '#ffeedd') {
  // Wyłączono sztuczne okręgi z cienkiej linii na rzecz poświaty i cząsteczek
}

/**
 * Czyści wszystkie aktywne światła i fale (np. przy zmianie areny lub respawnie).
 */
export function clearLightingState() {
  lightingState.activeLights.length = 0;
  lightingState.activeShockwaves.length = 0;
}
