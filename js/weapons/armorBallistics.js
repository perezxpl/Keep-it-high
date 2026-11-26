// =========================================================================
// WEAPONS/ARMOR_BALLISTICS.JS - RYKOSZETY OD PANCERZA I WYTRZYMAŁOŚĆ HEŁMU
// Współdzielona logika dla balistyki lokalnej oraz trafień sieciowych:
// - Różnicowanie siły przebicia (Barrett .50 BMG zrywa każdy hełm 1 strzałem
//   i nie rykoszetuje od pancerza).
// - Szansa na rykoszet pocisków od hełmu, kamizelki oraz płyt Kolosa.
// - Hełm wytrzymuje wielokrotne trafienia przed spadnięciem z głowy.
// Zero emojis.
// =========================================================================

import { spawnBulletSparks } from './transform.js';
import { spawnRicochetSparks } from '../particles.js';
import { spawnKnockedHelmet, spawnVestShreds } from '../world/gore.js';
import { triggerScreenShake } from '../camera.js';
import { playSound } from '../audio/index.js';

export const DEFAULT_HELMET_HITS = 2;
export const JUGGERNAUT_HELMET_HITS = 3;

export const ARMOR_RICOCHET_CHANCE = {
  JUGGERNAUT_HELMET: 0.34,
  STANDARD_HELMET: 0.22,
  JUGGERNAUT_VEST: 0.34,
  STANDARD_VEST: 0.22,
  JUGGERNAUT_LIMB: 0.22
};

/**
 * Zwraca true dla wielkokalibrowego karabinu Barrett .50 BMG
 */
export function isBarrett50Weapon(weaponId, isSniper = false) {
  return Boolean(isSniper || weaponId === 'SNIPER' || weaponId === 'BARRETT');
}

/**
 * Domyślna wytrzymałość hełmu (liczba celnych nie-rykoszetujących trafień)
 */
export function getDefaultHelmetHits(target) {
  return (target && target.isJuggernaut && !target.isZombie)
    ? JUGGERNAUT_HELMET_HITS
    : DEFAULT_HELMET_HITS;
}

/**
 * Inicjalizuje lub uzupełnia liczbę trafień hełmu, gdy postać ma go na głowie
 */
export function ensureHelmetHitsInitialized(target) {
  if (!target) return 0;
  const hasHelm = !!(target.hasHelmet || target.visuals?.hasHelmet);
  if (!hasHelm) return 0;
  if (typeof target.helmetHits !== 'number' || target.helmetHits <= 0) {
    target.helmetHits = getDefaultHelmetHits(target);
  }
  return target.helmetHits;
}

/**
 * Oblicza prawdopodobieństwo rykoszetu pocisku od pancerza celu
 */
export function getArmorRicochetChance({
  target,
  isHeadshot = false,
  isTorsoShot = false,
  weaponId = null,
  isSniper = false,
  ricochetCount = 0
} = {}) {
  if (!target || target.isZombie) return 0;
  if (ricochetCount > 0) return 0;
  if (isBarrett50Weapon(weaponId, isSniper)) return 0;
  if (weaponId === 'RPG7' || weaponId === 'FLAMETHROWER') return 0;

  const isJugg = !!(target.isJuggernaut && !target.isZombie);
  const hasHelm = !!(target.hasHelmet || target.visuals?.hasHelmet);
  const hasActiveVest = !!(target.hasVest || target.visuals?.hasVest) &&
    (target.vestHp === undefined || target.vestHp > 0);

  if (isHeadshot) {
    if (!hasHelm) return 0;
    return isJugg ? ARMOR_RICOCHET_CHANCE.JUGGERNAUT_HELMET : ARMOR_RICOCHET_CHANCE.STANDARD_HELMET;
  }

  if (isTorsoShot) {
    if (!hasActiveVest) return 0;
    return isJugg ? ARMOR_RICOCHET_CHANCE.JUGGERNAUT_VEST : ARMOR_RICOCHET_CHANCE.STANDARD_VEST;
  }

  // Kończyny Kolosa osłonięte są naramiennikami, karwaszami i nagolennikami
  return isJugg ? ARMOR_RICOCHET_CHANCE.JUGGERNAUT_LIMB : 0;
}

/**
 * Fizyczne odbicie pocisku od płyty pancernej / hełmu oraz zwrócenie wektora normalnego
 */
