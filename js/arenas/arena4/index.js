// =========================================================================
// ARENAS/ARENA4/INDEX.JS - OBSIDIAN CALDERA (ORCHESTRATOR & LIFECYCLE)
// Wtyczka Areny 4: Wulkaniczny Krater Magmowy
// =========================================================================

import {
  ARENA_4_WIDTH,
  ARENA_4_HEIGHT,
  ARENA_4_DEATH_Y,
  ARENA_4_MAIN_DECK_Y,
  CALDERA_SPAWN_POINTS,
  CALDERA_GEYSERS,
  CALDERA_PLATFORMS,
  createMagmaCrusts,
  killByHazard
} from './state.js';

import {
  renderCalderaStructures
} from './geometry.js';

import {
  renderCalderaBackgroundBuffer,
  drawCalderaBackground,
  drawCalderaForeground
} from './renderer.js';

import { triggerScreenShake } from '../../camera.js';
import { addDynamicLight } from '../../lighting/state.js';
import { spawnPowderSmoke } from '../../particles.js';

export class Arena4Caldera {
  constructor() {
    this.id = 'arena-4';
    this.alias = 'OBSIDIAN_CALDERA';
    this.mapId = 'obsidian_caldera_01';
    this.name = 'OBSIDIAN CALDERA';
    this.width = ARENA_4_WIDTH;
    this.height = ARENA_4_HEIGHT;
    this.mainDeckY = ARENA_4_MAIN_DECK_Y;
    this.deathY = ARENA_4_DEATH_Y;
    this.gravityMultiplier = 1.0;
    this.animTime = 0;

    // Punkty odrodzenia graczy i botów
    this.spawnPoints = CALDERA_SPAWN_POINTS;
    this.spawns = this.spawnPoints;

    // Fizyczna lista platform i osłon
    this.platforms = CALDERA_PLATFORMS;

    // Aktywne gejzery termiczne
    this.geysers = CALDERA_GEYSERS;

    // Pływające kry bazaltowe
    this.crusts = createMagmaCrusts();

    // Pule cząsteczek
    this.embers = [];
    this.magmaSplashes = [];

    // Bufory OffscreenCanvas
    this.bgCanvas = null;
    this.calderaCanvas = null;
    this.buffersReady = false;

    if (typeof window !== 'undefined') {
      window.arena4 = this;
      window.spawnMagmaSplash = (x, y, count = 16, isGeyser = false) => {
        this.spawnMagmaSplash(x, y, count, isGeyser);
      };
      window.spawnOceanSplash = window.spawnMagmaSplash;
    }
  }

  /**
   * Inicjalizacja buforów OffscreenCanvas
   */
  initBuffers() {
    if (typeof document === 'undefined') return;

    // 1. Bufor tła (niebo, dalekie ściany, chmury, rurociągi)
    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.width = this.width;
    this.bgCanvas.height = this.height;
    const bgCtx = this.bgCanvas.getContext('2d');
    if (bgCtx) {
      renderCalderaBackgroundBuffer(bgCtx);
    }

    // 2. Bufor architektury (filar, rampy, pomosty, osłony)
    this.calderaCanvas = document.createElement('canvas');
    this.calderaCanvas.width = this.width;
    this.calderaCanvas.height = this.height;
    const calderaCtx = this.calderaCanvas.getContext('2d');
    if (calderaCtx) {
      renderCalderaStructures(calderaCtx);
    }

    this.buffersReady = true;
  }

