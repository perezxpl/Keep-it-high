// =========================================================================
// ARENAS/ARENA4_SPACE.JS - STACJA ORBITALNA ARES (CANVAS 2D ENGINE)
// Moduł Areny 4: Środowisko Niskiej Grawitacji, Śmiertelna Próżnia,
// Zwarte Bryły Militarnego Kadłuba, Kompaktowe Jump-Pady, Zero ShadowBlur
// Standard: 60 FPS Google Chrome, Offscreen Canvas Background, ZERO EMOJIS
// =========================================================================

import { triggerScreenShake } from '../camera.js';
import { spawnBloodSpurt } from '../world/gore.js';

// =========================================================================
// 1. KLASA I ORKIESTRATOR ARENY KOSMICZNEJ (ARES ORBITAL STATION)
// =========================================================================
export class Arena4Space {
  constructor() {
    this.id = 'arena-4';
    this.alias = 'ARES_ORBITAL_STATION';
    this.mapId = 'ares_orbital_station_01';
    this.name = 'STACJA ORBITALNA ARES';
    this.width = 2400;
    this.height = 1400;
    this.mainDeckY = 820; // Główna wysokość platform
    this.deathY = 1250;   // Bezpieczny margines próżni pod całą stacją (minimum 350 px poniżej głównego pokładu)
    this.gravityMultiplier = 0.72;
    this.jetpackDrainMultiplier = 0.60;
    this.animTime = 0;
    this.cachedBg = null;

    // Twarde punkty odrodzenia przypisane bezpośrednio do powierzchni platform (isGround: true)
    this.spawnPoints = [
      { x: 500,  y: this.mainDeckY - 50, facing: 1,  team: 'CYAN',   label: 'LEWE_SKRZYDLO', isGround: true }, // Lewe skrzydło stacji
      { x: 850,  y: this.mainDeckY - 50, facing: 1,  team: 'CYAN',   label: 'CENTRUM_LEWE',   isGround: true }, // Centrum lewe
      { x: 1250, y: this.mainDeckY - 50, facing: -1, team: 'ORANGE', label: 'CENTRUM_PRAWE',  isGround: true }, // Centrum prawe
      { x: 1650, y: this.mainDeckY - 50, facing: -1, team: 'ORANGE', label: 'PRAWE_SKRZYDLO', isGround: true }  // Prawe skrzydło
    ];
    this.spawns = this.spawnPoints;

    // Zwarte, technologiczne bryły platform (koniec z pustą drucianą klatką)
    this.platforms = [
      // Główny centralny pokład bojowy (pełne wypełnienie)
      {
        id: 'ares_solid_deck',
        x: 400,
        y: 820,
        width: 1300,
        height: 140,
        w: 1300,
        h: 140,
        thickness: 140,
        isGround: true,
        solid: true,
        type: 'solid_deck'
      },
      // Lewa wieża obserwacyjna
      {
        id: 'ares_left_wing',
        x: 150,
        y: 640,
        width: 300,
        height: 35,
        w: 300,
        h: 35,
        thickness: 35,
        isGround: true,
        solid: true,
        type: 'wing'
      },
      // Prawa kładka radarowa
      {
        id: 'ares_right_wing',
        x: 1650,
        y: 640,
        width: 300,
        height: 35,
        w: 300,
        h: 35,
        thickness: 35,
        isGround: true,
        solid: true,
        type: 'wing'
      },
      // Osłony taktyczne na głównym pokładzie (niski profil)
      {
        id: 'ares_cover_west',
        x: 750,
        y: 785,
        width: 60,
        height: 35,
        w: 60,
        h: 35,
        thickness: 35,
        isCover: true,
        solid: true,
        isWall: true,
        isCoverWall: true,
        type: 'cover'
      },
      {
        id: 'ares_cover_east',
        x: 1300,
        y: 785,
        width: 60,
        height: 35,
        w: 60,
        h: 35,
        thickness: 35,
        isCover: true,
        solid: true,
        isWall: true,
        isCoverWall: true,
        type: 'cover'
      }
    ];

    // Kompaktowe, techniczne jump-pady na podłodze platformy
    this.repulsors = [
      {
        id: 'repulsor_left',
        x: 420,
        y: 810,
        width: 60,
        height: 10,
        w: 60,
        h: 10,
        launchVy: -16
      },
      {
        id: 'repulsor_right',
        x: 1620,
        y: 810,
        width: 60,
        height: 10,
        w: 60,
        h: 10,
        launchVy: -16
      }
    ];

    this.customObjects = [];
    this.initOffscreenBackground();
  }

