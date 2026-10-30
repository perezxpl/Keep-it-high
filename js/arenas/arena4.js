// =========================================================================
// ARENAS/ARENA4.JS - PLATFORMA WIERTNICZA // TYFON (CANVAS 2D ENGINE)
// Moduł Areny 4: Morski Kompleks Przemysłowy w Epicentrum Sztormu
// Wielopoziomowa Wiertnia, Wysunięty Helipad, Ruchoma Suwnica Rur,
// Plamy Ropy o Obniżonym Tarciu (z Reakcją Łańcuchową Podpalenia),
// Wzburzony Ocean jako Strefa Śmierci.
// Standard: Stabilne 60 FPS Google Chrome, ZERO ctx.shadowBlur,
// OffscreenCanvas buforowanie tła sztormu, fal i wieży wiertniczej,
// ZERO EMOJIS, Stylistyka Modern Military.
// =========================================================================

import { triggerScreenShake } from '../camera.js';
import { spawnBloodSpurt } from '../world/gore.js';

/**
 * Pomocnicze bezpieczne tworzenie OffscreenCanvas kompatybilne z przeglądarkami i środowiskiem Node.
 */
function createOffscreenCanvas(width, height) {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    return c;
  }
  return null;
}

// =========================================================================
// 1. GŁÓWNA KLASA ARENY: Arena4OilRig („PLATFORMA WIERTNICZA // TYFON”)
// =========================================================================
export class Arena4OilRig {
  constructor() {
    this.id = 'arena-4';
    this.alias = 'OIL_RIG_TYPHOON';
    this.mapId = 'oil_rig_typhoon_01';
    this.name = 'PLATFORMA WIERTNICZA // TYFON';
    this.width = 2200;
    this.height = 1400;
    this.mainDeckY = 920; // Główna wysokość pokładu technicznego
    this.deathY = 1250;   // Granica wzburzonego oceanu (strefa śmierci)
    this.gravityMultiplier = 1.0;
    this.animTime = 0;
    this.lightningTimer = 0;
    this.lightningAlpha = 0;

    // Twarde punkty odrodzenia (SPAWN_POINTS) wykluczające wodę i próżnię
    this.spawnPoints = [
      { x: 280,  y: 680, facing: 1,  team: 'CYAN',   label: 'HELIPAD',           isGround: true },
      { x: 800,  y: 860, facing: 1,  team: 'CYAN',   label: 'GŁÓWNY_POKŁAD_L',   isGround: true },
      { x: 1400, y: 860, facing: -1, team: 'ORANGE', label: 'GŁÓWNY_POKŁAD_P',   isGround: true },
      { x: 1850, y: 680, facing: -1, team: 'ORANGE', label: 'MASZYNOWNIA_PRAWA', isGround: true }
    ];
    this.spawns = this.spawnPoints;

    // Ruchoma suwnica rur (parametry wahadłowe)
    this.crane = {
      x: 850,
      y: 500,
      width: 320,
      height: 25,
      minX: 750,
      maxX: 1150,
      speed: 1.2, // px na klatkę (72 px/s przy 60 FPS)
      dir: 1,
      currentSpeed: 1.2
    };

    // Obiekt platformy suwnicy w rejestrze platform
    this.cranePlatform = {
      id: 'typhoon_crane_gantry',
      name: 'RUCHOMA SUWNICA RUR',
      x: this.crane.x,
      y: this.crane.y,
      width: this.crane.width,
      height: this.crane.height,
      w: this.crane.width,
      h: this.crane.height,
      thickness: this.crane.height,
      isGround: true,
      solid: true,
      isDropThrough: true,
      type: 'pipe_gantry'
    };

    // Kompletna lista fizycznych platform areny
    this.platforms = [
      // 1. Główny Pokład Techniczny (Centrum)
      {
        id: 'typhoon_main_deck',
        name: 'GŁÓWNY POKŁAD TECHNICZNY',
        x: 600,
        y: 920,
        width: 1000,
        height: 60,
        w: 1000,
        h: 60,
        thickness: 60,
        isGround: true,
        solid: true,
        type: 'solid_deck'
      },
      // 2. Wysunięty Helipad (Lewa flanka)
      {
        id: 'typhoon_helipad',
        name: 'WYSUNIĘTY HELIPAD',
        x: 120,
        y: 740,
        width: 420,
        height: 35,
        w: 420,
        h: 35,
        thickness: 35,
        isGround: true,
        solid: true,
        type: 'helipad'
      },
      // 3. Kładka Rafinerii i Maszynowni (Prawa flanka)
      {
        id: 'typhoon_refinery_walkway',
        name: 'KŁADKA RAFINERII I MASZYNOWNI',
        x: 1680,
        y: 740,
        width: 420,
        height: 35,
        w: 420,
        h: 35,
        thickness: 35,
        isGround: true,
        solid: true,
        type: 'walkway'
      },
      // 4. Ruchoma Suwnica Rur (Górny poziom)
      this.cranePlatform,
      // 5. Osłony taktyczne: dwa kontenery techniczne na głównym pokładzie
      {
        id: 'typhoon_container_1',
        name: 'KONTENER TECHNICZNY ALFA',
        x: 680,
        y: 880,
        width: 65,
        height: 40,
        w: 65,
        h: 40,
        thickness: 40,
        isGround: true,
        solid: true,
        isCover: true,
        type: 'container'
      },
      {
        id: 'typhoon_container_2',
        name: 'KONTENER TECHNICZNY BRAWO',
        x: 1220,
        y: 880,
        width: 65,
        height: 40,
        w: 65,
        h: 40,
        thickness: 40,
        isGround: true,
        solid: true,
        isCover: true,
        type: 'container'
      },
      // Twarde osłony pionowe: dwa kominy rafinerii chroniące przed snajperami
      {
        id: 'typhoon_chimney_1',
        name: 'KOMIN RAFINERII SEKTOR E1',
        x: 1780,
        y: 560,
        width: 40,
        height: 180,
        w: 40,
        h: 180,
        thickness: 180,
        isGround: true,
        solid: true,
        isCover: true,
        isWall: true,
        type: 'chimney'
      },
      {
        id: 'typhoon_chimney_2',
        name: 'KOMIN RAFINERII SEKTOR E2',
        x: 1980,
        y: 560,
        width: 40,
        height: 180,
        w: 40,
        h: 180,
        thickness: 180,
        isGround: true,
        solid: true,
        isCover: true,
        isWall: true,
        type: 'chimney'
      }
    ];

    // Mechanika środowiskowa: Plamy ropy na głównym pokładzie
    this.oilPuddles = [
      {
        id: 'oil_puddle_west',
        name: 'PLAMA ROPY ZACHÓD',
        x1: 750,
        x2: 900,
        y: 920,
        width: 150,
        height: 10,
        burning: false,
        burnTimer: 0
      },
      {
        id: 'oil_puddle_east',
        name: 'PLAMA ROPY WSCHÓD',
        x1: 1300,
        x2: 1450,
        y: 920,
        width: 150,
        height: 10,
        burning: false,
        burnTimer: 0
      }
    ];

    // Pule cząsteczek dymu, ognia i bryzgów wody oceanicznej (Zero shadowBlur, wysoka wydajność)
    this.smokeParticles = [];
    this.fireParticles = [];
    this.sprayParticles = [];

    // Pre-buforowane tło (OffscreenCanvas)
    this.cachedBgCanvas = null;
    this.initPrebufferedBackground();
  }

