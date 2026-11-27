// =========================================================================
// MOBILECONTROLS.JS - ZAAWANSOWANE STEROWANIE DOTYKOWE (MOBILE CONTROLS)
// Obsługuje wirtualne drążki, dynamiczny kontekstowy przycisk (Wślizg / Leżenie)
// oraz gesty kopnięcia z prawego drążka (Right Stick Kick).
// =========================================================================

import { CONFIG } from './config.js';
import { performKick, kick, triggerSpartanKick, findMeleeTarget, prepareTomahawkThrow, releaseTomahawkThrow } from './player/actions.js';
import { triggerEnforcerGroundSlam } from './classes/enforcer.js';
import { startMeleeAttack, WEAPONS, cancelReload } from './weapons.js';
import { activeArenaId as obstacleArenaId } from './obstacles.js';
import { getActiveArena } from './arenas/index.js';

export const leftStick = {
  active: false,
  id: null,
  baseX: 0,
  baseY: 0,
  defaultBaseX: 0,
  defaultBaseY: 0,
  curX: 0,
  curY: 0,
  axisX: 0,
  axisY: 0,
  maxRadius: 55,

  // Skok i obsługa jetpacka na lewym drążku
  jumpTriggered: false,
  jetpackNeutralized: true,
  waitingForJetpackTap: false,
  jetpackWindowTimer: 0,
  isJetpacking: false,
  jetpackAirborneSession: false,
  downIntent: false,
  downStartTime: 0,
  downFlickDetected: false
};

export const rightStick = {
  active: false,
  id: null,
  baseX: 0,
  baseY: 0,
  curX: 0,
  curY: 0,
  axisX: 0,
  axisY: 0,
  power: 0,
  movedDist: 0,
  maxRadius: 58,

  // Tryb wyposażenia drążka: 'FIREARM' (broń palna) lub 'GRENADE' (broń miotana)
  armedMode: 'FIREARM',

  // Obsługa strzelania i rzutu granatem
  touchStartTime: 0,
  startX: 0,
  startY: 0,
  isShooting: false,
  shotgunFiredThisTap: false,

  // Płynne przeciąganie ikony na prawy drążek (Drag & Drop)
  draggedSlot: null, // null lub { type: 'FIREARM'|'GRENADE', startX, startY, curX, curY, touchId }

  waitingForSecondTap: false,
  windowTimer: 0,
  lingerAlpha: 0,
  gestureState: 'IDLE'
};

// =========================================================================
// KIESZENIE WOKÓŁ PRAWEGO DRĄŻKA (POCKETS) & DYNAMICZNY PRZYCISK RUCHU
// =========================================================================
export const pockets = {
  // 1. Kieszeń na broń palną (kliknięcie = wybór/zmiana broni, przytrzymanie 500ms = przeładowanie)
  firearm: {
    x: 0,
    y: 0,
    r: 26,
    active: false,
    id: null,
    touchStartTime: 0,
    startX: 0,
    startY: 0,
    isDragging: false,
    reloadTriggered: false
  },

  // 2. Kieszeń na broń miotaną (granat)
  throwable: {
    x: 0,
    y: 0,
    r: 26,
    active: false,
    id: null,
    touchStartTime: 0,
    startX: 0,
    startY: 0,
    isDragging: false
  },

  // 3. Zunifikowany 1 przycisk akcji (wślizg / kładzenie się / wstawanie / kopniak)
  action: {
    x: 0,
    y: 0,
    r: 28,
    active: false,
    id: null,
    currentMode: 'KICK' // 'SLIDE' | 'PRONE' | 'STAND' | 'KICK'
  },

  // 4. Dedykowany przycisk broni białej (Nóż / Maczeta / Toporek Tomahawk)
  melee: {
    x: 0,
    y: 0,
    r: 26,
    active: false,
    id: null,
    touchStartTime: 0,
    startX: 0,
    startY: 0
  }
};

export const btnCluster = {
  firearm: pockets.firearm,
  throwable: pockets.throwable,
  action: pockets.action,
  melee: pockets.melee,
  prone: pockets.action,
  crouch: pockets.action,
  grenade: pockets.throwable,
  kick: pockets.action
};

/**
 * Aktualizuje pozycje przycisków dotykowych na ekranie
 * @param {number} W - Szerokość ekranu
 * @param {number} H - Wysokość ekranu
 */