  /**
   * Główna pętla aktualizacji fizyki i cyklu areny
   */
  update(dt, combatants, ballObj) {
    const safeDt = Math.min(dt || 0.016, 0.05);
    this.animTime += safeDt;

    const targets = Array.isArray(combatants) ? combatants : [];
    const ball = ballObj || (typeof window !== 'undefined' ? window.ball : null);

    // 1. Dryf kier bazaltowych na powierzchni magmy
    for (let i = 0; i < this.crusts.length; i++) {
      const c = this.crusts[i];
      c.x += c.driftSpeed;
      if (c.x > this.width + 60) {
        c.x = -60;
      }
    }

    // 2. Cykl maszyny stanów gejzerów termicznych
    for (let gi = 0; gi < this.geysers.length; gi++) {
      const g = this.geysers[gi];
      g.timer -= safeDt;

      if (g.state === 'DORMANT') {
        if (g.timer <= 0) {
          g.state = 'TELEGRAPH';
          g.timer = g.telegraphTime; // 1.5s
        }
      } else if (g.state === 'TELEGRAPH') {
        if (Math.random() < 0.40) {
          spawnPowderSmoke(g.x + (Math.random() - 0.5) * 30, g.y - 10, 3);
        }
        if (Math.random() < 0.35) {
          this.spawnEmber(g.x + (Math.random() - 0.5) * 20, g.y - 15, true);
        }
        addDynamicLight({
          x: g.x,
          y: g.y - 30,
          radius: 240,
          color: '#ff6600',
          intensity: 0.85,
          duration: 0.20
        });

        if (g.timer <= 0) {
          g.state = 'ERUPTING';
          g.timer = g.eruptTime; // 1.2s
          triggerScreenShake(2.5);
          this.spawnMagmaSplash(g.x, g.y, 22, true);
        }
      } else if (g.state === 'ERUPTING') {
        addDynamicLight({
          x: g.x,
          y: g.y - 200,
          radius: 460,
          color: '#ff4400',
          intensity: 1.2,
          duration: 0.15
        });

        for (let i = 0; i < 2; i++) {
          this.spawnEmber(g.x + (Math.random() - 0.5) * 40, g.y - Math.random() * 300, true);
        }

        // Impuls pionowy i obrażenia dla combatantów
        for (let i = 0; i < targets.length; i++) {
          const p = targets[i];
          if (!p || p.isDead) continue;
          const centerX = (p.x || 0) + (p.w || 24) * 0.5;
          const feetY = (p.y || 0) + (p.h || 70);

          const inGeyserX = Math.abs(centerX - g.x) <= 36;
          const inGeyserY = feetY >= (g.y - g.height) && (p.y <= g.y + 10);

          if (inGeyserX && inGeyserY) {
            p.vy = Math.min(p.vy || 0, -17);
            p.onGround = false;
            p.currentPlatform = null;
            p.isJumping = true;

            p.hp = Math.max(0, (p.hp || 100) - 18 * safeDt * 60);
            if (p.hp <= 0 && !p.isDead) {
              killByHazard(p, "GEJZER LAWY // ERUPCJA TERMICZNA");
            }
          }
        }

        // Impuls dla piłki
        if (ball && ball.active !== false) {
          const inBallX = Math.abs(ball.x - g.x) <= 38;
          const inBallY = ball.y >= (g.y - g.height) && (ball.y <= g.y + 20);
          if (inBallX && inBallY) {
            ball.vy = -18;
            ball.vx += (Math.random() - 0.5) * 6;
            ball.spin += (Math.random() > 0.5 ? 2.2 : -2.2);
            ball.isLevitating = false;
          }
        }

        // Detonacja granatów i rakiet w kontakcie ze strumieniem
        if (typeof window !== 'undefined') {
          if (Array.isArray(window.activeGrenades)) {
            for (let gri = window.activeGrenades.length - 1; gri >= 0; gri--) {
              const gr = window.activeGrenades[gri];
              if (gr && Math.abs(gr.x - g.x) <= 38 && gr.y >= (g.y - g.height) && gr.y <= g.y) {
                if (typeof gr.detonate === 'function') {
                  gr.detonate(this.deathY, this.platforms, this.platforms, targets, ball);
                }
              }
            }
          }
          if (Array.isArray(window.activeProjectiles)) {
            for (let pi = window.activeProjectiles.length - 1; pi >= 0; pi--) {
              const pr = window.activeProjectiles[pi];
              if (pr && Math.abs(pr.x - g.x) <= 38 && pr.y >= (g.y - g.height) && pr.y <= g.y) {
                if (typeof pr.detonate === 'function') {
                  pr.detonate(this.deathY, this.platforms, this.platforms, targets, ball);
                  window.activeProjectiles.splice(pi, 1);
                }
              }
            }
          }
        }

        if (g.timer <= 0) {
          g.state = 'DORMANT';
          g.timer = g.dormantTime + (Math.random() * 4.0 - 2.0); // 8-12s
        }
      }
    }

    // 3. Sprawdzanie śmiertelnej strefy jeziora magmy na dnie (Y > 1400)
    for (let i = 0; i < targets.length; i++) {
      const entity = targets[i];
      if (!entity) continue;
      const centerX = (entity.x || 0) + (entity.w || 24) * 0.5;

      if (entity.y > this.deathY && !entity.isDead) {
        killByHazard(entity, "KRATER WULKANICZNY // JEZIORO MAGMY");
        this.spawnMagmaSplash(centerX, 1400, 26, true);
        spawnPowderSmoke(centerX, 1390, 8);
      }
    }

    // 4. Okresowe drobiny żaru i popiołu
    if (Math.random() < 0.40) {
      this.spawnEmber(Math.random() * this.width, 1400 + Math.random() * 50);
    }

    // 5. Aktualizacja cząsteczek
    this.updateEmbers(safeDt);
    this.updateSplashes(safeDt);
  }