  /**
   * Pre-buforowanie tła sztormu, fal horyzontu oraz wieży wiertniczej (OffscreenCanvas).
   * Gwarantuje stabilne 60 FPS w Chrome bez każdorazowego przeliczania setek belek kratownicy.
   */
  initPrebufferedBackground() {
    const bgCanvas = createOffscreenCanvas(this.width, this.height);
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.shadowBlur = 0; // Twardy zakaz shadowBlur

    // 1. Ciemne, sztormowe niebo tyfonu
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#040711');
    skyGrad.addColorStop(0.35, '#080e1a');
    skyGrad.addColorStop(0.70, '#0f172a');
    skyGrad.addColorStop(1.0, '#090d16');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Chmury burzowe i odległe rozświetlenia
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    for (let c = 0; c < 8; c++) {
      const cx = (c * 300) - 100;
      const cy = 60 + (c % 3) * 50;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 260, 90, -0.05, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Potężna Wieża Wiertnicza (The Derrick) w centrum kompleksu (x: 960..1240, y: 160..920)
    this.drawDerrickTower(ctx, 960, 160, 280, 760);

    // 4. Odległe instalacje morskie i rurociągi w tle
    this.drawBackgroundRefineryPipes(ctx);

    // 5. Statyczne warstwy fal sztormowych na horyzoncie (y: 1120..1250)
    this.drawBackgroundOceanHorizons(ctx);

    ctx.restore();
    this.cachedBgCanvas = bgCanvas;
  }

  /**
   * Rysuje monumentalną stalową wieżę wiertniczą (Derrick) ze stężeniami X i pochodnią gazową.
   */
  drawDerrickTower(ctx, x, y, w, h) {
    ctx.save();
    ctx.shadowBlur = 0;

    const topW = w * 0.42;
    const topX = x + (w - topW) * 0.5;
    const botX = x;
    const botW = w;
    const botY = y + h;

    // Sylwetka rdzenia wieży
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.moveTo(topX, y);
    ctx.lineTo(topX + topW, y);
    ctx.lineTo(botX + botW, botY);
    ctx.lineTo(botX, botY);
    ctx.closePath();
    ctx.fill();

    // Główne pylony nośne wieży
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(topX, y);
    ctx.lineTo(botX, botY);
    ctx.moveTo(topX + topW, y);
    ctx.lineTo(botX + botW, botY);
    ctx.stroke();

    // Półki technologiczne i stężenia krzyżowe (X-truss)
    const tiers = 7;
    const tierH = h / tiers;
    ctx.lineWidth = 2.5;

    for (let t = 0; t <= tiers; t++) {
      const curY = y + t * tierH;
      const frac = t / tiers;
      const curLeft = topX + (botX - topX) * frac;
      const curRight = (topX + topW) + ((botX + botW) - (topX + topW)) * frac;

      // Belka pozioma
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(curLeft, curY);
      ctx.lineTo(curRight, curY);
      ctx.stroke();

      // Zastrzały skośne (X)
      if (t < tiers) {
        const nextY = y + (t + 1) * tierH;
        const nextFrac = (t + 1) / tiers;
        const nextLeft = topX + (botX - topX) * nextFrac;
        const nextRight = (topX + topW) + ((botX + botW) - (topX + topW)) * nextFrac;

        ctx.strokeStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(curLeft, curY);
        ctx.lineTo(nextRight, nextY);
        ctx.moveTo(curRight, curY);
        ctx.lineTo(nextLeft, nextY);
        ctx.stroke();
      }
    }

    // Głowica wiertnicza i blok koronowy (Crown Block) na szczycie
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(topX - 10, y - 22, topW + 20, 22);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.strokeRect(topX - 10, y - 22, topW + 20, 22);

    // Pionowa szyna przewodu wiertniczego (Drill String Guide) pośrodku wieży
    const midX = x + w * 0.5;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(midX, y);
    ctx.lineTo(midX, botY);
    ctx.stroke();

    // Pochodnia gazowa (Flare Stack) na prawej flance wieży
    const flareX = botX + botW + 35;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(flareX, botY);
    ctx.lineTo(flareX, y + 40);
    ctx.stroke();

    // Ramię wysięgnika pochodni
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(flareX - 35, y + 120);
    ctx.lineTo(flareX, y + 40);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Rurociągi technologiczne rafinerii w tle za pokładem.
   */
  drawBackgroundRefineryPipes(ctx) {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 14;

    ctx.beginPath();
    ctx.moveTo(500, 910);
    ctx.lineTo(500, 800);
    ctx.lineTo(1720, 800);
    ctx.lineTo(1720, 910);
    ctx.stroke();

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Odległe sylwetki wzburzonych fal oceanicznych na horyzoncie.
   */
  drawBackgroundOceanHorizons(ctx) {
    ctx.save();
    ctx.shadowBlur = 0;

    // Warstwa 1: Odległy ocean
    ctx.fillStyle = '#060d18';
    ctx.beginPath();
    ctx.moveTo(0, 1140);
    for (let bx = 0; bx <= this.width; bx += 80) {
      const by = 1140 + Math.sin(bx * 0.015) * 12;
      ctx.lineTo(bx, by);
    }
    ctx.lineTo(this.width, this.height);
    ctx.lineTo(0, this.height);
    ctx.closePath();
    ctx.fill();

    // Warstwa 2: Średnio oddalona fala
    ctx.fillStyle = '#0a1424';
    ctx.beginPath();
    ctx.moveTo(0, 1190);
    for (let bx = 0; bx <= this.width; bx += 60) {
      const by = 1190 + Math.cos(bx * 0.02) * 16;
      ctx.lineTo(bx, by);
    }
    ctx.lineTo(this.width, this.height);
    ctx.lineTo(0, this.height);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // =======================================================================
  // GŁÓWNA PĘTLA LOGIKI (UPDATE): SUWNICA, ROPA, ŚLISK, POŻAR, OCEAN
  // =======================================================================
  update(dt, combatants) {
    const safeDt = Math.min(dt || (1 / 60), 0.1);
    this.animTime += safeDt;

    // 1. Logika Błyskawic Sztormowych (losowe rozbłyski nieba)
    this.lightningTimer -= safeDt;
    if (this.lightningTimer <= 0) {
      if (Math.random() < 0.28) {
        this.lightningAlpha = 0.45;
        this.lightningTimer = 3.5 + Math.random() * 4.5;
      } else {
        this.lightningTimer = 1.0 + Math.random() * 2.0;
      }
    }
    if (this.lightningAlpha > 0) {
      this.lightningAlpha = Math.max(0, this.lightningAlpha - safeDt * 2.2);
    }

    // 2. Ruchoma Suwnica Rur (Wahadłowe przemieszczenie w osi X)
    const prevCraneX = this.crane.x;
    const stepMove = this.crane.speed * (safeDt * 60);
    this.crane.x += stepMove * this.crane.dir;

    if (this.crane.x >= this.crane.maxX) {
      this.crane.x = this.crane.maxX;
      this.crane.dir = -1;
    } else if (this.crane.x <= this.crane.minX) {
      this.crane.x = this.crane.minX;
      this.crane.dir = 1;
    }
    const craneDeltaX = this.crane.x - prevCraneX;
    this.crane.currentSpeed = craneDeltaX;
    this.cranePlatform.x = this.crane.x;

    // 3. Aktualizacja płonących plam ropy i timerów zapłonu
    for (let pIdx = 0; pIdx < this.oilPuddles.length; pIdx++) {
      const puddle = this.oilPuddles[pIdx];
      if (puddle.burning) {
        puddle.burnTimer -= safeDt;
        if (puddle.burnTimer <= 0) {
          puddle.burning = false;
          puddle.burnTimer = 0;
        } else {
          // Generowanie cząsteczek ognia i gęstego dymu
          if (Math.random() < 0.75) {
            const px = puddle.x1 + Math.random() * puddle.width;
            this.spawnFireParticle(px, puddle.y - 2);
            this.spawnSmokeParticle(px, puddle.y - 12);
          }
        }
      }
    }

    // 4. Interakcja z postaciami: Suwnica, Ślizg na ropie, Obrażenia od ognia, Ocean śmierci
    const targets = Array.isArray(combatants) ? combatants : [];
    for (let i = 0; i < targets.length; i++) {
      const entity = targets[i];
      if (!entity) continue;

      // A. Strefa Śmierci: Wzburzony Ocean (deathY = 1250)
      if (entity.y > this.deathY && !entity.isDead) {
        killByHazard(entity, "WZBURZONY OCEAN // SZTORM TYFON");
        continue;
      }

      if (entity.isDead) continue;

      const centerX = (entity.x || 0) + (entity.w || 24) * 0.5;
      const feetY = (entity.y || 0) + (entity.h || 70);

      // B. Przenoszenie gracza/bota przez ruchomą suwnicę
      const isStandingOnCrane = (
        entity.currentPlatform === this.cranePlatform || (
          entity.onGround &&
          feetY >= this.crane.y - 6 &&
          feetY <= this.crane.y + 16 &&
          centerX >= this.crane.x - 4 &&
          centerX <= this.crane.x + this.crane.width + 4
        )
      );
      if (isStandingOnCrane) {
        entity.x += craneDeltaX;
      }

      // C. Interakcja z plamami ropy na głównym pokładzie (y: 920)
      const isOnDeckLevel = (feetY >= 910 && feetY <= 936);
      if (isOnDeckLevel) {
        for (let pIdx = 0; pIdx < this.oilPuddles.length; pIdx++) {
          const puddle = this.oilPuddles[pIdx];
          if (centerX >= puddle.x1 && centerX <= puddle.x2) {
            // Poślizg: tarcie spada o 70%, postać wykonuje niekontrolowany ślizg
            const curVx = entity.vx || 0;
            if (Math.abs(curVx) > 0.25) {
              entity.isOilSlipping = true;
              entity.oilSlipTimer = 8;
              // Zmniejszenie oporu: zachowanie pędu biegu i podtrzymanie ślizgu
              entity.x += curVx * 0.70;
              entity.vx = curVx * 0.985 + (Math.sign(curVx) || entity.facing || 1) * 0.12;
            }

            // Płonąca plama: zadaje 15 HP/s i emituje dym wokół postaci
            if (puddle.burning) {
              entity.hp = Math.max(0, (entity.hp || 100) - (15 * safeDt));
              if (Math.random() < 0.35) {
                this.spawnSmokeParticle(centerX, feetY - 20);
              }
              if (entity.hp <= 0 && !entity.isDead) {
                killByHazard(entity, "PŁONĄCY ROZLEW ROPY // KATASTROFA EKOLOGICZNA");
                break;
              }
            }
          }
        }
      }
    }

    // 5. Aktualizacja cząsteczek dymu, ognia i morskich bryzgów
    this.updateParticles(safeDt);
  }

  /**
   * Obsługa wybuchów (granaty [G], rakiety RPG, miny) powodujących reakcję łańcuchową zapłonu ropy.
   */
  onExplosion(expX, expY, radius) {
    let triggered = false;
    const effRadius = radius || 80;

    for (let i = 0; i < this.oilPuddles.length; i++) {
      const p = this.oilPuddles[i];
      const pCenterX = (p.x1 + p.x2) * 0.5;
      const dist = Math.hypot(expX - pCenterX, expY - p.y);

      if (dist <= effRadius + 95) {
        p.burning = true;
        p.burnTimer = 5.0; // Płonie przez dokładnie 5 sekund
        triggered = true;
        triggerScreenShake(3.5);

        // Eksplozja zapłonu ropy: wyrzut języków ognia
        for (let k = 0; k < 12; k++) {
          const rx = p.x1 + Math.random() * p.width;
          this.spawnFireParticle(rx, p.y - 4);
          this.spawnSmokeParticle(rx, p.y - 15);
        }
      }
    }
    return triggered;
  }

  onBulletHit(bullet) {
    if (!bullet) return false;
    // Zapalenie ropy przez pociski wybuchowe, rakiety RPG lub plazmę
    if (bullet.isExplosive || bullet.isRocket || bullet.type === 'RPG' || bullet.type === 'PLASMA' || bullet.type === 'TESLA') {
      return this.onExplosion(bullet.x, bullet.y, 45);
    }
    return false;
  }

  onKickHit(player, kickBox) {
    return false;
  }

  // =======================================================================
  // SYSTEM CZĄSTECZEK (OGIEŃ, DYM, BRYZGI FAL) - ZERO ctx.shadowBlur
  // =======================================================================
  spawnFireParticle(x, y) {
    if (this.fireParticles.length >= 70) return;
    this.fireParticles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 1.8 + 0.8, // Zniesienie wiatrem sztormowym w prawo
      vy: -1.8 - Math.random() * 2.4,
      size: 4 + Math.random() * 7,
      life: 0.35 + Math.random() * 0.35,
      maxLife: 0.70,
      color: Math.random() < 0.6 ? '#f97316' : '#facc15'
    });
  }

  spawnSmokeParticle(x, y) {
    if (this.smokeParticles.length >= 80) return;
    this.smokeParticles.push({
      x,
      y,
      vx: 1.2 + Math.random() * 2.2, // Porywisty wiatr tyfonu znosi dym w prawo
      vy: -1.2 - Math.random() * 1.8,
      radius: 6 + Math.random() * 10,
      maxRadius: 28 + Math.random() * 18,
      life: 0.6 + Math.random() * 0.6,
      maxLife: 1.2,
      alpha: 0.55
    });
  }

  spawnSeaSpray(x, y) {
    if (this.sprayParticles.length >= 60) return;
    this.sprayParticles.push({
      x,
      y,
      vx: (Math.random() - 0.3) * 3.5,
      vy: -3.0 - Math.random() * 4.5,
      size: 2 + Math.random() * 3,
      life: 0.4 + Math.random() * 0.4,
      maxLife: 0.8
    });
  }

  updateParticles(dt) {
    // Ogień
    for (let i = this.fireParticles.length - 1; i >= 0; i--) {
      const p = this.fireParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      p.size = Math.max(1, p.size - dt * 6);
      if (p.life <= 0) this.fireParticles.splice(i, 1);
    }
    // Dym
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      const progress = 1 - (p.life / p.maxLife);
      p.radius = 6 + progress * (p.maxRadius - 6);
      p.alpha = Math.max(0, 0.55 * (1 - progress));
      if (p.life <= 0) this.smokeParticles.splice(i, 1);
    }
    // Bryzgi fal morskich
    for (let i = this.sprayParticles.length - 1; i >= 0; i--) {
      const p = this.sprayParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 9.8 * dt; // Grawitacja opadania kropel morskich
      p.life -= dt;
      if (p.life <= 0) this.sprayParticles.splice(i, 1);
    }

    // Losowe uderzenia fal o pylony stacji
    if (Math.random() < 0.22) {
      const splashX = [330, 720, 1100, 1500, 1850][Math.floor(Math.random() * 5)];
      this.spawnSeaSpray(splashX + (Math.random() - 0.5) * 40, this.deathY);
    }
  }

  // =======================================================================
  // POTOK RENDEROWANIA (BACKGROUND): BUFOR OFFSCREEN + BŁYSKAWICE
  // =======================================================================
  drawBackground(ctx, camera) {
    if (!ctx) return;
    ctx.save();
    ctx.shadowBlur = 0; // Twardy zakaz ctx.shadowBlur

    // 1. Rysowanie zbuforowanego tła OffscreenCanvas
    if (this.cachedBgCanvas) {
      ctx.drawImage(this.cachedBgCanvas, 0, 0);
    }

    // 2. Animowany płomień na szczycie pochodni gazowej (Flare Stack)
    const flarePulse = 0.8 + 0.3 * Math.sin(this.animTime * 14);
    const flareX = 1275;
    const flareY = 200;
    ctx.fillStyle = `rgba(249, 115, 22, ${flarePulse.toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(flareX + 18, flareY, 22, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(flareX + 14, flareY, 12, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 3. Rozbłysk błyskawicy sztormowej w atmosferze
    if (this.lightningAlpha > 0) {
      ctx.fillStyle = `rgba(186, 230, 253, ${this.lightningAlpha.toFixed(2)})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 4. Pochyły deszcz tyfonu (smugi wiatru pod kątem 15 stopni)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const rainSeed = (this.animTime * 1400) % 600;
    for (let rx = 0; rx < this.width + 300; rx += 75) {
      const ry = ((rx * 1.7 + rainSeed) % 1300) - 100;
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + 28, ry + 75);
    }
    ctx.stroke();

    ctx.restore();
  }

