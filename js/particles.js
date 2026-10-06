// =========================================================================
// PARTICLES.JS - SYSTEM CZĄSTECZEK (W TYM ŁUSKI / BULLET CASINGS)
// Zgodność z DAG (Warstwa 1: Środowisko Fizyczne, importuje wyłącznie Warstwę 0)
// =========================================================================

import { CONFIG } from './config.js';

// Domyślna wartość grawitacji w px/s^2 (dla dt w sekundach)
export const CASING_GRAVITY = 820;

export const CASING_CONFIGS = {
  AK47: {
    width: 4,
    height: 2,
    color: '#EAB308', // złoty / mosiądz
    rimColor: null,
    hasRim: false,
    speedMin: 140,
    speedMax: 220,
    bounces: 3,
    type: 'AK47'
  },
  SHOTGUN: {
    width: 6,
    height: 3,
    color: '#DC2626', // czerwony kartusz
    rimColor: '#EAB308', // złota dupka (mosiężna baza)
    hasRim: true,
    speedMin: 110,
    speedMax: 180,
    bounces: 2,
    type: 'SHOTGUN'
  },
  SNIPER: {
    width: 7,
    height: 2.5,
    color: '#CA8A04', // długa mosiężna łuska
    rimColor: null,
    hasRim: false,
    speedMin: 220,
    speedMax: 310, // większy impet odskoku
    bounces: 3,
    type: 'SNIPER'
  },
  DEFAULT: {
    width: 4,
    height: 2,
    color: '#EAB308',
    rimColor: null,
    hasRim: false,
    speedMin: 130,
    speedMax: 210,
    bounces: 3,
    type: 'DEFAULT'
  }
};

/**
 * Klasa reprezentująca pojedynczą wylatującą łuskę (Casing Particle)
 */
export class BulletCasing {
  constructor({
    x = 0,
    y = 0,
    vx = 0,
    vy = 0,
    angle = 0,
    vRot = 0,
    width = 4,
    height = 2,
    color = '#EAB308',
    bounces = 0,
    maxBounces = 3,
    isGrounded = false,
    life = 2.5,
    alpha = 1.0,
    type = 'AK47',
    hasRim = false,
    rimColor = '#EAB308',
    groundTimer = 1.4
  } = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.angle = angle;
    this.vRot = vRot; // prędkość obrotowa (rad/s)
    this.width = width;
    this.height = height;
    this.color = color;
    this.bounces = bounces;
    this.maxBounces = maxBounces;
    this.isGrounded = isGrounded;
    this.life = life; // czas życia w sekundach
    this.alpha = alpha;
    this.type = type;
    this.hasRim = hasRim;
    this.rimColor = rimColor;
    this.groundTimer = groundTimer; // czas spoczynku na ziemi przed wygaszaniem (1-2s)
  }

  /**
   * Aktualizacja fizyki, grawitacji, rotacji i odbić od podłoża
   * @param {number} dt Krok czasu w sekundach
   * @param {number} groundY Poziom podłoża
   * @param {Array} obstaclesList Lista przeszkód/platform
   * @returns {boolean} true jeśli łuska nadal istnieje, false jeśli należy ją usunąć
   */
  update(dt, groundY = 500, obstaclesList = null) {
    if (this.isGrounded) {
      if (this.groundTimer > 0) {
        this.groundTimer -= dt;
      } else {
        // Po zatrzymaniu się na ziemi i odczekaniu 1-2s stopniowo wygaszaj alfe
        this.alpha -= dt;
      }
      return this.alpha > 0;
    }

    this.life -= dt;
    if (this.life <= 0) {
      this.alpha -= dt * 1.5;
      return this.alpha > 0;
    }

    // Aplikuj grawitację (vy += GRAVITY * dt)
    this.vy += CASING_GRAVITY * dt;

    const prevY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.angle += this.vRot * dt;

    // Sprawdzenie kolizji z podłożem i platformami
    const floorY = findPlatformLandingY(this.x, prevY, this.y, groundY, obstaclesList);
    const surfaceY = floorY - this.height * 0.5;

    if (this.y >= surfaceY && this.vy > 0) {
      this.y = surfaceY;

      if (this.bounces < this.maxBounces && Math.abs(this.vy) > 25) {
        // Gdy łuska uderzy w platformę lub ziemię:
        // odwróć prędkość z tłumieniem (vy = -vy * 0.35, vx *= 0.6, vRot *= 0.5)
        this.vy = -this.vy * 0.35;
        this.vx *= 0.6;
        this.vRot *= 0.5;
        this.bounces++;
      } else {
        // Po 2-3 odbiciach zatrzymaj ją (isGrounded = true, vy = 0, vx = 0)
        this.isGrounded = true;
        this.vy = 0;
        this.vx = 0;
        this.vRot = 0;
        this.y = surfaceY;
        // Wyrównanie poziome do podłoża dla estetycznego leżenia łuski
        this.angle = Math.round(this.angle / Math.PI) * Math.PI;
      }
    }

    return true;
  }
}