  /**
   * Przechwycenie trafienia pocisku w unikalne elementy areny
   */
  onBulletHit(bullet) {
    if (!bullet) return false;
    // Kolizja z taflą magmy na dnie krateru (y >= 1390)
    if (bullet.y >= 1390) {
      this.spawnMagmaSplash(bullet.x, 1400, 10);
      spawnPowderSmoke(bullet.x, 1390, 4);
      return true;
    }
    // Kolizja z aktywnym gejzerem w trakcie erupcji
    for (let gi = 0; gi < this.geysers.length; gi++) {
      const g = this.geysers[gi];
      if (g.state === 'ERUPTING') {
        if (Math.abs(bullet.x - g.x) <= 38 && bullet.y >= (g.y - g.height) && bullet.y <= g.y) {
          this.spawnMagmaSplash(bullet.x, bullet.y, 14, true);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Tworzy cząsteczkę żaru i popiołu
   */
  spawnEmber(x, y, fast = false) {
    if (this.embers.length >= 90) {
      this.embers.shift();
    }
    this.embers.push({
      x,
      y,
      vx: (Math.random() - 0.5) * (fast ? 2.5 : 1.2),
      vy: -(Math.random() * (fast ? 7.5 : 2.2) + (fast ? 4.0 : 0.8)),
      size: Math.random() * 3.0 + 1.2,
      alpha: 0.95,
      life: 0,
      maxLife: fast ? (35 + Math.random() * 25) : (60 + Math.random() * 50),
      color: ['#fde047', '#f97316', '#ea580c', '#ffffff'][Math.floor(Math.random() * 4)]
    });
  }

  /**
   * Tworzy rozbryzg płynnej magmy
   */
  spawnMagmaSplash(x, y, count = 14, isGeyser = false) {
    const num = isGeyser ? Math.round(count * 1.8) : count;
    for (let i = 0; i < num; i++) {
      if (this.magmaSplashes.length >= 90) {
        this.magmaSplashes.shift();
      }
      this.magmaSplashes.push({
        x: x + (Math.random() - 0.5) * (isGeyser ? 46 : 18),
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * (isGeyser ? 8.5 : 4.0),
        vy: isGeyser ? (-Math.random() * 12.0 - 5.0) : (-Math.random() * 6.0 - 2.5),
        size: isGeyser ? (3.5 + Math.random() * 4.5) : (2.0 + Math.random() * 3.0),
        alpha: 0.95,
        life: 0,
        maxLife: isGeyser ? (40 + Math.random() * 25) : (25 + Math.random() * 20),
        color: ['#ffffff', '#fde047', '#f97316', '#dc2626'][Math.floor(Math.random() * 4)]
      });
    }
  }

  /**
   * Aktualizuje cząsteczki żaru i rozbryzgi magmy
   */
  updateEmbers(dt) {
    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.life++;
      e.x += e.vx + Math.sin(this.animTime * 3 + e.y * 0.02) * 0.4;
      e.y += e.vy;
      e.size *= 0.995;
      e.alpha = 0.95 * (1.0 - e.life / e.maxLife);

      if (e.life >= e.maxLife || e.alpha <= 0.01) {
        this.embers.splice(i, 1);
      }
    }
  }

  updateSplashes(dt) {
    for (let i = this.magmaSplashes.length - 1; i >= 0; i--) {
      const p = this.magmaSplashes[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.45;
      p.vx *= 0.98;

      const progress = p.life / p.maxLife;
      p.alpha = 0.95 * (1.0 - progress);

      if (p.life >= p.maxLife || p.alpha <= 0.01) {
        this.magmaSplashes.splice(i, 1);
      }
    }
  }

  /**
   * Rysuje panoramiczne tło areny i strukturę w skali 1:1
   */
  drawBackground(ctx, camera) {
    if (!this.buffersReady) {
      this.initBuffers();
    }
    drawCalderaBackground(ctx, camera, this.bgCanvas, this.calderaCanvas, this.animTime);
  }

  /**
   * Rysuje elementy pierwszego planu (po postaciach)
   */
  draw(ctx, camera) {
    this.render(ctx, camera);
  }

  render(ctx, camera) {
    drawCalderaForeground(ctx, camera, this.animTime, this.geysers, this.crusts, this.embers, this.magmaSplashes);
  }

  reset() {
    this.animTime = 0;
    this.embers.length = 0;
    this.magmaSplashes.length = 0;
  }
}

export const arena4 = new Arena4Caldera();
export default arena4;

export const Arena4Titan = Arena4Caldera;
export const ARENA_TITAN = arena4;
export const ARENA_CALDERA = arena4;
export const ARENA_OBSIDIAN_CALDERA = arena4;

export function spawnMagmaSplash(x, y, count = 16, isGeyser = false) {
  if (arena4) arena4.spawnMagmaSplash(x, y, count, isGeyser);
}

export function spawnOceanSplash(x, y, count = 16, isGeyser = false) {
  spawnMagmaSplash(x, y, count, isGeyser);
}

export {
  ARENA_4_WIDTH,
  ARENA_4_HEIGHT,
  ARENA_4_DEATH_Y,
  ARENA_4_MAIN_DECK_Y,
  CALDERA_SPAWN_POINTS,
  CALDERA_GEYSERS,
  CALDERA_PLATFORMS,
  killByHazard
} from './state.js';

