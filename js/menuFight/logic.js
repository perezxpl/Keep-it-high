// =========================================================================
// MENUFIGHT/LOGIC.JS - LOGIKA BITWY DEMONSTRACYJNEJ W MENU GŁÓWNYM
// Dynamiczna rotacja aren: Arena 2 -> Arena 3 -> Arena 5 -> Arena 3 -> Arena 2
// Płynne przejścia w bok ekranu (Horizontal Slide Transition)
// Zwiększona odporność botów i inteligentna fizyka ratunkowa (zero głupich zgonów w kwasie/przepaści)
// ZERO ctx.shadowBlur, stałe 60 FPS w Chrome
// =========================================================================

import { 
  menuFightState, 
  menuBots, 
  resetMenuBot, 
  ARENA_ROTATION, 
  ARENA_METADATA, 
  ARENA_SPAWN_POINTS 
} from './state.js';
import { updatePlayer } from '../player/index.js';
import { shootWeapon, updateBullets, bullets } from '../weapons.js';
import { updateProjectiles, activeProjectiles } from '../projectiles.js';
import { updateParticles, updateJetpackParticles } from '../world/state.js';
import { spawnRicochetSparks } from '../particles.js';
import { updateGore, spawnBloodSpurt } from '../world/gore.js';
import { updateLighting, addDynamicLight } from '../lighting/index.js';
import { updateMenuCamera, setCameraArenaId, camera } from '../camera.js';
import { checkPlayerPlatformLanding } from '../obstacles/playerPhysics.js';
import { obstacles, customObstacles, ARENA_PLATFORMS, switchArena, activeArenaId } from '../obstacles.js';
import { WEAPONS } from '../weapons/transform.js';
import { updateArena2 } from '../arenas/arena2/state.js';
import { updateArena3 } from '../arenas/arena3.js';
import { getActiveArena } from '../arenas/index.js';
import { prepareTransitionSnapshot } from './renderer.js';

const ARENA_DISPLAY_DURATION = 15.0; // 15 sekund zaciętej walki na każdej arenie
const TRANSITION_DURATION = 2.2;    // 2.2s kinowe, płynne przejście w bok ekranu

export function isMenuFightActive() {
  return menuFightState.active;
}

export function updateMenuSectorTag(arenaId) {
  if (typeof document === 'undefined') return;
  const tagEl = document.getElementById('menu-sector-tag');
  if (tagEl && ARENA_METADATA[arenaId]) {
    tagEl.textContent = ARENA_METADATA[arenaId].shortTag;
  }
}

export function initMenuFight() {
  if (menuFightState.active && menuFightState.initialized) return;

  menuFightState.active = true;
  menuFightState.initialized = true;
  menuFightState.time = 0;
  menuFightState.arenaTime = 0;
  menuFightState.rotationIndex = 0;
  menuFightState.rotationDir = 1;
  menuFightState.transitionPhase = 'NONE';
  menuFightState.transitionTimer = 0;
  menuFightState.slideDir = 1;
  menuFightState.targetArenaId = null;
  menuFightState.arenaId = 'ARENA_2';

  // Załaduj startową Arenę 2 (Toksyczna Rafineria)
  if (typeof switchArena === 'function') {
    try {
      const p = (typeof window !== 'undefined' && window.player) ? window.player : null;
      const b = (typeof window !== 'undefined' && window.ball) ? window.ball : null;
      switchArena('ARENA_2', p, menuBots, b);
      if (typeof setCameraArenaId === 'function') {
        setCameraArenaId('ARENA_2');
      }
    } catch (_) {}
  }

  // Zainicjalizuj 3 boty bojowe na centralnych platformach Areny 2
  for (let i = 0; i < menuBots.length; i++) {
    resetMenuBot(menuBots[i], i, 'ARENA_2');
  }

  updateMenuSectorTag('ARENA_2');
  updateMenuCamera();
}

export function stopMenuFight() {
  menuFightState.active = false;
  menuFightState.initialized = false;
  menuFightState.transitionPhase = 'NONE';
  if (Array.isArray(bullets)) bullets.length = 0;
  if (Array.isArray(activeProjectiles)) activeProjectiles.length = 0;
  if (camera) {
    camera._initialized = false;
  }
  for (const b of menuBots) {
    if (b && b.botKeys) {
      b.botKeys.left = false;
      b.botKeys.right = false;
      b.botKeys.up = false;
      b.botKeys.down = false;
      b.botKeys.space = false;
      b.botKeys.slide = false;
    }
  }
}