  // =======================================================================
  // POTOK RENDEROWANIA (FOREGROUND): PŁYTY PANCERNE, HELIPAD, SUWNICA, OCEAN
  // =======================================================================
  render(ctx) {
    if (!ctx) return;
    ctx.save();
    ctx.shadowBlur = 0; // Twardy zakaz ctx.shadowBlur

    const isDebug = (typeof window !== 'undefined' && !!window.DEBUG_MODE);

    // 1. Podwodne pylony stalowe wiertni schodzące w odmęty oceanu (y: 740..1250)
    this.drawRigPylons(ctx);

    // 2. Wysunięty Helipad (Lewa flanka: x: 120, y: 740, w: 420, h: 35)
    this.drawHelipad(ctx, isDebug);

    // 3. Główny Pokład Techniczny (Centrum: x: 600, y: 920, w: 1000, h: 60)
    this.drawMainDeck(ctx, isDebug);

    // 4. Kładka Rafinerii i Maszynowni (Prawa flanka: x: 1680, y: 740, w: 420, h: 35)
    this.drawRefineryWalkway(ctx, isDebug);

    // 5. Ruchoma Suwnica Rur (Górny poziom: y: 500, w: 320, h: 25)
    this.drawCraneGantry(ctx, isDebug);

    // 6. Renderowanie plam ropy i efektów płomieni/dymu
    this.drawOilPuddles(ctx);

    // 7. Wzburzony Ocean jako Strefa Śmierci (y: 1250..1400)
    this.drawTurbulentOcean(ctx);

    ctx.restore();
  }

