// =========================================================================
// ARENAS/ARENA4.JS - LOTNISKOWIEC // USS TITAN (CANVAS 2D ENGINE)
// Moduł Areny 4: Panoramiczny Okręt Wojenny na Otwartym Oceanie
// Skala 1:1: Masywny Stalowy Pokład Lotniskowca Bezpośrednio pod Stopami Graczy!
//
// GEOMETRIA I POZYCJE (SKALA 1:1):
// - Poziom podłogi pokładu: mainDeckY = 820, szerokość: 2800 px (x: 200..3000), grubość: 45 px (y: 820..865)
// - Kadłub burtowy pod pokładem: y: 865 w dół do y: 1200 (lita stal pancerna #1e293b, spawy, nity)
// - Mostek dowodzenia / Wyspa (Prawa strona: x: 2400..2800):
//     Piętro 1: Kładka techniczna na y: 680 (szerokość 350 px, x: 2450..2800)
//     Piętro 2: Balkon kontroli lotów na y: 520 (szerokość 280 px, x: 2520..2800)
//     Szczyt: Maszt radarowy z obracającą się anteną i oświetleniem #ef4444
// - Zaparkowane myśliwce jako twarde osłony (Covers):
//     Myśliwiec A: x: 900, y: 778, width: 90, height: 42 (stoi na y: 820)
//     Myśliwiec B: x: 1700, y: 778, width: 90, height: 42 (stoi na y: 820)
// - Katapulta parowa: x: 350..750 na y: 820, przyspieszenie vx = max(vx, 22) + para
// - Strefa śmierci: deathY = 1080 poza obrysem pasa (x < 200 lub x > 3000)
//
// STANDARD: Stabilne 60 FPS Google Chrome, ZERO ctx.shadowBlur,
// OffscreenCanvas buforowanie tła oceanu, kadłuba lotniskowca i mostka,
// ZERO EMOJIS, Stylistyka Modern Naval Military.
// =========================================================================

import { triggerScreenShake } from '../camera.js';
import { spawnBloodSpurt } from '../world/gore.js';