/**
 * Główna pętla fizyki, sztucznej inteligencji i płynnej rotacji aren w menu
 */
export function updateMenuFight(dt = 1 / 60) {
  if (!menuFightState.active) {
    initMenuFight();
  }

  menuFightState.time += dt;
  menuFightState.arenaTime += dt;

  // -------------------------------------------------------------------------
  // A. PŁYNNA ROTACJA AREN W BOK: ARENA 2 -> 3 -> 5 -> 3 -> 2 ... (PING-PONG)
  // -------------------------------------------------------------------------
  if (menuFightState.arenaTime >= ARENA_DISPLAY_DURATION && menuFightState.transitionPhase === 'NONE') {
    // Obliczenie kolejnej areny w cyklu ping-pong
    let nextIdx = menuFightState.rotationIndex + menuFightState.rotationDir;
    if (nextIdx >= ARENA_ROTATION.length) {
      menuFightState.rotationDir = -1;
      nextIdx = ARENA_ROTATION.length - 2;
    } else if (nextIdx < 0) {
      menuFightState.rotationDir = 1;
      nextIdx = 1;
    }

    const nextArenaId = ARENA_ROTATION[nextIdx];
    // Kierunek przesunięcia w bok: 1 = ekran przesuwa się w lewo (nowa mapa wjeżdża z prawej)
    // -1 = ekran przesuwa się w prawo (nowa mapa wjeżdża z lewej przy powrocie)
    const slideDir = (menuFightState.rotationDir > 0) ? 1 : -1;

    // Pobierz zrzut aktualnej klatki do płynnego przejścia w bok
    prepareTransitionSnapshot();

    menuFightState.transitionPhase = 'SLIDE';
    menuFightState.transitionTimer = 0;
    menuFightState.slideDir = slideDir;
    menuFightState.targetArenaId = nextArenaId;
    menuFightState.arenaId = nextArenaId;
    menuFightState.rotationIndex = nextIdx;
    menuFightState.arenaTime = 0;

    // Przełączenie fizyki i platform na nową arenę
    try {
      switchArena(nextArenaId, null, menuBots, null);
      if (typeof setCameraArenaId === 'function') {
        setCameraArenaId(nextArenaId);
      }
    } catch (_) {}

    // Wyczyszczenie starych pocisków ze starej mapy
    if (Array.isArray(bullets)) {
      bullets.length = 0;
    }

    // Natychmiastowe rozmieszczenie botów na nowych platformach w kadrze
    for (let i = 0; i < menuBots.length; i++) {
      resetMenuBot(menuBots[i], i, nextArenaId);
    }

    updateMenuCamera();
    updateMenuSectorTag(nextArenaId);
  }

  // Aktualizacja timera przejścia w bok
  if (menuFightState.transitionPhase === 'SLIDE') {
    menuFightState.transitionTimer += dt;
    if (menuFightState.transitionTimer >= TRANSITION_DURATION) {
      menuFightState.transitionPhase = 'NONE';
      menuFightState.transitionTimer = 0;
    }
  }

  // -------------------------------------------------------------------------
  // B. AKTUALIZACJA SYMULACJI BIEŻĄCEJ ARENY
  // -------------------------------------------------------------------------
  const currentArenaId = menuFightState.arenaId || 'ARENA_2';
  const meta = ARENA_METADATA[currentArenaId] || ARENA_METADATA.ARENA_2;
  const effectiveGroundY = meta.deathY + 100;
  const livingBots = menuBots.filter(b => b && !b.isDead);

  // Utrzymuj sztywne wykadrowanie centrum areny
  updateMenuCamera();

  // Aktualizacja mechanik areny (Arena 2: kwas | Arena 3: dżungla | Arena 5: wieża kontenerów)
  if (currentArenaId === 'ARENA_2') {
    try { updateArena2(dt, menuBots); } catch (_) {}
  } else if (currentArenaId === 'ARENA_3') {
    try { updateArena3(dt, menuBots, null); } catch (_) {}
  } else {
    try {
      const curArena = getActiveArena();
      if (curArena && typeof curArena.update === 'function') {
        curArena.update(dt, menuBots, null);
      }
    } catch (_) {}
  }

  // -------------------------------------------------------------------------
  // C. INTELIGENTNA, CIĄGŁA WALKA BOTÓW (ZERO GŁUPICH ZGONÓW)
  // -------------------------------------------------------------------------
  for (let i = 0; i < menuBots.length; i++) {
    const b = menuBots[i];
    if (!b) continue;

    // Obsługa śmierci: szybki respawn po 1 sekundzie (60 klatek)
    if (b.isDead || (b.acidDeath && b.acidDeath.dissolved)) {
      b.respawnTimer = (b.respawnTimer || 60) - 1;
      if (b.respawnTimer <= 0) {
        resetMenuBot(b, null, currentArenaId);
        b.isDead = false;
      }
      continue;
    }

    if (b.acidDeath && b.acidDeath.active) {
      continue;
    }

    // Eliminacja wyłącznie przy wyczerpaniu wysokiego HP (250 HP)
    if (b.hp <= 0 && !b.isDead) {
      b.isDead = true;
      b.respawnTimer = 60;
      spawnBloodSpurt(b.x + 12, b.y + 35, (Math.random() - 0.5) * 4, -3, 16);
      continue;
    }

    // Ciągła samoregeneracja zdrowia i pancerza, by starcia były długie i widowiskowe
    b.hp = Math.min(b.maxHp || 250, b.hp + 0.18);
    b.vestHp = Math.min(b.vestMaxHp || 150, b.vestHp + 0.12);

    // Ciągłe zasilanie amunicji i jetpacka (zero przestojów w walce)
    b.isReloading = false;
    b.reloadTimer = 0;
    if (b.jetFuel < 70) {
      b.jetFuel = 100;
    }
    if (b.ammo && b.currentWeapon) {
      const a = b.ammo[b.currentWeapon.id];
      if (a) {
        a.currentAmmo = 99;
        a.reserveAmmo = 999;
        a.isReloading = false;
      }
    }

    // -----------------------------------------------------------------------
    // SYSTEM RATUNKOWY: AWARYJNY DOPALACZ JETPACKA PRZED PRZEPAŚCIĄ / KWASEM
    // -----------------------------------------------------------------------
    // Gdy bot opada zbyt nisko (w stronę dna kwasu / przepaści / mielarki),
    // natychmiast odpala potężny ciąg jetpacka w górę i steruje ku centrum platform!
    if (b.y > meta.safeFloorY) {
      b.botKeys.up = true;
      b.isJetpacking = true;
      b.vy = Math.min(b.vy, -8.5); // Mocny impuls ratunkowy

      const safeCenterX = (meta.minX + meta.maxX) * 0.5;
      if (b.x < safeCenterX) {
        b.botKeys.right = true;
        b.botKeys.left = false;
      } else {
        b.botKeys.left = true;
        b.botKeys.right = false;
      }
    }

    // Żelazna blokada dna areny: bot natychmiast wraca na poziom platformy
    if (b.y > (meta.safeFloorY + 60)) {
      b.y = meta.safeFloorY - (b.h || 72);
      b.vy = -4;
      b.isJetpacking = true;
    }

    // Poziome granice kadru: boty nie opuszczają widocznego pola walki
    if (b.x < meta.minX) {
      b.x = meta.minX;
      b.vx = Math.max(2.5, b.vx + 3);
      b.botKeys.left = false;
      b.botKeys.right = true;
      b.botKeys.up = true;
      b.isJetpacking = true;
    } else if (b.x > meta.maxX) {
      b.x = meta.maxX;
      b.vx = Math.min(-2.5, b.vx - 3);
      b.botKeys.right = false;
      b.botKeys.left = true;
      b.botKeys.up = true;
      b.isJetpacking = true;
    }

    // -----------------------------------------------------------------------
    // LOGIKA TAKTYCZNA: WYBÓR CELU I INTENSYWNY POJEDYNEK
    // -----------------------------------------------------------------------
    let nearestTarget = null;
    let nearestDist = Infinity;
    for (let j = 0; j < menuBots.length; j++) {
      if (i === j) continue;
      const other = menuBots[j];
      if (other && !other.isDead) {
        const d = Math.hypot(other.x - b.x, other.y - b.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearestTarget = other;
        }
      }
    }

    if (nearestTarget) {
      const dx = nearestTarget.x - b.x;
      const dy = nearestTarget.y - b.y;
      const dist = nearestDist;

      // Celowanie i zwrot
      b.facing = dx >= 0 ? 1 : -1;
      b.aimX = nearestTarget.x + 12;
      b.aimY = nearestTarget.y + 30;

      if (i === 0) {
        // BOT 1: SGT. STRIKER (AK-47) - Taktyczny strzelec wyborowy
        // Dynamiczne manewry: zbliżanie się, strafe, uniki i skoki
        if (dist > 380) {
          if (dx > 0) b.botKeys.right = true;
          else b.botKeys.left = true;
        } else if (dist < 160) {
          if (dx > 0) b.botKeys.left = true;
          else b.botKeys.right = true;
        } else {
          // Strafe na dystansie bojowym
          if (Math.sin(menuFightState.time * 3) > 0) b.botKeys.right = true;
          else b.botKeys.left = true;
        }

        // Skoki i zrywy powietrzne
        if (dy < -40 || Math.random() < 0.20) {
          b.botKeys.up = true;
          b.isJetpacking = true;
        }

        // Ogień ciągły seriami z żółtymi smugami pocisków
        if (b.shootCooldown <= 0) {
          shootWeapon(b, b.currentWeapon);
          b.shootCooldown = 6;
        }

      } else if (i === 1) {
        // BOT 2: COL. ENFORCER (RPG-7) - Ciężkie wsparcie rakietowe
        // Zachowuje bezpieczny dystans, by nie detonować pod własnymi nogami!
        if (dist < 220) {
          // Za blisko: wycofanie się skokiem w tył z jetpackiem
          if (dx > 0) b.botKeys.left = true;
          else b.botKeys.right = true;
          b.botKeys.up = true;
          b.isJetpacking = true;
        } else if (dist > 550) {
          if (dx > 0) b.botKeys.right = true;
          else b.botKeys.left = true;
        }

        // Kolos dominuje z wysoka na jetpacku
        if (dy < -20 || Math.random() < 0.25) {
          b.botKeys.up = true;
          b.isJetpacking = true;
        }

        // Salwy rakietowe co ~0.7 sekundy
        if (b.shootCooldown <= 0) {
          shootWeapon(b, b.currentWeapon);
          b.shootCooldown = 42;
        }

      } else {
        // BOT 3: CYBER REAPER (Nano-Saber) - Bezwzględny mistrz miecza plazmowego
        // Agresywne zrywy, doskoki i odbijanie nadlatujących kul
        if (dx > 0) b.botKeys.right = true;
        else b.botKeys.left = true;

        if (dist > 60) {
          if (dy < -20 || Math.random() < 0.38) {
            b.botKeys.up = true;
            b.isJetpacking = true;
          }
        }

        // Atak cięciem plazmowym w zwarciu
        if (dist < 130) {
          shootWeapon(b, b.currentWeapon);
        }

        // ODBIJANIE KUL PLAZMĄ (Bullet Deflection)
        if (b.meleeState && (b.meleeState.phase === 'ACTIVE' || b.meleeState.phase === 'WINDUP')) {
          if (Array.isArray(bullets) && bullets.length > 0) {
            const bx = b.x + 12;
            const by = b.y + 35;
            for (let bi = 0; bi < bullets.length; bi++) {
              const bull = bullets[bi];
              if (!bull || !bull.active || bull.shooter === b) continue;
              const bDist = Math.hypot(bull.x - bx, bull.y - by);
              if (bDist < 95) {
                bull.vx = -bull.vx * 1.35;
                bull.vy = -bull.vy * 0.75 + (Math.random() - 0.5) * 3;
                bull.shooter = b;
                bull.shooterTeam = b.team;

                spawnRicochetSparks(bull.x, bull.y, bull.vx, bull.vy, 4);
                addDynamicLight({
                  x: bull.x,
                  y: bull.y,
                  radius: 75,
                  color: '#00e5ff',
                  intensity: 0.95,
                  life: 0.12
                });
              }
            }
          }
        }
      }
    }

    // Aktualizacja fizyki postaci (lokomocja, IK, animacje chodu/skoku)
    updatePlayer(b.botKeys, null, effectiveGroundY, null, null, b, livingBots);
    checkPlayerPlatformLanding(b, effectiveGroundY);
  }

  // -------------------------------------------------------------------------
  // D. AKTUALIZACJA POCISKÓW, CZĄSTECZEK I OŚWIETLENIA
  // -------------------------------------------------------------------------
  updateBullets(effectiveGroundY, ARENA_PLATFORMS, null, menuBots);
  updateProjectiles(effectiveGroundY, ARENA_PLATFORMS, customObstacles, menuBots, null);
  updateParticles();
  updateJetpackParticles();
  updateGore(effectiveGroundY, ARENA_PLATFORMS, customObstacles);
  updateLighting(dt);

  updateMenuCamera();
}
