// =============================================================================
// JS/KILLSTREAKS/CAREPACKAGE.JS - ZRZUT ZAOPATRZENIA (CARE PACKAGE)
// Moduł zrzutu skrzyń ze spadochronem, przechwytywania i przydziału łupów
// Styl: Modern Military (ZERO EMOJIS, taktyczne flary, skrzynie US-MIL)
// =============================================================================

import { isTouchDevice } from '../config.js';
import { triggerScreenShake } from '../camera.js';
import { GROUND_Y, spawnGroundPuff, spawnJetpackSparks } from '../world/state.js';
import { ARENA_PLATFORMS, getActiveArena, activeArenaId, getPlatformSurfaceY } from '../obstacles.js';
import { WEAPONS, getWeaponAmmo } from '../weapons/transform.js';
import { triggerCombatFeedBanner } from '../ui/combatFeed.js';
import { killstreakState } from './state.js';
import { spawnMortarStrike, spawnAttackDrone } from './supportStrikes.js';
import { spawnSentryGun } from './sentryGun.js';

function getKeys() {
  if (typeof window !== 'undefined' && window.keys) return window.keys;
  return {};
}

export const activeCarePackages = [];
export const activeFlares = [];

/**
 * Oblicza wysokość powierzchni lądowania (ziemia / platforma) pod danym X
 */