  // =======================================================================
  // PRE-RENDEROWANE TŁO KOSMOSU (OFFSCREEN CANVAS BUFFER, 60 FPS)
  // Generowane RAZ w konstruktorze mapy; ZERO shadowBlur; ZERO wielkich zielonych kół
  // =======================================================================
  initOffscreenBackground() {
    const w = 3600;
    const h = 2000;
    let offCanvas = null;
    if (typeof OffscreenCanvas !== 'undefined') {
      offCanvas = new OffscreenCanvas(w, h);
    } else if (typeof document !== 'undefined') {
      offCanvas = document.createElement('canvas');
      offCanvas.width = w;
      offCanvas.height = h;
    }
    if (!offCanvas) return;

    const bgCtx = offCanvas.getContext('2d');
    if (!bgCtx) return;

    bgCtx.shadowBlur = 0;

    // 1. Głębia kosmicznej próżni (abyssal space gradient)
    const spaceGrad = bgCtx.createLinearGradient(0, 0, 0, h);
    spaceGrad.addColorStop(0, '#01030a');
    spaceGrad.addColorStop(0.35, '#030718');
    spaceGrad.addColorStop(0.7, '#040b22');
    spaceGrad.addColorStop(1, '#06102b');
    bgCtx.fillStyle = spaceGrad;
    bgCtx.fillRect(0, 0, w, h);

    // 2. Kosmiczne mgławice gazowe (bez shadowBlur)
    const nebGrad1 = bgCtx.createRadialGradient(800, 260, 40, 800, 260, 780);
    nebGrad1.addColorStop(0, 'rgba(14, 165, 233, 0.25)');
    nebGrad1.addColorStop(0.35, 'rgba(56, 189, 248, 0.12)');
    nebGrad1.addColorStop(0.7, 'rgba(14, 116, 144, 0.04)');
    nebGrad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    bgCtx.fillStyle = nebGrad1;
    bgCtx.fillRect(0, 0, w, h);

    const nebGrad2 = bgCtx.createRadialGradient(2400, 230, 50, 2400, 230, 720);
    nebGrad2.addColorStop(0, 'rgba(139, 92, 246, 0.20)');
    nebGrad2.addColorStop(0.4, 'rgba(99, 102, 241, 0.10)');
    nebGrad2.addColorStop(0.75, 'rgba(79, 70, 229, 0.03)');
    nebGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    bgCtx.fillStyle = nebGrad2;
    bgCtx.fillRect(0, 0, w, h);

    // 3. Deterministyczne pole gwiezdne (580 gwiazd o różnej magnitudo)
    let seed = 42891;
    function lcg() {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    }

    for (let i = 0; i < 580; i++) {
      const sx = lcg() * w;
      const sy = lcg() * (h * 0.72);
      const st = lcg();
      let r = 0.75;
      let a = 0.35 + lcg() * 0.60;
      let col = `rgba(255, 255, 255, ${a.toFixed(2)})`;

      if (st > 0.90) {
        r = 1.8;
        col = `rgba(186, 230, 253, ${a.toFixed(2)})`;
      } else if (st > 0.76) {
        r = 1.3;
        col = `rgba(254, 240, 138, ${a.toFixed(2)})`;
      }

      bgCtx.fillStyle = col;
      bgCtx.beginPath();
      bgCtx.arc(sx, sy, r, 0, Math.PI * 2);
      bgCtx.fill();

      // 4-ramienne promienie dyfrakcyjne dla najjaśniejszych gwiazd
      if (st > 0.95) {
        bgCtx.strokeStyle = `rgba(255, 255, 255, ${(a * 0.45).toFixed(2)})`;
        bgCtx.lineWidth = 1;
        const flen = 4 + lcg() * 5;
        bgCtx.beginPath();
        bgCtx.moveTo(sx - flen, sy);
        bgCtx.lineTo(sx + flen, sy);
        bgCtx.moveTo(sx, sy - flen);
        bgCtx.lineTo(sx, sy + flen);
        bgCtx.stroke();
      }
    }

    // 4. Daleka stacja przekaźnikowa w głębokim tle
    bgCtx.save();
    const rx = 620, ry = 175;
    bgCtx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
    bgCtx.lineWidth = 1.5;
    bgCtx.beginPath();
    bgCtx.moveTo(rx - 50, ry);
    bgCtx.lineTo(rx + 50, ry);
    bgCtx.moveTo(rx, ry - 35);
    bgCtx.lineTo(rx, ry + 35);
    bgCtx.stroke();

    bgCtx.beginPath();
    bgCtx.arc(rx, ry, 18, 0, Math.PI * 2);
    bgCtx.stroke();

    bgCtx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    bgCtx.fillRect(rx - 80, ry - 8, 26, 16);
    bgCtx.fillRect(rx + 54, ry - 8, 26, 16);
    bgCtx.restore();

    // 5. Krzywizna Ziemi (Luminous Earth Horizon) - BEZ WIELKICH ZIELONYCH KÓŁ
    bgCtx.save();
    const earthCenterX = w * 0.50;
    const earthRadius = 1850;
    const earthCenterY = 2550; // Horyzont planety majestatycznie w tle

    // Aureola atmosferyczna
    const atmoGrad = bgCtx.createRadialGradient(
      earthCenterX, earthCenterY, earthRadius - 20,
      earthCenterX, earthCenterY, earthRadius + 140
    );
    atmoGrad.addColorStop(0, 'rgba(56, 189, 248, 0.70)');
    atmoGrad.addColorStop(0.25, 'rgba(14, 165, 233, 0.38)');
    atmoGrad.addColorStop(0.65, 'rgba(2, 132, 199, 0.14)');
    atmoGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
    bgCtx.fillStyle = atmoGrad;
    bgCtx.beginPath();
    bgCtx.arc(earthCenterX, earthCenterY, earthRadius + 140, 0, Math.PI * 2);
    bgCtx.fill();

    // Tarcza oceaniczna planety Ziemia
    const oceanGrad = bgCtx.createRadialGradient(
      earthCenterX - 350, earthCenterY - earthRadius * 0.75, 120,
      earthCenterX, earthCenterY, earthRadius
    );
    oceanGrad.addColorStop(0, '#1d4ed8');
    oceanGrad.addColorStop(0.35, '#0f2c59');
    oceanGrad.addColorStop(0.75, '#07162c');
    oceanGrad.addColorStop(1, '#020617');
    bgCtx.fillStyle = oceanGrad;
    bgCtx.beginPath();
    bgCtx.arc(earthCenterX, earthCenterY, earthRadius, 0, Math.PI * 2);
    bgCtx.fill();

    // Złote światła miast po nocnej stronie planety
    bgCtx.fillStyle = 'rgba(254, 240, 138, 0.85)';
    for (let c = 0; c < 65; c++) {
      const cx = earthCenterX - 650 + lcg() * 1300;
      const cy = earthCenterY - earthRadius + 45 + lcg() * 160;
      const sz = 1.5 + (c % 3) * 0.7;
      bgCtx.fillRect(cx, cy, sz, sz);
    }

    // Formacje chmur wzdłuż krzywizny planety
    bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
    bgCtx.lineWidth = 16;
    bgCtx.beginPath();
    bgCtx.arc(earthCenterX, earthCenterY, earthRadius - 28, Math.PI * 1.24, Math.PI * 1.76);
    bgCtx.stroke();

    // Krawędź ozonowa
    bgCtx.strokeStyle = 'rgba(125, 211, 252, 0.95)';
    bgCtx.lineWidth = 3.5;
    bgCtx.beginPath();
    bgCtx.arc(earthCenterX, earthCenterY, earthRadius, Math.PI * 1.21, Math.PI * 1.79);
    bgCtx.stroke();

    bgCtx.restore();

    this.cachedBg = offCanvas;
  }

