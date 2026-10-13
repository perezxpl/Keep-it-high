// =========================================================================
// OBSTACLES/PALETTE.JS - DEFINICJE PALETY PRZESZKÓD I NORMALIZACJA TYPÓW
// Wydzielony moduł z js/obstacles.js
// =========================================================================

export function normalizeObstacleType(type) {
  if (!type) return '';
  const str = String(type).trim().toLowerCase().replace(/[-_\s]+/g, '');
  if (str === 'sandbag' || str === 'sandbags' || str === 'worki' || str === 'workizpiaskiem') {
    return 'sandbags';
  }
  if (
    str === 'ammo' ||
    str === 'ammocrate' ||
    str === 'ammobox' ||
    str === 'ammodepot' ||
    str === 'crate' ||
    str === 'ammobag' ||
    str === 'skrzynia' ||
    str === 'skrzyniaammo'
  ) {
    return 'ammo_depot';
  }
  return type;
}

export const OBSTACLE_PALETTE = {
  ARENA_1: [
    { type: 'catwalk', name: 'Stalowa Kładka', label: 'Kładka', category: 'platforms', w: 200, h: 14, isPlatform: true, oneWay: true, anchor: 'top' },
    { type: 'sniper_tower', name: 'Wieża Snajperska', label: 'Ambona', category: 'platforms', w: 90, h: 160, isPlatform: true, oneWay: true, anchor: 'bottom' },
    { type: 'metal_ramp_left', name: 'Rampa Lewa', label: 'Rampa L', category: 'platforms', w: 80, h: 40, isPlatform: true, anchor: 'bottom' },
    { type: 'metal_ramp_right', name: 'Rampa Prawa', label: 'Rampa P', category: 'platforms', w: 80, h: 40, isPlatform: true, anchor: 'bottom' },
    { type: 'tall_concrete_wall', name: 'Mur Zbrojony', label: 'Mur', category: 'defense', w: 26, h: 110, solid: true, anchor: 'bottom' },
    { type: 'bunker_block', name: 'Blok Betonowy', label: 'Blok', category: 'defense', w: 120, h: 40, isPlatform: true, solid: true, anchor: 'bottom' },
    { type: 'sandbags', name: 'Worki z Piaskiem', label: 'Worki', category: 'defense', w: 48, h: 24, isPlatform: true, solid: true, anchor: 'bottom' },
    { type: 'ammo_depot', name: 'Skrzynia Ammo', label: 'Ammo', category: 'defense', w: 32, h: 24, isPlatform: true, solid: true, anchor: 'bottom', isPickup: true, isInteractable: true },
    { type: 'explosive_barrel', name: 'Beczka Wybuchowa', label: 'Beczka', category: 'traps', w: 22, h: 34, solid: true, anchor: 'bottom' },
    { type: 'barbed_wire', name: 'Drut Kolczasty', label: 'Drut', category: 'traps', w: 60, h: 18, anchor: 'bottom' },
    { type: 'hedgehog', name: 'Jeż Stalowy', label: 'Jeż', category: 'traps', w: 32, h: 32, size: 32, isHedgehog: true, anchor: 'bottom' }
  ],
  ARENA_2: [
    { type: 'steel_beam', name: 'Belka Stalowa', label: 'Belka', category: 'platforms', w: 200, h: 20, isPlatform: true, oneWay: true, anchor: 'top' },
    { type: 'industrial_catwalk', name: 'Kratownica Pomostowa', label: 'Kratownica', category: 'platforms', w: 180, h: 18, isPlatform: true, oneWay: true, anchor: 'top' },
    { type: 'concrete_barrier', name: 'Bariera Betonowa', label: 'Beton', category: 'defense', w: 100, h: 36, isPlatform: true, solid: true, anchor: 'bottom' },
    { type: 'metal_crate', name: 'Skrzynia Stalowa', label: 'Skrzynia', category: 'defense', w: 40, h: 40, isPlatform: true, solid: true, anchor: 'bottom' },
    { type: 'ammo_depot', name: 'Skrzynia Zaopatrzenia', label: 'Ammo', category: 'defense', w: 32, h: 24, isPlatform: true, solid: true, anchor: 'bottom', isPickup: true, isInteractable: true },
    { type: 'toxic_barrel', name: 'Beczka Toksyczna', label: 'Kwas', category: 'traps', w: 24, h: 36, solid: true, anchor: 'bottom' },
    { type: 'steam_vent', name: 'Zawór Parowy', label: 'Para', category: 'traps', w: 40, h: 80, anchor: 'bottom' },
    { type: 'jump_pad_industrial', name: 'Pneumatyczna Skocznia', label: 'Wyrzutnia', category: 'traps', w: 60, h: 16, isPlatform: true, isJumpPad: true, anchor: 'bottom' }
  ],
  ARENA_3: [
    { type: 'jungle_rock', name: 'Półka Skalna (Dżungla)', label: 'Skalna Półka', category: 'platforms', w: 180, h: 40, isPlatform: true, oneWay: true, anchor: 'top' },
    { type: 'sandbags', name: 'Bunkier z Worków', label: 'Worki', category: 'defense', w: 56, h: 26, isPlatform: true, solid: true, anchor: 'bottom' },
    { type: 'wooden_ladder', name: 'Drabina Drewniana', label: 'Drabina', category: 'platforms', w: 32, h: 180, isPlatform: true, oneWay: true, anchor: 'bottom' },
    { type: 'jungle_hut', name: 'Strażnica na Palach', label: 'Strażnica', category: 'platforms', w: 110, h: 100, isPlatform: true, oneWay: true, anchor: 'bottom' },
    { type: 'ammo_depot', name: 'Skrzynia Zaopatrzenia', label: 'Ammo', category: 'defense', w: 32, h: 24, isPlatform: true, solid: true, anchor: 'bottom', isPickup: true, isInteractable: true },
    { type: 'explosive_barrel', name: 'Beczka Paliwa', label: 'Beczka', category: 'traps', w: 24, h: 36, solid: true, anchor: 'bottom' },
    { type: 'catwalk', name: 'Kładka / Most Linowy', label: 'Kładka', category: 'platforms', w: 180, h: 16, isPlatform: true, oneWay: true, anchor: 'top' },
    { type: 'jump_pad', name: 'Wyrzutnia Gejzer', label: 'Gejzer', category: 'traps', w: 60, h: 14, isPlatform: true, isJumpPad: true, anchor: 'bottom' }
  ]
};