export function getCarePackageSurfaceY(x) {
  const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
  const isA2 = (curArena?.id === 'arena-2' || activeArenaId === 'ARENA_2' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X' || activeArenaId === 'ARENA_2_PANDORA');
  const isA3 = (curArena?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY');

  let groundY = GROUND_Y || 960;
  if (isA2) {
    groundY = (typeof curArena?.acidSurge?.currentY === 'number')
      ? (curArena.acidSurge.currentY - 10)
      : (curArena?.hazardZoneY ?? 1440);
  } else if (isA3) {
    if (x < 1150) groundY = 1200;
    else if (x <= 1750) groundY = 1200 + ((x - 1150) / 600) * 135;
    else if (x < 2650) groundY = 1390;
    else if (x <= 3250) groundY = 1335 - ((x - 2650) / 600) * 135;
    else groundY = 1200;
  }

  let highestY = groundY;
  const plats = ARENA_PLATFORMS || [];
  for (const plat of plats) {
    if (!plat || plat.solid === false || plat.isWall) continue;
    if (x >= plat.x - 12 && x <= plat.x + plat.w + 12) {
      const topY = (plat.surfacePoints && typeof getPlatformSurfaceY === 'function')
        ? getPlatformSurfaceY(plat, x, groundY)
        : ((plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0)));
      if (typeof topY === 'number' && !isNaN(topY) && topY < highestY && topY > 80) {
        highestY = topY;
      }
    }
  }
  return highestY;
}

/**
 * Inicjalizacja / reset modułu skrzyń zrzutowych
 */
export function initCarePackages() {
  activeCarePackages.length = 0;
  activeFlares.length = 0;
}

/**
 * Tworzy nowy zrzut zaopatrzenia w wybranym punkcie X
 * @param {object} owner - podmiot wzywający (np. gracz)
 * @param {number} targetX - docelowa pozycja X na mapie
 */
export function spawnCarePackage(owner, targetX) {
  const safeX = (typeof targetX === 'number' && !isNaN(targetX)) ? targetX : 500;
  const landingY = getCarePackageSurfaceY(safeX);

  const crateId = `cp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // 1. Dodanie flary dymnej na podłożu
  activeFlares.push({
    id: `flare_${crateId}`,
    crateId,
    x: safeX,
    y: landingY,
    timer: 16.0,
    extinguishing: false,
    particles: []
  });

  // 2. Utworzenie skrzyni spadającej z powietrza na spadochronie
  activeCarePackages.push({
    id: crateId,
    owner,
    x: safeX - 19,
    y: landingY - 480,
    w: 38,
    h: 28,
    vy: 2.8,
    isFalling: true,
    isGrounded: false,
    parachuteAlpha: 1.0,
    swayTimer: Math.random() * Math.PI * 2,
    captureProgress: 0.0,
    capturingEntity: null,
    isOpen: false,
    openedTimer: 0,
    floatingNotice: null,
    landingY
  });

  if (owner && !owner.isBot && !owner.isRemote) {
    triggerCombatFeedBanner('KILL', '[ZRZUT] FLARA TAKTYCZNA AKTYWNA - SKRZYNIA W DRODZE');
  }
}

/**
 * Losuje zawartość zrzutu zgodnie z zatwierdzoną tabelą nagród:
 * 35% Ciężki Pancerz (100 HP kamizelki + hełm FAST + 100 HP)
 * 25% Pełna Amunicja (wszystkie bronie na max + reset granatów)
 * 20% Nalot Moździerzowy [NALOT] (5-killstreak)
 * 12% Wieżyczka Strażnicza [SENTRY] (7-killstreak)
 * 9% Dron Bojowy [DRON] (9-killstreak wsparcia z powietrza)
 * 4% Pancerz Juggernaut [KOLOS] (11-killstreak 250 HP)
 */
function rollCarePackageLoot() {
  const roll = Math.random() * 100;
  if (roll < 30) return 'HEAVY_ARMOR';
  if (roll < 52) return 'FULL_AMMO';
  if (roll < 72) return 'MORTAR_STRIKE';
  if (roll < 85) return 'SENTRY_GUN';
  if (roll < 95) return 'ATTACK_DRONE';
  return 'JUGGERNAUT';
}

/**
 * Przyznanie nagrody podmiotowi, który przechwycił zrzut
 */
function awardCarePackageLoot(crate, recipient, player) {
  crate.isOpen = true;
  crate.isGrounded = false;
  crate.openedTimer = 2.4;

  triggerScreenShake(2.5);
  spawnJetpackSparks(crate.x + crate.w / 2, crate.y + crate.h / 2, 1, 14, ['#facc15', '#00e5ff', '#ffffff', '#22c55e'], 0, -2.5);

  const loot = rollCarePackageLoot();
  const isPlayer = (recipient === player);

  switch (loot) {
    case 'HEAVY_ARMOR': {
      recipient.hasVest = true;
      recipient.vestHp = 100;
      recipient.hasHelmet = true;
      recipient.hp = recipient.maxHp || 100;
      if (recipient.visuals) {
        recipient.visuals.hasVest = true;
        recipient.visuals.hasHelmet = true;
      }

      const label = 'CIĘŻKI PANCERZ (100 HP) + HEŁM';
      crate.floatingNotice = { text: `[+] ${label}`, color: '#22c55e', y: crate.y - 12, alpha: 1.0 };

      if (isPlayer) {
        triggerCombatFeedBanner('KILL', `[ZRZUT] OTRZYMANO: ${label}`);
        killstreakState.recentNotification = {
          title: '[ZRZUT] ZAOPATRZENIE',
          text: label,
          color: '#22c55e'
        };
        killstreakState.notificationTimer = 3.5;
      } else {
        triggerCombatFeedBanner('DEATH', `[UWAGA] BOT PRZECHWYCIŁ: ${label}`);
      }
      break;
    }

    case 'FULL_AMMO': {
      for (const wepId of ['AK47', 'SHOTGUN', 'SNIPER']) {
        const ammo = getWeaponAmmo(recipient, wepId);
        if (ammo) {
          ammo.currentAmmo = ammo.magSize;
          ammo.reserveAmmo = (wepId === 'SHOTGUN' ? 64 : (wepId === 'SNIPER' ? 25 : 120));
          ammo.isReloading = false;
          ammo.reloadTimer = 0;
        }
      }
      if (recipient.grenadeCooldown !== undefined) {
        recipient.grenadeCooldown = 0;
      }

      const label = 'PEŁNA AMUNICJA I GRANATY';
      crate.floatingNotice = { text: `[+] ${label}`, color: '#38bdf8', y: crate.y - 12, alpha: 1.0 };

      if (isPlayer) {
        triggerCombatFeedBanner('KILL', `[ZRZUT] OTRZYMANO: ${label}`);
        killstreakState.recentNotification = {
          title: '[ZRZUT] ZAOPATRZENIE',
          text: label,
          color: '#38bdf8'
        };
        killstreakState.notificationTimer = 3.5;
      } else {
        triggerCombatFeedBanner('DEATH', `[UWAGA] BOT PRZECHWYCIŁ: ${label}`);
      }
      break;
    }

    case 'MORTAR_STRIKE': {
      const label = 'NALOT MOŹDZIERZOWY [NALOT]';
      crate.floatingNotice = { text: `[+] ${label}`, color: '#f59e0b', y: crate.y - 12, alpha: 1.0 };

      if (isPlayer) {
        killstreakState.availableStreaks.push('MORTAR_STRIKE');
        triggerCombatFeedBanner('KILL', `[ZRZUT] ODBLOKOWANO: ${label} [KLAWISZ 4]`);
        killstreakState.recentNotification = {
          title: '[ZRZUT] SERIA ZABÓJSTW',
          text: `${label} GOTOWY DO UŻYCIA [KLAWISZ 4]`,
          color: '#f59e0b'
        };
        killstreakState.notificationTimer = 4.0;
      } else {
        spawnMortarStrike(player ? player.x : crate.x, recipient);
        triggerCombatFeedBanner('DEATH', `[UWAGA] BOT WEZWAŁ: ${label}!`);
      }
      break;
    }

    case 'SENTRY_GUN': {
      const label = 'WIEŻYCZKA STRAŻNICZA [SENTRY]';
      crate.floatingNotice = { text: `[+] ${label}`, color: '#00e5ff', y: crate.y - 12, alpha: 1.0 };

      if (isPlayer) {
        killstreakState.availableStreaks.push('SENTRY_GUN');
        triggerCombatFeedBanner('KILL', `[ZRZUT] ODBLOKOWANO: ${label} [KLAWISZ 4]`);
        killstreakState.recentNotification = {
          title: '[ZRZUT] SERIA ZABÓJSTW',
          text: `${label} GOTOWA DO ROZSTAWIENIA [KLAWISZ 4]`,
          color: '#00e5ff'
        };
        killstreakState.notificationTimer = 4.0;
      } else {
        spawnSentryGun(recipient, recipient.x + (recipient.facing || 1) * 45);
        triggerCombatFeedBanner('DEATH', `[UWAGA] BOT ROZSTAWIŁ: ${label}!`);
      }
      break;
    }

    case 'ATTACK_DRONE': {
      const label = 'DRON BOJOWY [DRON] (25S)';
      crate.floatingNotice = { text: `[+] ${label}`, color: '#00e5ff', y: crate.y - 12, alpha: 1.0 };

      spawnAttackDrone(recipient);

      if (isPlayer) {
        triggerCombatFeedBanner('KILL', `[ZRZUT] WSPARCIE POWIETRZNE: ${label}`);
        killstreakState.recentNotification = {
          title: '[ZRZUT] WSPARCIE POWIETRZNE',
          text: 'DRON BOJOWY WSPIERA OPERATORA PRZEZ 25S',
          color: '#00e5ff'
        };
        killstreakState.notificationTimer = 4.0;
      } else {
        triggerCombatFeedBanner('DEATH', `[UWAGA] BOT URUCHOMIŁ: ${label}!`);
      }
      break;
    }

    case 'JUGGERNAUT': {
      recipient.maxHp = 250;
      recipient.hp = 250;
      recipient.hasVest = true;
      recipient.vestHp = 200;
      recipient.hasHelmet = true;
      if (recipient.visuals) {
        recipient.visuals.hasVest = true;
        recipient.visuals.hasHelmet = true;
      }

      const label = 'PANCERZ JUGGERNAUT [KOLOS] (250 HP)';
      crate.floatingNotice = { text: `[KOLOS] ${label}`, color: '#eab308', y: crate.y - 12, alpha: 1.0 };

      if (isPlayer) {
        triggerCombatFeedBanner('KILL', `[ZRZUT] JACKPOT! ${label}`);
        killstreakState.recentNotification = {
          title: '[ZRZUT] PANCERZ JUGGERNAUT',
          text: 'CIĘŻKI PANCERZ TYTANOWY (250 HP / 200 KEVLARU)',
          color: '#eab308'
        };
        killstreakState.notificationTimer = 5.0;
      } else {
        triggerCombatFeedBanner('DEATH', `[UWAGA] BOT ZDOBYŁ: ${label}!`);
      }
      break;
    }
  }
}

/**
 * Główna pętla aktualizacji fizyki, kolizji i przechwytywania zrzutów
 */
export function updateCarePackages(dt = (1 / 60), player = null, combatants = []) {
  const safeDt = (typeof dt === 'number' && dt > 0 && dt < 1) ? dt : (1 / 60);
  const isMobile = !!(
    isTouchDevice ||
    (typeof window !== 'undefined' && (window.innerWidth <= 850 || ('ontouchstart' in window) || (navigator && navigator.maxTouchPoints > 0)))
  );

  // 1. Aktualizacja flar dymnych
  for (let i = activeFlares.length - 1; i >= 0; i--) {
    const flare = activeFlares[i];
    flare.timer -= safeDt;

    // Generowanie cząsteczek pomarańczowego dymu TYLKO gdy flara jeszcze płonie
    if (!flare.extinguishing && flare.timer > 0 && Math.random() < 0.65) {
      flare.particles.push({
        x: flare.x + (Math.random() - 0.5) * 8,
        y: flare.y - 2,
        vx: (Math.random() - 0.5) * 0.45,
        vy: -Math.random() * 1.8 - 0.9,
        r: 4.5 + Math.random() * 3.5,
        alpha: 0.65
      });
    }

    // Aktualizacja istniejących kłębów dymu (szybsze wygaszanie po wylądowaniu)
    const fadeSpeed = flare.extinguishing ? 1.4 : 0.42;
    for (let p = flare.particles.length - 1; p >= 0; p--) {
      const part = flare.particles[p];
      part.x += part.vx;
      part.y += part.vy;
      part.r += safeDt * 7.5;
      part.alpha -= safeDt * fadeSpeed;
      if (part.alpha <= 0.02) flare.particles.splice(p, 1);
    }

    if ((flare.timer <= 0 || flare.extinguishing) && flare.particles.length === 0) {
      activeFlares.splice(i, 1);
    }
  }

  // 2. Aktualizacja skrzyń zrzutowych
  for (let i = activeCarePackages.length - 1; i >= 0; i--) {
    const crate = activeCarePackages[i];

    if (crate.isOpen) {
      crate.openedTimer -= safeDt;
      if (crate.floatingNotice) {
        crate.floatingNotice.y -= safeDt * 16;
        crate.floatingNotice.alpha = Math.max(0, crate.floatingNotice.alpha - safeDt * 0.42);
      }
      if (crate.openedTimer <= 0) {
        activeCarePackages.splice(i, 1);
      }
      continue;
    }

    if (crate.isFalling) {
      crate.y += crate.vy;
      crate.swayTimer += safeDt * 2.8;

      // Sprawdzenie lądowania na podłożu lub platformie
      const surfaceY = getCarePackageSurfaceY(crate.x + crate.w / 2);
      if (crate.y + crate.h >= surfaceY) {
        crate.y = surfaceY - crate.h;
        crate.isFalling = false;
        crate.isGrounded = true;
        triggerScreenShake(3.0);
        spawnGroundPuff(crate.x + crate.w / 2, crate.y + crate.h);

        // Flara natychmiast wygasa po wylądowaniu paczki
        for (const flare of activeFlares) {
          if (flare.crateId === crate.id || Math.hypot(flare.x - (crate.x + crate.w / 2), flare.y - (crate.y + crate.h)) < 75) {
            flare.extinguishing = true;
            flare.timer = 0;
          }
        }
      }
    } else if (crate.isGrounded) {
      // Wygasanie spadochronu na ziemi
      if (crate.parachuteAlpha > 0) {
        crate.parachuteAlpha = Math.max(0, crate.parachuteAlpha - safeDt * 0.7);
      }

      // Logika przechwytywania skrzyni
      let capturingEntity = null;

      // A. Sprawdzenie gracza
      if (player && !player.isDead) {
        const px = player.x + (player.w || 32) / 2;
        const py = player.y + (player.h || 58) / 2;
        const cx = crate.x + crate.w / 2;
        const cy = crate.y + crate.h / 2;
        const distToPlayer = Math.hypot(px - cx, py - cy);

        if (distToPlayer <= 68) {
          const k = getKeys();
          const isHoldingInteract = isMobile || !!(k.KeyE || k.interact);
          if (isHoldingInteract) {
            capturingEntity = player;
          }
        }
      }

      // B. Sprawdzenie botów (jeśli gracz nie przechwytuje)
      if (!capturingEntity) {
        const list = Array.isArray(combatants) ? combatants : [];
        for (const c of list) {
          if (!c || c === player || c.isDead || c.active === false) continue;
          const bx = c.x + (c.w || 32) / 2;
          const by = c.y + (c.h || 58) / 2;
          const cx = crate.x + crate.w / 2;
          const cy = crate.y + crate.h / 2;
          if (Math.hypot(bx - cx, by - cy) <= 56) {
            capturingEntity = c;
            break;
          }
        }
      }

      if (capturingEntity) {
        crate.capturingEntity = capturingEntity;
        const speed = (capturingEntity === player) ? (1 / 1.2) : (1 / 1.8);
        crate.captureProgress += safeDt * speed;

        if (crate.captureProgress >= 1.0) {
          awardCarePackageLoot(crate, capturingEntity, player);
        }
      } else if (crate.captureProgress > 0) {
        // Stopniowy spadek paska po przerwaniu interakcji
        crate.captureProgress = Math.max(0, crate.captureProgress - safeDt * 1.4);
        crate.capturingEntity = null;
      }
    }
  }
}

/**
 * Renderowanie flar, skrzyń zrzutowych, spadochronów i pasków postępu
 */
export function drawCarePackages(ctx, camera, player) {
  if (activeFlares.length === 0 && activeCarePackages.length === 0) return;

  const isMobile = !!(
    isTouchDevice ||
    (typeof window !== 'undefined' && (window.innerWidth <= 850 || ('ontouchstart' in window) || (navigator && navigator.maxTouchPoints > 0)))
  );

  ctx.save();

  // 1. Rysowanie flar taktycznych na podłożu
  for (const flare of activeFlares) {
    // Kłęby dymu flary
    for (const p of flare.particles) {
      ctx.fillStyle = `rgba(249, 115, 22, ${Math.max(0, p.alpha * 0.48)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cylindryczny korpus flary na ziemi
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(flare.x - 3, flare.y - 6, 6, 6);

    if (!flare.extinguishing) {
      // Palący się czubek flary
      ctx.fillStyle = '#f97316';
      ctx.fillRect(flare.x - 2, flare.y - 8, 4, 3);

      // Poświata termiczna flary
      const glow = 0.5 + 0.5 * Math.sin(performance.now() * 0.015);
      ctx.fillStyle = `rgba(249, 115, 22, ${0.15 + glow * 0.12})`;
      ctx.beginPath();
      ctx.arc(flare.x, flare.y - 6, 22, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Wypalony kikut zgaszonej flary
      ctx.fillStyle = '#334155';
      ctx.fillRect(flare.x - 2, flare.y - 7, 4, 2);
    }
  }

  // 2. Rysowanie skrzyń zrzutowych i spadochronów
  for (const crate of activeCarePackages) {
    const cx = crate.x + crate.w / 2;
    const cy = crate.y + crate.h / 2;

    // A. Rysowanie spadochronu
    if (crate.parachuteAlpha > 0.05) {
      ctx.save();
      ctx.globalAlpha = crate.parachuteAlpha;

      const sway = crate.isFalling ? Math.sin(crate.swayTimer) * 0.08 : 0;
      ctx.translate(cx, crate.y);
      ctx.rotate(sway);

      const chuteW = 68;
      const chuteH = 34;
      const topY = -70;

      // Linki spadochronu (paracord lines)
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.65)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(-chuteW / 2 + 4, topY + chuteH); ctx.lineTo(-crate.w / 2 + 2, 0);
      ctx.moveTo(-chuteW / 4, topY + chuteH); ctx.lineTo(-crate.w / 4, 0);
      ctx.moveTo(chuteW / 4, topY + chuteH); ctx.lineTo(crate.w / 4, 0);
      ctx.moveTo(chuteW / 2 - 4, topY + chuteH); ctx.lineTo(crate.w / 2 - 2, 0);
      ctx.stroke();

      // Czasza spadochronu (oliwkowy wojskowy nylon)
      ctx.fillStyle = '#2f3e2f';
      ctx.beginPath();
      ctx.arc(0, topY + chuteH, chuteW / 2, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#4b5f4b';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Pas wzmacniający na szczycie czaszy
      ctx.fillStyle = '#475d47';
      ctx.beginPath();
      ctx.arc(0, topY + chuteH, chuteW / 2 - 5, Math.PI * 1.15, Math.PI * 1.85, false);
      ctx.stroke();

      ctx.restore();
    }

    // B. Rysowanie skrzyni bojowej (US Military Spec Crate)
    if (!crate.isOpen) {
      ctx.save();

      // Główny metalowy korpus
      ctx.fillStyle = '#1e281e';
      ctx.fillRect(crate.x, crate.y, crate.w, crate.h);

      // Stalowe narożniki i krawędzie ochronne
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.0;
      ctx.strokeRect(crate.x, crate.y, crate.w, crate.h);

      // Pasy ostrzegawcze (żółto-czarne hazard stripes) na środku
      const stripeY = crate.y + 10;
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(crate.x + 3, stripeY, crate.w - 6, 7);

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      for (let s = 6; s < crate.w - 8; s += 8) {
        ctx.beginPath();
        ctx.moveTo(crate.x + s, stripeY);
        ctx.lineTo(crate.x + s + 5, stripeY + 7);
        ctx.stroke();
      }

      // Etykieta wojskowa
      ctx.font = 'bold 7px monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.textAlign = 'center';
      ctx.fillText('[ZRZUT]', cx, crate.y + 7);

      // Dioda / sygnalizator stroboskopowy na dachu skrzyni
      const strobe = (Math.sin(performance.now() * 0.01) > 0);
      const strobeCol = crate.isFalling ? (strobe ? '#22c55e' : '#14532d') : (strobe ? '#00e5ff' : '#0369a1');

      ctx.fillStyle = strobeCol;
      ctx.beginPath();
      ctx.arc(cx, crate.y - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Poświata diody
      if (strobe) {
        ctx.fillStyle = crate.isFalling ? 'rgba(34, 197, 94, 0.35)' : 'rgba(0, 229, 255, 0.35)';
        ctx.beginPath();
        ctx.arc(cx, crate.y - 2, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // C. Rysowanie pierścienia przechwytywania (Capture HUD Ring)
      if (crate.isGrounded) {
        const px = player ? (player.x + (player.w || 32) / 2) : 0;
        const py = player ? (player.y + (player.h || 58) / 2) : 0;
        const dist = Math.hypot(px - cx, py - cy);
        const inReach = (dist <= 72);

        if (inReach || crate.captureProgress > 0) {
          const ringY = crate.y - 26;
          const radius = 15;

          // Ciemne tło pierścienia
          ctx.beginPath();
          ctx.arc(cx, ringY, radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fill();

          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Wypełnienie postępu (Neon Cyan / Emerald)
          if (crate.captureProgress > 0) {
            ctx.beginPath();
            ctx.arc(
              cx,
              ringY,
              radius,
              -Math.PI / 2,
              -Math.PI / 2 + Math.PI * 2 * Math.min(1.0, crate.captureProgress)
            );
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 3.0;
            ctx.stroke();
          }

          // Procent w środku
          ctx.font = 'bold 8px monospace';
          ctx.fillStyle = '#f8fafc';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${Math.round(crate.captureProgress * 100)}%`, cx, ringY);

          // Etykieta zachęty do przechwycenia
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = (crate.captureProgress > 0) ? '#38bdf8' : '#e2e8f0';
          const k = getKeys();
          const promptText = isMobile
            ? (crate.captureProgress > 0 ? '[PRZECHWYTYWANIE...]' : '[STAŃ BLISKO]')
            : ((k.KeyE || k.interact) ? '[PRZECHWYTYWANIE...]' : '[E] PRZECHWYĆ ZRZUT');
          ctx.fillText(promptText, cx, ringY - 14);
        }
      }
    }

    // D. Pływające powiadomienie po otwarciu
    if (crate.floatingNotice) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, crate.floatingNotice.alpha);
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = crate.floatingNotice.color || '#22c55e';
      ctx.textAlign = 'center';
      ctx.fillText(crate.floatingNotice.text, cx, crate.floatingNotice.y);
      ctx.restore();
    }
  }

  ctx.restore();
}