  draw(ctx, camera) {
    this.render(ctx);
  }

  /**
   * Pylony wsporcze wiertni schodzące w ocean oraz skośny wspornik helipada.
   */
  drawRigPylons(ctx) {
    ctx.save();
    ctx.shadowBlur = 0;

    // Skośny pylon podtrzymujący wysunięty helipad (z x: 330, y: 775 do x: 600, y: 1220)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(330, 775);
    ctx.lineTo(600, 1220);
    ctx.stroke();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 12;
    ctx.stroke();

    // Masywne pionowe nogi wiertni pod głównym pokładem i maszynownią
    const pylonXList = [700, 1050, 1400, 1750, 2020];
    for (let px of pylonXList) {
      const topY = px > 1650 ? 775 : 980;
      // Trzon pylonu
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px - 22, topY, 44, this.height - topY);

      // Rdzawe ślady i wżery solne
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(px - 18, topY + 40, 8, 90);
      ctx.fillRect(px + 8, topY + 140, 10, 80);

      // Stalowe obejmy i nity
      ctx.fillStyle = '#334155';
      ctx.fillRect(px - 25, topY + 60, 50, 12);
      ctx.fillRect(px - 25, topY + 160, 50, 12);
    }

    // Stężenia krzyżowe między pylonami głównymi
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(700, 1020);
    ctx.lineTo(1050, 1200);
    ctx.moveTo(1050, 1020);
    ctx.lineTo(700, 1200);
    ctx.moveTo(1050, 1020);
    ctx.lineTo(1400, 1200);
    ctx.moveTo(1400, 1020);
    ctx.lineTo(1050, 1200);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Rysuje wysunięty helipad (x: 120, y: 740, w: 420, h: 35).
   */
  drawHelipad(ctx, isDebug) {
    const x = 120;
    const y = 740;
    const w = 420;
    const h = 35;

    ctx.save();
    ctx.shadowBlur = 0;

    // Stalowa konstrukcja pomostu lądowiska
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, w, h);