/**
 * Tablica aktywnych łusek na arenie
 */
export const bulletCasings = [];

/**
 * Wyszukanie powierzchni do lądowania (platformy lub ziemia)
 */
export function findPlatformLandingY(x, prevY, currentY, groundY = 500, obstaclesList = null) {
  let bestFloorY = groundY;

  if (obstaclesList && Array.isArray(obstaclesList)) {
    for (let i = 0; i < obstaclesList.length; i++) {
      const obs = obstaclesList[i];
      if (!obs || typeof obs.x !== 'number' || typeof obs.w !== 'number') continue;

      if (x >= obs.x - 2 && x <= obs.x + obs.w + 2) {
        let topY = obs.y;
        if (topY === undefined) {
          if (typeof obs.relY === 'number') {
            topY = groundY - obs.relY;
          } else if (obs.anchor === 'bottom' && typeof obs.h === 'number') {
            topY = groundY - obs.h;
          } else {
            continue;
          }
        }

        // Obsługa ramp pochyłych
        if (obs.type === 'metal_ramp_left') {
          const t = Math.max(0, Math.min(1, (x - obs.x) / obs.w));
          topY = topY + t * obs.h;
        } else if (obs.type === 'metal_ramp_right') {
          const t = Math.max(0, Math.min(1, (x - obs.x) / obs.w));
          topY = topY + (1 - t) * obs.h;
        }

        if (prevY <= topY + 6 && currentY >= topY - 4 && topY < bestFloorY) {
          bestFloorY = topY;
        }
      }
    }
  }

  return bestFloorY;
}

/**
 * Wyrzut nowej łuski przy wystrzale z broni
 * @param {number} x Pozycja X zamka broni
 * @param {number} y Pozycja Y zamka broni
 * @param {number} aimAngle Kąt celowania broni w radianach
 * @param {string} weaponType Identyfikator broni (np. 'AK47', 'SHOTGUN', 'SNIPER')
 * @param {number} facing Kierunek postaci (1 w prawo, -1 w lewo)
 * @param {number} inheritVx Opcjonalna prędkość postaci X
 * @param {number} inheritVy Opcjonalna prędkość postaci Y
 */
export function spawnBulletCasing(x, y, aimAngle, weaponType = 'AK47', facing = 1, inheritVx = 0, inheritVy = 0) {
  const normType = String(weaponType || 'AK47').toUpperCase();
  const cfg = CASING_CONFIGS[normType] ||
    (normType.includes('SHOTGUN') ? CASING_CONFIGS.SHOTGUN :
    (normType.includes('SNIPER') ? CASING_CONFIGS.SNIPER : CASING_CONFIGS.AK47));

  // Kąt wyrzutu: w tył i do góry względem kierunku celowania (aimAngle + Math.PI + losowy rozrzut +/- 0.3 rad)
  const upwardTilt = (facing >= 0 ? 0.42 : -0.42);
  const spread = (Math.random() - 0.5) * 0.30;
  const ejectAngle = aimAngle + Math.PI + upwardTilt + spread;

  // Prędkość początkowa (np. 120-220 px/s, dla snajperki większa)
  const speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);
  let vx = Math.cos(ejectAngle) * speed + inheritVx * 12;
  let vy = Math.sin(ejectAngle) * speed + inheritVy * 12;

  // Dodatkowy impuls do góry, aby łuska ładnie podskoczyła nad broń
  if (vy > -40) {
    vy = -Math.abs(vy) - 40;
  }

  // Losowe wirowanie vRot = (Math.random() - 0.5) * 20
  const vRot = (Math.random() - 0.5) * 20;

  const casing = new BulletCasing({
    x,
    y,
    vx,
    vy,
    angle: aimAngle + (Math.random() - 0.5) * 0.4,
    vRot,
    width: cfg.width,
    height: cfg.height,
    color: cfg.color,
    bounces: 0,
    maxBounces: cfg.bounces,
    isGrounded: false,
    life: 2.5,
    alpha: 1.0,
    type: cfg.type,
    hasRim: cfg.hasRim,
    rimColor: cfg.rimColor,
    groundTimer: 1.2 + Math.random() * 0.6
  });

  if (bulletCasings.length > 160) {
    bulletCasings.shift();
  }
  bulletCasings.push(casing);
  return casing;
}

/**
 * Aktualizacja wszystkich łusek w grze
 */
export function updateBulletCasings(dt = 1 / 60, groundY = 500, obstaclesList = null) {
  const safeDt = (typeof dt === 'number' && dt > 0 && dt < 0.2) ? dt : (1 / 60);
  for (let i = bulletCasings.length - 1; i >= 0; i--) {
    const keep = bulletCasings[i].update(safeDt, groundY, obstaclesList);
    if (!keep) {
      bulletCasings.splice(i, 1);
    }
  }
}

