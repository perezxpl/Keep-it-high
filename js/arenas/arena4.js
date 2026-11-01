// =========================================================================
// ARENAS/ARENA4.JS - LOTNISKOWIEC // USS TITAN (CANVAS 2D ENGINE)
// Moduł Areny 4: Panoramiczny Okręt Wojenny na Otwartym Oceanie
// Gigantyczny Płaski Pas Startowy (2800 px wolnego pokładu),
// Prawa Wieża Dowodzenia / Mostek (3 poziomy kładek obserwacyjnych),
// Zaparkowane Myśliwce F/A-24 jako Osłony Taktyczne,
// Aktywna Katapulta Parowa (Steam Catapult) wyrzucająca w poziomie,
// Wzburzony Ocean jako Strefa Śmierci poza obrysem pokładu.
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
    this.mainDeckY = 920; // Główna wysokość płaskiego pasa startowego
    this.deathY = 1080;   // Granica wzburzonego oceanu za burtą (strefa śmierci)
    this.gravityMultiplier = 1.0;
    this.animTime = 0;

    // Twarde punkty odrodzenia (SPAWN_POINTS)
    this.spawnPoints = [
      { x: 450,  y: 860, facing: 1,  team: 'CYAN',   label: 'KATAPULTA_LEWA', isGround: true },
      { x: 1350, y: 860, facing: 1,  team: 'CYAN',   label: 'ŚRODEK_PASA',    isGround: true },
      { x: 2150, y: 860, facing: -1, team: 'ORANGE', label: 'PRAWA_POKŁAD',  isGround: true },
      { x: 2550, y: 540, facing: -1, team: 'ORANGE', label: 'MOSTEK_POZIOM_2',isGround: true }
    ];
    this.spawns = this.spawnPoints;

    // Platforma katapulty parowej (strefa aktywacji: x od 350 do 750)
    this.catapult = {
      x1: 350,
      x2: 750,
      y: 920,
      boostVx: 22,
      cooldown: 0
    };

    // Kompletna lista fizycznych platform areny
    this.platforms = [
      // 1. Główny pas startowy (Płaski pokład)
      {
        id: 'titan_flight_deck',
        name: 'GŁÓWNY POKŁAD STARTOWY',
        x: 200,
        y: 920,
        width: 2800,
        height: 80,
        w: 2800,
        h: 80,
        thickness: 80,
        isGround: true,
        solid: true,
        type: 'flight_deck'
      },

      // 2. Wyspa dowodzenia / Mostek (3 poziomy kładek obserwacyjnych)
      // Poziom 1
      {
        id: 'titan_bridge_lvl1',
        name: 'MOSTEK - POZIOM 1',
        x: 2450,
        y: 760,
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
      // Poziom 2
      {
        id: 'titan_bridge_lvl2',
        name: 'MOSTEK - POZIOM 2',
        x: 2520,
        y: 600,
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
      // Poziom 3 (Dach radaru)
      {
        id: 'titan_bridge_lvl3',
        name: 'MOSTEK - DACH RADARU',
        x: 2600,
        y: 440,
        width: 200,
        height: 25,
        w: 200,
        h: 25,
        thickness: 25,
        isGround: true,
        solid: true,
        isDropThrough: true,
        type: 'catwalk'
      },

      // 3. Myśliwce wielozadaniowe (Osłony taktyczne na pasie)
      // Myśliwiec A
      {
        id: 'titan_fighter_a',
        name: 'MYŚLIWIEC F/A-24 ALFA',
        x: 1050,
        y: 875,
        width: 90,
        height: 45,
        w: 90,
        h: 45,
        thickness: 45,
        isCover: true,
        solid: true,
        isGround: true,
        type: 'fighter_cover'
      },
      // Myśliwiec B
      {
        id: 'titan_fighter_b',
        name: 'MYŚLIWIEC F/A-24 BRAWO',
        x: 1850,
        y: 875,
        width: 90,
        height: 45,
        w: 90,
        h: 45,
        thickness: 45,
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
   * Pre-renderowanie panoramicznego tła morskiego w buforze OffscreenCanvas.
   * ZERO ctx.shadowBlur.
   */
  renderBackgroundBuffer() {
    const ctx = this.bgCanvas.getContext('2d');
    if (!ctx) return;

    const w = this.width;
    const h = this.height;

    // 1. Panoramiczne niebo morskie – czysty gradient wojskowy
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 850);
    skyGrad.addColorStop(0.00, '#0a1728'); // Granat stratosfery
    skyGrad.addColorStop(0.35, '#122640'); // Chłodny granat
    skyGrad.addColorStop(0.70, '#1d3958'); // Stalowy błękit
    skyGrad.addColorStop(0.92, '#335574'); // Zamglenie horyzontu
    skyGrad.addColorStop(1.00, '#4b6c8c'); // Linia horyzontu
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, 850);

    // 2. Chmury na dalszym planie (lekkie pasma altostratus)
    ctx.fillStyle = 'rgba(210, 225, 240, 0.08)';
    ctx.beginPath();
    ctx.ellipse(600, 260, 480, 45, -0.05, 0, Math.PI * 2);
    ctx.ellipse(1500, 180, 620, 50, 0.03, 0, Math.PI * 2);
    ctx.ellipse(2400, 240, 550, 42, -0.02, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(230, 240, 255, 0.05)';
    ctx.beginPath();
    ctx.ellipse(900, 320, 360, 35, 0.02, 0, Math.PI * 2);
    ctx.ellipse(2000, 290, 420, 38, -0.04, 0, Math.PI * 2);
    ctx.fill();

    // 3. Smugi kondensacyjne myśliwców (contrails) na dużym pułapie
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(100, 120);
    ctx.lineTo(1400, 40);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(1800, 70);
    ctx.lineTo(3100, 140);
    ctx.stroke();

    // 4. Odległy ocean na horyzoncie (od y = 780 do dołu)
    const seaGrad = ctx.createLinearGradient(0, 780, 0, h);
    seaGrad.addColorStop(0.00, '#102235'); // Ciemna tafla horyzontu
    seaGrad.addColorStop(0.30, '#0a1827');
    seaGrad.addColorStop(1.00, '#050c14'); // Głębia oceanu
    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, 780, w, h - 780);

    // Linia mgły horyzontu
    ctx.strokeStyle = 'rgba(96, 138, 175, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 780);
    ctx.lineTo(w, 780);
    ctx.stroke();

    // 5. Sylwetki odległych okrętów eskorty (Grupa Uderzeniowa / Strike Group)
    // Okręt 1: Niszczyciel rakietowy Arleigh Burke (lewa flanka)
    this.drawDistantWarship(ctx, 420, 778, 1.0);
    // Okręt 2: Krążownik Ticonderoga (prawa flanka)
    this.drawDistantWarship(ctx, 2150, 778, 1.25);
  }

  /**
   * Rysuje minimalistyczną sylwetkę okrętu eskorty na horyzoncie.
   */
  drawDistantWarship(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#142538';

    // Kadłub
    ctx.beginPath();
    ctx.moveTo(-110, 0);
    ctx.lineTo(-90, -9);
    ctx.lineTo(85, -9);
    ctx.lineTo(105, 0);
    ctx.closePath();
    ctx.fill();

    // Nadbudówka i mostek
    ctx.fillRect(-45, -24, 65, 15);
    ctx.fillRect(-25, -34, 30, 10);

    // Maszt i radar
    ctx.strokeStyle = '#142538';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-10, -34);
    ctx.lineTo(-10, -48);
    ctx.moveTo(-18, -42);
    ctx.lineTo(-2, -42);
    ctx.moveTo(35, -9);
    ctx.lineTo(35, -26);
    ctx.stroke();

    // Wyrzutnie VLS i działo dziobowe
    ctx.fillRect(-70, -12, 10, 3);
    ctx.beginPath();
    ctx.moveTo(-75, -11);
    ctx.lineTo(-88, -13);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Pre-renderowanie konstrukcji lotniskowca:
   * Kadłub, Pokład startowy, Oznaczenia pasa, Szyna katapulty, Mostek, Myśliwce.
   * ZERO ctx.shadowBlur.
   */
  renderCarrierBuffer() {
    const ctx = this.carrierCanvas.getContext('2d');
    if (!ctx) return;

    // =========================================================================
    // A. POTĘŻNY KADŁUB LOTNISKOWCA (BATTLESHIP STEEL HULL)
    // =========================================================================
    ctx.save();

    // Główny obrys kadłuba (od x: 140 do x: 3060)
    ctx.fillStyle = '#1e2632'; // Pancerz burtowy Navy Haze
    ctx.beginPath();
    ctx.moveTo(140, 920);  // Dziób
    ctx.lineTo(200, 1140); // Skos dziobowy ku kilowi
    ctx.lineTo(3000, 1140); // Linia stępki / wody
    ctx.lineTo(3060, 920); // Rufa
    ctx.closePath();
    ctx.fill();

    // Dolny podwodny pas antyporostowy (czerwony tlenkowy)
    ctx.fillStyle = '#662222';
    ctx.beginPath();
    ctx.moveTo(185, 1090);
    ctx.lineTo(200, 1140);
    ctx.lineTo(3000, 1140);
    ctx.lineTo(3045, 1090);
    ctx.closePath();
    ctx.fill();

    // Ciemna linia wodna (boot-topping black)
    ctx.fillStyle = '#0f141c';
    ctx.fillRect(175, 1076, 2880, 14);

    // Stalowe płyty pancerne i żebra kadłuba
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 2;
    for (let px = 300; px <= 2900; px += 180) {
      ctx.beginPath();
      ctx.moveTo(px, 930);
      ctx.lineTo(px + 10, 1076);
      ctx.stroke();
    }

    // Podłużne wręgi kadłuba
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(160, 970);
    ctx.lineTo(3040, 970);
    ctx.moveTo(170, 1020);
    ctx.lineTo(3030, 1020);
    ctx.stroke();

    // Wsporniki wysięgników pokładu (sponsons & deck trusses)
    ctx.fillStyle = '#161d27';
    for (let sx = 260; sx <= 2950; sx += 220) {
      ctx.beginPath();
      ctx.moveTo(sx - 20, 920);
      ctx.lineTo(sx + 20, 920);
      ctx.lineTo(sx, 955);
      ctx.closePath();
      ctx.fill();
    }

    // Kładki techniczne wzdłuż burty (catwalks z barierkami)
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(220, 940, 750, 8);
    ctx.fillRect(1050, 940, 750, 8);
    ctx.fillRect(1880, 940, 750, 8);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1;
    for (let bx = 220; bx <= 2630; bx += 30) {
      if ((bx >= 970 && bx <= 1050) || (bx >= 1800 && bx <= 1880)) continue;
      ctx.beginPath();
      ctx.moveTo(bx, 940);
      ctx.lineTo(bx, 933);
      ctx.stroke();
    }

    // =========================================================================
    // B. GŁÓWNY POKŁAD STARTOWY (FLIGHT DECK: x: 200 do 3000, y: 920)
    // =========================================================================
    // Blok masywu pokładu
    const deckGrad = ctx.createLinearGradient(0, 920, 0, 1000);
    deckGrad.addColorStop(0.00, '#1c212a'); // Ciemna nawierzchnia antypoślizgowa
    deckGrad.addColorStop(0.15, '#161a22');
    deckGrad.addColorStop(1.00, '#0f131a');
    ctx.fillStyle = deckGrad;
    ctx.fillRect(200, 920, 2800, 80);

    // Krawędź górna pokładu (stalowy rant)
    ctx.fillStyle = '#475569';
    ctx.fillRect(190, 920, 2820, 4);

    // Stalowe dylatacje i płyty pokładu
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    for (let dx = 250; dx < 3000; dx += 100) {
      ctx.beginPath();
      ctx.moveTo(dx, 924);
      ctx.lineTo(dx, 1000);
      ctx.stroke();
    }

    // Oznaczenia pasa startowego (Runway Centerline - biało-żółte przerywane pasy)
    ctx.fillStyle = '#f8fafc';
    for (let rx = 350; rx <= 2850; rx += 140) {
      ctx.fillRect(rx, 942, 80, 5);
    }

    // Żółte pasy strefy manewrowej
    ctx.fillStyle = '#eab308';
    ctx.fillRect(240, 928, 2720, 3);
    ctx.fillRect(240, 960, 2720, 3);

    // Oznaczenie taktyczne i nazwa lotniskowca na pokładzie
    ctx.fillStyle = 'rgba(241, 245, 249, 0.28)';
    ctx.font = '900 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CVN-99', 1500, 985);
    ctx.font = '900 36px sans-serif';
    ctx.fillText('USS TITAN', 2250, 985);

    // Dźwignik samolotowy (Aircraft Elevator 1 & 2)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(920, 924, 110, 76);
    ctx.fillRect(1720, 924, 110, 76);

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.strokeRect(920, 924, 110, 76);
    ctx.strokeRect(1720, 924, 110, 76);

    // =========================================================================
    // C. MECHANIZM KATAPULTY PAROWEJ (STEAM CATAPULT: x: 350..750, y: 920)
    // =========================================================================
    // Stalowa szyna katapulty wpuszczona w pokład
    ctx.fillStyle = '#090d14';
    ctx.fillRect(350, 920, 400, 10);

    // Dwie równoległe szyny stalowe
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(350, 922, 400, 2);
    ctx.fillRect(350, 926, 400, 2);

    // Wózek startowy katapulty (shuttle)
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(720, 917, 26, 7);

    // Pasy ostrzegawcze (hazard stripes) wokół strefy katapulty
    ctx.save();
    for (let hx = 340; hx <= 750; hx += 16) {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(hx, 932, 8, 8);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(hx + 8, 932, 8, 8);
    }
    ctx.restore();

    // Napis strefy katapulty
    ctx.fillStyle = '#fbbf24';
    ctx.font = '700 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('CATAPULT 01 // HIGH PRESSURE STEAM', 350, 955);

    // Liny aresztujące na rufie (Arresting gear wires: x: 2650..2900)
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    for (let wx = 2680; wx <= 2920; wx += 80) {
      ctx.beginPath();
      ctx.moveTo(wx, 919);
      ctx.lineTo(wx, 925);
      ctx.stroke();
    }

    // =========================================================================
    // D. WYSPA DOWODZENIA / MOSTEK (SUPERSTRUCTURE / BRIDGE: x: 2400..3000)
    // =========================================================================
    // Masywna wieża dowodzenia (Island)
    ctx.fillStyle = '#263140'; // Stalowy Haze Gray
    ctx.beginPath();
    ctx.moveTo(2420, 920);
    ctx.lineTo(2460, 440); // Skos aerodynamiczny
    ctx.lineTo(2850, 440);
    ctx.lineTo(2920, 920);
    ctx.closePath();
    ctx.fill();

    // Cienie i podziały kondygnacji wieży
    ctx.fillStyle = '#1a232f';
    ctx.fillRect(2470, 760, 390, 16);
    ctx.fillRect(2530, 600, 310, 14);
    ctx.fillRect(2610, 440, 220, 12);

    // Oszklenie mostka kapitańskiego i kontroli lotów PRI-FLY (Primary Flight Control)
    // Szyby pod kątem ujemnym chroniące przed słońcem
    ctx.fillStyle = 'rgba(16, 185, 129, 0.45)'; // Szmaragdowo-złote szkło taktyczne
    ctx.fillRect(2480, 520, 130, 28);
    ctx.fillRect(2640, 520, 140, 28);

    // Szprosy okienne mostka
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(2480, 520, 130, 28);
    ctx.strokeRect(2640, 520, 140, 28);
    for (let gx = 2505; gx < 2610; gx += 25) {
      ctx.beginPath();
      ctx.moveTo(gx, 520);
      ctx.lineTo(gx, 548);
      ctx.stroke();
    }
    for (let gx = 2665; gx < 2780; gx += 25) {
      ctx.beginPath();
      ctx.moveTo(gx, 520);
      ctx.lineTo(gx, 548);
      ctx.stroke();
    }

    // Dolny mostek nawigacyjny
    ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
    ctx.fillRect(2490, 680, 240, 24);
    ctx.strokeStyle = '#0f172a';
    ctx.strokeRect(2490, 680, 240, 24);

    // 1. Kładka Mostka - Poziom 1 (x: 2450, y: 760, w: 350, h: 25)
    this.drawCatwalkStructure(ctx, 2450, 760, 350, 25);
    // 2. Kładka Mostka - Poziom 2 (x: 2520, y: 600, w: 280, h: 25)
    this.drawCatwalkStructure(ctx, 2520, 600, 280, 25);
    // 3. Kładka Mostka - Poziom 3 Dach Radaru (x: 2600, y: 440, w: 200, h: 25)
    this.drawCatwalkStructure(ctx, 2600, 440, 200, 25);

    // Maszt taktyczny i kopuły radarów (Phased Array Radome & Mast)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    // Główny pylon masztu
    ctx.beginPath();
    ctx.moveTo(2700, 440);
    ctx.lineTo(2700, 330);
    ctx.stroke();

    // Kratownice masztu
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(2680, 440);
    ctx.lineTo(2700, 360);
    ctx.lineTo(2720, 440);
    ctx.moveTo(2670, 390);
    ctx.lineTo(2730, 390);
    ctx.stroke();

    // Kopuła radaru satelitarnego (Satcom Radome dome)
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(2640, 425, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2760, 425, 14, 0, Math.PI * 2);
    ctx.fill();

    // Wielka tarcza radaru SPY Phased Array na ścianie wieży
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(2580, 475);
    ctx.lineTo(2620, 475);
    ctx.lineTo(2630, 510);
    ctx.lineTo(2570, 510);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.stroke();

    // =========================================================================
    // E. ZAPARKOWANE MYŚLIWCE F/A-24 (OSŁONY TAKTYCZNE NA PASIE)
    // =========================================================================
    // Myśliwiec A: x: 1050, y: 875, w: 90, h: 45
    this.drawParkedFighter(ctx, 1050, 875, 90, 45, 'F/A-24 ALFA', 1);
    // Myśliwiec B: x: 1850, y: 875, w: 90, h: 45
    this.drawParkedFighter(ctx, 1850, 875, 90, 45, 'F/A-24 BRAWO', -1);

    ctx.restore();
  }

  /**
   * Rysuje platformę kładki obserwacyjnej z ażurowym pomostem i balustradą.
   */
  drawCatwalkStructure(ctx, x, y, width, height) {
    // Podstawa kładki
    ctx.fillStyle = '#334155';
    ctx.fillRect(x, y, width, height);

    // Krawędź górna
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x, y, width, 4);

    // Ażurowa siatka nośna
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let kx = x; kx < x + width; kx += 12) {
      ctx.beginPath();
      ctx.moveTo(kx, y + 4);
      ctx.lineTo(kx + 6, y + height);
      ctx.stroke();
    }

    // Balustrada bezpieczeństwa nad kładką (poręcz)
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
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
   * Rysuje profil wielozadaniowego myśliwca stealth 5. generacji F/A-24.
   * Spełnia rolę niskiej osłony taktycznej na pokładzie (isCover: true).
   */
  drawParkedFighter(ctx, x, y, width, height, label, facing) {
    ctx.save();
    ctx.translate(x + width * 0.5, y + height);
    if (facing === -1) {
      ctx.scale(-1, 1);
    }

    const halfW = width * 0.5;

    // Koła podwozia na pokładzie (chocks / blokady kół)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfW + 16, -10, 10, 10);
    ctx.fillRect(halfW - 22, -10, 10, 10);

    // Żółte klocki blokujące koła (wheel chocks)
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-halfW + 12, -4, 4, 4);
    ctx.fillRect(-halfW + 26, -4, 4, 4);
    ctx.fillRect(halfW - 26, -4, 4, 4);
    ctx.fillRect(halfW - 12, -4, 4, 4);

    // Goleń podwozia
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-halfW + 21, -10);
    ctx.lineTo(-halfW + 25, -20);
    ctx.moveTo(halfW - 17, -10);
    ctx.lineTo(halfW - 20, -20);
    ctx.stroke();

    // Kadłub myśliwca (Stealth Low-Observable Gray)
    const hullGrad = ctx.createLinearGradient(0, -45, 0, -10);
    hullGrad.addColorStop(0.00, '#475569');
    hullGrad.addColorStop(0.40, '#334155');
    hullGrad.addColorStop(1.00, '#1e293b');
    ctx.fillStyle = hullGrad;

    ctx.beginPath();
    ctx.moveTo(-halfW, -22);       // Dziób / stożek radaru
    ctx.lineTo(-halfW + 18, -32);  // Krawędź kokpitu
    ctx.lineTo(-halfW + 36, -34);  // Szczyt owiewki
    ctx.lineTo(halfW - 20, -32);   // Grzbiet kadłuba
    ctx.lineTo(halfW - 6, -44);    // Skośny statecznik pionowy (V-tail)
    ctx.lineTo(halfW, -38);        // Krawędź spływu statecznika
    ctx.lineTo(halfW - 2, -18);    // Dysza wektorowania ciągu silnika
    ctx.lineTo(halfW - 14, -16);   // Dolna linia kadłuba
    ctx.lineTo(-halfW + 24, -18);  // Wlot powietrza
    ctx.closePath();
    ctx.fill();

    // Obrys kadłuba
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Owiewka kabiny pilota (bursztynowe złocone szkło radar-reflective)
    const canopyGrad = ctx.createLinearGradient(-halfW + 18, -34, -halfW + 36, -24);
    canopyGrad.addColorStop(0.00, 'rgba(245, 158, 11, 0.85)');
    canopyGrad.addColorStop(0.50, 'rgba(217, 119, 6, 0.75)');
    canopyGrad.addColorStop(1.00, 'rgba(69, 26, 3, 0.90)');
    ctx.fillStyle = canopyGrad;

    ctx.beginPath();
    ctx.moveTo(-halfW + 18, -27);
    ctx.lineTo(-halfW + 26, -33);
    ctx.lineTo(-halfW + 36, -31);
    ctx.lineTo(-halfW + 32, -25);
    ctx.closePath();
    ctx.fill();

    // Płaty skrzydeł (złożone na pokładzie lotniskowca - folded wings)
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.moveTo(halfW - 42, -28);
    ctx.lineTo(halfW - 32, -42);
    ctx.lineTo(halfW - 24, -40);
    ctx.lineTo(halfW - 28, -26);
    ctx.closePath();
    ctx.fill();

    // Rombowe oznaczenie przynależności (Naval Insignia)
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(halfW - 35, -22, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Napis taktyczny
    ctx.fillStyle = 'rgba(203, 213, 225, 0.4)';
    ctx.font = '600 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NAVY 04', 0, -22);

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

      // B. MECHANIKA KATAPULTY PAROWEJ (Steam Catapult)
      // Strefa: x od 350 do 750, na wysokości pokładu y: 920
      const inCatapultX = (centerX >= this.catapult.x1 && centerX <= this.catapult.x2);
      const onCatapultLevel = (feetY >= 910 && feetY <= 936);

      if (inCatapultX && onCatapultLevel) {
        // Sprawdzenie czy gracz/bot biegnie w prawo
        const movingRight = (entity.vx > 0.1) || (entity.facing === 1 && Math.abs(entity.vx) > 0.02);

        if (movingRight) {
          // Gwałtowne przyspieszenie poziome (zgodnie ze specyfikacją: entity.vx = Math.max(entity.vx, 22))
          const oldVx = entity.vx || 0;
          entity.vx = Math.max(oldVx, this.catapult.boostVx);

          // Wyrzut poziomego obłoku pary
          this.spawnSteamBurst(centerX, 920, 4);

          // Lekki wstrząs kamery przy starcie katapulty
          if (oldVx < 20) {
            triggerScreenShake(2.0);
          }
        }
      }
    }

    // 2. Samoczynny, okresowy wypust pary ze szczeliny szyny katapulty (efekt klimatyczny)
    if (Math.random() < 0.20) {
      const rx = this.catapult.x1 + Math.random() * (this.catapult.x2 - this.catapult.x1);
      this.spawnIdleSteam(rx, 921);
    }

    // 3. Aktualizacja cząsteczek pary
    this.updateSteamParticles(safeDt);
  }

  /**
   * Tworzy silny, poziomy wyrzut pary towarzyszący przyspieszeniu katapulty.
   */
  spawnSteamBurst(x, y, count = 3) {
    for (let i = 0; i < count; i++) {
      if (this.steamParticles.length >= 75) {
        this.steamParticles.shift(); // Ograniczenie puli dla 60 FPS
      }
      this.steamParticles.push({
        x: x - Math.random() * 15,
        y: y - 2 + (Math.random() * 4 - 2),
        vx: Math.random() * 9 + 8, // Dynamiczny wylot poziomy w prawo
        vy: -(Math.random() * 2.2 + 0.4), // Lekkie unoszenie ku górze
        size: Math.random() * 8 + 8,
        maxSize: Math.random() * 26 + 24,
        alpha: Math.random() * 0.12 + 0.28, // Niski globalAlpha
        maxAlpha: 0.35,
        life: 0,
        maxLife: Math.random() * 25 + 30
      });
    }
  }

  /**
   * Tworzy drobny obłoczek pary unoszący się ze szczeliny szyny.
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
   * Aktualizuje pozycje i rozproszenie pary.
   */
  updateSteamParticles(dt) {
    for (let i = this.steamParticles.length - 1; i >= 0; i--) {
      const p = this.steamParticles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95; // Wyhamowanie aerodynamiczne
      p.vy *= 0.97;

      // Rozszerzanie się obłoku pary
      const progress = p.life / p.maxLife;
      p.size += (p.maxSize - p.size) * 0.06;

      // Płynny zanik alpha
      p.alpha = p.maxAlpha * (1.0 - progress);

      if (p.life >= p.maxLife || p.alpha <= 0.01) {
        this.steamParticles.splice(i, 1);
      }
    }
  }

  /**
   * Rysuje panoramiczne tło (wywołanie w pętli drawBackground).
   */
  drawBackground(ctx, camera) {
    if (!this.buffersReady) {
      this.initBuffers();
    }
    if (this.bgCanvas) {
      ctx.drawImage(this.bgCanvas, 0, 0);
    }
  }

  /**
   * Główny potok renderowania areny na pierwszym planie (wywołanie w pętli render / draw).
   * ZERO ctx.shadowBlur.
   */
  render(ctx) {
    if (!this.buffersReady) {
      this.initBuffers();
    }

    const t = this.animTime;

    // 1. Dynamiczne fale oceanu za burtą (lewa i prawa strona poza kadłubem)
    this.drawOceanWaves(ctx, t);

    // 2. Pre-renderowany kadłub lotniskowca, mostek i myśliwce
    if (this.carrierCanvas) {
      ctx.drawImage(this.carrierCanvas, 0, 0);
    }

    // 3. Dynamiczne światła nawigacyjne pasa startowego (LED / OLS Approach)
    this.drawDeckLights(ctx, t);

    // 4. Obracający się radar na dachu mostka (x: 2700, y: 330)
    this.drawRotatingRadar(ctx, 2700, 330, t);

    // 5. Cząsteczki pary z katapulty
    this.drawSteamParticles(ctx);
  }

  /**
   * Rysuje dynamiczne fale wzburzonego oceanu wokół burt.
   * ZERO ctx.shadowBlur.
   */
  drawOceanWaves(ctx, t) {
    ctx.save();

    // Woda po lewej stronie kadłuba (x: 0..200)
    ctx.fillStyle = '#081420';
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
    ctx.fillStyle = '#081420';
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

    // Zielone światła progu katapulty (x: 350)
    const greenPulse = 0.5 + Math.sin(t * 4.0) * 0.4;
    ctx.fillStyle = `rgba(34, 197, 94, ${greenPulse})`;
    ctx.beginPath();
    ctx.arc(350, 918, 4, 0, Math.PI * 2);
    ctx.arc(750, 918, 4, 0, Math.PI * 2);
    ctx.fill();

    // Bursztynowe światła krawędziowe pasa
    ctx.fillStyle = '#f59e0b';
    for (let lx = 300; lx <= 2900; lx += 200) {
      ctx.beginPath();
      ctx.arc(lx, 922, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Czerwone światło ostrzegawcze na szczycie masztu wieży (x: 2700, y: 310)
    const redFlash = Math.sin(t * 3.5) > 0.2 ? 1.0 : 0.2;
    ctx.fillStyle = `rgba(239, 68, 68, ${redFlash})`;
    ctx.beginPath();
    ctx.arc(2700, 312, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Rysuje obracające się ramię radaru poszukiwania celów powietrznych na maszcie.
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
   * Reset stanu areny (czyszczenie cząsteczek).
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
  arena4.render(ctx);
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