/**
 * Bezpieczne tworzenie OffscreenCanvas kompatybilne z przeglądarkami oraz Node.js.
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
// 1. GŁÓWNA KLASA ARENY: Arena4Titan („LOTNISKOWIEC // USS TITAN”)
// =========================================================================
export class Arena4Titan {
  constructor() {
    this.id = 'arena-4';
    this.alias = 'USS_TITAN';
    this.mapId = 'uss_titan_01';
    this.name = 'LOTNISKOWIEC // USS TITAN';
    this.width = 3200;
    this.height = 1200;
    this.mainDeckY = 820; // Poziom podłogi pokładu w skali 1:1
    this.deathY = 1080;   // Granica wzburzonego oceanu za burtą (strefa śmierci)
    this.gravityMultiplier = 1.0;
    this.animTime = 0;

    // Twarde punkty odrodzenia (SPAWN_POINTS) na pokładzie y = 820 (stopy)
    this.spawnPoints = [
      { x: 450,  y: 760, facing: 1,  team: 'CYAN',   label: 'KATAPULTA_LEWA', isGround: true },
      { x: 1350, y: 760, facing: 1,  team: 'CYAN',   label: 'ŚRODEK_PASA',    isGround: true },
      { x: 2150, y: 760, facing: -1, team: 'ORANGE', label: 'PRAWA_POKŁAD',  isGround: true },
      { x: 2550, y: 460, facing: -1, team: 'ORANGE', label: 'MOSTEK_PIĘTRO_2',isGround: true }
    ];
    this.spawns = this.spawnPoints;

    // Platforma katapulty parowej (strefa aktywacji: x od 350 do 750, y: 820)
    this.catapult = {
      x1: 350,
      x2: 750,
      y: 820,
      boostVx: 22,
      cooldown: 0
    };

    // Kompletna lista fizycznych platform areny
    this.platforms = [
      // 1. Główny pas startowy (Płaski pokład 2800 px)
      {
        id: 'titan_flight_deck',
        name: 'GŁÓWNY POKŁAD STARTOWY',
        x: 200,
        y: 820,
        width: 2800,
        height: 45,
        w: 2800,
        h: 45,
        thickness: 45,
        isGround: true,
        solid: true,
        type: 'flight_deck'
      },

      // 2. Wyspa dowodzenia / Mostek (Kładki obserwacyjne po prawej stronie)
      // Piętro 1: Kładka techniczna na y: 680 (szerokość 350 px)
      {
        id: 'titan_bridge_lvl1',
        name: 'MOSTEK - PIĘTRO 1',
        x: 2450,
        y: 680,
        width: 350,
        height: 25,
        w: 350,
        h: 25,
        thickness: 25,
        isGround: true,
        solid: true,
        isDropThrough: true,
        type: 'catwalk'
      },
      // Piętro 2: Balkon kontroli lotów na y: 520 (szerokość 280 px)
      {
        id: 'titan_bridge_lvl2',
        name: 'MOSTEK - PIĘTRO 2',
        x: 2520,
        y: 520,
        width: 280,
        height: 25,
        w: 280,
        h: 25,
        thickness: 25,
        isGround: true,
        solid: true,
        isDropThrough: true,
        type: 'catwalk'
      },

      // 3. Zaparkowane myśliwce stealth jako twarde osłony (Covers)
      // Myśliwiec A: x: 900, y: 778, width: 90, height: 42 (spód stoi na y: 820)
      {
        id: 'titan_fighter_a',
        name: 'MYŚLIWIEC F/A-24 ALFA',
        x: 900,
        y: 778,
        width: 90,
        height: 42,
        w: 90,
        h: 42,
        thickness: 42,
        isCover: true,
        solid: true,
        isGround: true,
        type: 'fighter_cover'
      },
      // Myśliwiec B: x: 1700, y: 778, width: 90, height: 42 (spód stoi na y: 820)
      {
        id: 'titan_fighter_b',
        name: 'MYŚLIWIEC F/A-24 BRAWO',
        x: 1700,
        y: 778,
        width: 90,
        height: 42,
        w: 90,
        h: 42,
        thickness: 42,
        isCover: true,
        solid: true,
        isGround: true,
        type: 'fighter_cover'
      }
    ];

    this.customObjects = [];

    // Pula cząsteczek pary z katapulty
    this.steamParticles = [];

    // Bufory OffscreenCanvas
    this.bgCanvas = null;
    this.carrierCanvas = null;
    this.buffersReady = false;

    this.initBuffers();
  }

  /**
   * Inicjalizacja buforów OffscreenCanvas – generowane TYLKO RAZ dla 60 FPS.
   */
  initBuffers() {
    this.bgCanvas = createOffscreenCanvas(this.width, this.height);
    this.carrierCanvas = createOffscreenCanvas(this.width, this.height);

    if (this.bgCanvas && this.carrierCanvas) {
      this.renderBackgroundBuffer();
      this.renderCarrierBuffer();
      this.buffersReady = true;
    }
  }

  /**
   * Pre-renderowanie panoramicznego tła nieba morskiego w buforze OffscreenCanvas.
   * ZERO sylwetek miniaturowego okrętu na dole ekranu.
   * ZERO ctx.shadowBlur.
   */
  renderBackgroundBuffer() {
    const ctx = this.bgCanvas.getContext('2d');
    if (!ctx) return;

    const w = this.width;
    const h = this.height;

    // 1. Panoramiczne niebo morskie – czysty wojskowy gradient nieba
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 750);
    skyGrad.addColorStop(0.00, '#0a1728'); // Granat stratosfery
    skyGrad.addColorStop(0.40, '#122640'); // Chłodny granat
    skyGrad.addColorStop(0.75, '#1d3958'); // Stalowy błękit
    skyGrad.addColorStop(0.92, '#335574'); // Zamglenie horyzontu
    skyGrad.addColorStop(1.00, '#4b6c8c'); // Linia horyzontu
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, 750);

    // 2. Chmury na dalszym planie (lekkie pasma altostratus)
    ctx.fillStyle = 'rgba(210, 225, 240, 0.08)';
    ctx.beginPath();
    ctx.ellipse(600, 240, 480, 45, -0.05, 0, Math.PI * 2);
    ctx.ellipse(1500, 160, 620, 50, 0.03, 0, Math.PI * 2);
    ctx.ellipse(2400, 220, 550, 42, -0.02, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(230, 240, 255, 0.05)';
    ctx.beginPath();
    ctx.ellipse(900, 300, 360, 35, 0.02, 0, Math.PI * 2);
    ctx.ellipse(2000, 270, 420, 38, -0.04, 0, Math.PI * 2);
    ctx.fill();

    // 3. Smugi kondensacyjne myśliwców (contrails) w stratosferze
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(100, 100);
    ctx.lineTo(1400, 30);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(1700, 60);
    ctx.lineTo(3100, 130);
    ctx.stroke();

    // 4. Odległy ocean na horyzoncie (od y = 750 do h)
    const seaGrad = ctx.createLinearGradient(0, 750, 0, h);
    seaGrad.addColorStop(0.00, '#102235'); // Tafla horyzontu
    seaGrad.addColorStop(0.35, '#0a1827');
    seaGrad.addColorStop(1.00, '#040911'); // Głębia oceanu
    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, 750, w, h - 750);

    // Linia mgły morskiej na horyzoncie
    ctx.strokeStyle = 'rgba(96, 138, 175, 0.40)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 750);
    ctx.lineTo(w, 750);
    ctx.stroke();
  }

  /**
   * Pre-renderowanie konstrukcji lotniskowca W SKALI 1:1:
   * Główny pokład startowy na y = 820, potężny kadłub burtowy w dół do y = 1200,
   * wieża mostka (x: 2400..2800) z kładkami na y: 680 i y: 520, oraz myśliwce stealth na y: 778.
   * ZERO ctx.shadowBlur.
   */
  renderCarrierBuffer() {
    const ctx = this.carrierCanvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    // =========================================================================
    // A. POTĘŻNY KADŁUB POD POKŁADEM (BURTA OKRĘTU: y: 865 w dół do y: 1200)
    // =========================================================================
    // Lita ściana kadłuba ze stali pancernej (#1e293b)
    const hullGrad = ctx.createLinearGradient(0, 865, 0, 1200);
    hullGrad.addColorStop(0.00, '#1e293b'); // Stal pancerna burt
    hullGrad.addColorStop(0.50, '#17202d');
    hullGrad.addColorStop(0.85, '#0f1722');
    hullGrad.addColorStop(1.00, '#090d14'); // Ciemna linia wodna
    ctx.fillStyle = hullGrad;

    ctx.beginPath();
    // Górna krawędź styku z płytą pokładu
    ctx.moveTo(180, 865);
    // Skos dziobowy lewej burty
    ctx.lineTo(260, 1150);
    ctx.lineTo(2940, 1150);
    // Skos rufowy prawej burty
    ctx.lineTo(3020, 865);
    ctx.closePath();
    ctx.fill();

    // Dolny podwodny pas antyporostowy (czerwony tlenkowy pancerz mniejszy niż linia wodna)
    ctx.fillStyle = '#5c1d1d';
    ctx.beginPath();
    ctx.moveTo(250, 1110);
    ctx.lineTo(260, 1150);
    ctx.lineTo(2940, 1150);
    ctx.lineTo(2950, 1110);
    ctx.closePath();
    ctx.fill();

    // Czarny pas linii wodnej (boot-topping)
    ctx.fillStyle = '#090d14';
    ctx.fillRect(240, 1095, 2720, 15);

    // Pionowe spawy płyt pancernych i nity burtowe
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    for (let px = 320; px <= 2880; px += 150) {
      ctx.beginPath();
      ctx.moveTo(px, 865);
      ctx.lineTo(px, 1095);
      ctx.stroke();

      // Cień po prawej stronie spoiny
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 2, 865);
      ctx.lineTo(px + 2, 1095);
      ctx.stroke();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
    }

    // Podłużne wręgi usztywniające burtę kadłuba
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, 920);
    ctx.lineTo(3000, 920);
    ctx.moveTo(220, 980);
    ctx.lineTo(2980, 980);
    ctx.moveTo(235, 1040);
    ctx.lineTo(2965, 1040);
    ctx.stroke();

    // Stalowe podpory pokładu (sponsons & knee braces)
    ctx.fillStyle = '#111827';
    for (let sx = 260; sx <= 2940; sx += 180) {
      ctx.beginPath();
      ctx.moveTo(sx - 25, 865);
      ctx.lineTo(sx + 25, 865);
      ctx.lineTo(sx, 905);
      ctx.closePath();
      ctx.fill();
    }

    // Wystające siatki bezpieczeństwa (safety catwalks / netting) na krawędziach
    // Lewa siatka asekuracyjna (x: 155..200, y: 830..865)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(155, 840, 45, 6);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(155, 840, 45, 6);
    // Siatka
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1;
    for (let nx = 158; nx <= 196; nx += 8) {
      ctx.beginPath();
      ctx.moveTo(nx, 840);
      ctx.lineTo(nx + 4, 855);
      ctx.stroke();
    }

    // Prawa siatka asekuracyjna (x: 3000..3045, y: 830..865)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(3000, 840, 45, 6);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(3000, 840, 45, 6);
    for (let nx = 3004; nx <= 3040; nx += 8) {
      ctx.beginPath();
      ctx.moveTo(nx, 840);
      ctx.lineTo(nx - 4, 855);
      ctx.stroke();
    }

    // =========================================================================
    // B. GŁÓWNY PAS STARTOWY (NAWIERZCHNIA: y: 820, szerokość: 2800 px, grubość: 45 px)
    // =========================================================================
    // Płyta pokładu startowego z ciemnego kompozytu/asfaltu (#111827)
    const deckGrad = ctx.createLinearGradient(0, 820, 0, 865);
    deckGrad.addColorStop(0.00, '#111827'); // Antypoślizgowa nawierzchnia pokładu
    deckGrad.addColorStop(0.40, '#0f172a');
    deckGrad.addColorStop(1.00, '#090d16');
    ctx.fillStyle = deckGrad;
    ctx.fillRect(200, 820, 2800, 45);

    // Poziome panele technologiczne (dylatacje i płyty pokładu)
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
    ctx.lineWidth = 1;
    for (let dx = 240; dx <= 2960; dx += 80) {
      ctx.beginPath();
      ctx.moveTo(dx, 822);
      ctx.lineTo(dx, 863);
      ctx.stroke();
    }

    // Wyraźna żółta krawędź bezpieczeństwa na obrzeżach (#eab308)
    ctx.fillStyle = '#eab308';
    ctx.fillRect(195, 820, 2810, 4); // Górna krawędź
    ctx.fillRect(195, 861, 2810, 4); // Dolna krawędź

    // Przerywane białe pasy startowe na całej długości (Runway Centerline)
    ctx.fillStyle = 'rgba(248, 250, 252, 0.92)';
    for (let rx = 320; rx <= 2880; rx += 140) {
      ctx.fillRect(rx, 839, 80, 5);
    }

    // Stencil oznaczeń taktycznych na pokładzie
    ctx.fillStyle = 'rgba(241, 245, 249, 0.22)';
    ctx.font = '900 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CVN-99', 1400, 856);
    ctx.font = '900 32px sans-serif';
    ctx.fillText('USS TITAN', 2150, 856);

    // Dźwigniki samolotowe (Aircraft Elevators)
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#090d14';
    ctx.fillRect(780, 824, 100, 38);
    ctx.strokeRect(780, 824, 100, 38);
    ctx.fillRect(1850, 824, 100, 38);
    ctx.strokeRect(1850, 824, 100, 38);

    // =========================================================================
    // C. MECHANIZM KATAPULTY PAROWEJ (STEAM CATAPULT: x: 350..750, y: 820)
    // =========================================================================
    // Stalowy rowek techniczny katapulty wpuszczony w pokład
    ctx.fillStyle = '#080c14';
    ctx.fillRect(350, 820, 400, 8);

    // Dwie stalowe prowadnice szyny
    ctx.fillStyle = '#64748b';
    ctx.fillRect(350, 821, 400, 2);
    ctx.fillRect(350, 825, 400, 2);

    // Wózek startowy katapulty (shuttle)
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(720, 817, 24, 6);

    // Żółto-czarne pasy ostrzegawcze (hazard stripes) wokół katapulty
    for (let hx = 340; hx <= 750; hx += 16) {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(hx, 828, 8, 8);
      ctx.fillStyle = '#111827';
      ctx.fillRect(hx + 8, 828, 8, 8);
    }

    // Napis strefy startowej
    ctx.fillStyle = '#fbbf24';
    ctx.font = '700 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('CATAPULT 01 // STEAM BOOST', 350, 848);

    // Stalowe liny hamujące (4 poprzeczne liny naciągnięte w poprzek pokładu)
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2.5;
    const wireXList = [2150, 2250, 2350, 2450];
    for (let i = 0; i < wireXList.length; i++) {
      const wx = wireXList[i];
      ctx.beginPath();
      ctx.moveTo(wx, 818);
      ctx.lineTo(wx, 823);
      ctx.stroke();

      // Bębny naciągowe liny na krawędzi
      ctx.fillStyle = '#475569';
      ctx.fillRect(wx - 4, 822, 8, 4);
    }

    // =========================================================================
    // D. WYSPA DOWODZENIA / MOSTEK (SUPERSTRUCTURE: x: 2400..2800)
    // =========================================================================
    // Masywna wielopiętrowa wieża kontroli lotów wznosząca się w górę
    const bridgeWallGrad = ctx.createLinearGradient(2400, 0, 2800, 0);
    bridgeWallGrad.addColorStop(0.00, '#242f3d');
    bridgeWallGrad.addColorStop(0.50, '#334155');
    bridgeWallGrad.addColorStop(1.00, '#1e293b');
    ctx.fillStyle = bridgeWallGrad;

    ctx.beginPath();
    ctx.moveTo(2400, 820);
    ctx.lineTo(2440, 420); // Skos aerodynamiczny wieży
    ctx.lineTo(2800, 420);
    ctx.lineTo(2850, 820);
    ctx.closePath();
    ctx.fill();

    // Szprosy i podziały pancerza wieży
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(2425, 680);
    ctx.lineTo(2820, 680);
    ctx.moveTo(2435, 520);
    ctx.lineTo(2810, 520);
    ctx.stroke();

    // Panoramiczne szmaragdowo-złote szyby kontroli lotów PRI-FLY na Piętrze 2
    ctx.fillStyle = 'rgba(16, 185, 129, 0.50)';
    ctx.fillRect(2470, 480, 140, 26);
    ctx.fillRect(2630, 480, 140, 26);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(2470, 480, 140, 26);
    ctx.strokeRect(2630, 480, 140, 26);

    // Szprosy okienne
    for (let gx = 2500; gx < 2600; gx += 25) {
      ctx.beginPath();
      ctx.moveTo(gx, 480);
      ctx.lineTo(gx, 506);
      ctx.stroke();
    }
    for (let gx = 2660; gx < 2760; gx += 25) {
      ctx.beginPath();
      ctx.moveTo(gx, 480);
      ctx.lineTo(gx, 506);
      ctx.stroke();
    }

    // Piętro 1: Kładka techniczna na y: 680 (szerokość 350 px, x: 2450..2800)
    this.drawBridgeWalkway(ctx, 2450, 680, 350, 25);

    // Piętro 2: Balkon kontroli lotów na y: 520 (szerokość 280 px, x: 2520..2800)
    this.drawBridgeWalkway(ctx, 2520, 520, 280, 25);

    // Szczyt: Maszt radarowy i kopuły anten
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(2650, 420);
    ctx.lineTo(2650, 350);
    ctx.stroke();

    // Kratownica masztu
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(2635, 420);
    ctx.lineTo(2650, 375);
    ctx.lineTo(2665, 420);
    ctx.moveTo(2630, 395);
    ctx.lineTo(2670, 395);
    ctx.stroke();

    // Kopuły radome Satcom (białe dyski)
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(2600, 410, 12, 0, Math.PI * 2);
    ctx.arc(2700, 410, 12, 0, Math.PI * 2);
    ctx.fill();

    // =========================================================================
    // E. ZAPARKOWANE MYŚLIWCE JAKO TWARDE OSŁONY (COVERS: y: 778, stoją na y: 820)
    // =========================================================================
    // Myśliwiec A: x: 900, y: 778, width: 90, height: 42
    this.drawStealthFighterCover(ctx, 900, 778, 90, 42, 1);
    // Myśliwiec B: x: 1700, y: 778, width: 90, height: 42
    this.drawStealthFighterCover(ctx, 1700, 778, 90, 42, -1);

    ctx.restore();
  }

  /**
   * Rysuje platformę kładki mostka z ażurową podłogą i balustradą.
   */
  drawBridgeWalkway(ctx, x, y, width, height) {
    // Podstawa kładki
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, width, height);

    // Górna stalowa krawędź kładki
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x, y, width, 4);

    // Ażurowa siatka nośna
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    for (let kx = x; kx < x + width; kx += 12) {
      ctx.beginPath();
      ctx.moveTo(kx, y + 4);
      ctx.lineTo(kx + 6, y + height);
      ctx.stroke();
    }

    // Balustrada bezpieczeństwa nad kładką (poręcz)
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 14);
    ctx.lineTo(x + width, y - 14);
    ctx.stroke();

    // Słupki balustrady
    ctx.lineWidth = 1;
    for (let sx = x + 10; sx < x + width; sx += 35) {
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx, y - 14);
      ctx.stroke();
    }
  }

  /**
   * Rysuje pancerny myśliwiec stealth 5. generacji jako twardą niską osłonę (Cover).
   * Spód stoi dokładnie na nawierzchni pokładu y = 820 (czyli y: 778, height: 42).
   */
  drawStealthFighterCover(ctx, x, y, width, height, facing) {
    ctx.save();
    ctx.translate(x + width * 0.5, y + height);
    if (facing === -1) {
      ctx.scale(-1, 1);
    }

    const halfW = width * 0.5;

    // Koła podwozia stojące bezpośrednio na pokładzie
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfW + 16, -8, 8, 8);
    ctx.fillRect(halfW - 20, -8, 8, 8);

    // Żółte kliny blokujące koła (wheel chocks)
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-halfW + 12, -4, 4, 4);
    ctx.fillRect(-halfW + 24, -4, 4, 4);
    ctx.fillRect(halfW - 24, -4, 4, 4);
    ctx.fillRect(halfW - 12, -4, 4, 4);

    // Golenie podwozia
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-halfW + 20, -8);
    ctx.lineTo(-halfW + 24, -18);
    ctx.moveTo(halfW - 16, -8);
    ctx.lineTo(halfW - 18, -18);
    ctx.stroke();

    // Pancerny kadłub myśliwca stealth (#334155 / #1e293b)
    const hullGrad = ctx.createLinearGradient(0, -height, 0, 0);
    hullGrad.addColorStop(0.00, '#475569');
    hullGrad.addColorStop(0.40, '#334155');
    hullGrad.addColorStop(1.00, '#1e293b');
    ctx.fillStyle = hullGrad;

    ctx.beginPath();
    ctx.moveTo(-halfW, -20);      // Dziób
    ctx.lineTo(-halfW + 18, -30); // Kokpit
    ctx.lineTo(-halfW + 36, -32); // Szczyt owiewki
    ctx.lineTo(halfW - 22, -30);  // Grzbiet kadłuba
    ctx.lineTo(halfW - 6, -42);   // Skośny statecznik pionowy V-tail
    ctx.lineTo(halfW, -36);
    ctx.lineTo(halfW - 2, -16);   // Dysza ciągu
    ctx.lineTo(halfW - 14, -14);
    ctx.lineTo(-halfW + 24, -16);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bursztynowa owiewka kabiny pilota ze złoconą powłoką antyradarową
    ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
    ctx.beginPath();
    ctx.moveTo(-halfW + 18, -25);
    ctx.lineTo(-halfW + 26, -31);
    ctx.lineTo(-halfW + 36, -29);
    ctx.lineTo(-halfW + 32, -23);
    ctx.closePath();
    ctx.fill();

    // Oznaczenie taktyczne
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(halfW - 32, -20, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Pętla aktualizacji areny:
   * Katapulta parowa, strefa śmierci oceanu, cykl cząsteczek pary.
   */
  update(dt, combatants) {
    const safeDt = Math.min(dt || 0.016, 0.05);
    this.animTime += safeDt;

    // 1. Sprawdzanie interakcji combatantów z katapultą i oceanem
    const targets = Array.isArray(combatants) ? combatants : [];
    for (let i = 0; i < targets.length; i++) {
      const entity = targets[i];
      if (!entity) continue;

      const centerX = (entity.x || 0) + (entity.w || 24) * 0.5;
      const feetY = (entity.y || 0) + (entity.h || 70);

      // A. STREFA ŚMIERCI: Wypadnięcie za burtę (deathY = 1080 poza obrysem pasa x: 200..3000)
      const isOverboard = (entity.x < 200 || entity.x > 3000) && (entity.y > this.deathY);
      if (isOverboard && !entity.isDead) {
        killByHazard(entity, "WZBURZONY OCEAN // ZA BURTĄ");
        continue;
      }

      if (entity.isDead) continue;

      // B. MECHANIKA KATAPULTY PAROWEJ (Steam Catapult: x: 350..750 na y: 820)
      const inCatapultX = (centerX >= this.catapult.x1 && centerX <= this.catapult.x2);
      const onCatapultLevel = (feetY >= 810 && feetY <= 836);

      if (inCatapultX && onCatapultLevel) {
        // Sprawdzenie czy gracz/bot biegnie w prawo
        const movingRight = (entity.vx > 0.1) || (entity.facing === 1 && Math.abs(entity.vx) > 0.02);

        if (movingRight) {
          // Gwałtowne przyspieszenie poziome (entity.vx = Math.max(entity.vx, 22))
          const oldVx = entity.vx || 0;
          entity.vx = Math.max(oldVx, this.catapult.boostVx);

          // Wyrzut poziomego obłoku pary
          this.spawnSteamBurst(centerX, 820, 4);

          // Lekki wstrząs kamery przy starcie katapulty
          if (oldVx < 20) {
            triggerScreenShake(2.0);
          }
        }
      }
    }

    // 2. Okresowy wyrzut pary ze szczeliny szyny katapulty (efekt klimatyczny)
    if (Math.random() < 0.20) {
      const rx = this.catapult.x1 + Math.random() * (this.catapult.x2 - this.catapult.x1);
      this.spawnIdleSteam(rx, 821);
    }

    // 3. Aktualizacja cząsteczek pary
    this.updateSteamParticles(safeDt);
  }

  /**
   * Tworzy silny poziomy wyrzut pary towarzyszący startowi katapulty.
   */
  spawnSteamBurst(x, y, count = 3) {
    for (let i = 0; i < count; i++) {
      if (this.steamParticles.length >= 75) {
        this.steamParticles.shift();
      }
      this.steamParticles.push({
        x: x - Math.random() * 15,
        y: y - 2 + (Math.random() * 4 - 2),
        vx: Math.random() * 9 + 8, // Poziomy pęd w prawo
        vy: -(Math.random() * 2.2 + 0.4),
        size: Math.random() * 8 + 8,
        maxSize: Math.random() * 26 + 24,
        alpha: Math.random() * 0.12 + 0.28,
        maxAlpha: 0.35,
        life: 0,
        maxLife: Math.random() * 25 + 30
      });
    }
  }

  /**
   * Tworzy obłoczek pary unoszący się ze szczeliny szyny.
   */
  spawnIdleSteam(x, y) {
    if (this.steamParticles.length >= 75) {
      this.steamParticles.shift();
    }
    this.steamParticles.push({
      x: x,
      y: y,
      vx: Math.random() * 2.5 + 1.2,
      vy: -(Math.random() * 1.5 + 0.5),
      size: Math.random() * 5 + 4,
      maxSize: Math.random() * 16 + 12,
      alpha: Math.random() * 0.08 + 0.15,
      maxAlpha: 0.22,
      life: 0,
      maxLife: Math.random() * 35 + 40
    });
  }

  /**
   * Aktualizuje pozycje i rozproszenie cząsteczek pary.
   */
  updateSteamParticles(dt) {
    for (let i = this.steamParticles.length - 1; i >= 0; i--) {
      const p = this.steamParticles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.97;

      const progress = p.life / p.maxLife;
      p.size += (p.maxSize - p.size) * 0.06;
      p.alpha = p.maxAlpha * (1.0 - progress);

      if (p.life >= p.maxLife || p.alpha <= 0.01) {
        this.steamParticles.splice(i, 1);
      }
    }
  }

  /**
   * Rysuje panoramiczne tło (wywołanie w pętli drawBackground przed transformacją kamery w main.js).
   * 1. Rysuje czyste niebo i horyzont.
   * 2. Aplikuje kamerę i rysuje stalowy pokład, kadłub i mostek w skali 1:1 pod stopami graczy!
   */
  drawBackground(ctx, camera) {
    if (!this.buffersReady) {
      this.initBuffers();
    }

    const canvasW = (ctx.canvas && ctx.canvas.width) ? (ctx.canvas.clientWidth || ctx.canvas.width) : 1920;
    const canvasH = (ctx.canvas && ctx.canvas.height) ? (ctx.canvas.clientHeight || ctx.canvas.height) : 1080;

    // 1. Tło nieba i odległego horyzontu morskiego (wypełnienie ekranu bez miniaturowego okrętu)
    if (this.bgCanvas) {
      ctx.drawImage(this.bgCanvas, 0, 0, canvasW, canvasH);
    }

    // 2. Masywny stalowy pokład lotniskowca, burt i mostek W PRZESTRZENI ŚWIATA (skala 1:1)
    // Rysowany przed postaciami, pociskami i krwią, aby gracze stali DOKŁADNIE na pokładzie!
    if (this.carrierCanvas && camera) {
      ctx.save();
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-camera.x, -camera.y);
      ctx.drawImage(this.carrierCanvas, 0, 0);
      ctx.restore();
    }
  }

  /**
   * Rysuje dynamiczne elementy pierwszego planu (wywołanie w pętli renderArenaForeground po postaciach).
   * ZERO ctx.shadowBlur.
   */
  draw(ctx, camera) {
    this.render(ctx, camera);
  }

  /**
   * Główny potok renderowania pierwszego planu areny.
   * Rysuje fale oceanu, parę katapulty, obracający się radar i światła nawigacyjne.
   * ZERO ctx.shadowBlur.
   */
  render(ctx, camera) {
    if (!this.buffersReady) {
      this.initBuffers();
    }

    const t = this.animTime;

    // 1. Dynamiczne fale oceanu za burtą (x < 200 oraz x > 3000)
    this.drawOceanWaves(ctx, t);

    // 2. Dynamiczne światła nawigacyjne pasa startowego i masztu (#ef4444)
    this.drawDeckLights(ctx, t);

    // 3. Obracający się radar na dachu mostka (x: 2650, y: 350)
    this.drawRotatingRadar(ctx, 2650, 350, t);

    // 4. Cząsteczki pary z katapulty
    this.drawSteamParticles(ctx);
  }

  /**
   * Rysuje dynamiczne fale wzburzonego oceanu po bokach burt.
   * ZERO ctx.shadowBlur.
   */
  drawOceanWaves(ctx, t) {
    ctx.save();

    // Woda po lewej stronie kadłuba (x: 0..200)
    ctx.fillStyle = '#06101a';
    ctx.beginPath();
    ctx.moveTo(0, 960);
    for (let x = 0; x <= 200; x += 20) {
      const wy = 960 + Math.sin(x * 0.04 + t * 2.2) * 8 + Math.cos(x * 0.08 - t) * 4;
      ctx.lineTo(x, wy);
    }
    ctx.lineTo(200, this.height);
    ctx.lineTo(0, this.height);
    ctx.closePath();
    ctx.fill();

    // Piana na lewej fali
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= 200; x += 20) {
      const wy = 960 + Math.sin(x * 0.04 + t * 2.2) * 8 + Math.cos(x * 0.08 - t) * 4;
      if (x === 0) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.stroke();

    // Woda po prawej stronie kadłuba (x: 3000..3200)
    ctx.fillStyle = '#06101a';
    ctx.beginPath();
    ctx.moveTo(3000, 960);
    for (let x = 3000; x <= 3200; x += 20) {
      const wy = 960 + Math.sin(x * 0.04 + t * 2.4) * 8 + Math.cos(x * 0.08 - t * 1.2) * 4;
      ctx.lineTo(x, wy);
    }
    ctx.lineTo(3200, this.height);
    ctx.lineTo(3000, this.height);
    ctx.closePath();
    ctx.fill();

    // Piana na prawej fali
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 3000; x <= 3200; x += 20) {
      const wy = 960 + Math.sin(x * 0.04 + t * 2.4) * 8 + Math.cos(x * 0.08 - t * 1.2) * 4;
      if (x === 3000) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Rysuje pulsujące diody nawigacyjne krawędzi pasa startowego i mostka.
   * ZERO ctx.shadowBlur.
   */
  drawDeckLights(ctx, t) {
    ctx.save();

    // Zielone światła progu katapulty (x: 350 i x: 750, y: 818)
    const greenPulse = 0.5 + Math.sin(t * 4.0) * 0.4;
    ctx.fillStyle = `rgba(34, 197, 94, ${greenPulse})`;
    ctx.beginPath();
    ctx.arc(350, 818, 4, 0, Math.PI * 2);
    ctx.arc(750, 818, 4, 0, Math.PI * 2);
    ctx.fill();

    // Bursztynowe światła krawędziowe pasa
    ctx.fillStyle = '#f59e0b';
    for (let lx = 300; lx <= 2900; lx += 200) {
      ctx.beginPath();
      ctx.arc(lx, 822, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Czerwone światło nawigacyjne na szczycie masztu (#ef4444)
    const redFlash = Math.sin(t * 3.5) > 0.2 ? 1.0 : 0.2;
    ctx.fillStyle = `rgba(239, 68, 68, ${redFlash})`;
    ctx.beginPath();
    ctx.arc(2650, 345, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Rysuje obracające się ramię radaru na szczycie mostka.
   */
  drawRotatingRadar(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);

    const angle = t * 2.8;
    const barWidth = Math.cos(angle) * 32;

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-barWidth * 0.5, 0);
    ctx.lineTo(barWidth * 0.5, 0);
    ctx.stroke();

    // Oś obrotu radaru
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Renderuje obłoki pary katapulty parowej z niskim globalAlpha.
   * ZERO ctx.shadowBlur.
   */
  drawSteamParticles(ctx) {
    if (this.steamParticles.length === 0) return;

    ctx.save();
    for (let i = 0; i < this.steamParticles.length; i++) {
      const p = this.steamParticles[i];
      ctx.fillStyle = `rgba(241, 245, 249, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Reset stanu areny.
   */
  reset() {
    this.animTime = 0;
    this.steamParticles.length = 0;
  }
}

// =========================================================================
// 2. FUNKCJA REJESTRACJI ŚMIERCI ŚRODOWISKOWEJ (killByHazard)
// =========================================================================
export function killByHazard(victim, hazardName = "WZBURZONY OCEAN // ZA BURTĄ") {
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
export const arena4 = new Arena4Titan();

export const ARENA_TITAN = arena4;
export const ARENA_USS_TITAN = arena4;
export const ARENA_4_CONFIG = arena4;
export const ARENA_TYPHOON = arena4; // Kompatybilność wsteczna
export const ARENA_SPACE = arena4;   // Kompatybilność wsteczna
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
  arena4.draw(ctx, camera);
}

export function resetArena4() {
  arena4.reset();
}

export function handleTyphoonExplosion(expX, expY, radius) {
  return false;
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
