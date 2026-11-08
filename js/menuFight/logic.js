// =========================================================================
// MENUFIGHT/LOGIC.JS - LOGIKA BITWY DEMONSTRACYJNEJ W MENU GŁÓWNYM
// Dynamiczne tło Areny 2 (Toksyczna Rafineria) ze statyczną kamerą
// 3 boty na centralnych platformach: AK-47, RPG-7, Nano-Saber (odbijanie kul)
// Kwas, gejzery kropel, rozpuszczanie i błyskawiczny respawn 1.5s
// ZERO ctx.shadowBlur, stałe 60 FPS w Chrome
// =========================================================================

import { menuFightState, menuBots, resetMenuBot, MENU_SPAWN_POINTS } from './state.js';
import { updatePlayer } from '../player/index.js';
import { shootWeapon, updateBullets, bullets } from '../weapons.js';
import { updateProjectiles } from '../projectiles.js';
import { updateParticles, updateJetpackParticles } from '../world/state.js';
import { spawnRicochetSparks } from '../particles.js';
import { updateGore, spawnBloodSpurt } from '../world/gore.js';
import { updateLighting, addDynamicLight } from '../lighting/index.js';
import { updateMenuCamera } from '../camera.js';
import { checkPlayerPlatformLanding } from '../obstacles/playerPhysics.js';
import { obstacles, customObstacles, ARENA_PLATFORMS, switchArena, activeArenaId } from '../obstacles.js';
import { WEAPONS } from '../weapons/transform.js';
import { updateArena2, createAcidSplash, isPlayerSubmergedInAcid } from '../arenas/arena2/state.js';

export function isMenuFightActive() {
  return menuFightState.active;
}

export function initMenuFight() {
  if (menuFightState.active && menuFightState.initialized) return;

  // Upewnij się, że Arena 2 (Toksyczna Rafineria) jest załadowana dla optymalnej geometrii i kwasu
  if (typeof switchArena === 'function' && activeArenaId !== 'ARENA_2') {
    try {
      const p = (typeof window !== 'undefined' && window.player) ? window.player : null;
      const b = (typeof window !== 'undefined' && window.ball) ? window.ball : null;
      switchArena('ARENA_2', p, menuBots, b);
    } catch (_) {}
  }

  // Zainicjalizuj 3 boty bojowe na dedykowanych centralnych platformach
  for (let i = 0; i < menuBots.length; i++) {
    resetMenuBot(menuBots[i], i);
  }

  menuFightState.active = true;
  menuFightState.initialized = true;
  menuFightState.time = 0;
  menuFightState.arenaId = 'ARENA_2';

  // Natychmiastowe zablokowanie sztywnego, statycznego kadru
  updateMenuCamera();
}

