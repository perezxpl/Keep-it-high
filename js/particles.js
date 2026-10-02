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