export function updateButtonLayout(W, H) {
  const curW = (typeof W === 'number' && W > 0) ? W : (typeof window !== 'undefined' ? window.innerWidth : 800);
  const curH = (typeof H === 'number' && H > 0) ? H : (typeof window !== 'undefined' ? window.innerHeight : 600);

  // Domyślne ergonomiczne pozycje drążków dotykowych
  leftStick.defaultBaseX = Math.round(Math.min(135, Math.max(95, curW * 0.14)));
  leftStick.defaultBaseY = Math.round(curH - Math.min(135, Math.max(95, curH * 0.28)));
  leftStick.maxRadius = 55;
  if (!leftStick.active) {
    leftStick.baseX = leftStick.defaultBaseX;
    leftStick.baseY = leftStick.defaultBaseY;
    leftStick.curX = leftStick.baseX;
    leftStick.curY = leftStick.baseY;
  }

  rightStick.baseX = Math.round(curW - Math.min(135, Math.max(95, curW * 0.14)));
  rightStick.baseY = Math.round(curH - Math.min(135, Math.max(95, curH * 0.28)));
  rightStick.maxRadius = 58;
  if (!rightStick.active) {
    rightStick.curX = rightStick.baseX;
    rightStick.curY = rightStick.baseY;
  }

  const rsX = rightStick.baseX;
  const rsY = rightStick.baseY;

  // Ergonomiczne rozmieszczenie przycisków w łuku/kolumnie przy prawej dolnej krawędzi:
  // - Przycisk ruchów najniżej (blisko dolnej krawędzi ekranu)
  // - Po środku broń miotana (granat)
  // - Wyżej broń palna (AK47 / Shotgun)
  const bottomMargin = Math.max(40, Math.min(52, Math.round(curH * 0.09)));
  const btnSpacing = Math.max(54, Math.min(60, Math.round(curH * 0.125)));

  // 1. Zunifikowany przycisk akcji dynamicznej (wślizg / kładzenie się / kopniak) – NAJNIŻEJ, blisko dolnej krawędzi
  pockets.action.r = 27;
  pockets.action.x = Math.round(rsX - 78);
  pockets.action.y = Math.round(curH - bottomMargin);

  // 2. Kieszeń na broń miotaną (granat) – PO ŚRODKU
  pockets.throwable.r = 26;
  pockets.throwable.x = Math.round(rsX - 84);
  pockets.throwable.y = Math.round(pockets.action.y - btnSpacing);

  // 3. Kieszeń na broń palną – WYŻEJ
  pockets.firearm.r = 26;
  pockets.firearm.x = Math.round(rsX - 76);
  pockets.firearm.y = Math.round(pockets.throwable.y - btnSpacing);

  // 4. Dedykowany przycisk broni białej – OBOK KOPANIA (po prawej, niżej, po okręgu drążka)
  pockets.melee.r = 26;
  pockets.melee.x = Math.round(rsX - 22);
  pockets.melee.y = Math.min(curH - Math.max(30, bottomMargin - 8), Math.round(pockets.action.y + 10));
}

/**
 * Monitoruje ruch postaci i dynamicznie przełącza kontekstowy tryb przycisku akcji:
 * - W pełnym biegu (|vx| > MIN_RUN_SPEED): WŚLIZG (SLIDE)
 * - W kucaniu / leżeniu: KŁADZENIE SIĘ / WSTAWANIE (PRONE / STAND)
 * - W pozostałych stanach: KOPNIAK (KICK)
 *
 * @param {Object} player - Obiekt gracza
 * @param {Object} [lStick] - Lewy drążek
 * @param {Object} [bCluster] - Zespół przycisków
 */
export function updateMobileControlStates(player, lStick = leftStick, bCluster = btnCluster, extraOptions = {}) {
  if (!player) return;

  if (player.isProne) {
    pockets.action.currentMode = 'STAND';
  } else if (player.isCrouching) {
    // Tryb leżenia jest dostępny WYŁĄCZNIE kiedy gracz kuca!
    pockets.action.currentMode = 'PRONE';
  } else {
    pockets.action.currentMode = 'KICK';
  }
}

/**
 * Obsługa wciśnięcia zunifikowanego przycisku akcji dynamicznej:
 * - 'PRONE': położenie się na ziemi (dostępne TYLKO podczas kucania)
 * - 'STAND': wstanie na równe nogi
 * - 'KICK': Spartan Kick w starciu wręcz / niszczeniu otoczenia
 *
 * @param {Object} player - Obiekt gracza
 * @param {Function} spawnGrass - Funkcja spawnu cząstzek
 * @param {number} GROUND_Y - Poziom podłoża
 * @param {Object} [extraOptions] - Dodatkowe opcje (targets, obstacles)
 * @returns {boolean|string}
 */
