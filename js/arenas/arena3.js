// =========================================================================
// ARENAS/ARENA3.JS - AERO-RAFINERIA / PODNIEBNY DYSTRYKT (4400x1400 PX)
// Autonomiczny moduł areny (Plugin / Lifecycle Hooks Pattern)
// Ściśle przestrzega reguł AGENT.md (Strict DAG: Warstwa 1, zero importów z wyższych warstw)
//
// Architektura:
// - Statyczne tło i architektura: wygenerowane w grafice PNG (assets/aero_refinery_bg.png)
//   oraz modułowe sprite'y PNG (bramki, most, platformy, windy, kładki szklane)
// - Obiekty i efekty ruchome: generowane w kodzie (kłębiące się chmury burzowe,
//   para pod ciśnieniem z rur, obracające się łopatki wielkiego wentylatora,
//   iskry na kablach, pulsujące lasery w bramkach, niska mgła na autostradzie,
//   oraz plazma silników antygrawitacyjnych wind towarowych).
// =========================================================================

// 1. ZASOBY GRAFICZNE PNG
const bgImg = new Image();
bgImg.src = 'assets/aero_refinery_bg.png';

const fanBladesImg = new Image();
fanBladesImg.src = 'assets/aero_fan_blades.png';

const platformTileImg = new Image();
platformTileImg.src = 'assets/aero_platform_tile.png';

const suspensionBridgeImg = new Image();
suspensionBridgeImg.src = 'assets/aero_suspension_bridge.png';

const cargoPlatformImg = new Image();
cargoPlatformImg.src = 'assets/aero_cargo_platform.png';

const goalApertureImg = new Image();
goalApertureImg.src = 'assets/aero_goal_aperture.png';

const glassPlatformImg = new Image();
glassPlatformImg.src = 'assets/aero_glass_platform.png';

const wallPanelImg = new Image();
wallPanelImg.src = 'assets/aero_steel_wall_panel.png';