  // =======================================================================
  // RENDEROWANIE TŁA (POJEDYNCZE DRAWIMAGE, 60 FPS)
  // =======================================================================
  drawBackground(ctx, camera) {
    if (!this.cachedBg) {
      this.initOffscreenBackground();
    }
    if (!this.cachedBg) return;

    ctx.shadowBlur = 0;
    const camX = camera?.x || 0;
    const camY = camera?.y || 0;
    const bgOffsetX = -camX * 0.10;
    const bgOffsetY = -camY * 0.08;

    ctx.drawImage(this.cachedBg, bgOffsetX, bgOffsetY);
  }

  // =======================================================================
  // METODA RENDER() / DRAW() - ZWARTE, MILITARNE BRYŁY I KOMPAKTOWE JUMP-PADY
  // =======================================================================
  render(ctx) {
    // 1. Zabezpieczenie wydajności w Google Chrome: shadowBlur = 0 na początku renderowania
    ctx.shadowBlur = 0;
    ctx.save();

    // 2. Kolumny wsporcze łączące skrzydła wież (Y=640) z głównym pokładem (Y=820)
    // Lewe wsporniki konstrukcyjne
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(360, 675, 24, 145);
    ctx.fillRect(410, 675, 24, 145);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(360, 675, 24, 145);
    ctx.strokeRect(410, 675, 24, 145);

    // Prawe wsporniki konstrukcyjne
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(1660, 675, 24, 145);
    ctx.fillRect(1710, 675, 24, 145);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(1660, 675, 24, 145);
    ctx.strokeRect(1710, 675, 24, 145);

    // 3. Rysowanie litych platform stacji
    for (const p of this.platforms) {
      if (p.isCover) {
        // Osłony taktyczne na głównym pokładzie (niski profil: 60x35)
        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(p.x, p.y, p.width, p.height);

        // Pancerne płytki osłony
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(p.x + 4, p.y + 4, p.width - 8, p.height - 8);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x + 4, p.y + 4, p.width - 8, p.height - 8);

        // Wizjer ze szkła balistycznego
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(p.x + 8, p.y + 8, p.width - 16, 8);

        // Górna krawędź neonowy cyjan
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.width, p.y);
        ctx.stroke();

        // Paski ostrzegawcze
        ctx.fillStyle = '#eab308';
        ctx.fillRect(p.x + 8, p.y + 22, p.width - 16, 3);
        continue;
      }