export function stopMenuFight() {
  menuFightState.active = false;
  menuFightState.initialized = false;
  // Wyzeruj klawisze botów
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
 * Główna pętla fizyki i sztucznej inteligencji walki w menu
 */
export function updateMenuFight(dt = 1 / 60) {
  if (!menuFightState.active) {
    initMenuFight();
  }

  menuFightState.time += dt;
  const effectiveGroundY = 1600;
  const livingBots = menuBots.filter(b => b && !b.isDead);

  // Utrzymuj całkowicie statyczną kamerę (sztywne wykadrowanie, 0 shake)
  updateMenuCamera();

  // Aktualizacja symulacji kwasu, bąbli, pary i fizyki Areny 2
  try {
    updateArena2(dt, menuBots);
  } catch (_) {}

  // 1. Aktualizacja każdego bota bojowego
  for (let i = 0; i < menuBots.length; i++) {
    const b = menuBots[i];
    if (!b) continue;

    // Obsługa śmierci i błyskawicznego respawnu po 1.5 sekundy (90 klatek)
    if (b.isDead || (b.acidDeath && b.acidDeath.dissolved)) {
      b.respawnTimer = (b.respawnTimer || 90) - 1;
      if (b.respawnTimer <= 0) {
        // Respawnuj na jednej z 3 centralnych platform Areny 2
        resetMenuBot(b);
        b.isDead = false;
      }
      continue;
    }

    // Bot jest w trakcie procesu rozpuszczania w kwasie (animacja zgonu w kwasie)
    if (b.acidDeath && b.acidDeath.active) {
      continue;
    }

    // Sprawdzenie czy bot zginął od obrażeń w tej klatce
    if (b.hp <= 0 && !b.isDead) {
      b.isDead = true;
      b.respawnTimer = 90; // 1.5 sekundy przy 60 FPS
      spawnBloodSpurt(b.x + 12, b.y + 35, (Math.random() - 0.5) * 4, -3, 14);
      continue;
    }

    // Bezpieczeństwo czeluści: zgon w kwasie przy spadku poniżej Y = 1500
    if (b.y > 1500 && !b.isDead) {
      b.isDead = true;
      b.respawnTimer = 90;
      createAcidSplash(b.x + 12, 1440);
      continue;
    }

    // Bezpieczeństwo: broń w dłoni, nieograniczona amunicja i brak przerw na przeładowanie
    b.isHolstered = false;
    b.holsterWeight = 0.0;
    b.isReloading = false;
    b.reloadTimer = 0;
    b.jetFuel = b.jetMax || 100;

    if (b.ammo && b.currentWeapon) {
      b.ammo[b.currentWeapon.id] = {
        currentAmmo: 99,
        reserveAmmo: 999,
        isReloading: false
      };
    }

    // Wyszukaj najbliższego żywego wroga w starciu FFA
    let enemy = null;
    let minDist = Infinity;
    for (const other of livingBots) {
      if (other === b || (other.acidDeath && other.acidDeath.active)) continue;
      const d = Math.hypot(other.x - b.x, other.y - b.y);
      if (d < minDist) {
        minDist = d;
        enemy = other;
      }
    }

    // Reset wejść w klatce
    b.botKeys.left = false;
    b.botKeys.right = false;
    b.botKeys.up = false;
    b.botKeys.down = false;
    b.botKeys.space = false;
    b.botKeys.slide = false;
    b.isJetpacking = false;

    if (enemy) {
      const dx = enemy.x - b.x;
      const dy = enemy.y - b.y;
      const dist = Math.hypot(dx, dy) || 1;

      // Celowanie dynamiczne w środek sylwetki wroga
      b.aimX = enemy.x + (enemy.w || 24) * 0.5;
      b.aimY = enemy.y + (enemy.h || 70) * 0.45;
      b.facing = (dx >= 0) ? 1 : -1;

      // PODKRĘCONE ZACHOWANIE TAKTYCZNE WEDŁUG KLASY I BRONI
      if (b.currentWeapon?.id === 'AK47') {
        // BOT 1: SGT. STRIKER - Karabin maszynowy (ciągły ogień zaporowy i żółte smugi)
        if (dist > 380) {
          if (dx > 0) b.botKeys.right = true;
          else b.botKeys.left = true;
        } else if (dist < 180) {
          if (dx > 0) b.botKeys.left = true;
          else b.botKeys.right = true;
        }

        // Skoki i ciąg jetpacka przy różnicy wysokości
        if (dy < -60 || (Math.random() < 0.14 && b.y > 800)) {
          b.botKeys.up = true;
          b.isJetpacking = true;
        }

        // Okazjonalne kucanie dla laserowej celności
        if (dist < 320 && Math.random() < 0.20) {
          b.botKeys.down = true;
        }

        // Ogień ciągły
        if (b.shootCooldown <= 0) {
          shootWeapon(b, b.currentWeapon);
        }

      } else if (b.currentWeapon?.id === 'RPG7') {
        // BOT 2: COL. ENFORCER - Wyrzutnia rakiet (efektowne wybuchy, odrzut i skoki)
        if (dist > 520) {
          if (dx > 0) b.botKeys.right = true;
          else b.botKeys.left = true;
        } else if (dist < 260) {
          if (dx > 0) b.botKeys.left = true;
          else b.botKeys.right = true;
        }

        // Ciężki Kolos dominuje z wysoka na jetpacku
        if (dy < -30 || Math.random() < 0.18) {
          b.botKeys.up = true;
          b.isJetpacking = true;
        }

        // Strzał rakietą RPG z minimalnym interwałem dla ciągłej kanonady
        if (b.shootCooldown <= 0) {
          shootWeapon(b, b.currentWeapon);
          b.shootCooldown = 42; // Rakieta co ~0.7 sekundy
        }

      } else {
        // BOT 3: CYBER REAPER - Ostrze Plazmowe (Nano-Saber)
        // Agresywny doskok, zrywy na jetpacku i cięcia wręcz
        if (dx > 0) b.botKeys.right = true;
        else b.botKeys.left = true;

        if (dist > 80) {
          // Zrywy powietrzne ku wrogowi
          if (dy < -20 || Math.random() < 0.35) {
            b.botKeys.up = true;
            b.isJetpacking = true;
          }
        }

        // Atak wręcz w zwarciu
        if (dist < 120) {
          shootWeapon(b, b.currentWeapon);
        }

        // ODBIJANIE KUL PLAZMĄ (Bullet Deflection)
        // Gdy bot macha Nano-Saberem, odbija nadlatujące wrogie pociski
        if (b.meleeState && (b.meleeState.phase === 'ACTIVE' || b.meleeState.phase === 'WINDUP')) {
          if (Array.isArray(bullets) && bullets.length > 0) {
            const bx = b.x + 12;
            const by = b.y + 35;
            for (let bi = 0; bi < bullets.length; bi++) {
              const bull = bullets[bi];
              if (!bull || !bull.active || bull.shooter === b) continue;
              const bDist = Math.hypot(bull.x - bx, bull.y - by);
              if (bDist < 95) {
                // Odbicie pocisku w stronę strzelca ze zwielokrotnioną prędkością
                bull.vx = -bull.vx * 1.35;
                bull.vy = -bull.vy * 0.75 + (Math.random() - 0.5) * 3;
                bull.shooter = b;
                bull.shooterTeam = b.team;

                // Iskry rykoszetu i kinowy błysk (ZERO shadowBlur!)
                spawnRicochetSparks(bull.x, bull.y, bull.vx, bull.vy, 4);
                addDynamicLight({
                  x: bull.x,
                  y: bull.y,
                  radius: 70,
                  color: '#00e5ff',
                  intensity: 0.9,
                  life: 0.12
                });
              }
            }
          }
        }
      }
    }

    // Utrzymanie botów na centralnych traktach areny (unikanie przypadkowego błądzenia na krańce)
    if (b.x < 1350) {
      b.botKeys.left = false;
      b.botKeys.right = true;
      if (b.y > 800) {
        b.botKeys.up = true;
        b.isJetpacking = true;
      }
    } else if (b.x > 2650) {
      b.botKeys.right = false;
      b.botKeys.left = true;
      if (b.y > 800) {
        b.botKeys.up = true;
        b.isJetpacking = true;
      }
    }

    // Aktualizacja fizyki postaci (lokomocja, IK, animacje chodu/skoku)
    updatePlayer(b.botKeys, null, effectiveGroundY, null, null, b, livingBots);
    checkPlayerPlatformLanding(b, effectiveGroundY);
  }

  // 2. Aktualizacja pocisków balistycznych i rakiet RPG
  updateBullets(effectiveGroundY, ARENA_PLATFORMS, null, menuBots);
  updateProjectiles(effectiveGroundY, ARENA_PLATFORMS, customObstacles, menuBots, null);

  // 3. Aktualizacja cząsteczek, dymu, łusek, ognia jetpacka i krwi
  updateParticles();
  updateJetpackParticles();
  updateGore(effectiveGroundY, ARENA_PLATFORMS, customObstacles);
  updateLighting(dt);

  // 4. Sztywna, statyczna kamera zablokowana na centrum Areny 2
  updateMenuCamera();
}