// =========================================================================
// 2. STATYCZNA GEOMETRIA I PLATFORMY KOLIZYJNE (ARENA_3_PLATFORMS)
// =========================================================================
export const ARENA_3_PLATFORMS = [
  // -----------------------------------------------------------------------
  // POZIOM DOLNY (Autostrada Tranzytowa - pełna szerokość mapy, Y = 1180)
  // -----------------------------------------------------------------------
  {
    id: 'highway_floor',
    name: 'Autostrada Tranzytowa (Kładka Dolna)',
    x: 20,
    w: 4360,
    y: 1180,
    h: 40,
    thickness: 40,
    solid: true,
    isPlatform: true
  },

  // -----------------------------------------------------------------------
  // POZIOM GÓRNY - BAZA LEWA (Cyan: x: 180–1280, y: 700)
  // -----------------------------------------------------------------------
  {
    id: 'cyan_base_slab',
    name: 'Baza Lewa (Cyan - Główna Płyta)',
    x: 180,
    w: 1100,
    y: 700,
    h: 54,
    thickness: 54,
    solid: true,
    isPlatform: true
  },
  // Wlot bramki Cyan - pochyła kieszeń chwytająca opadająca ku ścianie
  {
    id: 'goal_cyan_pocket',
    name: 'Kieszeń Bramki Cyan (Pochylnia)',
    x: 20,
    w: 160,
    y: 700,
    h: 32,
    thickness: 32,
    solid: true,
    isPlatform: true,
    surfacePoints: [
      { x: 20, y: 716 },
      { x: 180, y: 700 }
    ]
  },
  // Nadproże / Gzyms Bramki Cyan (masywny dwuteownik I-beam)
  {
    id: 'goal_cyan_lintel',
    name: 'Gzyms Bramki Cyan (Nadproże)',
    x: 20,
    w: 160,
    y: 505,
    h: 20,
    thickness: 20,
    solid: true,
    isPlatform: true
  },

  // -----------------------------------------------------------------------
  // POZIOM GÓRNY - CENTRALNY MOST WISZĄCY (x: 1680–2720, y: 700)
  // -----------------------------------------------------------------------
  {
    id: 'central_suspension_bridge',
    name: 'Centralny Most Wiszący',
    x: 1680,
    w: 1040,
    y: 700,
    h: 40,
    thickness: 40,
    solid: true,
    isPlatform: true
  },

  // -----------------------------------------------------------------------
  // POZIOM GÓRNY - BAZA PRAWA (Orange: x: 3120–4220, y: 700)
  // -----------------------------------------------------------------------
  {
    id: 'orange_base_slab',
    name: 'Baza Prawa (Orange - Główna Płyta)',
    x: 3120,
    w: 1100,
    y: 700,
    h: 54,
    thickness: 54,
    solid: true,
    isPlatform: true
  },
  // Wlot bramki Orange - pochyła kieszeń chwytająca opadająca ku ścianie
  {
    id: 'goal_orange_pocket',
    name: 'Kieszeń Bramki Orange (Pochylnia)',
    x: 4220,
    w: 160,
    y: 700,
    h: 32,
    thickness: 32,
    solid: true,
    isPlatform: true,
    surfacePoints: [
      { x: 4220, y: 700 },
      { x: 4380, y: 716 }
    ]
  },
  // Nadproże / Gzyms Bramki Orange (masywny dwuteownik I-beam)
  {
    id: 'goal_orange_lintel',
    name: 'Gzyms Bramki Orange (Nadproże)',
    x: 4220,
    w: 160,
    y: 505,
    h: 20,
    thickness: 20,
    solid: true,
    isPlatform: true
  },

  // -----------------------------------------------------------------------
  // LUKI I ASYMETRYCZNE PLATFORMY PRZESIADKOWE (Magnetyczne Windy Towarowe)
  // -----------------------------------------------------------------------
  // Studnia Lewa: X: 1280–1680 (pomiędzy Bazą Cyan a Centralnym Mostem)
  {
    id: 'cargo_lift_west_low',
    name: 'Winda Towarowa Zachodnia Dolna',
    x: 1330,
    w: 155,
    y: 970,
    h: 30,
    thickness: 30,
    solid: true,
    isPlatform: true
  },
  {
    id: 'cargo_lift_west_high',
    name: 'Winda Towarowa Zachodnia Górna',
    x: 1490,
    w: 155,
    y: 835,
    h: 30,
    thickness: 30,
    solid: true,
    isPlatform: true
  },

  // Studnia Prawa: X: 2720–3120 (pomiędzy Centralnym Mostem a Bazą Orange)
  {
    id: 'cargo_lift_east_high',
    name: 'Winda Towarowa Wschodnia Górna',
    x: 2760,
    w: 155,
    y: 835,
    h: 30,
    thickness: 30,
    solid: true,
    isPlatform: true
  },
  {
    id: 'cargo_lift_east_low',
    name: 'Winda Towarowa Wschodnia Dolna',
    x: 2920,
    w: 155,
    y: 970,
    h: 30,
    thickness: 30,
    solid: true,
    isPlatform: true
  },

  // -----------------------------------------------------------------------
  // NAJWYŻSZY PUŁAP (Kładki Snajperskie ze zbrojonego szkła)
  // -----------------------------------------------------------------------
  {
    id: 'sniper_glass_west',
    name: 'Szklana Kładka Snajperska Zachodnia',
    x: 1840,
    w: 240,
    y: 440,
    h: 20,
    thickness: 20,
    solid: true,
    oneWay: true,
    isPlatform: true
  },
  {
    id: 'sniper_glass_east',
    name: 'Szklana Kładka Snajperska Wschodnia',
    x: 2320,
    w: 240,
    y: 440,
    h: 20,
    thickness: 20,
    solid: true,
    oneWay: true,
    isPlatform: true
  },

  // -----------------------------------------------------------------------
  // PIONOWE ŚCIANY BOCZNE HANGARÓW
  // -----------------------------------------------------------------------
  // Górne ściany nad wlotem bramki (Y: 0..510)
  {
    id: 'wall_west_upper',
    name: 'Górna Ściana Hangaru Cyan',
    x: 0,
    w: 180,
    y: 0,
    h: 510,
    thickness: 180,
    solid: true,
    isWall: true,
    pushSide: 'right'
  },
  {
    id: 'wall_east_upper',
    name: 'Górna Ściana Hangaru Orange',
    x: 4220,
    w: 180,
    y: 0,
    h: 510,
    thickness: 180,
    solid: true,
    isWall: true,
    pushSide: 'left'
  },
  // Skrajne granice areny (Y: 0..1400)
  {
    id: 'wall_west_boundary',
    name: 'Boczna Ściana Hangaru Cyan (Granica Zachodnia)',
    x: 0,
    w: 20,
    y: 0,
    h: 1400,
    thickness: 20,
    solid: true,
    isWall: true,
    pushSide: 'right'
  },
  {
    id: 'wall_east_boundary',
    name: 'Boczna Ściana Hangaru Orange (Granica Wschodnia)',
    x: 4380,
    w: 20,
    y: 0,
    h: 1400,
    thickness: 20,
    solid: true,
    isWall: true,
    pushSide: 'left'
  }
];