      // Solidne platformy bojowe (pokład główny i skrzydła)
      // A. Korpus: wypełnienie ciemnym grafitem (#0b0f19 / #0f172a)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.width, p.height);

      // B. Pancerne modułowe panele wewnątrz bryły
      ctx.fillStyle = '#162235';
      const step = (p.type === 'solid_deck') ? 110 : 70;
      for (let px = p.x + 20; px < p.x + p.width - 20; px += step) {
        const segW = Math.min(step - 12, p.x + p.width - px - 8);
        ctx.fillRect(px, p.y + 6, segW, p.height - 12);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, p.y + 6, segW, p.height - 12);
      }

      // C. Górna krawędź kolizyjna: neonowy cyjan (#00f0ff, grubość 3 px)
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.width, p.y);
      ctx.stroke();

      // D. Krawędzie skrajne: żółto-czarne pasy ostrzegawcze (szerokość 18 px)
      drawHazardStripes(ctx, p.x, p.y, 18, p.height);
      drawHazardStripes(ctx, p.x + p.width - 18, p.y, 18, p.height);

      // E. Wojskowe oznaczenia taktyczne
      if (p.type === 'solid_deck') {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('ARES-04 // PRIMARY COMBAT DECK // ORBITAL COMMAND', p.x + 50, p.y + 35);
        ctx.fillText('STATUS: SECURE // ATMOSPHERE: VACUUM HAZARD', p.x + 50, p.y + 55);

        // Dolny pylon stacji (zwężenie w głąb kosmosu)
        ctx.fillStyle = '#080d17';
        ctx.beginPath();
        ctx.moveTo(p.x + 150, p.y + p.height);
        ctx.lineTo(p.x + 280, p.y + p.height + 60);
        ctx.lineTo(p.x + p.width - 280, p.y + p.height + 60);
        ctx.lineTo(p.x + p.width - 150, p.y + p.height);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dysze manewrowe RCS
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(p.x + 360, p.y + p.height + 60, 40, 10);
        ctx.fillRect(p.x + p.width - 400, p.y + p.height + 60, 40, 10);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(p.x + 368, p.y + p.height + 68, 24, 2);
        ctx.fillRect(p.x + p.width - 392, p.y + p.height + 68, 24, 2);
      } else if (p.id === 'ares_left_wing') {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('OBSERVATION TOWER // SECTOR WEST', p.x + 26, p.y + 20);
      } else if (p.id === 'ares_right_wing') {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('RADAR CATWALK // SECTOR EAST', p.x + 26, p.y + 20);
      }
    }

    // 4. Kompaktowe, techniczne jump-pady na podłodze platformy
    for (const rep of this.repulsors) {
      // Baza podestu: width: 60px, height: 10px na podłodze platformy (ctx.fillStyle = '#00f0ff')
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(rep.x, rep.y, rep.width, rep.height);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(rep.x, rep.y, rep.width, rep.height);

      // Efekt wizualny: wąski, pionowy promień energii w górę (width: 50px, height: 120px, rgba(0, 240, 255, 0.2))
      const beamGrad = ctx.createLinearGradient(0, rep.y, 0, rep.y - 120);
      beamGrad.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
      beamGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.15)');
      beamGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(rep.x + 5, rep.y - 120, 50, 120);

      // Subtelny animowany grot energii (▲)
      const phase = (this.animTime * 3.5) % 1.0;
      const arrowY = rep.y - 10 - phase * 90;
      ctx.fillStyle = `rgba(0, 240, 255, ${(1.0 - phase * 0.8).toFixed(2)})`;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('▲', rep.x + rep.width * 0.5, arrowY);
      ctx.textAlign = 'start';
    }

    ctx.restore();
  }

  draw(ctx, camera) {
    this.render(ctx);
  }

  // =======================================================================
  // GŁÓWNA PĘTLA LOGIKI (UPDATE: PRÓŻNIA, JUMP-PADY, JETPACK)
  // =======================================================================
  update(dt, combatants) {
    const safeDt = Math.min(dt || (1 / 60), 0.1);
    this.animTime += safeDt;

    const targets = Array.isArray(combatants) ? combatants : [];
    for (let i = 0; i < targets.length; i++) {
      const entity = targets[i];
      if (!entity) continue;

      // Warunek śmierci ma reagować wyłącznie na bezpowrotne wypadnięcie poza dolną krawędź konstrukcji
      if (entity.y > this.deathY && !entity.isDead) {
        killByHazard(entity, "PRÓŻNIA KOSMICZNA // DEKOMPRESJA");
        continue;
      }

      if (entity.isDead) continue;

      // Refundacja 40% zużytego paliwa jetpacka w niskiej grawitacji (drainMultiplier = 0.60)
      if (typeof entity.jetFuel === 'number') {
        if (entity._aresPrevFuel !== undefined && entity.jetFuel < entity._aresPrevFuel) {
          const drained = entity._aresPrevFuel - entity.jetFuel;
          const refund = drained * (1.0 - this.jetpackDrainMultiplier);
          entity.jetFuel = Math.min(entity.jetMax || 100, entity.jetFuel + refund);
        }
        entity._aresPrevFuel = entity.jetFuel;
      }

      // Kolizja: nadanie pędu entity.vy = -16 wyłącznie w chwili wejścia w obrys bazy podestu na podłodze
      const centerX = (entity.x || 0) + (entity.w || 24) * 0.5;
      const feetY = (entity.y || 0) + (entity.h || 70);

      for (let r = 0; r < this.repulsors.length; r++) {
        const rep = this.repulsors[r];
        if (centerX >= rep.x && centerX <= rep.x + rep.width) {
          if (feetY >= rep.y - 6 && feetY <= rep.y + rep.height + 16) {
            entity.y = rep.y - (entity.h || 70) - 2;
            entity.vy = rep.launchVy; // -16
            entity.isJumping = true;
            entity.onGround = false;
            entity.currentPlatform = null;
            entity.isCrouching = false;
            entity.airVx = entity.vx;
            triggerScreenShake(4.0);
            break;
          }
        }
      }
    }
  }

  reset() {
    this.animTime = 0;
  }

  onExplosion(expX, expY, radius, context) {
    return false;
  }

  onBulletHit(bullet) {
    return false;
  }

  onKickHit(player, kickBox) {
    return false;
  }
}