/**
 * Renderowanie pojedynczej łuski jako obróconego prostokąta
 */
export function drawBulletCasing(ctx, casing) {
  if (!ctx || !casing || casing.alpha <= 0) return;

  ctx.save();
  ctx.translate(casing.x, casing.y);
  ctx.rotate(casing.angle);
  ctx.globalAlpha = Math.max(0, Math.min(1, casing.alpha));
  ctx.fillStyle = casing.color;
  ctx.fillRect(-casing.width / 2, -casing.height / 2, casing.width, casing.height);

  // Shotgun: większy czerwony kartusz ze złotą dupką
  if (casing.type === 'SHOTGUN' || casing.hasRim) {
    ctx.fillStyle = casing.rimColor || '#EAB308';
    ctx.fillRect(-casing.width / 2, -casing.height / 2, casing.width * 0.35, casing.height);
  }

  ctx.restore();
}

/**
 * Renderowanie wszystkich aktywnych łusek
 */
export function drawBulletCasings(ctx) {
  if (!ctx || bulletCasings.length === 0) return;
  for (let i = 0; i < bulletCasings.length; i++) {
    drawBulletCasing(ctx, bulletCasings[i]);
  }
}

/**
 * Czyszczenie listy łusek (np. przy restarcie meczu)
 */
export function clearBulletCasings() {
  bulletCasings.length = 0;
}

// =========================================================================
// REALISTYCZNY SYSTEM WYBUCHU ODŁAMKOWO-BURZĄCEGO (HE EXPLOSION PARTICLES)
// =========================================================================

/**
 * A. Szrapnel naddźwiękowy (ShrapnelStreak)
 * - Bardzo wysoka prędkość początkowa (1400–1800 px/s) pod losowym kątem 360°
 * - Linia o szerokości 1.5px od pozycji poprzedniej do aktualnej
 * - Kolizja z platformą/ziemią generuje 3-4 drobne iskry rykoszetu i usuwa smugę
 */