export function deflectBulletOffArmor(bullet, hitPtX, hitPtY, { isHeadshot = false } = {}) {
  const inSignX = (bullet.vx >= 0) ? 1 : -1;
  const spd = Math.max(8, Math.hypot(bullet.vx || 0, bullet.vy || 0));

  let rawNx;
  let rawNy;
  if (isHeadshot) {
    // Rykoszet z zaokrąglonego hełmu kieruje kulę stromo w górę / ukośnie w tył
    const skimForward = Math.random() < 0.30;
    rawNx = (skimForward ? inSignX : -inSignX) * (0.28 + Math.random() * 0.42);
    rawNy = -(0.72 + Math.random() * 0.28);
  } else {
    // Odbicie od płyty piersiowej lub naramiennika w bok-górę / bok-dół
    const verticalSign = (Math.random() < 0.68) ? -1 : 1;
    rawNx = -inSignX * (0.45 + Math.random() * 0.45);
    rawNy = verticalSign * (0.45 + Math.random() * 0.50);
  }

  const len = Math.hypot(rawNx, rawNy) || 1;
  const nx = rawNx / len;
  const ny = rawNy / len;
  const newSpd = spd * (0.62 + Math.random() * 0.16);

  bullet.vx = nx * newSpd;
  bullet.vy = ny * newSpd;
  bullet.prevX = hitPtX;
  bullet.prevY = hitPtY;
  bullet.x = hitPtX + nx * 6;
  bullet.y = hitPtY + ny * 6;
  bullet.ricocheted = true;
  bullet.ricochetCount = (bullet.ricochetCount || 0) + 1;
  bullet.damage = Math.max(1, Math.round((bullet.damage || 10) * 0.55));
  bullet.life = Math.min(bullet.life || 28, 28);
  bullet.color = '#fef08a';
  bullet.gravity = Math.max(bullet.gravity || 0.045, 0.09);

  return { nx, ny };
}

/**
 * Efekty wizualne i dźwiękowe rykoszetu pocisku od pancerza
 */
export function spawnArmorRicochetEffects({
  x,
  y,
  nx = 0,
  ny = -1,
  isJuggernaut = false,
  isHelmet = false
} = {}) {
  const sparkCount = isJuggernaut ? 7 : 5;
  spawnRicochetSparks(x, y, nx, ny, sparkCount);
  spawnBulletSparks(x, y, isHelmet ? '#fde047' : '#e2e8f0', sparkCount);
  playSound('hit_ricochet', { x, y, gainScale: isJuggernaut ? 1.15 : 1.0 });
  playSound('hit_armor', { x, y, gainScale: 0.52 });
  if (isJuggernaut) {
    triggerScreenShake(0.9);
  }
}

/**
 * Rozlicza trafienie w głowę z uwzględnieniem wytrzymałości hełmu oraz wyjątku Barrett .50
 */