/**
 * Pomocnicze rysowanie profesjonalnej żółto-czarnej taśmy ostrzegawczej o szerokości 18 px
 */
function drawHazardStripes(ctx, x, y, w = 18, h = 35) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.fillStyle = '#0b0f19';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 4;
  for (let sx = x - h; sx < x + w + h; sx += 10) {
    ctx.beginPath();
    ctx.moveTo(sx, y + h);
    ctx.lineTo(sx + h, y);
    ctx.stroke();
  }
  ctx.restore();
}

// =========================================================================
// 2. FUNKCJA ŚMIERTELNEJ PRÓŻNI: killByHazard
// =========================================================================
export function killByHazard(victim, hazardName = "PRÓŻNIA KOSMICZNA // DEKOMPRESJA") {
  if (!victim || victim.isDead) return;

  victim.hp = 0;
  victim.isDead = true;
  victim.killer = { name: hazardName, isSelf: true, cause: 'VACUUM_DEATH' };
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
export const arena4 = new Arena4Space();

export const ARENA_SPACE = arena4;
export const ARENA_4_SPACE_CONFIG = arena4;
export const ARENA_4_SPACE_SPAWNS = arena4.spawnPoints;
export const ARENA_4_PLATFORMS = arena4.platforms;
export const arenaSpaceState = {
  get animTime() { return arena4.animTime; },
  set animTime(v) { arena4.animTime = v; },
  deathY: arena4.deathY
};

export function updateArena4Space(dt, combatants) {
  arena4.update(dt, combatants);
}

export function drawArena4SpaceBackground(ctx, camera) {
  arena4.drawBackground(ctx, camera);
}

export function drawArena4SpaceForeground(ctx, camera) {
  arena4.render(ctx);
}

export function resetArena4Space() {
  arena4.reset();
}

export function handleSpaceExplosion(expX, expY, radius) {
  return arena4.onExplosion(expX, expY, radius);
}

if (typeof window !== 'undefined') {
  window.arena4 = arena4;
}

export default arena4;