// =========================================================================
// 3. OBIEKTY BRAMEK (CYAN / ORANGE) I PROPY
// =========================================================================
export const ARENA_3_CUSTOM_OBJECTS = [
  {
    id: 'goal_cyan',
    type: 'goal',
    team: 'CYAN',
    x: 30,
    y: 530,
    w: 130,
    h: 170,
    facing: 1,
    color: '#00e5ff',
    glowColor: 'rgba(0, 229, 255, 0.85)'
  },
  {
    id: 'goal_orange',
    type: 'goal',
    team: 'ORANGE',
    x: 4240,
    y: 530,
    w: 130,
    h: 170,
    facing: -1,
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.85)'
  }
];

export const ARENA_3_MINECARTS = [];
export const arena3Breaches = [];
export function resetArena3Breaches() {}
export function carveArena3SlabBreach() {}
export function resetArena3Minecarts() {}

// =========================================================================
// 4. SYMULACJA DYNAMICZNA: PARA, ISKRY, WENTYLATOR, CHMURY
// =========================================================================
let animTime = 0;
let fanRotation = 0;
let lightningTimer = 3.5;
let lightningAlpha = 0;

// Dysze pary buchające z rur przemysłowych
class SteamPuff {
  constructor(x, y, vx, vy, maxR, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.r = 6;
    this.maxR = maxR;
    this.life = life;
    this.maxLife = life;
    this.alpha = 0.55;
  }
  update(dt) {
    this.life -= dt;
    if (this.life <= 0) return false;
    const progress = 1.0 - (this.life / this.maxLife);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.r = 6 + (this.maxR - 6) * Math.sin(progress * Math.PI * 0.5);
    this.alpha = 0.55 * Math.sin((1.0 - progress) * Math.PI);
    return true;
  }
  draw(ctx) {
    if (this.alpha <= 0.01) return;
    ctx.save();
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
    g.addColorStop(0, `rgba(241, 245, 249, ${this.alpha})`);
    g.addColorStop(0.5, `rgba(203, 213, 225, ${this.alpha * 0.5})`);
    g.addColorStop(1, 'rgba(148, 163, 184, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

const STEAM_VENTS = [
  { x: 1120, y: 640, dirX: 1, dirY: -0.6, interval: 2.8, timer: 0.5 },
  { x: 1620, y: 660, dirX: -0.8, dirY: -0.9, interval: 3.2, timer: 1.8 },
  { x: 2780, y: 660, dirX: 0.8, dirY: -0.9, interval: 3.0, timer: 1.0 },
  { x: 3280, y: 640, dirX: -1, dirY: -0.6, interval: 2.9, timer: 2.2 }
];

const activeSteamPuffs = [];

function spawnSteamJet(vent) {
  const count = 7;
  for (let i = 0; i < count; i++) {
    const spread = (Math.random() - 0.5) * 0.45;
    const speed = 70 + Math.random() * 85;
    const angle = Math.atan2(vent.dirY, vent.dirX) + spread;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const maxR = 40 + Math.random() * 35;
    const life = 1.1 + Math.random() * 0.7;
    activeSteamPuffs.push(new SteamPuff(vent.x, vent.y, vx, vy, maxR, life));
  }
}

// Iskry przeskakujące po kablach w dalekim planie
class CableSpark {
  constructor(cable) {
    this.cable = cable;
    this.progress = 0;
    this.speed = 0.55 + Math.random() * 0.45;
    this.size = 2.5 + Math.random() * 2.0;
  }
  update(dt) {
    this.progress += this.speed * dt;
    return this.progress < 1.0;
  }
  draw(ctx) {
    const c = this.cable;
    const t = this.progress;
    const x = c.x1 + (c.x2 - c.x1) * t;
    const sag = Math.sin(t * Math.PI) * c.sag;
    const y = c.y1 + (c.y2 - c.y1) * t + sag;

    ctx.save();
    ctx.fillStyle = '#67e8f9';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

const DISTANT_CABLES = [
  { x1: 400, y1: 320, x2: 1200, y2: 390, sag: 55, timer: 1.0 },
  { x1: 1300, y1: 380, x2: 2100, y2: 350, sag: 60, timer: 3.2 },
  { x1: 2300, y1: 350, x2: 3100, y2: 380, sag: 60, timer: 2.1 },
  { x1: 3200, y1: 390, x2: 4000, y2: 320, sag: 55, timer: 4.0 }
];

const activeCableSparks = [];

// Sunąca niska mgła nad autostradą tranzytową (Y: 1140..1180)
const HIGHWAY_FOG_PUFFS = [];
for (let i = 0; i < 28; i++) {
  HIGHWAY_FOG_PUFFS.push({
    x: i * 160 + Math.random() * 60,
    baseY: 1165 + Math.random() * 12,
    r: 55 + Math.random() * 45,
    speed: 12 + Math.random() * 14,
    phase: Math.random() * Math.PI * 2
  });
}

// =========================================================================
// 5. GŁÓWNA PĘTLA AKTUALIZACJI ARENY 3 (UPDATE TICK)
// =========================================================================
export function updateArena3(dt, players, ball) {
  animTime += dt;
  fanRotation = (fanRotation + dt * 0.45) % (Math.PI * 2);

  // Wyładowania burzowe
  lightningTimer -= dt;
  if (lightningTimer <= 0) {
    lightningAlpha = 0.55 + Math.random() * 0.35;
    lightningTimer = 4.0 + Math.random() * 5.0;
  }
  if (lightningAlpha > 0) {
    lightningAlpha = Math.max(0, lightningAlpha - dt * 2.8);
  }

  // Buchy pary
  for (let i = 0; i < STEAM_VENTS.length; i++) {
    const v = STEAM_VENTS[i];
    v.timer -= dt;
    if (v.timer <= 0) {
      spawnSteamJet(v);
      v.timer = v.interval + (Math.random() - 0.5) * 1.2;
    }
  }
  for (let i = activeSteamPuffs.length - 1; i >= 0; i--) {
    if (!activeSteamPuffs[i].update(dt)) {
      activeSteamPuffs.splice(i, 1);
    }
  }

  // Iskry na kablach
  for (let i = 0; i < DISTANT_CABLES.length; i++) {
    const c = DISTANT_CABLES[i];
    c.timer -= dt;
    if (c.timer <= 0) {
      activeCableSparks.push(new CableSpark(c));
      c.timer = 3.5 + Math.random() * 4.5;
    }
  }
  for (let i = activeCableSparks.length - 1; i >= 0; i--) {
    if (!activeCableSparks[i].update(dt)) {
      activeCableSparks.splice(i, 1);
    }
  }

  // Mgła na autostradzie
  for (let i = 0; i < HIGHWAY_FOG_PUFFS.length; i++) {
    const fog = HIGHWAY_FOG_PUFFS[i];
    fog.x += fog.speed * dt;
    if (fog.x > 4450) fog.x = -50;
  }

  // Termika bezpieczeństwa w chmurach poniżej platformy (Y > 1240)
  if (Array.isArray(players)) {
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (!p || p.isDead) continue;
      if (p.y > 1240) {
        p.vy = -18.5;
        p.y = 1170 - (p.h || 70);
        p.isJumping = true;
        p.onGround = false;
        p.currentPlatform = null;
      }
    }
  }
}

// =========================================================================
// 6. RENDEROWANIE TŁA (PNG + RUCHOME CHMURY, ISKRY, WENTYLATOR, PARA)
// =========================================================================
export function drawArena3Background(ctx, camera) {
  if (!ctx) return;

  // 1. Wypełnienie pełnego ekranu zmierzchowym gradientem nieba (screen space)
  const W_screen = ctx.canvas?.width || (typeof window !== 'undefined' ? window.innerWidth : 1920);
  const H_screen = ctx.canvas?.height || (typeof window !== 'undefined' ? window.innerHeight : 1080);
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H_screen);
  skyGrad.addColorStop(0.0, '#160d26');
  skyGrad.addColorStop(0.65, '#2b143a');
  skyGrad.addColorStop(1.0, '#0e0717');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W_screen, H_screen);

  ctx.save();
  if (camera) {
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
  }

  const camL = camera ? camera.x - 150 : 0;
  const camR = camera ? camera.x + (camera.viewWidth || 2000) + 150 : 4400;

  // 2. RYSOWANIE STATYCZNEJ GRAFIKI PANORAMICZNEJ MAPY (4400 x 1400 px)
  if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
    ctx.drawImage(bgImg, 0, 0, 4400, 1400);
  } else {
    // Rezerwowy gradient gdyby PNG było w trakcie wczytywania
    const g = ctx.createLinearGradient(0, 0, 0, 1400);
    g.addColorStop(0, '#160d26');
    g.addColorStop(0.65, '#b44b24');
    g.addColorStop(1, '#0e0717');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4400, 1400);
  }

