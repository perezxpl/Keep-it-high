// =========================================================================
// PICKUP/LOGIC.JS - FIZYKA LEŻĄCEJ BRONI, ZAMIANA EKWIPUNKU I PRZECHWYTYWANIE
// Standard: Zero emojis, modularyzacja ES, strict DAG
// =========================================================================

import { CONFIG, ARENA_LEFT, ARENA_RIGHT } from '../config.js';
import { WEAPONS, getWeaponAmmo, cancelReload } from '../weapons/transform.js';
import { saveStoredLoadout } from '../loadout/state.js';
import { triggerScreenShake, worldToScreen } from '../camera.js';
import { spawnRicochetSparks } from '../particles.js';
import { triggerCombatFeedBanner } from '../ui/combatFeed.js';
import { keys } from '../input/keyboardMouse.js';
import { gamepadState } from '../input/gamepad.js';
import { activeProjectiles, retrieveThrownTomahawk } from '../projectiles.js';
import { activeCarePackages, awardCarePackageLoot } from '../killstreaks/carePackage.js';
import { ARENA_PLATFORMS, getPlatformSurfaceY } from '../obstacles.js';
import { GROUND_Y, isGroundAt, _worldPlatforms } from '../world/state.js';
import { getActiveArena } from '../arenas/index.js';
import { getRiverbankGroundY } from '../arenas/arena3/state.js';
import { pickupState, pickupPromptState } from './state.js';

/**
 * Spawnuje fizyczny przedmiot broni leżącej na ziemi z zapamiętaną liczbą naboi
 */