    // Fazowanie i płyty antypoślizgowe
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

    // Krawędź kolizyjna lądowiska
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    // Zewnętrzna siatka bezpieczeństwa / okapnik przeciwpożarowy
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 14, y + 10);
    ctx.lineTo(x, y + 25);
    ctx.lineTo(x + w, y + 25);
    ctx.lineTo(x + w + 14, y + 10);
    ctx.stroke();

    // Żółte oznaczenie lądowiska: Okrąg i litera "H"
    const centerX = x + w * 0.5;
    const centerY = y + 17;

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#eab308';
    ctx.font = '900 13px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', centerX, centerY + 1);

    // Lampy obrysowe lądowiska (zielone / bursztynowe)
    const lampAlpha = 0.6 + 0.4 * Math.sin(this.animTime * 5);
    ctx.fillStyle = `rgba(34, 197, 94, ${lampAlpha.toFixed(2)})`;
    ctx.fillRect(x + 12, y + 2, 6, 4);
    ctx.fillRect(x + w - 18, y + 2, 6, 4);

    // Oznaczenia taktyczne
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'start';
    ctx.fillText('HELIDECK // 12.5T MAX', x + 24, y + 22);

    if (isDebug) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('[PLAT: typhoon_helipad]', x, y - 6);
    }

    ctx.restore();
  }

  /**
   * Rysuje główny pokład techniczny (x: 600, y: 920, w: 1000, h: 60) z kratownicami,
   * barierkami, dwoma wlotami wentylacyjnymi i kontenerami technicznymi.
   */
  drawMainDeck(ctx, isDebug) {
    const x = 600;
    const y = 920;
    const w = 1000;
    const h = 60;

    ctx.save();
    ctx.shadowBlur = 0;

    // Główna bryła pokładu (grube stalowe poszycie)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, w, h);

    // Płyty kratownicy stalowej z rdzawym nalotem
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

    // Wzór kratownicy przemysłowej (stal ryflowana)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    for (let gx = x + 15; gx < x + w - 15; gx += 25) {
      ctx.beginPath();
      ctx.moveTo(gx, y + 5);
      ctx.lineTo(gx, y + h - 5);
      ctx.stroke();
    }

    // Pasy ostrzegawcze na skrajnych krawędziach spadku w ocean
    this.drawHazardStripes(ctx, x, y, 40, h);
    this.drawHazardStripes(ctx, x + w - 40, y, 40, h);

    // Dwa wloty wentylacyjne z obrotowymi turbinami
    this.drawVentIntake(ctx, 710, y + 10, 50, 40);
    this.drawVentIntake(ctx, 1490, y + 10, 50, 40);

    // Żółte barierki przemysłowe wzdłuż górnej krawędzi pokładu
    this.drawDeckHandrails(ctx, x + 40, y - 18, 630);
    this.drawDeckHandrails(ctx, x + 760, y - 18, 200);

    // Dwa kontenery techniczne na pokładzie (width: 65, height: 40)
    this.drawTacticalContainer(ctx, 680, 880, 65, 40, 'CARGO // C-01', '#3f6212');
    this.drawTacticalContainer(ctx, 1220, 880, 65, 40, 'PUMP // H-02', '#334155');

    // Górna krawędź kolizyjna
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);

    if (isDebug) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('[PLAT: typhoon_main_deck]', x, y - 24);
    }

    ctx.restore();
  }

  /**
   * Pasy ostrzegawcze w żółto-czarne skośne linie.
   */
  drawHazardStripes(ctx, x, y, w, h) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#0f172a';
    for (let sx = x - h; sx < x + w + h; sx += 14) {
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx + 7, y);
      ctx.lineTo(sx - 3, y + h);
      ctx.lineTo(sx - 10, y + h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Wlot wentylacyjny z kratownicą ochronną i obracającym się wirnikiem.
   */
  drawVentIntake(ctx, x, y, w, h) {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#090d16';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Obracające się łopatki turbiny wentylatora
    const angle = this.animTime * 12;
    const cx = x + w * 0.5;
    const cy = y + h * 0.5;
    const r = Math.min(w, h) * 0.38;

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    for (let b = 0; b < 4; b++) {
      const a = angle + b * (Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.stroke();
    }

    // Krata ochronna
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    ctx.restore();
  }

  /**
   * Żółte barierki ochronne na krawędziach pokładu.
   */
  drawDeckHandrails(ctx, startX, y, len) {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;

    // Dwie poziome poręcze
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + len, y);
    ctx.moveTo(startX, y + 9);
    ctx.lineTo(startX + len, y + 9);
    ctx.stroke();

    // Słupki pionowe
    ctx.lineWidth = 2.5;
    for (let sx = startX; sx <= startX + len; sx += 35) {
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx, y + 18);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Kontener techniczny (twarda osłona taktyczna o wymiarach 65 x 40).
   */
  drawTacticalContainer(ctx, x, y, w, h, label, mainColor) {
    ctx.save();
    ctx.shadowBlur = 0;

    // Korpus kontenera
    ctx.fillStyle = mainColor;
    ctx.fillRect(x, y, w, h);

    // Żłobienia blachy falistej
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let rx = x + 6; rx < x + w - 6; rx += 8) {
      ctx.fillRect(rx, y + 2, 3, h - 4);
    }

    // Wzmocnienia narożne ISO
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, y, 6, 6);
    ctx.fillRect(x + w - 6, y, 6, 6);
    ctx.fillRect(x, y + h - 6, 6, 6);
    ctx.fillRect(x + w - 6, y + h - 6, 6, 6);

    // Obrys kontenera
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Etykieta stencila
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w * 0.5, y + h * 0.5 + 2);

    ctx.restore();
  }

  /**
   * Rysuje kładkę rafinerii i maszynowni (x: 1680, y: 740, w: 420, h: 35)
   * z dwoma pionowymi kominami i rurociągami.
   */
  drawRefineryWalkway(ctx, isDebug) {
    const x = 1680;
    const y = 740;
    const w = 420;
    const h = 35;

    ctx.save();
    ctx.shadowBlur = 0;

    // Podest technologiczny
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);

    // Rurociągi ciśnieniowe biegnące wzdłuż kładki
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x, y + 16);
    ctx.lineTo(x + w, y + 16);
    ctx.stroke();

    // Dwa pionowe kominy rafinerii (twarde osłony przed snajperami)
    this.drawChimneyStack(ctx, 1780, 560, 40, 180, 'STACK-A');
    this.drawChimneyStack(ctx, 1980, 560, 40, 180, 'STACK-B');

    if (isDebug) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('[PLAT: typhoon_refinery_walkway]', x, y - 6);
    }

    ctx.restore();
  }

  /**
   * Pionowy komin rafinerii (twarda osłona o wymiarach 40 x 180).
   */
  drawChimneyStack(ctx, x, y, w, h, name) {
    ctx.save();
    ctx.shadowBlur = 0;

    // Stalowy korpus komina
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, w, h);

    // Obejmy pierścieniowe
    ctx.fillStyle = '#334155';
    for (let cy = y + 25; cy < y + h - 10; cy += 35) {
      ctx.fillRect(x - 2, cy, w + 4, 8);
    }

    // Pasy ostrzegawcze na szczycie komina
    this.drawHazardStripes(ctx, x, y, w, 22);

    // Obrys
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Delikatne smugi dymu z komina
    const smokeY = y - 8;
    ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5 + 8, smokeY, 14, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Ruchoma suwnica rur (Górny poziom: y: 500, w: 320, h: 25).
   */
  drawCraneGantry(ctx, isDebug) {
    const cx = this.crane.x;
    const cy = this.crane.y;
    const cw = this.crane.width;
    const ch = this.crane.height;

    ctx.save();
    ctx.shadowBlur = 0;

    // Górna belka szyny suwnicy (rozciągnięta od 720 do 1180 przy y: 440)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(720, 440, 470, 14);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(720, 440, 470, 14);

    // Liny i wózek wciągarki podtrzymujący przemieszczającą się kładkę
    const trolleyX = cx + cw * 0.5;
    ctx.fillStyle = '#eab308';
    ctx.fillRect(trolleyX - 25, 436, 50, 18);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(trolleyX - 20, 454);
    ctx.lineTo(cx + 30, cy);
    ctx.moveTo(trolleyX + 20, 454);
    ctx.lineTo(cx + cw - 30, cy);
    ctx.stroke();

    // Podest suwnicy (ruchoma platforma kładkowa)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx, cy, cw, ch);
    ctx.fillStyle = '#334155';
    ctx.fillRect(cx + 3, cy + 3, cw - 6, ch - 6);

    // Wiązka rur wiertniczych przewożona na suwnicy
    ctx.fillStyle = '#64748b';
    ctx.fillRect(cx + 60, cy - 8, cw - 120, 8);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx + 60, cy - 8, cw - 120, 8);

    // Pasy ostrzegawcze na bokach kładki suwnicy
    this.drawHazardStripes(ctx, cx, cy, 30, ch);
    this.drawHazardStripes(ctx, cx + cw - 30, cy, 30, ch);

    // Oznaczenia taktyczne suwnicy
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CARGO GANTRY CRANE // ACTIVE LOAD', cx + cw * 0.5, cy + 16);

    // Obrys kolizyjny platformy
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, cw, ch);

    if (isDebug) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('[PLAT: typhoon_crane_gantry]', cx, cy - 14);
    }

    ctx.restore();
  }

  /**
   * Rysuje plamy ropy na głównym pokładzie z opalizującym filmem oraz płomienie/dym po zapaleniu.
   */
  drawOilPuddles(ctx) {
    ctx.save();
    ctx.shadowBlur = 0;

    for (let pIdx = 0; pIdx < this.oilPuddles.length; pIdx++) {
      const p = this.oilPuddles[pIdx];

      // Podstawa plamy: ciemna, gęsta ciecz naftowa
      ctx.fillStyle = '#09090b';
      ctx.fillRect(p.x1, p.y - 3, p.width, 6);

      // Tęczowy/błękitny połysk filmu naftowego
      const sheenGrad = ctx.createLinearGradient(p.x1, p.y, p.x2, p.y);
      sheenGrad.addColorStop(0, 'rgba(15, 23, 42, 0.7)');
      sheenGrad.addColorStop(0.35, 'rgba(30, 58, 138, 0.45)');
      sheenGrad.addColorStop(0.70, 'rgba(16, 185, 129, 0.35)');
      sheenGrad.addColorStop(1, 'rgba(15, 23, 42, 0.7)');
      ctx.fillStyle = sheenGrad;
      ctx.fillRect(p.x1 + 4, p.y - 2, p.width - 8, 4);

      // Jeśli ropa płonie: dynamiczne języki ognia na całej szerokości
      if (p.burning) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.fillRect(p.x1, p.y - 6, p.width, 10);

        // Płomienie procedularne
        for (let fx = p.x1 + 10; fx < p.x2 - 10; fx += 16) {
          const flameH = 14 + Math.sin(this.animTime * 18 + fx) * 8;
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(fx - 6, p.y);
          ctx.lineTo(fx + 6, p.y);
          ctx.lineTo(fx + 2, p.y - flameH);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.moveTo(fx - 3, p.y);
          ctx.lineTo(fx + 3, p.y);
          ctx.lineTo(fx + 1, p.y - flameH * 0.55);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // Cząsteczki płomieni
    for (let i = 0; i < this.fireParticles.length; i++) {
      const fp = this.fireParticles[i];
      ctx.fillStyle = fp.color;
      ctx.beginPath();
      ctx.arc(fp.x, fp.y, fp.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Kłęby ciemnego dymu
    for (let i = 0; i < this.smokeParticles.length; i++) {
      const sp = this.smokeParticles[i];
      ctx.fillStyle = `rgba(24, 24, 27, ${sp.alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Rysuje wzburzony ocean jako strefę śmierci (y: 1250..1400) z dynamicznymi falami i pianą.
   */
  drawTurbulentOcean(ctx) {
    ctx.save();
    ctx.shadowBlur = 0;

    const baseSeaY = this.deathY; // 1250 px

    // Ciemna głębia oceanu
    const oceanGrad = ctx.createLinearGradient(0, baseSeaY, 0, this.height);
    oceanGrad.addColorStop(0, '#0a1728');
    oceanGrad.addColorStop(0.5, '#060d17');
    oceanGrad.addColorStop(1, '#020509');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, baseSeaY, this.width, this.height - baseSeaY);

    // Animowane grzbiety fal (Sinusoida falująca w czasie)
    const t = this.animTime * 3.5;

    // Grzbiet fali 1
    ctx.fillStyle = '#0d223a';
    ctx.beginPath();
    ctx.moveTo(0, baseSeaY);
    for (let x = 0; x <= this.width; x += 40) {
      const wy = baseSeaY + Math.sin(x * 0.015 + t) * 16 + Math.cos(x * 0.03 - t * 0.8) * 8;
      ctx.lineTo(x, wy);
    }
    ctx.lineTo(this.width, this.height);
    ctx.lineTo(0, this.height);
    ctx.closePath();
    ctx.fill();

    // Grzbiet fali 2 z białą pianą morską
    ctx.fillStyle = '#133355';
    ctx.beginPath();
    ctx.moveTo(0, baseSeaY + 12);
    for (let x = 0; x <= this.width; x += 30) {
      const wy = baseSeaY + 12 + Math.cos(x * 0.02 - t * 1.2) * 14 + Math.sin(x * 0.04 + t) * 6;
      ctx.lineTo(x, wy);
    }
    ctx.lineTo(this.width, this.height);
    ctx.lineTo(0, this.height);
    ctx.closePath();
    ctx.fill();

    // Biała piana na szczytach fal
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 0; x <= this.width; x += 25) {
      const py = baseSeaY + 12 + Math.cos(x * 0.02 - t * 1.2) * 14 + Math.sin(x * 0.04 + t) * 6;
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();

    // Bryzgi fal morskich (krople)
    ctx.fillStyle = '#e0f2fe';
    for (let i = 0; i < this.sprayParticles.length; i++) {
      const sp = this.sprayParticles[i];
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  reset() {
    this.animTime = 0;
    this.lightningTimer = 0;
    this.lightningAlpha = 0;
    this.crane.x = 850;
    this.crane.dir = 1;
    this.cranePlatform.x = 850;
    for (let p of this.oilPuddles) {
      p.burning = false;
      p.burnTimer = 0;
    }
    this.fireParticles.length = 0;
    this.smokeParticles.length = 0;
    this.sprayParticles.length = 0;
  }
}

// =========================================================================
// 2. FUNKCJA REJESTRACJI ŚMIERCI ŚRODOWISKOWEJ (killByHazard)
// =========================================================================
export function killByHazard(victim, hazardName = "WZBURZONY OCEAN // SZTORM TYFON") {
  if (!victim || victim.isDead) return;

  victim.hp = 0;
  victim.isDead = true;
  victim.killer = { name: hazardName, isSelf: true, cause: 'OCEAN_HAZARD_DEATH' };
  victim.respawnTimer = 180;
  victim.vx = 0;
  victim.vy = 2;
  victim.onGround = false;
  victim.currentPlatform = null;
  victim.dropThroughPlatform = null;

  triggerScreenShake(4.5);
  spawnBloodSpurt(victim.x, victim.y + 30, 0, -1, 16, 2.0);
}

// =========================================================================
// 3. INSTANCJA ARENY I EKSPORTY KOMPATYBILNOŚCI
// =========================================================================
export const arena4 = new Arena4OilRig();

export const ARENA_TYPHOON = arena4;
export const ARENA_4_CONFIG = arena4;
export const ARENA_SPACE = arena4; // Kompatybilność wsteczna
export const ARENA_4_SPACE_CONFIG = arena4; // Kompatybilność wsteczna
export const SPAWN_POINTS = arena4.spawnPoints;
export const ARENA_4_PLATFORMS = arena4.platforms;
export const arena4State = {
  get animTime() { return arena4.animTime; },
  set animTime(v) { arena4.animTime = v; },
  deathY: arena4.deathY
};

export function updateArena4(dt, combatants) {
  arena4.update(dt, combatants);
}

export function drawArena4Background(ctx, camera) {
  arena4.drawBackground(ctx, camera);
}

export function drawArena4Foreground(ctx, camera) {
  arena4.render(ctx);
}

export function resetArena4() {
  arena4.reset();
}

export function handleTyphoonExplosion(expX, expY, radius) {
  return arena4.onExplosion(expX, expY, radius);
}

// Aliasy wstecznej kompatybilności
export const updateArena4Space = updateArena4;
export const drawArena4SpaceBackground = drawArena4Background;
export const drawArena4SpaceForeground = drawArena4Foreground;
export const resetArena4Space = resetArena4;
export const handleSpaceExplosion = handleTyphoonExplosion;

if (typeof window !== 'undefined') {
  window.arena4 = arena4;
}

export default arena4;