export function handleDynamicActionButtonPress(player, spawnGrass, GROUND_Y, extraOptions = {}) {
  if (!player || player.isDead) return false;

  const mode = pockets.action.currentMode || 'KICK';

  if (mode === 'PRONE') {
    // Tryb leżenia ma być dostępny TYLKO kiedy gracz kuca
    if (!player.isCrouching) return false;

    player.isProne = true;
    player.isCrouching = false;
    player.crouchToggled = true;
    player.state = 'PRONE';
    player.hitboxHeight = 26;
    pockets.action.currentMode = 'STAND';
    return true;
  } else if (mode === 'STAND') {
    player.isProne = false;
    player.isCrouching = false;
    player.crouchToggled = false;
    player.state = 'STAND';
    player.hitboxHeight = player.h || 70;
    pockets.action.currentMode = 'KICK';
    return true;
  } else {
    // Sprawdzenie czy Enforcer w locie wykonuje Tąpnięcie z powietrza (Ground Slam):
    // Wymóg: lewy drążek wychylony w dół (axisY > 0.42) ORAZ wciśnięcie przycisku kopania
    if (player.currentClass?.id === 'ENFORCER' && !player.onGround && !player.isGroundSlamming) {
      const isStickDown = !!(leftStick && leftStick.active && leftStick.axisY > 0.42);
      if (isStickDown) {
        triggerEnforcerGroundSlam(player);
        return true;
      }
    }

    if (player.kickState !== 'IDLE' || (player.kickCooldown && player.kickCooldown > 0)) return false;

    player.isProne = false;
    player.isCrouching = false;
    player.crouchToggled = false;

    const activeTargets = extraOptions.targets || [
      (typeof window !== 'undefined' && window.bot?.active ? window.bot : null),
      (typeof window !== 'undefined' && window.remotePlayer?.active ? window.remotePlayer : null)
    ].filter(Boolean);
    const meleeTarget = findMeleeTarget(player, activeTargets);
    return triggerSpartanKick(player, meleeTarget) || false;
  }
}

export function handleSlideProneButtonPress(player, spawnGrass, GROUND_Y, bCluster = btnCluster) {
  return handleDynamicActionButtonPress(player, spawnGrass, GROUND_Y);
}

/**
 * Wyzwala kopnięcie Spartan Kick z prawego drążka / akcji dotykowej.
 *
 * @param {Object} player - Obiekt gracza
 * @param {Object} [rStick] - Prawy drążek
 * @param {Object} [extraOptions] - Dodatkowe opcje (targets, obstacles, spawnGrass)
 * @returns {string|null}
 */
export function triggerRightStickKick(player, rStick = rightStick, extraOptions = {}) {
  if (!player || player.isDead || player.staggerTimer > 0) return null;
  if (player.kickState !== 'IDLE' || (player.kickCooldown && player.kickCooldown > 0)) return null;

  const activeTargets = extraOptions.targets || [
    (typeof window !== 'undefined' && window.bot?.active ? window.bot : null),
    (typeof window !== 'undefined' && window.remotePlayer?.active ? window.remotePlayer : null)
  ].filter(Boolean);
  const meleeTarget = findMeleeTarget(player, activeTargets);
  return triggerSpartanKick(player, meleeTarget);
}

/**
 * Sprawdza czy dotyk prawego drążka kwalifikuje się jako tap lub szybki flick wykopu
 *
 * @param {Object} rStick - Prawy drążek
 * @param {number} touchDuration - Czas trwania dotknięcia w ms
 * @param {number} movedDist - Maksymalne przemieszczenie palca w px
 * @returns {boolean}
 */
export function checkRightStickFlickOrTap(rStick, touchDuration, movedDist) {
  if (!rStick) return false;

  // 1. Szybki tap w gałkę (< 240 ms, minimalny ruch)
  const isTap = (touchDuration < 240 && movedDist < 25);

  // 2. Szybki flick / gest krawędziowy (< 320 ms, dynamiczne pociągnięcie w stronę krawędzi)
  const isFlick = (touchDuration < 320 && (movedDist >= 25 || rStick.power > 0.35));

  return isTap || isFlick;
}

/**
 * Przywraca poprzednio wybraną broń palną (np. po ataku bronią białą lub rzuceniu tomahawka)
 *
 * @param {Object} player - Obiekt gracza
 * @returns {Object|null}
 */