export function spawnDroppedWeapon(x, y, vx = 0, vy = 0, weapon = null, facing = 1, ammoState = null, owner = null) {
  if (!weapon) return null;
  const wepId = weapon.id || (typeof weapon === 'string' ? weapon : 'AK47');
  const baseWep = WEAPONS[wepId] || WEAPONS.AK47;

  // Zapamietanie dokladnej liczby naboi w momencie upadku
  let currentAmmo = baseWep.magSize || 30;
  let reserveAmmo = baseWep.reserveAmmo ?? 90;

  if (ammoState && typeof ammoState.currentAmmo === 'number') {
    currentAmmo = ammoState.currentAmmo;
    if (typeof ammoState.reserveAmmo === 'number') {
      reserveAmmo = ammoState.reserveAmmo;
    }
  } else if (owner) {
    const ownerAmmo = getWeaponAmmo(owner, baseWep);
    if (ownerAmmo) {
      currentAmmo = ownerAmmo.currentAmmo;
      reserveAmmo = ownerAmmo.reserveAmmo;
    }
  }

  const dropFacing = (facing === -1) ? -1 : 1;
  const baseVx = (typeof vx === 'number' && !isNaN(vx)) ? vx : 0;
  const initialVx = baseVx * 0.25 + dropFacing * (1.2 + Math.random() * 0.8);

  const baseVy = (typeof vy === 'number' && !isNaN(vy)) ? vy : 0;
  let initialVy = 1.0 + Math.random() * 0.8;
  if (baseVy < -1.0) {
    // Przy silnym wybuchu lub odrzucie minimalny, bezpieczny impuls (max 2 px/frame)
    initialVy = Math.max(-2.0, baseVy * 0.20) + 0.5;
  } else if (baseVy > 0) {
    initialVy = Math.min(8.0, baseVy * 0.40 + 1.0);
  }

  const posX = (typeof x === 'number' && !isNaN(x)) ? x : 500;
  const posY = (typeof y === 'number' && !isNaN(y)) ? y : 500;

  const dropObj = {
    id: `dropped_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    weaponId: wepId,
    weapon: baseWep,
    name: baseWep.name || wepId,
    fullName: baseWep.fullName || baseWep.name || wepId,
    isMelee: !!baseWep.isMelee,
    x: posX,
    y: posY,
    startY: posY,
    vx: initialVx,
    vy: initialVy,
    rot: 0,
    vRot: (Math.random() * 0.16 + 0.08) * dropFacing,
    facing: dropFacing,
    bounces: 0,
    isGrounded: false,
    stuckPlatform: null,
    stuckOffsetX: 0,
    currentAmmo: Math.max(0, currentAmmo),
    reserveAmmo: Math.max(0, reserveAmmo),
    magSize: baseWep.magSize || 30,
    life: 15.0, // 15 sekund trwania w swiecie gry przed zniknieciem
    maxLife: 15.0,
    pickupRadius: 66
  };

  if (owner && owner.isDead) {
    owner._droppedWeaponThisDeath = true;
  }

  pickupState.droppedWeapons.push(dropObj);
  if (pickupState.droppedWeapons.length > pickupState.maxDroppedWeapons) {
    pickupState.droppedWeapons.shift();
  }

  return dropObj;
}

/**
 * Wykonuje zamiane posiadanej broni na bron lezaca
 */
export function performWeaponSwap(player, droppedWeapon) {
  if (!player || player.isDead || !droppedWeapon) return false;
  if (!player.loadout?.pocket1?.slots) return false;

  const currentWep = player.currentWeapon || WEAPONS.AK47;
  const currentWepId = currentWep.id || 'AK47';

  // 1. Zapis stanu amunicji posiadanej broni przed jej upuszczeniem
  const oldAmmo = getWeaponAmmo(player, currentWep);
  const oldMagAmmo = oldAmmo ? oldAmmo.currentAmmo : (currentWep.magSize || 30);
  const oldResAmmo = oldAmmo ? oldAmmo.reserveAmmo : (currentWep.reserveAmmo ?? 90);

  // 2. Upuszczenie posiadanej broni pod nogi gracza (z naturalnej wysokosci pasa w dol)
  spawnDroppedWeapon(
    player.x + (player.w || 24) * 0.5,
    player.y + (player.h ? player.h * 0.5 : 35),
    (player.facing || 1) * 1.5,
    1.2,
    currentWep,
    player.facing || 1,
    { currentAmmo: oldMagAmmo, reserveAmmo: oldResAmmo },
    player
  );

  // 3. Wstawienie nowo podniesionej broni do aktywnego slotu kieszeni 1
  const activeIdx = Math.max(0, Math.min(2, player.loadout.pocket1.activeSlotIndex || 0));
  player.loadout.pocket1.slots[activeIdx] = droppedWeapon.weaponId;

  // 4. Natychmiastowe wyposazenie nowej broni w rece gracza
  const targetWep = droppedWeapon.weapon || WEAPONS[droppedWeapon.weaponId] || WEAPONS.AK47;
  cancelReload(player, player.currentWeapon);
  player.currentWeapon = targetWep;
  player.isHolstered = false;

  // 5. Przywrocenie zapamietanej liczby naboi z podniesionego egzemplarza
  const newAmmo = getWeaponAmmo(player, targetWep);
  if (newAmmo) {
    newAmmo.currentAmmo = droppedWeapon.currentAmmo;
    newAmmo.reserveAmmo = droppedWeapon.reserveAmmo;
    newAmmo.isReloading = false;
    newAmmo.reloadTimer = 0;
  }

  // 6. Reset timera przeladowania na ciele postaci
  player.isReloading = false;
  player.reloadTimer = 0;
  player.reloadProgress = 0;
  player.shootTimer = 12; // krotkie opoznienie gotowosci po przelaczeniu

  // 7. Usuniecie podniesionego egzemplarza ze swiata
  const dropIdx = pickupState.droppedWeapons.indexOf(droppedWeapon);
  if (dropIdx !== -1) {
    pickupState.droppedWeapons.splice(dropIdx, 1);
  }

  // 8. Podniesiona bron jest tymczasowa w danym zyciu - nie nadpisujemy trwalej zbrojowni w localStorage

  // 9. Efekty wizualne i dzwiekowe oraz powiadomienie na banerze
  triggerScreenShake(2.0);
  spawnRicochetSparks(player.x + (player.w || 24) * 0.5, player.y + 24, 0, -1, 6);
  const ammoBadge = targetWep.isMelee ? 'BIAŁA' : `${newAmmo?.currentAmmo ?? 0}/${newAmmo?.reserveAmmo ?? 0}`;
  triggerCombatFeedBanner('KILL', `[BROŃ] PODNIESIONO ${droppedWeapon.fullName} (${ammoBadge})`);

  return true;
}

/**
 * Podniesienie lezacego toporka tomahawk przez gracza
 */
export function performTomahawkPickup(player, tomahawk) {
  if (!player || !tomahawk) return false;
  return retrieveThrownTomahawk(tomahawk, player);
}

/**
 * Przechwycenie zrzutu zaopatrzenia (Care Package)
 */
export function performCarePackageCapture(player, crate) {
  if (!player || !crate) return false;
  crate.captureProgress = 1.0;
  awardCarePackageLoot(crate, player, player);
  return true;
}

/**
 * Oblicza wlasciwa wysokosc podloza dla aktywnej areny pod dana wspolrzedna X
 */
export function getArenaGroundYAt(x) {
  const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
  const aId = curArena?.id || (typeof window !== 'undefined' && window.activeArenaId) || '';

  if (aId === 'arena-3' || aId === 'ARENA_3' || aId === 'ARENA_FOUNDRY') {
    return (typeof getRiverbankGroundY === 'function') ? getRiverbankGroundY(x) : 900;
  }
  if (aId === 'arena-4' || aId === 'ARENA_4' || aId === 'OBSIDIAN_CALDERA' || aId === 'CALDERA') {
    return (curArena && typeof curArena.mainDeckY === 'number') ? curArena.mainDeckY : 1040;
  }
  if (aId === 'arena-5' || aId === 'ARENA_5' || aId === 'PREFAB_TOWER') {
    if (typeof window !== 'undefined' && typeof window.arena5State?.currentFloorY === 'number') {
      return window.arena5State.currentFloorY;
    }
    return (curArena && typeof curArena.mainDeckY === 'number') ? curArena.mainDeckY : 1200;
  }
  if (aId === 'arena-2' || aId === 'ARENA_2' || aId === 'ARENA_2_SECTOR_X' || aId === 'ARENA_2_PANDORA') {
    return (typeof curArena?.acidSurge?.currentY === 'number')
      ? (curArena.acidSurge.currentY - 10)
      : (curArena?.hazardZoneY ?? 1350);
  }
  return GROUND_Y || 1000;
}

/**
 * Zwraca poziom najblizszej powierzchni pod obiektem (platforma lub podloze areny)
 */
export function getGroundSurfaceBelow(x, currentY, startY = null) {
  const activePlats = (typeof window !== 'undefined' && Array.isArray(window.ARENA_PLATFORMS)) ? window.ARENA_PLATFORMS : _worldPlatforms;
  const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
  const aId = curArena?.id || (typeof window !== 'undefined' && window.activeArenaId) || '';
  const isA3 = (aId === 'arena-3' || aId === 'ARENA_3' || aId === 'ARENA_FOUNDRY');

  const baseGroundY = getArenaGroundYAt(x);
  const hasGround = (typeof isGroundAt === 'function') ? isGroundAt(x) : true;
  let surfaceY = hasGround ? (baseGroundY - 4) : (baseGroundY + 1200);

  if (Array.isArray(activePlats)) {
    for (const plat of activePlats) {
      if (!plat || plat.solid === false || plat.isWall) continue;
      if (plat.isCrossbar || plat.id?.startsWith('crossbar')) continue;
      if (plat.isCeiling || plat.isHanging || plat.id?.startsWith('ceil_') || plat.id?.startsWith('ceiling')) continue;
      if (isA3 && (plat.id === 'ground_left' || plat.id === 'ground_right' || plat.id === 'riverbank_left_oval' || plat.id === 'riverbank_right_oval')) continue;

      const minX = (plat.x !== undefined) ? plat.x : 0;
      const maxX = minX + (plat.w || 0);
      if (x >= minX - 4 && x <= maxX + 4) {
        const topY = getPlatformSurfaceY(plat, x, baseGroundY);
        if (typeof topY === 'number' && !isNaN(topY)) {
          if (typeof startY === 'number' && topY < startY - 10) continue;
          if (topY >= currentY - 8 && topY < surfaceY) {
            surfaceY = topY - 4;
          }
        }
      }
    }
  }

  return surfaceY;
}

/**
 * Glowna petla aktualizacji fizyki lezacej broni i interakcji z graczem
 */
export function updatePickups(dt = (1 / 60), player = null, combatants = [], camera = null) {
  const safeDt = (typeof dt === 'number' && dt > 0 && dt < 1) ? dt : (1 / 60);

  // 1. Aktualizacja fizyki upuszczonych broni w swiecie
  const activePlats = (typeof window !== 'undefined' && Array.isArray(window.ARENA_PLATFORMS)) ? window.ARENA_PLATFORMS : _worldPlatforms;
  const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
  const aId = curArena?.id || (typeof window !== 'undefined' && window.activeArenaId) || '';
  const isA3 = (aId === 'arena-3' || aId === 'ARENA_3' || aId === 'ARENA_FOUNDRY');

  for (let i = pickupState.droppedWeapons.length - 1; i >= 0; i--) {
    const dw = pickupState.droppedWeapons[i];
    dw.life -= safeDt;

    if (dw.isGrounded) {
      if (dw.stuckPlatform) {
        if (dw.stuckPlatform.isDestroyed || dw.stuckPlatform.solid === false || (Array.isArray(activePlats) && !activePlats.includes(dw.stuckPlatform))) {
          dw.isGrounded = false;
          dw.stuckPlatform = null;
          dw.vy = 1.0;
        } else {
          // Synchronizacja z poruszajaca sie platforma (np. klocki w Arenie 5)
          dw.x = dw.stuckPlatform.x + dw.stuckOffsetX;
          const baseGround = getArenaGroundYAt(dw.x);
          const platY = (dw.stuckPlatform.y !== undefined) ? dw.stuckPlatform.y : (baseGround - (dw.stuckPlatform.relY || 0));
          dw.y = platY - 4;
        }
      } else {
        const hasGround = (typeof isGroundAt === 'function') ? isGroundAt(dw.x) : true;
        if (!hasGround) {
          dw.isGrounded = false;
          dw.vy = 1.5;
        }
      }
    } else {
      const prevY = dw.y;
      // Zwiekszona, dynamiczna grawitacja - szybki, naturalny upadek broni na podloze
      dw.vy += (CONFIG.GRAVITY || 0.38) * 1.5;
      if (dw.vy > 16.0) dw.vy = 16.0;
      dw.vx *= 0.96;
      dw.x += dw.vx;
      dw.y += dw.vy;
      dw.rot += dw.vRot;

      const baseGroundY = getArenaGroundYAt(dw.x);
      let slope = 0;
      if (isA3 && typeof getRiverbankGroundY === 'function') {
        slope = (getRiverbankGroundY(dw.x + 4) - getRiverbankGroundY(dw.x - 4)) / 8;
      }

      const hasGround = (typeof isGroundAt === 'function') ? isGroundAt(dw.x) : true;
      let landed = false;
      let floorY = hasGround ? (baseGroundY - 4) : (baseGroundY + 1200);
      let hitPlat = null;

      // 1. Detekcja kolizji z platformami (swept collision)
      if (dw.vy > 0 && Array.isArray(activePlats)) {
        let highestSurfY = null;
        for (const plat of activePlats) {
          if (!plat || plat.solid === false || plat.isWall) continue;
          if (plat.isCrossbar || plat.id?.startsWith('crossbar')) continue;
          if (plat.isCeiling || plat.isHanging || plat.id?.startsWith('ceil_') || plat.id?.startsWith('ceiling')) continue;
          if (isA3 && (plat.id === 'ground_left' || plat.id === 'ground_right' || plat.id === 'riverbank_left_oval' || plat.id === 'riverbank_right_oval')) continue;

          const minX = (plat.x !== undefined) ? plat.x : 0;
          const maxX = minX + (plat.w || 0);
          if (dw.x >= minX - 4 && dw.x <= maxX + 4) {
            const topY = getPlatformSurfaceY(plat, dw.x, baseGroundY);
            if (typeof topY === 'number' && !isNaN(topY)) {
              if (typeof dw.startY === 'number' && topY < dw.startY - 10) continue;

              if (prevY <= topY + 8 && dw.y >= topY - 4) {
                if (highestSurfY === null || topY < highestSurfY) {
                  highestSurfY = topY;
                  hitPlat = plat;
                }
              }
            }
          }
        }

        if (highestSurfY !== null) {
          floorY = highestSurfY - 4;
          landed = true;
        }
      }

      // 2. Ladowanie na ziemi jesli nie trafiono platformy
      if (!landed && hasGround) {
        if (prevY <= baseGroundY + 8 && dw.y >= baseGroundY - 4 && dw.vy > 0) {
          floorY = baseGroundY - 4;
          landed = true;
          hitPlat = null;
        }
      }

      // 3. Obsluga ladowania i ewentualnego pojedynczego odbicia
      if (landed) {
        dw.y = floorY;
        if (Math.abs(dw.vy) > 3.0 && dw.bounces < 1) {
          dw.vy = -Math.min(2.0, dw.vy * 0.25);
          dw.vx *= 0.50;
          if (Math.abs(slope) > 0.03) dw.vx += slope * 0.30;
          dw.vRot *= 0.35;
          dw.bounces++;
          spawnRicochetSparks(dw.x, floorY, 0, -1, 3);
        } else {
          dw.isGrounded = true;
          dw.vy = 0;
          dw.vx = 0;
          dw.vRot = 0;
          dw.rot = 0;
          if (hitPlat) {
            dw.stuckPlatform = hitPlat;
            dw.stuckOffsetX = dw.x - hitPlat.x;
          }
        }
      }
    }

    if (dw.life <= 0 || dw.y > getArenaGroundYAt(dw.x) + 800) {
      pickupState.droppedWeapons.splice(i, 1);
    }
  }

  // 2. Detekcja najblizszego obiektu interaktywnego dla lokalnego gracza
  if (!player || player.isDead) {
    pickupPromptState.promptAlpha = Math.max(0, pickupPromptState.promptAlpha - safeDt * 6.0);
    if (pickupPromptState.promptAlpha <= 0) {
      pickupPromptState.currentInteractable = null;
      pickupPromptState.touchButtonBounds.active = false;
      pickupPromptState.isHoldingTouch = false;
    }
    return;
  }

  const pMidX = player.x + (player.w || 24) * 0.5;
  const pMidY = player.y + (player.h || 70) * 0.5;

  let bestTarget = null;
  let bestDist = Infinity;
  let bestType = null;

  // A. Sprawdz lezace bronie (zasieg ~66px, wylacznie uziemione na podlozu/platformie)
  for (const dw of pickupState.droppedWeapons) {
    if (!dw || dw.life <= 0 || !dw.isGrounded) continue;
    const d = Math.hypot(pMidX - dw.x, pMidY - (dw.y - 6));
    if (d <= dw.pickupRadius && d < bestDist) {
      bestDist = d;
      bestTarget = dw;
      bestType = 'WEAPON';
    }
  }

  // B. Sprawdz wbity toporek tomahawk (zasieg ~64px)
  if (Array.isArray(activeProjectiles)) {
    for (const proj of activeProjectiles) {
      if (proj && proj.type === 'TOMAHAWK' && proj.state === 'GROUNDED') {
        const d = Math.hypot(pMidX - proj.x, pMidY - proj.y);
        if (d <= (proj.pickupRadius || 62) && d < bestDist) {
          bestDist = d;
          bestTarget = proj;
          bestType = 'TOMAHAWK';
        }
      }
    }
  }

  // C. Sprawdz zrzut zaopatrzenia na ziemi (zasieg ~75px)
  if (Array.isArray(activeCarePackages)) {
    for (const crate of activeCarePackages) {
      if (crate && crate.isGrounded && !crate.isOpen) {
        const cx = crate.x + crate.w * 0.5;
        const cy = crate.y + crate.h * 0.5;
        const d = Math.hypot(pMidX - cx, pMidY - cy);
        if (d <= 75 && d < bestDist) {
          bestDist = d;
          bestTarget = crate;
          bestType = 'CARE_PACKAGE';
        }
      }
    }
  }

  // 3. Obsluga zaznaczonego kandydata do interakcji
  if (bestTarget && bestType) {
    let candidate = pickupPromptState.currentInteractable;
    if (!candidate || candidate.target !== bestTarget || candidate.type !== bestType) {
      let label = 'ZAMIEŃ';
      let sublabel = '';
      let holdDuration = 0.40;

      if (bestType === 'WEAPON') {
        label = bestTarget.name || bestTarget.fullName || 'BROŃ';
        sublabel = bestTarget.isMelee ? 'BROŃ BIAŁA' : `NABOJE: ${bestTarget.currentAmmo} / ${bestTarget.reserveAmmo}`;
        holdDuration = 0.40;
      } else if (bestType === 'TOMAHAWK') {
        label = 'TOMAHAWK';
        sublabel = 'PRZYTRZYMAJ ABY ODZYSKAĆ';
        holdDuration = 0.30;
      } else if (bestType === 'CARE_PACKAGE') {
        label = 'ZRZUT ZAOPATRZENIA';
        sublabel = 'PRZECHWYĆ SKRZYNIĘ';
        holdDuration = 1.20;
      }

      candidate = {
        type: bestType,
        target: bestTarget,
        x: bestType === 'CARE_PACKAGE' ? (bestTarget.x + bestTarget.w * 0.5) : bestTarget.x,
        y: bestType === 'CARE_PACKAGE' ? (bestTarget.y + bestTarget.h * 0.5) : bestTarget.y,
        label,
        sublabel,
        progress: (bestType === 'CARE_PACKAGE' && typeof bestTarget.captureProgress === 'number') ? bestTarget.captureProgress : 0.0,
        holdDuration
      };
      pickupPromptState.currentInteractable = candidate;
    } else {
      // Odswiezenie pozycji w czasie rzeczywistym
      candidate.x = bestType === 'CARE_PACKAGE' ? (bestTarget.x + bestTarget.w * 0.5) : bestTarget.x;
      candidate.y = bestType === 'CARE_PACKAGE' ? (bestTarget.y + bestTarget.h * 0.5) : bestTarget.y;
    }

    // Plynne pojawienie sie przycisku
    pickupPromptState.promptAlpha = Math.min(1.0, pickupPromptState.promptAlpha + safeDt * 6.5);

    // Przeliczenie pozycji na ekranie dla dotyku
    const scrPos = worldToScreen(candidate.x, candidate.y - 40, camera);
    const w = (typeof window !== 'undefined') ? (window.innerWidth || 1920) : 1920;
    const h = (typeof window !== 'undefined') ? (window.innerHeight || 1080) : 1080;
    const btnX = Math.max(36, Math.min(w - 36, scrPos.x));
    const btnY = Math.max(36, Math.min(h - 60, scrPos.y));

    pickupPromptState.touchButtonBounds.x = btnX;
    pickupPromptState.touchButtonBounds.y = btnY;
    pickupPromptState.touchButtonBounds.r = 21;
    pickupPromptState.touchButtonBounds.hitR = 35;
    pickupPromptState.touchButtonBounds.active = true;

    // Sprawdzenie intencji przytrzymania przycisku interakcji
    const isHoldingKey = !!(keys.KeyE || keys.KeyF || keys.interact);
    const isHoldingPad = !!(gamepadState.buttons && (gamepadState.buttons.west || gamepadState.buttons.south));
    const isHolding = pickupPromptState.isHoldingTouch || pickupPromptState.isHoldingMouse || isHoldingKey || isHoldingPad;

    if (isHolding) {
      candidate.progress += safeDt / candidate.holdDuration;
      if (bestType === 'CARE_PACKAGE') {
        bestTarget.captureProgress = candidate.progress;
        bestTarget.capturingEntity = player;
      }

      if (candidate.progress >= 1.0) {
        if (bestType === 'WEAPON') {
          performWeaponSwap(player, bestTarget);
        } else if (bestType === 'TOMAHAWK') {
          performTomahawkPickup(player, bestTarget);
        } else if (bestType === 'CARE_PACKAGE') {
          performCarePackageCapture(player, bestTarget);
        }
        candidate.progress = 0.0;
        pickupPromptState.isHoldingTouch = false;
        pickupPromptState.isHoldingMouse = false;
        pickupPromptState.currentInteractable = null;
        pickupPromptState.touchButtonBounds.active = false;
      }
    } else {
      candidate.progress = Math.max(0, candidate.progress - safeDt * 2.6);
      if (bestType === 'CARE_PACKAGE') {
        bestTarget.captureProgress = candidate.progress;
        if (bestTarget.captureProgress <= 0) {
          bestTarget.capturingEntity = null;
        }
      }
    }
  } else {
    // Brak kandydata w zasiegu: plynne wygaszanie
    pickupPromptState.promptAlpha = Math.max(0, pickupPromptState.promptAlpha - safeDt * 6.0);
    if (pickupPromptState.promptAlpha <= 0) {
      pickupPromptState.currentInteractable = null;
      pickupPromptState.touchButtonBounds.active = false;
      pickupPromptState.isHoldingTouch = false;
      pickupPromptState.isHoldingMouse = false;
    }
  }
}

/**
 * Obsluga zdarzenia touchstart dla dotykowego przycisku podnoszenia
 */
export function handlePickupTouchStart(touchX, touchY, touchId) {
  if (!pickupPromptState.touchButtonBounds.active || pickupPromptState.promptAlpha < 0.2) return false;
  const b = pickupPromptState.touchButtonBounds;
  const d = Math.hypot(touchX - b.x, touchY - b.y);
  if (d <= b.hitR) {
    pickupPromptState.activeTouchId = touchId;
    pickupPromptState.isHoldingTouch = true;
    return true; // Przechwycono dotyk
  }
  return false;
}

/**
 * Obsluga zdarzenia touchmove
 */
export function handlePickupTouchMove(touchX, touchY, touchId) {
  if (!pickupPromptState.isHoldingTouch || touchId !== pickupPromptState.activeTouchId) return;
  const b = pickupPromptState.touchButtonBounds;
  const d = Math.hypot(touchX - b.x, touchY - b.y);
  if (d > b.hitR * 1.6) {
    pickupPromptState.isHoldingTouch = false;
    pickupPromptState.activeTouchId = null;
  }
}

/**
 * Obsluga zdarzenia touchend / touchcancel
 */
export function handlePickupTouchEnd(touchId) {
  if (touchId === pickupPromptState.activeTouchId) {
    pickupPromptState.isHoldingTouch = false;
    pickupPromptState.activeTouchId = null;
  }
}