  // 3. WOLNO OBRACAJĄCY SIĘ GIGANTYCZNY WENTYLATOR PRZEMYSŁOWY (X = 2200, Y = 480)
  const fanCx = 2200;
  const fanCy = 480;
  if (fanCx + 260 >= camL && fanCx - 260 <= camR) {
    ctx.save();
    // Subtelna łuna podświetlenia zza wirnika wentylatora
    const fanGlow = ctx.createRadialGradient(fanCx, fanCy, 40, fanCx, fanCy, 240);
    fanGlow.addColorStop(0, 'rgba(249, 115, 22, 0.35)');
    fanGlow.addColorStop(0.6, 'rgba(234, 88, 12, 0.15)');
    fanGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = fanGlow;
    ctx.beginPath();
    ctx.arc(fanCx, fanCy, 240, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(fanCx, fanCy);
    ctx.rotate(fanRotation);

    if (fanBladesImg && fanBladesImg.complete && fanBladesImg.naturalWidth > 0) {
      const s = 420;
      ctx.drawImage(fanBladesImg, -s / 2, -s / 2, s, s);
    } else {
      // Rezerwowe łopatki
      const blades = 12;
      for (let i = 0; i < blades; i++) {
        ctx.rotate((Math.PI * 2) / blades);
        ctx.fillStyle = '#18141d';
        ctx.beginPath();
        ctx.moveTo(-14, -20);
        ctx.quadraticCurveTo(0, -90, 24, -180);
        ctx.lineTo(-20, -180);
        ctx.quadraticCurveTo(-10, -85, -14, -20);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // 4. RUCHOME ISKRY PRZESKAKUJĄCE PO KABLACH
  for (let i = 0; i < activeCableSparks.length; i++) {
    activeCableSparks[i].draw(ctx);
  }

  // 5. BUCHY PARY POD CIŚNIENIEM Z RUR
  for (let i = 0; i < activeSteamPuffs.length; i++) {
    activeSteamPuffs[i].draw(ctx);
  }

  // 6. RUCHOMY OCEAN BURZOWYCH CHMUR W OTCHŁANI (Y: 1080–1400)
  if (lightningAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = lightningAlpha;
    const lGrad = ctx.createRadialGradient(2200, 1280, 80, 2200, 1280, 1600);
    lGrad.addColorStop(0, 'rgba(192, 132, 252, 0.70)');
    lGrad.addColorStop(0.5, 'rgba(147, 51, 234, 0.28)');
    lGrad.addColorStop(1, 'rgba(88, 28, 135, 0)');
    ctx.fillStyle = lGrad;
    ctx.fillRect(0, 1050, 4400, 350);
    ctx.restore();
  }

  function drawCloudLayer(baseY, amp, speed, color, highlightColor) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 1400);
    ctx.lineTo(0, baseY);

    const step = 70;
    for (let x = 0; x <= 4400; x += step) {
      const wave1 = Math.sin((x * 0.0032) + (animTime * speed)) * amp;
      const wave2 = Math.cos((x * 0.0065) - (animTime * speed * 0.7)) * (amp * 0.45);
      const cy = baseY + wave1 + wave2;
      ctx.lineTo(x, cy);
    }
    ctx.lineTo(4400, 1400);
    ctx.closePath();
    ctx.fill();

    if (highlightColor) {
      ctx.strokeStyle = highlightColor;
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
    ctx.restore();
  }

  drawCloudLayer(1135, 26, 0.12, 'rgba(38, 20, 48, 0.95)', 'rgba(217, 83, 30, 0.30)');
  drawCloudLayer(1180, 22, 0.22, 'rgba(28, 14, 38, 0.98)', 'rgba(234, 115, 42, 0.38)');
  drawCloudLayer(1230, 18, 0.35, '#12091c', 'rgba(249, 115, 22, 0.20)');

  ctx.restore();
}

// =========================================================================
// 7. RENDEROWANIE PIERWSZEGO PLANU (SPRITE'Y PLATFORM, BRUK, MGŁA, LASERY)
// =========================================================================
export function drawArena3Foreground(ctx, camera) {
  if (!ctx) return;

  ctx.save();
  const camL = camera ? camera.x - 150 : 0;
  const camR = camera ? camera.x + (camera.viewWidth || 2000) + 150 : 4400;

  // -----------------------------------------------------------------------
  // 1. RENDEROWANIE ŚCIAN BOCZNYCH HANGARÓW I WLOTÓW BRAMEK (Cyan & Orange)
  // -----------------------------------------------------------------------
  // A. Ściana i bramka Cyan (Zachód: X: 0..180)
  if (220 >= camL) {
    // Górna ściana hangaru z blachy nitowanej (Y: 0..510)
    if (wallPanelImg && wallPanelImg.complete && wallPanelImg.naturalWidth > 0) {
      ctx.drawImage(wallPanelImg, 0, 0, 180, 510);
    } else {
      ctx.fillStyle = '#161922';
      ctx.fillRect(0, 0, 180, 510);
      ctx.strokeStyle = '#272f3d';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, 180, 510);
    }

    // Wlot bramki Cyan (Y: 510..705, lintel na Y = 505..520, wnęka laserowa w głębi)
    if (goalApertureImg && goalApertureImg.complete && goalApertureImg.naturalWidth > 0) {
      ctx.drawImage(goalApertureImg, 20, 510, 160, 195);
    }

    // Pulsujące laserowe pole wewnątrz wnęki
    ctx.save();
    const cyanPulse = Math.sin(animTime * 5.0) * 0.25 + 0.75;
    const clGrad = ctx.createLinearGradient(25, 530, 95, 530);
    clGrad.addColorStop(0, `rgba(0, 229, 255, ${0.85 * cyanPulse})`);
    clGrad.addColorStop(0.5, `rgba(6, 182, 212, ${0.40 * cyanPulse})`);
    clGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = clGrad;
    ctx.fillRect(20, 530, 80, 170);
    ctx.restore();
  }

  // B. Ściana i bramka Orange (Wschód: X: 4220..4400)
  if (4200 <= camR) {
    // Górna ściana hangaru z blachy nitowanej (Y: 0..510) - odbicie lustrzane
    if (wallPanelImg && wallPanelImg.complete && wallPanelImg.naturalWidth > 0) {
      ctx.save();
      ctx.translate(4220 + 180, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(wallPanelImg, 0, 0, 180, 510);
      ctx.restore();
    } else {
      ctx.fillStyle = '#161922';
      ctx.fillRect(4220, 0, 180, 510);
      ctx.strokeStyle = '#272f3d';
      ctx.lineWidth = 3;
      ctx.strokeRect(4220, 0, 180, 510);
    }

    // Wlot bramki Orange (Y: 510..705) - odbicie lustrzane
    if (goalApertureImg && goalApertureImg.complete && goalApertureImg.naturalWidth > 0) {
      ctx.save();
      ctx.translate(4220 + 160, 510);
      ctx.scale(-1, 1);
      ctx.drawImage(goalApertureImg, 0, 0, 160, 195);
      ctx.restore();
    }

    // Pulsujące laserowe pole wewnątrz wnęki
    ctx.save();
    const orangePulse = Math.sin(animTime * 5.0 + 1.2) * 0.25 + 0.75;
    const olGrad = ctx.createLinearGradient(4375, 530, 4305, 530);
    olGrad.addColorStop(0, `rgba(249, 115, 22, ${0.85 * orangePulse})`);
    olGrad.addColorStop(0.5, `rgba(234, 88, 12, ${0.40 * orangePulse})`);
    olGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = olGrad;
    ctx.fillRect(4300, 530, 80, 170);
    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // 2. RENDEROWANIE POZIOMU GÓRNEGO: BAZA CYAN, CENTRALNY MOST, BAZA ORANGE
  // -----------------------------------------------------------------------
  // A. Baza Lewa (Cyan: X: 180–1280, Y: 700)
  if (1280 >= camL && 180 <= camR) {
    if (platformTileImg && platformTileImg.complete && platformTileImg.naturalWidth > 0) {
      ctx.drawImage(platformTileImg, 180, 700, 1100, 54);
    } else {
      ctx.fillStyle = '#1c1f26';
      ctx.fillRect(180, 700, 1100, 54);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(180, 700, 1100, 4);
    }

    // Oznaczenia drużynowe Cyan (wyblakłe logotypy / pasy)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 229, 255, 0.16)';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('DISTRICT 01 // CYAN', 340, 680);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(340, 692);
    ctx.lineTo(820, 692);
    ctx.stroke();
    ctx.restore();
  }

  // B. Baza Prawa (Orange: X: 3120–4220, Y: 700)
  if (4220 >= camL && 3120 <= camR) {
    if (platformTileImg && platformTileImg.complete && platformTileImg.naturalWidth > 0) {
      ctx.save();
      // Odbicie lustrzane dla symetrii
      ctx.translate(3120 + 1100, 700);
      ctx.scale(-1, 1);
      ctx.drawImage(platformTileImg, 0, 0, 1100, 54);
      ctx.restore();
    } else {
      ctx.fillStyle = '#1c1f26';
      ctx.fillRect(3120, 700, 1100, 54);
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.strokeRect(3120, 700, 1100, 4);
    }

    // Oznaczenia drużynowe Orange
    ctx.save();
    ctx.fillStyle = 'rgba(249, 115, 22, 0.16)';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('DISTRICT 02 // ORANGE', 3420, 680);
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(3420, 692);
    ctx.lineTo(3920, 692);
    ctx.stroke();
    ctx.restore();
  }

  // C. Centralny Most Wiszący (X: 1680–2720, Y: 700)
  if (2720 >= camL && 1680 <= camR) {
    if (suspensionBridgeImg && suspensionBridgeImg.complete && suspensionBridgeImg.naturalWidth > 0) {
      // Skalowanie sprite'a mostu tak, by podłoga mostu pokrywała Y = 700 (deck row 245 / 675 * 260 = 95 px; 605 + 95 = 700)
      ctx.drawImage(suspensionBridgeImg, 1680, 605, 1040, 260);
    } else {
      ctx.fillStyle = '#161922';
      ctx.fillRect(1680, 700, 1040, 40);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(1680, 700, 1040, 4);
    }

    // Zimne niebieskawe jarzeniówki wbudowane w podłogę mostu
    const bridgeNeonPulse = Math.sin(animTime * 4.0) * 0.15 + 0.85;
    ctx.save();
    ctx.fillStyle = `rgba(56, 189, 248, ${0.40 * bridgeNeonPulse})`;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.fillRect(1700, 698, 1000, 3);
    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // 3. RENDEROWANIE MAGNETYCZNYCH WIND TOWAROWYCH (LUKI PRZESIADKOWE)
  // -----------------------------------------------------------------------
  const CARGO_LIFTS = [
    { x: 1330, y: 970, w: 155, team: 'cyan' },
    { x: 1490, y: 835, w: 155, team: 'cyan' },
    { x: 2760, y: 835, w: 155, team: 'orange' },
    { x: 2920, y: 970, w: 155, team: 'orange' }
  ];

  for (let i = 0; i < CARGO_LIFTS.length; i++) {
    const cl = CARGO_LIFTS[i];
    if (cl.x + cl.w < camL || cl.x > camR) continue;

    if (cargoPlatformImg && cargoPlatformImg.complete && cargoPlatformImg.naturalWidth > 0) {
      // Górna krawędź pokładu (row 0) idealnie na cl.y, silniki wiszą pod spodem
      ctx.drawImage(cargoPlatformImg, cl.x, cl.y, cl.w, 91);
    } else {
      ctx.fillStyle = '#232733';
      ctx.fillRect(cl.x, cl.y, cl.w, 30);
      ctx.strokeStyle = cl.team === 'cyan' ? '#00e5ff' : '#f97316';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(cl.x, cl.y, cl.w, 3);
    }

    // Pulsujące dysze plazmowe silników antygrawitacyjnych
    const thrusterPulse = Math.sin(animTime * 6.5 + i) * 0.25 + 0.75;
    const pods = [cl.x + cl.w * 0.28, cl.x + cl.w * 0.72];
    for (let k = 0; k < pods.length; k++) {
      const px = pods[k];
      const tg = ctx.createLinearGradient(px, cl.y + 28, px, cl.y + 60);
      tg.addColorStop(0, cl.team === 'cyan' ? `rgba(0, 229, 255, ${0.80 * thrusterPulse})` : `rgba(249, 115, 22, ${0.80 * thrusterPulse})`);
      tg.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.moveTo(px - 7, cl.y + 28);
      ctx.lineTo(px + 7, cl.y + 28);
      ctx.lineTo(px + 12, cl.y + 55);
      ctx.lineTo(px - 12, cl.y + 55);
      ctx.closePath();
      ctx.fill();
    }
  }

  // -----------------------------------------------------------------------
  // 4. RENDEROWANIE KŁADEK SNAJPERSKICH ZE ZBROJONEGO SZKŁA (Y = 440)
  // -----------------------------------------------------------------------
  const SNIPER_DECKS = [
    { x: 1840, y: 440, w: 240, flip: false },
    { x: 2320, y: 440, w: 240, flip: true }
  ];

  for (let i = 0; i < SNIPER_DECKS.length; i++) {
    const sd = SNIPER_DECKS[i];
    if (sd.x + sd.w < camL || sd.x > camR) continue;

    if (glassPlatformImg && glassPlatformImg.complete && glassPlatformImg.naturalWidth > 0) {
      ctx.save();
      if (sd.flip) {
        ctx.translate(sd.x + sd.w, sd.y);
        ctx.scale(-1, 1);
        ctx.drawImage(glassPlatformImg, 0, 0, sd.w, 25);
      } else {
        ctx.drawImage(glassPlatformImg, sd.x, sd.y, sd.w, 25);
      }
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.fillRect(sd.x, sd.y, sd.w, 20);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sd.x, sd.y, sd.w, 20);
    }
  }

  // -----------------------------------------------------------------------
  // 5. RENDEROWANIE POZIOMU DOLNEGO (AUTOSTRADA TRANZYTOWA, Y = 1180)
  // -----------------------------------------------------------------------
  // Rysowanie segmentowej kratownicy autostrady
  const hFloorY = 1180;
  if (platformTileImg && platformTileImg.complete && platformTileImg.naturalWidth > 0) {
    const tileW = 550;
    const startTile = Math.floor(Math.max(20, camL) / tileW);
    const endTile = Math.ceil(Math.min(4380, camR) / tileW);
    for (let t = startTile; t <= endTile; t++) {
      const tx = t * tileW;
      ctx.drawImage(platformTileImg, tx, hFloorY, tileW, 40);
    }
  } else {
    ctx.fillStyle = '#11141c';
    ctx.fillRect(20, hFloorY, 4360, 40);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, hFloorY, 4360, 3);
  }

  // Pulsujące żółte lampy awaryjne wbudowane w podłogę
  const pulse = Math.sin(animTime * 3.5) * 0.25 + 0.75;
  for (let lx = 90; lx < 4350; lx += 140) {
    if (lx < camL || lx > camR) continue;
    const lg = ctx.createRadialGradient(lx, hFloorY + 2, 2, lx, hFloorY + 2, 22);
    lg.addColorStop(0, `rgba(250, 204, 21, ${0.45 * pulse})`);
    lg.addColorStop(1, 'rgba(234, 179, 8, 0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(lx, hFloorY + 2, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sunąca niska mgła nad podłogą autostrady
  ctx.save();
  for (let i = 0; i < HIGHWAY_FOG_PUFFS.length; i++) {
    const fog = HIGHWAY_FOG_PUFFS[i];
    if (fog.x + fog.r < camL || fog.x - fog.r > camR) continue;
    const fy = fog.baseY + Math.sin(animTime * 1.5 + fog.phase) * 4;
    const fg = ctx.createRadialGradient(fog.x, fy, 0, fog.x, fy, fog.r);
    fg.addColorStop(0, 'rgba(148, 163, 184, 0.16)');
    fg.addColorStop(0.6, 'rgba(100, 116, 139, 0.08)');
    fg.addColorStop(1, 'rgba(71, 85, 105, 0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(fog.x, fy, fog.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}

// =========================================================================
// 8. HOOKI INTERAKCJI BOJOWYCH
// =========================================================================
export function onArena3BulletHit(bullet) {
  return false;
}

export function onArena3KickHit(player, kickBox) {
  return false;
}

export function onArena3Explosion(expX, expY, radius, context) {
  return false;
}

// =========================================================================
// 9. KONTRAKT ARENY 3 (PLUGIN DEFINITION / LIFECYCLE HOOKS)
// =========================================================================
const arena3 = {
  id: 'arena-3',
  alias: 'AERO_REFINERY',
  name: 'Aero-Rafineria (Podniebny Dystrykt)',
  width: 4400,
  height: 1400,
  spawns: [
    { x: 600, y: 630 },   // Spawn gracza (Cyan) - Płyta bazy lewej Y = 700 (postać h=70)
    { x: 3800, y: 630 },  // Spawn bota (Orange) - Płyta bazy prawej Y = 700
    { x: 2200, y: 650 }   // Piłka - lewitująca nad centralnym mostem Y = 700
  ],
  platforms: ARENA_3_PLATFORMS,
  customObjects: ARENA_3_CUSTOM_OBJECTS,
  minecarts: ARENA_3_MINECARTS,
  reset() {
    resetArena3Minecarts();
    resetArena3Breaches();
  },
  drawBackground(ctx, camera) {
    drawArena3Background(ctx, camera);
  },
  draw(ctx, camera) {
    drawArena3Foreground(ctx, camera);
  },
  update(dt, players, ball) {
    updateArena3(dt, players, ball);
  },
  onBulletHit(bullet) {
    return onArena3BulletHit(bullet);
  },
  onKickHit(player, kickBox) {
    return onArena3KickHit(player, kickBox);
  },
  onExplosion(expX, expY, radius, context) {
    return onArena3Explosion(expX, expY, radius, context);
  }
};

export default arena3;