export function restorePreviousFirearm(player) {
  if (!player || player.isDead) return null;
  const prev = player._previousFirearm;
  let targetWeapon = prev;
  if (!targetWeapon || targetWeapon.isMelee || targetWeapon.id === 'GRENADE') {
    const prevIdx = player.loadout?.previousSlotIndex;
    const curIdx = player.loadout?.pocket1?.activeSlotIndex;
    const curSlot = (typeof prevIdx === 'number' && prevIdx >= 0 && prevIdx < 2)
      ? prevIdx
      : (curIdx === 1 ? 1 : 0);
    const wepId = player.loadout?.pocket1?.slots?.[curSlot] || player.loadout?.pocket1?.slots?.[0] || 'AK47';
    targetWeapon = WEAPONS[wepId] || WEAPONS.AK47;
  }
  if (player.currentWeapon?.isMelee) {
    player.shootCooldown = 0;
  }
  player.currentWeapon = targetWeapon;
  player.isHolstered = false;
  player.meleeState = null;
  player.meleeNeedRelease = false;
  if (player.throwAnim && player.throwAnim.active) {
    player.throwAnim.active = false;
    player.throwAnim.aiming = false;
    player.throwAnim.phase = 'IDLE';
    player.throwAnim.timer = 0;
  }
  if (player.loadout?.pocket1?.slots) {
    const restoredIdx = player.loadout.pocket1.slots.indexOf(targetWeapon.id);
    if (restoredIdx === 0 || restoredIdx === 1) {
      player.loadout.pocket1.activeSlotIndex = restoredIdx;
    }
  }
  if (rightStick) {
    rightStick.armedMode = 'FIREARM';
  }
  return targetWeapon;
}

/**
 * Obsługa wciśnięcia dedykowanego przycisku broni białej na ekranie dotykowym:
 * - Kliknięcie: daje do ręki broń białą i natychmiast wykonuje nią atak
 * - Kolejne użycie, gdy broń jest w ręku: wykonuje kolejny cios combo / atak wręcz
 *
 * @param {Object} player - Obiekt gracza
 * @returns {boolean}
 */
export function handleMeleeButtonPress(player) {
  if (!player || player.isDead) return false;

  const isHoldingMelee = !player.isHolstered && (player.currentWeapon?.isMelee || player.currentWeapon?.id === 'AXE' || player.currentWeapon?.id === 'MACHETE' || player.currentWeapon?.id === 'KNIFE');

  if (!isHoldingMelee) {
    const meleeId = player.loadout?.pocket1?.slots?.[2] || player.meleeWeaponId || 'AXE';
    const targetWeapon = WEAPONS[meleeId] || WEAPONS.AXE || WEAPONS.KNIFE;
    if (targetWeapon.id === 'AXE' && player.axeThrown) {
      return false;
    }

    // 1. Zapisujemy poprzednio wybraną broń palną, by móc do niej natychmiast powrócić po wychyleniu drążka
    if (player.currentWeapon && !player.currentWeapon.isMelee && player.currentWeapon.id !== 'GRENADE') {
      player._previousFirearm = player.currentWeapon;
    } else if (!player._previousFirearm) {
      const curSlot = (player.loadout?.pocket1?.activeSlotIndex === 1) ? 1 : 0;
      const wepId = player.loadout?.pocket1?.slots?.[curSlot] || 'AK47';
      player._previousFirearm = WEAPONS[wepId] || WEAPONS.AK47;
    }

    cancelReload(player, player.currentWeapon);
    if (player.throwAnim && player.throwAnim.active) {
      player.throwAnim.active = false;
      player.throwAnim.aiming = false;
    }

    player.currentWeapon = targetWeapon;
    player.isHolstered = false;
    if (rightStick) {
      rightStick.armedMode = 'FIREARM';
    }

    // Natychmiastowy atak wręcz przy wciśnięciu przycisku!
    player.meleeNeedRelease = false;
    startMeleeAttack(player, targetWeapon);
    return true;
  }

  // 2. Kolejne użycie, gdy broń jest już w ręku: wykonanie ataku wręcz
  if (player.currentWeapon?.id === 'AXE' && player.axeThrown) {
    // Toporek został rzucony i leży na ziemi – gracz ma puste ręce
    return false;
  }

  // Blokada przed działaniem jak automat: wymóg zwolnienia po pełnej serii, ochrona cooldownu i fazy ciosu
  if (player.meleeNeedRelease && !player.isRemote) return false;
  if (player.shootCooldown > 0 && !player.isRemote) return false;
  if (player.meleeState && player.meleeState.phase !== 'RECOVERY' && !player.isRemote) return false;

  startMeleeAttack(player, player.currentWeapon);
  return true;
}
