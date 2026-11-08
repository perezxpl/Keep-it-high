// =========================================================================
// MENUFIGHT/LOGIC.JS - LOGIKA BITWY DEMONSTRACYJNEJ W MENU GŁÓWNYM
// Podkręcone AI, strzelanie, odrzut, skoki na jetpackach, odbijanie kul i respawn 1.5s
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
import { triggerScreenShake } from '../world.js';
import { WEAPONS } from '../weapons/transform.js';

export function isMenuFightActive() {
  return menuFightState.active;
}

export function initMenuFight() {
  if (menuFightState.active && menuFightState.initialized) return;

  // Upewnij się, że arena miejska jest załadowana dla optymalnej geometrii i widoczności
  if (typeof switchArena === 'function' && activeArenaId !== 'ARENA_1') {
    try {
      switchArena('ARENA_1');
    } catch (_) {}
  }

  // Zainicjalizuj 3 boty bojowe na odpowiednich platformach
  for (let i = 0; i < menuBots.length; i++) {
    resetMenuBot(menuBots[i], i);
  }

  menuFightState.active = true;
  menuFightState.initialized = true;
  menuFightState.time = 0;
}

export function stopMenuFight() {
  menuFightState.active = false;
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
  const effectiveGroundY = 1000;
  const livingBots = menuBots.filter(b => b && !b.isDead);

  // 1. Aktualizacja każdego bota bojowego
  for (let i = 0; i < menuBots.length; i++) {
    const b = menuBots[i];
    if (!b) continue;

    // Obsługa śmierci i błyskawicznego respawnu po 1.5 sekundy (90 klatek)
    if (b.isDead) {
      b.respawnTimer = (b.respawnTimer || 90) - 1;
      if (b.respawnTimer <= 0) {
        // Dobierz losowy punkt odrodzenia z dala od innych botów
        resetMenuBot(b);
        b.isDead = false;
      }
      continue;
    }

    // Sprawdzenie czy bot zginął w tej klatce
    if (b.hp <= 0 && !b.isDead) {
      b.isDead = true;
      b.respawnTimer = 90; // 1.5 sekundy przy 60 FPS
      spawnBloodSpurt(b.x + 12, b.y + 35, (Math.random() - 0.5) * 4, -3, 14);
      continue;
    }

    // Bezpieczeństwo: broń w dłoni, nieograniczona amunicja i natychmiastowe odnawianie
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
      if (other === b) continue;
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
        // BOT 1: SGT. STRIKER - Karabin maszynowy (ciągły ogień zaporowy i smugi)
        if (dist > 380) {
          if (dx > 0) b.botKeys.right = true;
          else b.botKeys.left = true;
        } else if (dist < 180) {
          if (dx > 0) b.botKeys.left = true;
          else b.botKeys.right = true;
        }

        // Skoki i ciąg jetpacka przy różnicy wysokości
        if (dy < -60 || (Math.random() < 0.12 && b.y > 750)) {
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

        // Ciężki Kolos lubi dominować z wysoka
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
        if (dist < 110) {
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
                triggerScreenShake(2.0);
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

  // 2. Aktualizacja pocisków balistycznych i rakiet RPG
  updateBullets(effectiveGroundY, obstacles, null, menuBots);
  updateProjectiles(effectiveGroundY, ARENA_PLATFORMS, customObstacles, menuBots, null);

  // 3. Aktualizacja cząsteczek, dymu, łusek, ognia jetpacka i krwi
  updateParticles();
  updateJetpackParticles();
  updateGore(effectiveGroundY, ARENA_PLATFORMS, customObstacles);
  updateLighting(dt);

  // 4. Płynna kamera śledząca środek walki botów (lerp avgX, avgY, zoom 0.9)
  updateMenuCamera(menuBots);
}