export function getObstacleDef(type) {
  if (!type) return null;
  const norm = normalizeObstacleType(type);
  for (const arenaKey of ['ARENA_1', 'ARENA_2', 'ARENA_3']) {
    if (!OBSTACLE_PALETTE[arenaKey]) continue;
    const found = OBSTACLE_PALETTE[arenaKey].find(
      d => d.type === type || d.type === norm || normalizeObstacleType(d.type) === norm
    );
    if (found) {
      const copy = { ...found };
      if (norm === 'ammo_depot') {
        copy.w = copy.w || 32;
        copy.h = copy.h || 24;
        if (copy.isPickup === undefined) copy.isPickup = true;
        if (copy.isInteractable === undefined) copy.isInteractable = true;
      } else if (norm === 'sandbags') {
        copy.w = copy.w || 48;
        copy.h = copy.h || 24;
      }
      return copy;
    }
  }
  if (norm === 'ammo_depot') {
    return {
      type: type || 'ammo_depot',
      name: 'Skrzynia Ammo',
      label: 'Ammo',
      category: 'defense',
      w: 32,
      h: 24,
      isPlatform: true,
      solid: true,
      anchor: 'bottom',
      isPickup: true,
      isInteractable: true
    };
  }
  if (norm === 'sandbags') {
    return {
      type: type || 'sandbags',
      name: 'Worki z Piaskiem',
      label: 'Worki',
      category: 'defense',
      w: 48,
      h: 24,
      isPlatform: true,
      solid: true,
      anchor: 'bottom'
    };
  }
  return null;
}

export function isBottomAnchored(def) {
  if (!def) return false;
  if (def.anchor === 'bottom') return true;
  if (def.anchor === 'top' || def.anchor === 'center') return false;
  const norm = normalizeObstacleType(def.type);
  if (norm === 'sandbags' || norm === 'ammo_depot') return true;
  if (def.type === 'catwalk' || def.type === 'cyber_catwalk' || def.type === 'floating_hex') {
    return false;
  }
  return true;
}