export class ShrapnelStreak {
  constructor({ x = 0, y = 0, vx = 0, vy = 0, life = 0.11, color = '#FFF2B2' } = {}) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life; // 0.08–0.14s
    this.maxLife = life;
    this.color = color;
    this.alpha = 1.0;
  }

  update(dt, groundY = 500, platforms = null) {
    this.life -= dt;
    if (this.life <= 0) return false;

    this.alpha = Math.max(0, this.life / this.maxLife);
    this.prevX = this.x;
    this.prevY = this.y;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Sprawdzenie kolizji promienia z platformami lub ziemią
    const hit = checkShrapnelRayHit(this.prevX, this.prevY, this.x, this.y, groundY, platforms);
    if (hit) {
      spawnRicochetSparks(hit.x, hit.y, hit.nx, hit.ny, Math.floor(Math.random() * 2 + 3));
      this.life = 0;
      return false;
    }

    return true;
  }

  draw(ctx) {
    if (!ctx || this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#fff2b2';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(this.prevX, this.prevY);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * B. Ciężki gruz zniszczonego terenu (ConcreteDebris)
 * - Wymiary 4–9px, nieregularny czworokąt
 * - Odcienie ciemnego betonu (#2A2D34 do #3E4450)
 * - Odbicia z utratą energii (vy *= -0.3, vx *= 0.5), spoczynek po 2 odbiciach
 * - Life 3.5s, zanikanie alpha fade
 */
export class ConcreteDebris {
  constructor({
    x = 0,
    y = 0,
    vx = 0,
    vy = 0,
    angle = 0,
    vRot = 0,
    size = 6,
    color = '#2A2D34',
    bounces = 0,
    maxBounces = 2,
    life = 3.5
  } = {}) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = vx;
    this.vy = vy;
    this.angle = angle;
    this.vRot = vRot;
    this.size = size;
    this.color = color;
    this.bounces = bounces;
    this.maxBounces = maxBounces;
    this.life = life;
    this.maxLife = life;
    this.grounded = false;
    this.alpha = 1.0;

    // Losowy nieregularny czworokąt
    const half = size * 0.5;
    const r = () => (Math.random() - 0.5) * half * 0.55;
    this.points = [
      { x: -half + r(), y: -half + r() },
      { x: half + r(), y: -half * 0.8 + r() },
      { x: half * 0.9 + r(), y: half + r() },
      { x: -half * 0.8 + r(), y: half * 0.9 + r() }
    ];
  }

  update(dt, groundY = 500, platforms = null) {
    this.life -= dt;
    if (this.life <= 0) return false;

    if (this.life < 1.0) {
      this.alpha = Math.max(0, this.life / 1.0);
    }

    if (this.grounded) {
      return true;
    }

    // Standardowa grawitacja i opór powietrza
    this.vy += 850 * dt;
    this.vx *= Math.pow(0.98, dt * 60);
    this.angle += this.vRot * dt;

    this.prevX = this.x;
    this.prevY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Sprawdzenie kolizji z platformami lub ziemią
    const floorY = findPlatformLandingY(this.x, this.prevY, this.y, groundY, platforms);
    const surfaceY = floorY - this.size * 0.4;

    if (this.y >= surfaceY && this.vy > 0) {
      this.y = surfaceY;
      if (this.bounces < this.maxBounces && Math.abs(this.vy) > 30) {
        this.vy = -this.vy * 0.3;
        this.vx *= 0.5;
        this.vRot *= 0.5;
        this.bounces++;
      } else {
        this.grounded = true;
        this.vx = 0;
        this.vy = 0;
        this.vRot = 0;
        this.y = surfaceY;
      }
    }

    return true;
  }

  draw(ctx) {
    if (!ctx || this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#181a1f';
    ctx.lineWidth = 0.8;

    ctx.beginPath();
    const pts = this.points;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * C1. Dym prochowy (PowderSmoke)
 * - Małe, ciemne kule (#1E1E22 do #333333)
 * - Błyskawiczny rozrost w promieniu 40px
 * - Powolne unoszenie się pionowo w górę (vy = -20 px/s)
 */
export class PowderSmoke {
  constructor({
    x = 0,
    y = 0,
    vx = 0,
    vy = -20,
    radius = 6,
    maxRadius = 38,
    color = '#222226',
    life = 1.2
  } = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy; // -20 px/s
    this.radius = radius;
    this.maxRadius = maxRadius;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.alpha = 0.85;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) return false;

    const progress = 1 - (this.life / this.maxLife);
    this.radius += (this.maxRadius - this.radius) * Math.min(1, dt * 8.5);

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.alpha = Math.max(0, (1 - progress) * 0.85);

    return true;
  }

  draw(ctx) {
    if (!ctx || this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    grad.addColorStop(0.0, this.color);
    grad.addColorStop(0.7, this.color);
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * C2. Pył rozkruszonego betonu (DustCloud)
 * - 14–20 cząstek o miękkiej teksturze
 * - Kolor jasnoszary/beżowy (#94A3B8 / #cbd5e1)
 * - Wysoka przezroczystość alpha: 0.25–0.40
 * - Wolne rozchodzenie na boki, opadanie pod mikrograwitacją przez 1.8 sekundy
 */
export class DustCloud {
  constructor({
    x = 0,
    y = 0,
    vx = 0,
    vy = 0,
    radius = 16,
    maxRadius = 45,
    color = '#94A3B8',
    life = 1.8,
    alpha = 0.35
  } = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.maxRadius = maxRadius;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.baseAlpha = alpha;
    this.alpha = alpha;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) return false;

    // Mikrograwitacja
    this.vy += 32 * dt;
    if (this.vy > 25) this.vy = 25;
    this.vx *= Math.pow(0.95, dt * 60);

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.radius += (this.maxRadius - this.radius) * Math.min(1, dt * 1.8);

    const progress = 1 - (this.life / this.maxLife);
    this.alpha = Math.max(0, (1 - progress) * this.baseAlpha);

    return true;
  }

  draw(ctx) {
    if (!ctx || this.alpha <= 0) return;
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = this.alpha * 0.45;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Iskry rykoszetu szrapnela
 */
export class RicochetSpark {
  constructor(x, y, nx = 0, ny = -1) {
    this.x = x;
    this.y = y;
    const angle = Math.atan2(ny, nx) + (Math.random() - 0.5) * 1.2;
    const speed = 120 + Math.random() * 220;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 0.12 + Math.random() * 0.08;
    this.maxLife = this.life;
    this.color = Math.random() > 0.4 ? '#ffffff' : '#f97316';
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) return false;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    return true;
  }

  draw(ctx) {
    if (!ctx || this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - 1, this.y - 1, 2.5, 2.5);
    ctx.restore();
  }
}

/**
 * Wykrywanie przecięcia promienia szrapnela z platformą lub podłożem
 */
export function checkShrapnelRayHit(x1, y1, x2, y2, groundY = 500, platforms = null) {
  // 1. Sprawdzenie przecięcia z podłożem
  if (y1 < groundY && y2 >= groundY) {
    const t = (groundY - y1) / (y2 - y1);
    return {
      x: x1 + (x2 - x1) * t,
      y: groundY,
      nx: 0,
      ny: -1
    };
  }

  // 2. Sprawdzenie przecięcia z platformami
  if (platforms && Array.isArray(platforms)) {
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (!p || typeof p.x !== 'number' || typeof p.w !== 'number') continue;
      const topY = groundY - (p.relY || 0);
      const thick = p.thickness || 20;
      const bottomY = topY + thick;
      const left = p.x;
      const right = p.x + p.w;

      if (Math.min(x1, x2) > right || Math.max(x1, x2) < left || Math.min(y1, y2) > bottomY || Math.max(y1, y2) < topY) {
        continue;
      }

      if (y1 <= topY && y2 >= topY) {
        const t = (topY - y1) / (y2 - y1);
        const hitX = x1 + (x2 - x1) * t;
        if (hitX >= left && hitX <= right) {
          return { x: hitX, y: topY, nx: 0, ny: -1 };
        }
      }
      if (y1 >= bottomY && y2 <= bottomY) {
        const t = (bottomY - y1) / (y2 - y1);
        const hitX = x1 + (x2 - x1) * t;
        if (hitX >= left && hitX <= right) {
          return { x: hitX, y: bottomY, nx: 0, ny: 1 };
        }
      }
      if (x1 <= left && x2 >= left) {
        const t = (left - x1) / (x2 - x1);
        const hitY = y1 + (y2 - y1) * t;
        if (hitY >= topY && hitY <= bottomY) {
          return { x: left, y: hitY, nx: -1, ny: 0 };
        }
      }
      if (x1 >= right && x2 <= right) {
        const t = (right - x1) / (x2 - x1);
        const hitY = y1 + (y2 - y1) * t;
        if (hitY >= topY && hitY <= bottomY) {
          return { x: right, y: hitY, nx: 1, ny: 0 };
        }
      }
    }
  }

  return null;
}

// Tablice aktywnych cząsteczek eksplozji
export const shrapnelStreaks = [];
export const concreteDebrisList = [];
export const powderSmokeList = [];
export const dustClouds = [];
export const ricochetSparks = [];

export function spawnShrapnelStreak(x, y, count = 20) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1400 + Math.random() * 400; // 1400–1800 px/s
    const life = 0.08 + Math.random() * 0.06; // 0.08–0.14s
    shrapnelStreaks.push(new ShrapnelStreak({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      color: '#FFF2B2'
    }));
  }
}

export function spawnRicochetSparks(x, y, nx, ny, count = 4) {
  for (let i = 0; i < count; i++) {
    ricochetSparks.push(new RicochetSpark(x, y, nx, ny));
  }
}

export function spawnConcreteDebris(x, y, count = 15, baseVx = 0, baseVy = 0) {
  const concreteColors = ['#2A2D34', '#333842', '#3E4450', '#262930', '#4A505D'];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 120 + Math.random() * 260;
    const vx = Math.cos(angle) * speed + baseVx;
    const vy = Math.sin(angle) * speed - (80 + Math.random() * 160) + baseVy;
    const size = 4 + Math.random() * 5; // 4–9px
    const color = concreteColors[Math.floor(Math.random() * concreteColors.length)];
    const vRot = (Math.random() - 0.5) * 16;
    concreteDebrisList.push(new ConcreteDebris({
      x: x + (Math.random() - 0.5) * 14,
      y: y + (Math.random() - 0.5) * 14,
      vx,
      vy,
      angle: Math.random() * Math.PI * 2,
      vRot,
      size,
      color,
      bounces: 0,
      maxBounces: 2,
      life: 3.5
    }));
  }
}

export function spawnPowderSmoke(x, y, count = 12) {
  const darkColors = ['#1E1E22', '#26262B', '#333333', '#202024'];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 18;
    const vx = (Math.random() - 0.5) * 35;
    const vy = -18 - Math.random() * 12; // powolne unoszenie pionowo w górę ~ -20 px/s
    const color = darkColors[Math.floor(Math.random() * darkColors.length)];
    powderSmokeList.push(new PowderSmoke({
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      vx,
      vy,
      radius: 6 + Math.random() * 4,
      maxRadius: 36 + Math.random() * 8, // w promieniu ~40px
      color,
      life: 1.0 + Math.random() * 0.4
    }));
  }
}

export function spawnDustCloud(x, y, count = 18) {
  const dustColors = ['#94A3B8', '#A0AEC0', '#8D99AE', '#CBD5E1'];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spreadSpeed = 30 + Math.random() * 80;
    const vx = Math.cos(angle) * spreadSpeed;
    const vy = (Math.sin(angle) * spreadSpeed * 0.45) - 20;
    const color = dustColors[Math.floor(Math.random() * dustColors.length)];
    const alpha = 0.25 + Math.random() * 0.15; // 0.25–0.40
    dustClouds.push(new DustCloud({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 16,
      vx,
      vy,
      radius: 12 + Math.random() * 8,
      maxRadius: 38 + Math.random() * 16,
      color,
      life: 1.8,
      alpha
    }));
  }
}

export function updateExplosionParticles(dt = 1 / 60, groundY = 500, platforms = null) {
  const safeDt = (typeof dt === 'number' && dt > 0 && dt < 0.2) ? dt : (1 / 60);

  // 1. Pył
  for (let i = dustClouds.length - 1; i >= 0; i--) {
    if (!dustClouds[i].update(safeDt)) dustClouds.splice(i, 1);
  }

  // 2. Gruz
  for (let i = concreteDebrisList.length - 1; i >= 0; i--) {
    if (!concreteDebrisList[i].update(safeDt, groundY, platforms)) concreteDebrisList.splice(i, 1);
  }

  // 3. Szrapnele
  for (let i = shrapnelStreaks.length - 1; i >= 0; i--) {
    if (!shrapnelStreaks[i].update(safeDt, groundY, platforms)) shrapnelStreaks.splice(i, 1);
  }

  // 4. Iskry
  for (let i = ricochetSparks.length - 1; i >= 0; i--) {
    if (!ricochetSparks[i].update(safeDt)) ricochetSparks.splice(i, 1);
  }

  // 5. Dym prochowy
  for (let i = powderSmokeList.length - 1; i >= 0; i--) {
    if (!powderSmokeList[i].update(safeDt)) powderSmokeList.splice(i, 1);
  }

  // 6. Dynamiczne efekty wybuchu (Juice Explosion)
  for (let i = shockwaveRings.length - 1; i >= 0; i--) {
    if (!shockwaveRings[i].update(safeDt)) shockwaveRings.splice(i, 1);
  }
  for (let i = explosionFirePuffs.length - 1; i >= 0; i--) {
    if (!explosionFirePuffs[i].update(safeDt)) explosionFirePuffs.splice(i, 1);
  }
  for (let i = stretchedSparks.length - 1; i >= 0; i--) {
    if (!stretchedSparks[i].update(safeDt)) stretchedSparks.splice(i, 1);
  }
  for (let i = heavySmokePuffs.length - 1; i >= 0; i--) {
    if (!heavySmokePuffs[i].update(safeDt)) heavySmokePuffs.splice(i, 1);
  }
}

// Kolejność renderowania: Pył w tle -> Gruz -> Smugi szrapnela -> Dym prochowy na wierzchu
export function drawDustClouds(ctx) {
  for (let i = 0; i < dustClouds.length; i++) dustClouds[i].draw(ctx);
}

export function drawConcreteDebris(ctx) {
  for (let i = 0; i < concreteDebrisList.length; i++) concreteDebrisList[i].draw(ctx);
}

export function drawShrapnelStreaks(ctx) {
  for (let i = 0; i < shrapnelStreaks.length; i++) shrapnelStreaks[i].draw(ctx);
}

export function drawRicochetSparks(ctx) {
  for (let i = 0; i < ricochetSparks.length; i++) ricochetSparks[i].draw(ctx);
}

export function drawPowderSmoke(ctx) {
  for (let i = 0; i < powderSmokeList.length; i++) powderSmokeList[i].draw(ctx);
}

export function drawAllExplosionParticles(ctx) {
  drawDustClouds(ctx);
  drawConcreteDebris(ctx);
  drawShrapnelStreaks(ctx);
  drawRicochetSparks(ctx);
  drawPowderSmoke(ctx);
  drawGrenadeJuiceExplosion(ctx);
}

export function clearExplosionParticles() {
  dustClouds.length = 0;
  concreteDebrisList.length = 0;
  shrapnelStreaks.length = 0;
  ricochetSparks.length = 0;
  powderSmokeList.length = 0;
  shockwaveRings.length = 0;
  explosionFirePuffs.length = 0;
  stretchedSparks.length = 0;
  heavySmokePuffs.length = 0;
}

// =========================================================================
// NOWE DYNAMICZNE TYPY CZĄSTECZEK WYBUCHU (GAME JUICE)
// =========================================================================

/**
 * A. Pęczniejąca kula ognia (ExplosionFirePuff)
 * - Promień szybko rośnie na starcie (ease-out): radius = maxRadius * Math.sin((1 - life/maxLife) * Math.PI * 0.5)
 * - Płynne przejście barw:
 *   0.0 - 0.2: gorąca biel/żółć (#FFF7D6 / #FDE047)
 *   0.2 - 0.6: głęboki pomarańcz/czerwień (#FB923C / #EF4444)
 *   0.6 - 1.0: ciemny węgiel/dym (#374151 / #1F2937) z zanikającym alpha
 */
export class ExplosionFirePuff {
  constructor({
    x = 0,
    y = 0,
    vx = 0,
    vy = 0,
    radius = 6,
    maxRadius = 40,
    life = 0.45
  } = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.maxRadius = maxRadius; // 25 do 55px
    this.life = life; // 0.35–0.55s
    this.maxLife = life;
    this.colorStage = 0;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) return false;

    this.vx *= Math.pow(0.92, dt * 60);
    this.vy *= Math.pow(0.92, dt * 60);
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const progress = Math.max(0, Math.min(1, 1 - (this.life / this.maxLife)));
    this.colorStage = progress;

    // Promień szybko rośnie na starcie (ease-out)
    this.radius = Math.max(1, this.maxRadius * Math.sin(progress * Math.PI * 0.5));

    return true;
  }

  draw(ctx) {
    if (!ctx || this.radius <= 0) return;
    const p = this.colorStage;

    let coreColor, edgeColor, alpha;

    if (p <= 0.2) {
      // 0.0 - 0.2: gorąca biel/żółć (#FFF7D6 / #FDE047)
      const t = p / 0.2;
      coreColor = '#FFFFFF';
      edgeColor = t < 0.5 ? '#FFF7D6' : '#FDE047';
      alpha = 1.0;
    } else if (p <= 0.6) {
      // 0.2 - 0.6: głęboki pomarańcz/czerwień (#FB923C / #EF4444)
      const t = (p - 0.2) / 0.4;
      coreColor = t < 0.5 ? '#FDE047' : '#FB923C';
      edgeColor = t < 0.5 ? '#FB923C' : '#EF4444';
      alpha = 0.95 - t * 0.25;
    } else {
      // 0.6 - 1.0: ciemny węgiel/dym (#374151 / #1F2937) z zanikającym alpha
      const t = (p - 0.6) / 0.4;
      coreColor = t < 0.5 ? '#EF4444' : '#374151';
      edgeColor = t < 0.5 ? '#374151' : '#1F2937';
      alpha = Math.max(0, (1 - t) * 0.70);
    }

    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    grad.addColorStop(0.0, coreColor);
    grad.addColorStop(0.55, edgeColor);
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * B. Rozciągane żarzące się iskry (StretchedSparks)
 * - Prędkość początkowa 500–900 px/s w losowych kierunkach pod kątem 360°, z grawitacją (vy += 400 * dt)
 * - Rysowanie: kreski rozciągnięte wzdłuż wektora prędkości: od (x, y) do (x - vx * 0.035, y - vy * 0.035)
 */
export class StretchedSparks {
  constructor({
    x = 0,
    y = 0,
    vx = 0,
    vy = 0,
    life = 0.6,
    color = '#FACC15',
    friction = 0.94
  } = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life; // 0.4–0.8s
    this.maxLife = life;
    this.color = color;
    this.friction = friction;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) return false;

    this.vy += 400 * dt;
    const f = Math.pow(this.friction, dt * 60);
    this.vx *= f;
    this.vy *= f;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    return true;
  }

  draw(ctx) {
    if (!ctx || this.life <= 0) return;
    const alpha = Math.max(0, this.life / this.maxLife);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.0; // cienkie, świecące linie żaru o szerokości 2px
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.035, this.y - this.vy * 0.035);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * C. Pierścień fali uderzeniowej (ShockwaveRing)
 * - Promień błyskawicznie rośnie ku maxRadius (130px)
 * - Grubość linii spada do 0.5px wraz z zanikiem alpha
 */
export class ShockwaveRing {
  constructor({
    x = 0,
    y = 0,
    radius = 8,
    maxRadius = 130,
    thickness = 6,
    life = 0.28
  } = {}) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.maxRadius = maxRadius;
    this.thickness = thickness;
    this.life = life; // 0.28s
    this.maxLife = life;
    this.color = '#E0F2FE'; // biało-błękitny
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) return false;

    const progress = Math.max(0, Math.min(1, 1 - (this.life / this.maxLife)));
    this.radius = 8 + (this.maxRadius - 8) * Math.sin(progress * Math.PI * 0.5);
    this.thickness = Math.max(0.5, 6 * (1 - progress) + 0.5);
    this.alpha = Math.max(0, 1 - progress);

    return true;
  }

  draw(ctx) {
    if (!ctx || this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = this.color;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 0;
    ctx.lineWidth = this.thickness;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * D. Gęste obłoki dymu (HeavySmokePuff)
 * - Powolny ruch ku górze z tarciem powietrza (vx *= 0.95, vy -= 18 * dt)
 * - Powolne rozszerzanie się i wygaszanie przezroczystości (alpha: 0.55)
 */
export class HeavySmokePuff {
  constructor({
    x = 0,
    y = 0,
    vx = 0,
    vy = 0,
    radius = 25,
    angle = 0,
    vRot = 0,
    life = 1.5,
    alpha = 0.55
  } = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius; // 18–35px
    this.angle = angle;
    this.vRot = vRot;
    this.life = life; // 1.2–1.8s
    this.maxLife = life;
    this.baseAlpha = alpha;
    this.alpha = alpha;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) return false;

    this.vx *= Math.pow(0.95, dt * 60);
    this.vy -= 18 * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.angle += this.vRot * dt;

    this.radius += 10 * dt;

    const progress = Math.max(0, Math.min(1, 1 - (this.life / this.maxLife)));
    this.alpha = Math.max(0, (1 - progress) * this.baseAlpha);

    return true;
  }

  draw(ctx) {
    if (!ctx || this.alpha <= 0 || this.radius <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
    grad.addColorStop(0.0, '#1F2937');
    grad.addColorStop(0.55, '#374151');
    grad.addColorStop(1.0, 'rgba(31, 41, 55, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// Tablice aktywnych cząsteczek dynamicznego wybuchu
export const explosionFirePuffs = [];
export const stretchedSparks = [];
export const shockwaveRings = [];
export const heavySmokePuffs = [];

export function spawnExplosionFirePuff(x, y, count = 16) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 20; // w promieniu 20px
    const speed = 50 + Math.random() * 70; // 50–120 px/s
    const life = 0.35 + Math.random() * 0.20; // 0.35–0.55s
    const maxRadius = 25 + Math.random() * 30; // 25 do 55px
    explosionFirePuffs.push(new ExplosionFirePuff({
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 6,
      maxRadius,
      life
    }));
  }
}

export function spawnStretchedSparks(x, y, count = 35) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 500 + Math.random() * 400; // 500–900 px/s
    const life = 0.4 + Math.random() * 0.4; // 0.4–0.8s
    stretchedSparks.push(new StretchedSparks({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      color: '#FACC15',
      friction: 0.94
    }));
  }
}

export function spawnShockwaveRing(x, y) {
  shockwaveRings.push(new ShockwaveRing({
    x,
    y,
    radius: 8,
    maxRadius: 130,
    thickness: 6,
    life: 0.28
  }));
}

export function spawnHeavySmokePuff(x, y, count = 12) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 25;
    const speed = 15 + Math.random() * 30;
    const radius = 18 + Math.random() * 17; // 18–35px
    const life = 1.2 + Math.random() * 0.6; // 1.2–1.8s
    heavySmokePuffs.push(new HeavySmokePuff({
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      vx: Math.cos(angle) * speed,
      vy: -20 - Math.random() * 15,
      radius,
      life,
      alpha: 0.55
    }));
  }
}

export function spawnJuiceExplosion(expX, expY) {
  // 1. Fala uderzeniowa: 1x ShockwaveRing
  spawnShockwaveRing(expX, expY);

  // 2. Rdzeń ognia: 14–18 cząsteczek ExplosionFirePuff
  spawnExplosionFirePuff(expX, expY, Math.floor(Math.random() * 5 + 14));

  // 3. Snop iskier: 30–40 cząsteczek StretchedSparks
  spawnStretchedSparks(expX, expY, Math.floor(Math.random() * 11 + 30));

  // 4. Chmura dymu: 10–14 cząsteczek HeavySmokePuff
  spawnHeavySmokePuff(expX, expY, Math.floor(Math.random() * 5 + 10));
}

/**
 * KROK 1 (Dym w tle – zwykły tryb):
 * ctx.save();
 * ctx.globalCompositeOperation = 'source-over';
 * Wyrenderuj wszystkie HeavySmokePuff (ciemnoszare koła z gradientem radialnym lub miękkim obrysem).
 * ctx.restore();
 */
export function drawExplosionSmokeBackground(ctx) {
  if (!ctx || heavySmokePuffs.length === 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < heavySmokePuffs.length; i++) {
    heavySmokePuffs[i].draw(ctx);
  }
  ctx.restore();
}

/**
 * KROK 2 (Ogień, błysk i iskry – tryb rozświetlenia):
 * ctx.save();
 * ctx.globalCompositeOperation = 'lighter'; // Additive blending daje jaskrawy, świecący efekt
 * Wyrenderuj ShockwaveRing (kolor: biało-błękitny #E0F2FE lub neonowo-żółty).
 * Wyrenderuj ExplosionFirePuff (nakładające się na siebie kule ognia zlewają się w rozżarzone białe jądro).
 * Wyrenderuj StretchedSparks (cienkie, świecące linie żaru o szerokości 2px).
 * ctx.restore();
 */
export function drawExplosionFireAndSparks(ctx) {
  if (!ctx || (shockwaveRings.length === 0 && explosionFirePuffs.length === 0 && stretchedSparks.length === 0)) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // 1. ShockwaveRing
  for (let i = 0; i < shockwaveRings.length; i++) {
    shockwaveRings[i].draw(ctx);
  }

  // 2. ExplosionFirePuff
  for (let i = 0; i < explosionFirePuffs.length; i++) {
    explosionFirePuffs[i].draw(ctx);
  }

  // 3. StretchedSparks
  for (let i = 0; i < stretchedSparks.length; i++) {
    stretchedSparks[i].draw(ctx);
  }

  ctx.restore();
}

export function drawGrenadeJuiceExplosion(ctx) {
  drawExplosionSmokeBackground(ctx);
  drawExplosionFireAndSparks(ctx);
}


