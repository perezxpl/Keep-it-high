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

    // Twarde punkty odrodzenia ograniczone wyłącznie do wnętrza obrysu platform (isGround: true)
    this.spawnPoints = [
      { x: 360,  y: 590, facing: 1,  team: 'CYAN',   label: 'LEWE_SKRZYDLO', isGround: true }, // Lewe skrzydło stacji
      { x: 750,  y: 770, facing: 1,  team: 'CYAN',   label: 'CENTRUM_LEWE',   isGround: true }, // Środek (pokład lewy)
      { x: 1250, y: 770, facing: -1, team: 'ORANGE', label: 'CENTRUM_PRAWE',  isGround: true }, // Środek (pokład prawy)
      { x: 1760, y: 590, facing: -1, team: 'ORANGE', label: 'PRAWE_SKRZYDLO', isGround: true }  // Prawe skrzydło stacji
    ];
    this.spawns = this.spawnPoints;

    // Zwarte, technologiczne bryły platform stacji orbitalnej
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
      // Lewe skrzydło stacji
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
      // Prawe skrzydło stacji
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
      // Wisząca kładka górna (Sens dla repulsorów: wyniesienie vy = -16 z dolnego pokładu)
      {
        id: 'ares_upper_gantry',
        name: 'GÓRNA KŁADKA DOWODZENIA',
        x: 800,
        y: 460,
        width: 400,
        height: 25,
        w: 400,
        h: 25,
        thickness: 25,
        isGround: true,
        solid: true,
        isDropThrough: true,
        type: 'upper_gantry'
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

    const isDebug = typeof window !== 'undefined' && !!window.DEBUG_MODE;

    // 2. Skośne belki wspornikowe i kratownica w kolorze #1e293b z nitami
    // łączące lewe i prawe skrzydło z dolnym kadłubem stacji (koniec lewitujących uciętych klocków)
    drawStationTrusses(ctx);

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

        if (isDebug) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`[COVER: ${p.id}]`, p.x, p.y - 4);
        }
        continue;
      }

      if (p.id === 'ares_upper_gantry') {
        // Wisząca kładka górna (x: 800, y: 460, w: 400, h: 25)
        drawUpperGantryPlatform(ctx, p, this.animTime);
        if (isDebug) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`[PLAT: ${p.id} 400x25]`, p.x, p.y - 4);
        }
        continue;
      }

      if (p.type === 'solid_deck') {
        // Poszycie głównego pokładu z poziomymi nitami, lampami pozycyjnymi i dwoma wlotami technicznymi
        drawDeckHullPlating(ctx, p, this.animTime);
        if (isDebug) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`[PLAT: ${p.id} ${p.width}x${p.height}]`, p.x, p.y - 4);
        }
        continue;
      }

      if (p.id === 'ares_left_wing') {
        // Skrzydło lewe (x: 150..450, y: 640..675)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.width, p.height);

        // Modularne panele pancerza
        ctx.fillStyle = '#162235';
        for (let px = p.x + 20; px < p.x + p.width - 20; px += 70) {
          ctx.fillRect(px, p.y + 6, 58, p.height - 12);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, p.y + 6, 58, p.height - 12);
        }

        // Górna krawędź neonowy cyjan (#00f0ff, grubość 3 px)
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.width, p.y);
        ctx.stroke();

        // Pasy ostrzegawcze WYŁĄCZNIE na samej skrajnej krawędzi spadku do próżni (18 px)
        drawHazardStripes(ctx, p.x, p.y, 18, p.height);

        // Lampa pozycyjna lewa (Port side: czerwona LED)
        const redBlink = (this.animTime * 2.5) % 1.0 > 0.45;
        ctx.fillStyle = redBlink ? '#ef4444' : '#991b1b';
        ctx.beginPath();
        ctx.arc(p.x + 8, p.y + 8, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('OBSERVATION TOWER // SECTOR WEST', p.x + 26, p.y + 20);

        if (isDebug) {
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`[PLAT: ${p.id}]`, p.x, p.y - 4);
        }
      } else if (p.id === 'ares_right_wing') {
        // Skrzydło prawe (x: 1650..1950, y: 640..675)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.width, p.height);

        // Modularne panele pancerza
        ctx.fillStyle = '#162235';
        for (let px = p.x + 20; px < p.x + p.width - 20; px += 70) {
          ctx.fillRect(px, p.y + 6, 58, p.height - 12);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, p.y + 6, 58, p.height - 12);
        }

        // Górna krawędź neonowy cyjan (#00f0ff, grubość 3 px)
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.width, p.y);
        ctx.stroke();

        // Pasy ostrzegawcze WYŁĄCZNIE na samej skrajnej krawędzi spadku do próżni (18 px)
        drawHazardStripes(ctx, p.x + p.width - 18, p.y, 18, p.height);

        // Lampa pozycyjna prawa (Starboard side: zielona LED)
        const greenBlink = (this.animTime * 2.5) % 1.0 > 0.45;
        ctx.fillStyle = greenBlink ? '#22c55e' : '#166534';
        ctx.beginPath();
        ctx.arc(p.x + p.width - 8, p.y + 8, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('RADAR CATWALK // SECTOR EAST', p.x + 26, p.y + 20);

        if (isDebug) {
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`[PLAT: ${p.id}]`, p.x, p.y - 4);
        }
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

      // Efekt wizualny: wąski, pionowy promień energii w górę (width: 50px, height: 120px)
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

      // Kolizja: nadanie pędu entity.vy = -16 oraz wektora dośrodkowego w stronę kładki górnej (800..1200, y: 460)
      const centerX = (entity.x || 0) + (entity.w || 24) * 0.5;
      const feetY = (entity.y || 0) + (entity.h || 70);

      for (let r = 0; r < this.repulsors.length; r++) {
        const rep = this.repulsors[r];
        if (centerX >= rep.x && centerX <= rep.x + rep.width) {
          if (feetY >= rep.y - 6 && feetY <= rep.y + rep.height + 16) {
            entity.y = rep.y - (entity.h || 70) - 2;
            entity.vy = rep.launchVy; // -16
            // Nadanie precyzyjnego pędu dośrodkowego ku wiszącej kładce górnej (x: 800..1200, y: 460)
            if (rep.id === 'repulsor_left') {
              entity.vx = Math.max(entity.vx || 0, 4.2);
            } else if (rep.id === 'repulsor_right') {
              entity.vx = Math.min(entity.vx || 0, -4.2);
            }
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

/**
 * Rysuje skośną belkę kratownicy w kolorze #1e293b z nitami
 */
function drawTrussBeam(ctx, x1, y1, x2, y2, thickness = 16) {
  ctx.save();
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  ctx.translate(x1, y1);
  ctx.rotate(angle);

  // Główna belka konstrukcyjna
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, -thickness / 2, len, thickness);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, -thickness / 2, len, thickness);

  // Wewnętrzny ryflowany/podłużny rowek technologiczny
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(8, -thickness / 4, len - 16, thickness / 2);

  // Nity stalowe wzdłuż belki
  ctx.fillStyle = '#64748b';
  for (let d = 16; d < len - 12; d += 32) {
    ctx.beginPath();
    ctx.arc(d, -thickness / 4, 1.8, 0, Math.PI * 2);
    ctx.arc(d, thickness / 4, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Węzeł kratownicy (gusset plate) z nitami
 */
function drawTrussGusset(ctx, x, y, size = 26) {
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x - size / 2, y - size / 2, size, size);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - size / 2, y - size / 2, size, size);

  // Nity narożne
  ctx.fillStyle = '#94a3b8';
  const rOff = size / 3;
  ctx.beginPath();
  ctx.arc(x - rOff, y - rOff, 2, 0, Math.PI * 2);
  ctx.arc(x + rOff, y - rOff, 2, 0, Math.PI * 2);
  ctx.arc(x - rOff, y + rOff, 2, 0, Math.PI * 2);
  ctx.arc(x + rOff, y + rOff, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Zintegrowane kratownice łączące skrzydła stacji z głównym pokładem
 */
function drawStationTrusses(ctx) {
  ctx.save();

  // 1. Lewa strona (skrzydło: X: 150..450, Y: 640..675 z kadłubem: X: 400, Y: 820..960)
  // Główne skośne belki wspornikowe
  drawTrussBeam(ctx, 180, 675, 400, 845, 18);
  drawTrussBeam(ctx, 275, 675, 400, 920, 16);
  drawTrussBeam(ctx, 350, 675, 400, 825, 14);

  // Krzyżulce kratownicy (X-bracing)
  drawTrussBeam(ctx, 220, 715, 330, 810, 8);
  drawTrussBeam(ctx, 330, 730, 240, 800, 8);

  // Pionowe podpory usztywniające pod lewym skrzydłem
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(360, 675, 24, 145);
  ctx.fillRect(410, 675, 24, 145);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(360, 675, 24, 145);
  ctx.strokeRect(410, 675, 24, 145);

  // Węzły połączeniowe (Gussets)
  drawTrussGusset(ctx, 180, 675, 28);
  drawTrussGusset(ctx, 275, 675, 24);
  drawTrussGusset(ctx, 400, 845, 28);
  drawTrussGusset(ctx, 400, 920, 26);

  // 2. Prawa strona (skrzydło: X: 1650..1950, Y: 640..675 z kadłubem: X: 1700, Y: 820..960)
  // Główne skośne belki wspornikowe
  drawTrussBeam(ctx, 1920, 675, 1700, 845, 18);
  drawTrussBeam(ctx, 1825, 675, 1700, 920, 16);
  drawTrussBeam(ctx, 1750, 675, 1700, 825, 14);

  // Krzyżulce kratownicy (X-bracing)
  drawTrussBeam(ctx, 1880, 715, 1770, 810, 8);
  drawTrussBeam(ctx, 1770, 730, 1860, 800, 8);

  // Pionowe podpory usztywniające pod prawym skrzydłem
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(1660, 675, 24, 145);
  ctx.fillRect(1710, 675, 24, 145);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(1660, 675, 24, 145);
  ctx.strokeRect(1710, 675, 24, 145);

  // Węzły połączeniowe (Gussets)
  drawTrussGusset(ctx, 1920, 675, 28);
  drawTrussGusset(ctx, 1825, 675, 24);
  drawTrussGusset(ctx, 1700, 845, 28);
  drawTrussGusset(ctx, 1700, 920, 26);

  ctx.restore();
}

/**
 * Rysuje militarny wlot techniczny / żaluzje chłodzenia reaktora
 */
function drawTechnicalIntake(ctx, x, y, w = 75, h = 56, animTime = 0, label = 'INTAKE') {
  ctx.save();
  // Wnęka
  ctx.fillStyle = '#030712';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);

  // 4 skośne tytanowe żaluzje (cooling louvers)
  const louverCount = 4;
  const lGap = (h - 8) / louverCount;
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < louverCount; i++) {
    const ly = y + 6 + i * lGap;
    ctx.beginPath();
    ctx.moveTo(x + 4, ly + 6);
    ctx.lineTo(x + w - 4, ly);
    ctx.stroke();
  }

  // Wewnętrzna siatka mesh
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
  ctx.lineWidth = 1;
  for (let gx = x + 8; gx < x + w - 8; gx += 8) {
    ctx.beginPath();
    ctx.moveTo(gx, y + 4);
    ctx.lineTo(gx, y + h - 4);
    ctx.stroke();
  }

  // Dioda statusowa wlotu (pulsujący cyan/amber)
  const pulse = 0.5 + 0.5 * Math.sin(animTime * 4 + x);
  ctx.fillStyle = `rgba(56, 189, 248, ${(0.4 + pulse * 0.6).toFixed(2)})`;
  ctx.fillRect(x + 5, y + 5, 4, 4);

  // Mikro-stencil
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 8px monospace';
  ctx.fillText(label, x + 14, y + 10);

  ctx.restore();
}

/**
 * Rysuje wiszącą kładkę górną (x: 800, y: 460, w: 400, h: 25)
 * z militarnym terminalem zrzutu airdropów / kopułą radarową pośrodku
 */
function drawUpperGantryPlatform(ctx, p, animTime = 0) {
  ctx.save();

  // 1. Podwieszenie: stalowe cięgna/odciągi biegnące w górę do orbitalnej ramy
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3;
  // Lewe podwieszenie
  ctx.beginPath();
  ctx.moveTo(p.x + 30, p.y);
  ctx.lineTo(p.x + 30, p.y - 260);
  ctx.moveTo(p.x + 40, p.y);
  ctx.lineTo(p.x + 40, p.y - 260);
  // Prawe podwieszenie
  ctx.moveTo(p.x + p.width - 30, p.y);
  ctx.lineTo(p.x + p.width - 30, p.y - 260);
  ctx.moveTo(p.x + p.width - 40, p.y);
  ctx.lineTo(p.x + p.width - 40, p.y - 260);
  ctx.stroke();

  // Okucia cięgien / śruby rzymskie
  ctx.fillStyle = '#334155';
  ctx.fillRect(p.x + 25, p.y - 35, 20, 14);
  ctx.fillRect(p.x + p.width - 45, p.y - 35, 20, 14);

  // 2. Bryła kładki
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(p.x, p.y, p.width, p.height);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.strokeRect(p.x, p.y, p.width, p.height);

  // Modularne płytki pancerne pokładu
  ctx.fillStyle = '#162235';
  for (let px = p.x + 12; px < p.x + p.width - 12; px += 45) {
    ctx.fillRect(px, p.y + 4, 38, p.height - 8);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, p.y + 4, 38, p.height - 8);
  }

  // Górna krawędź neonowy cyjan (grubość 2.5px)
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + p.width, p.y);
  ctx.stroke();

  // Nity montażowe wzdłuż dolnej krawędzi kładki
  ctx.fillStyle = '#64748b';
  for (let rx = p.x + 16; rx < p.x + p.width - 10; rx += 25) {
    ctx.beginPath();
    ctx.arc(rx, p.y + p.height - 4, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Militarny terminal zrzutu airdropów / osłona radarowa pośrodku (x: 955..1045)
  const termX = p.x + p.width * 0.5 - 45;
  const termW = 90;
  const termH = 30;
  const termY = p.y - termH;

  // Podstawa montażowa terminala
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(termX - 4, p.y - 6, termW + 8, 8);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(termX - 4, p.y - 6, termW + 8, 8);

  // Kompozytowa opancerzona kopuła radaru / obudowa terminala
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(termX, p.y);
  ctx.lineTo(termX + 12, termY);
  ctx.lineTo(termX + termW - 12, termY);
  ctx.lineTo(termX + termW, p.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Wypukła tarcza radarowa ze szkła pancernego
  ctx.fillStyle = '#091322';
  ctx.beginPath();
  ctx.arc(termX + termW * 0.5, termY + 12, 14, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Maszt anteny telemetrycznej z migającym sygnalizatorem
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(termX + termW * 0.5, termY);
  ctx.lineTo(termX + termW * 0.5, termY - 14);
  ctx.stroke();

  const beaconBlink = (animTime * 3.0) % 1.0 > 0.45;
  ctx.fillStyle = beaconBlink ? '#38bdf8' : '#0369a1';
  ctx.beginPath();
  ctx.arc(termX + termW * 0.5, termY - 15, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Dioda statusu gotowości zrzutu (READY: zielony / amber)
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(termX + 10, termY + 16, 4, 4);

  // Oznaczenie szablonowe na osłonie terminala
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('AIRDROP TERMINAL // RADAR', termX + termW * 0.5, termY + 26);
  ctx.textAlign = 'start';

  ctx.restore();
}

/**
 * Rysuje pancerne poszycie głównego pokładu z poziomymi nitami,
 * lampami pozycyjnymi i dwoma wlotami technicznymi
 */
function drawDeckHullPlating(ctx, p, animTime = 0) {
  ctx.save();

  // 1. Korpus: wypełnienie ciemnym grafitem
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(p.x, p.y, p.width, p.height);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.strokeRect(p.x, p.y, p.width, p.height);

  // 2. Poziome panele pancerza (3 warstwy pancerza modularnego)
  // Warstwa górna (Y: 826..868)
  ctx.fillStyle = '#131f33';
  ctx.fillRect(p.x + 15, p.y + 6, p.width - 30, 42);
  ctx.strokeStyle = '#27384f';
  ctx.lineWidth = 1;
  ctx.strokeRect(p.x + 15, p.y + 6, p.width - 30, 42);

  // Warstwa środkowa (Y: 872..914)
  ctx.fillStyle = '#16253c';
  ctx.fillRect(p.x + 15, p.y + 52, p.width - 30, 42);
  ctx.strokeStyle = '#27384f';
  ctx.lineWidth = 1;
  ctx.strokeRect(p.x + 15, p.y + 52, p.width - 30, 42);

  // Warstwa dolna (Y: 918..952)
  ctx.fillStyle = '#0e1726';
  ctx.fillRect(p.x + 15, p.y + 98, p.width - 30, 36);
  ctx.strokeStyle = '#27384f';
  ctx.lineWidth = 1;
  ctx.strokeRect(p.x + 15, p.y + 98, p.width - 30, 36);

  // Pionowe dylatacje paneli co 160px
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.lineWidth = 2;
  for (let dx = p.x + 175; dx < p.x + p.width - 50; dx += 160) {
    ctx.beginPath();
    ctx.moveTo(dx, p.y + 6);
    ctx.lineTo(dx, p.y + p.height - 6);
    ctx.stroke();
  }

  // 3. Poziome rzędy nitów stalowych wzdłuż spoin poszycia
  ctx.fillStyle = '#64748b';
  const rivetY1 = p.y + 28;
  const rivetY2 = p.y + 74;
  const rivetY3 = p.y + 116;
  for (let rx = p.x + 30; rx < p.x + p.width - 30; rx += 38) {
    // Pomijaj strefy wlotów technicznych
    if ((rx >= 670 && rx <= 765) || (rx >= 1335 && rx <= 1430)) continue;
    ctx.beginPath();
    ctx.arc(rx, rivetY1, 2, 0, Math.PI * 2);
    ctx.arc(rx, rivetY2, 2, 0, Math.PI * 2);
    ctx.arc(rx, rivetY3, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Dwa wloty techniczne (Lewy: X: 680..755, Prawy: X: 1345..1420)
  drawTechnicalIntake(ctx, 680, p.y + 26, 75, 56, animTime, 'SYS-INTAKE // L');
  drawTechnicalIntake(ctx, 1345, p.y + 26, 75, 56, animTime, 'SYS-INTAKE // R');

  // 5. Górna krawędź kolizyjna: neonowy cyjan (#00f0ff, grubość 3 px)
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + p.width, p.y);
  ctx.stroke();

  // 6. Lampy pozycyjne wzdłuż dolnego obrysu pylonu stacji
  const lampPulse = 0.5 + 0.5 * Math.sin(animTime * 3.5);
  ctx.fillStyle = `rgba(0, 240, 255, ${(0.5 + lampPulse * 0.5).toFixed(2)})`;
  const lampPositions = [p.x + 120, p.x + 450, p.x + 850, p.x + 1180];
  for (const lx of lampPositions) {
    ctx.fillRect(lx, p.y + p.height - 8, 12, 4);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(lx, p.y + p.height - 8, 12, 4);
  }

  // 7. Wojskowe oznaczenia taktyczne (subtelna typografia lore)
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('ARES-04 // PRIMARY COMBAT DECK // ORBITAL COMMAND', p.x + 50, p.y + 22);
  ctx.fillText('ATMOSPHERE: VACUUM HAZARD // SECURE AIRLOCK', p.x + 50, p.y + 118);

  // 8. Dolny pylon stacji (zwężenie w głąb kosmosu)
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
export const SPAWN_POINTS = arena4.spawnPoints;
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