export function resolveHelmetImpact({
  target,
  weaponId = null,
  isSniper = false,
  shotBurstId = null,
  bulletVx = 0,
  bulletVy = 0,
  hitPtX = 0,
  hitPtY = 0,
  attackerFacing = 1
} = {}) {
  if (!target) {
    return { damageMultiplier: 2.25, helmetAbsorbed: false, helmetKnockedOff: false };
  }

  const hasHelm = !!(target.hasHelmet || target.visuals?.hasHelmet);
  const hasImmunity = ((target.headshotImmunityTimer || 0) > 0);
  const isBarrett = isBarrett50Weapon(weaponId, isSniper);
  const isJugg = !!(target.isJuggernaut && !target.isZombie);

  if (hasImmunity && !hasHelm) {
    spawnBulletSparks(hitPtX, hitPtY, '#facc15', 5);
    playSound('hit_armor', { x: hitPtX, y: hitPtY });
    return { damageMultiplier: 0.35, helmetAbsorbed: true, helmetKnockedOff: false };
  }

  if (!hasHelm) {
    return { damageMultiplier: 2.25, helmetAbsorbed: false, helmetKnockedOff: false };
  }

  ensureHelmetHitsInitialized(target);

  const isSameBurst = !isBarrett && (
    (shotBurstId != null && target._lastHelmetHitBurstId === shotBurstId) ||
    (shotBurstId == null && (target.helmetBurstGuardTimer || 0) > 0)
  );

  let damageMultiplier;
  if (isBarrett) {
    // Barrett .50 BMG przebija i zrywa każdy hełm już przy pierwszym strzale
    target.helmetHits = 0;
    damageMultiplier = isJugg ? 0.45 : 0.60;
  } else if (isSameBurst) {
    // Kolejne śruciny tej samej salwy strzelby nie zrzucają hełmu w jednej klatce
    damageMultiplier = isJugg ? 0.20 : 0.28;
  } else {
    target.helmetHits = Math.max(0, target.helmetHits - 1);
    if (shotBurstId != null) {
      target._lastHelmetHitBurstId = shotBurstId;
    }
    target.helmetBurstGuardTimer = 2;
    damageMultiplier = isJugg ? 0.28 : 0.35;
  }

  if (target.helmetHits <= 0) {
    target.hasHelmet = false;
    if (target.visuals) target.visuals.hasHelmet = false;
    target.helmetHits = 0;
    target.headshotImmunityTimer = 22; // ~360ms krótkiej osłony po strąceniu hełmu

    const kickVx = bulletVx || (attackerFacing * 8);
    const kickVy = bulletVy || -4;
    spawnKnockedHelmet(
      hitPtX,
      hitPtY - 4,
      kickVx,
      kickVy,
      target.facing,
      target.visuals || target.currentClass?.visuals
    );
    triggerScreenShake(isBarrett ? 5.2 : 3.2);
    spawnBulletSparks(hitPtX, hitPtY, '#facc15', isBarrett ? 16 : 12);
    playSound('hit_helmet_break', { x: hitPtX, y: hitPtY });

    if (typeof window !== 'undefined' && typeof window.syncArmorDevButtons === 'function') {
      window.syncArmorDevButtons();
    }

    return { damageMultiplier, helmetAbsorbed: true, helmetKnockedOff: true };
  }

  // Hełm wytrzymał uderzenie i pozostał na głowie
  const deflectDirX = -Math.sign(bulletVx || attackerFacing || 1) || -1;
  spawnBulletSparks(hitPtX, hitPtY, '#fde047', 8);
  spawnRicochetSparks(hitPtX, hitPtY, deflectDirX, -0.65, 4);
  playSound('hit_armor', { x: hitPtX, y: hitPtY, gainScale: 1.05 });
  triggerScreenShake(isJugg ? 1.4 : 1.8);

  if (typeof window !== 'undefined' && typeof window.syncArmorDevButtons === 'function') {
    window.syncArmorDevButtons();
  }

  return { damageMultiplier, helmetAbsorbed: true, helmetKnockedOff: false };
}

/**
 * Rozlicza pochłanianie obrażeń na tors przez kamizelkę kuloodporną / pancerz Kolosa
 */
export function resolveTorsoVestImpact({
  target,
  totalDamage = 0,
  hitPtX = 0,
  hitPtY = 0,
  vx = 0,
  vy = 0
} = {}) {
  if (!target || !(target.hasVest || target.visuals?.hasVest)) {
    return { totalDamage, vestAbsorbed: false };
  }

  if (target.vestHp === undefined) {
    target.vestHp = 60;
    target.vestMaxHp = 60;
  }

  if (target.vestHp <= 0) {
    return { totalDamage, vestAbsorbed: false };
  }

  let remainingDamage = totalDamage;
  spawnBulletSparks(hitPtX, hitPtY, '#94a3b8', 7);
  playSound('hit_armor', { x: hitPtX, y: hitPtY });

  if (target.vestHp >= remainingDamage) {
    target.vestHp -= remainingDamage;
    remainingDamage = 0;
  } else {
    remainingDamage -= target.vestHp;
    target.vestHp = 0;
  }

  if (target.vestHp <= 0) {
    target.vestHp = 0;
    target.hasVest = false;
    if (target.visuals) target.visuals.hasVest = false;
    spawnVestShreds(hitPtX, hitPtY, vx, vy, target.visuals?.vestColor || '#18181b');
    triggerScreenShake(2.5);
    if (typeof window !== 'undefined' && typeof window.syncArmorDevButtons === 'function') {
      window.syncArmorDevButtons();
    }
  }

  return { totalDamage: remainingDamage, vestAbsorbed: true };
}
