// =========================================================================
// ARENAS/ARENA4_SPACE.JS - STACJA ORBITALNA ARES (3200x1400 PX)
// Moduł Areny 4: Środowisko Niskiej Grawitacji, Śmiertelna Próżnia,
// Zniszczalne Panele Słoneczne, Pionowe Repulsory Kinetyczne
// Standard: Zero ctx.shadowBlur, Pre-rendered Offscreen Background, 60 FPS
// =========================================================================

import { triggerScreenShake } from '../camera.js';
import { spawnBloodSpurt, spawnLimbGib } from '../world/gore.js';

// =========================================================================
// 1. STAŁE KONFIGURACYJNE I FIZYKA ARENY
// =========================================================================
export const ARENA_4_SPACE_CONFIG = {
  id: 'arena-4',
  name: 'STACJA ORBITALNA ARES',
  codeName: 'ARES_ORBITAL_STATION',
  mapWidth: 3200,
  mapHeight: 1400,
  centerX: 1600,
  gravityMultiplier: 0.72,
  jetpackDrainMultiplier: 0.60,
  deathY: 1250,

  // Geometria Modułu Centralnego (900 px x 350 px)
  module: {
    x: 1150,
    y: 560,
    w: 900,
    h: 350,
    roofY: 560,
    catwalkY: 735,
    hullFloorY: 910
  },

  // Ściany osłonowe (2 pionowe osłony taktyczne na dachu)
  coverWalls: [
    { id: 'ares_blastwall_west', x: 1360, y: 495, w: 24, h: 65 },
    { id: 'ares_blastwall_east', x: 1816, y: 495, w: 24, h: 65 }
  ],

  // Pionowe Repulsory (Jump Pady - 60 px przy krawędziach modułu, vy = -16)
  repulsors: [
    { id: 'ares_repulsor_west', x: 1080, y: 560, w: 60, h: 20, launchVy: -16 },
    { id: 'ares_repulsor_east', x: 2060, y: 560, w: 60, h: 20, launchVy: -16 }
  ],

  // Skrzydła Paneli Słonecznych (lewe i prawe skrzydło: 3 segmenty po 120 px)
  solarWings: {
    y: 620,
    h: 16,
    cooldownDuration: 8.0,
    outlineColor: '#38bdf8',
    segmentsLeft: [
      { id: 'solar_L1', x: 940, w: 120, y: 620, h: 16 },
      { id: 'solar_L2', x: 790, w: 120, y: 620, h: 16 },
      { id: 'solar_L3', x: 640, w: 120, y: 620, h: 16 }
    ],
    segmentsRight: [
      { id: 'solar_R1', x: 2140, w: 120, y: 620, h: 16 },
      { id: 'solar_R2', x: 2290, w: 120, y: 620, h: 16 },
      { id: 'solar_R3', x: 2440, w: 120, y: 620, h: 16 }
    ]
  }
};

// =========================================================================
// 2. STAN DYNAMICZNY ARENY
// =========================================================================
export const arenaSpaceState = {
  animTime: 0,
  gravityMultiplier: ARENA_4_SPACE_CONFIG.gravityMultiplier,
  jetpackDrainMultiplier: ARENA_4_SPACE_CONFIG.jetpackDrainMultiplier,
  deathY: ARENA_4_SPACE_CONFIG.deathY,

  // Dynamiczny stan zniszczenia/regeneracji paneli fotowoltaicznych
  solarPanels: [
    { id: 'solar_L1', x: 940, y: 620, w: 120, h: 16, disabled: false, disabledTimer: 0, platformRef: null },
    { id: 'solar_L2', x: 790, y: 620, w: 120, h: 16, disabled: false, disabledTimer: 0, platformRef: null },
    { id: 'solar_L3', x: 640, y: 620, w: 120, h: 16, disabled: false, disabledTimer: 0, platformRef: null },
    { id: 'solar_R1', x: 2140, y: 620, w: 120, h: 16, disabled: false, disabledTimer: 0, platformRef: null },
    { id: 'solar_R2', x: 2290, y: 620, w: 120, h: 16, disabled: false, disabledTimer: 0, platformRef: null },
    { id: 'solar_R3', x: 2440, y: 620, w: 120, h: 16, disabled: false, disabledTimer: 0, platformRef: null }
  ],

  // Cząsteczki energii repulsorów i wyładowań paneli fotowoltaicznych
  repulsorWaves: [],
  glitchParticles: []
};

// =========================================================================
// 3. SPONSOROWANE PUNKTY ODRODZENIA (SPAWN POINTS)
// =========================================================================
export const ARENA_4_SPACE_SPAWNS = [
  // Cyan Team (West Side)
  { x: 1240, y: 490, facing: 1, team: 'CYAN', label: 'DACH_ZACHOD' },
  // Orange Team (East Side)
  { x: 1960, y: 490, facing: -1, team: 'ORANGE', label: 'DACH_WSCHOD' },
  // Korytarz wewnętrzny (West / East)
  { x: 1280, y: 665, facing: 1, team: 'CYAN', label: 'KORYTARZ_ZACHOD' },
  { x: 1920, y: 665, facing: -1, team: 'ORANGE', label: 'KORYTARZ_WSCHOD' },
  // Skrzydła paneli słonecznych (West / East)
  { x: 990, y: 550, facing: 1, team: 'CYAN', label: 'PANEL_LEWY' },
  { x: 2210, y: 550, facing: -1, team: 'ORANGE', label: 'PANEL_PRAWY' },
  // Centralny pomost obserwacyjny
  { x: 1600, y: 490, facing: 1, team: 'CYAN', label: 'POMOST_CENTRUM' }
];

// =========================================================================
// 4. GENEROWANIE STATYCZNYCH I DYNAMICZNYCH PLATFORM
// =========================================================================
export function createSpaceStationPlatforms() {
  const m = ARENA_4_SPACE_CONFIG.module;
  const plats = [];

  // --- A. CENTRALNY MODUŁ BOJOWY (900 px x 350 px) ---
  // Główny dach modułu (lewy sektor i prawy sektor twardy, środek kładka z drop-through)
  plats.push({
    id: 'ares_roof_west',
    type: 'hull',
    x: m.x,
    w: 310,
    y: m.roofY,
    h: 24,
    thickness: 24,
    solid: true,
    isHull: true,
    dropThrough: false,
    isDropThrough: false
  });

  plats.push({
    id: 'ares_roof_hatch',
    type: 'catwalk',
    x: m.x + 310,
    w: 280,
    y: m.roofY,
    h: 14,
    thickness: 14,
    solid: true,
    isCatwalk: true,
    isOneWay: true,
    dropThrough: true,
    isDropThrough: true
  });

  plats.push({
    id: 'ares_roof_east',
    type: 'hull',
    x: m.x + 590,
    w: 310,
    y: m.roofY,
    h: 24,
    thickness: 24,
    solid: true,
    isHull: true,
    dropThrough: false,
    isDropThrough: false
  });

  // Wewnętrzny korytarz techniczny z kładką roboczą
  plats.push({
    id: 'ares_corridor_catwalk',
    type: 'catwalk',
    x: m.x + 50,
    w: m.w - 100,
    y: m.catwalkY,
    h: 18,
    thickness: 18,
    solid: true,
    isCatwalk: true,
    isOneWay: true,
    dropThrough: true,
    isDropThrough: true
  });

  // Dolny pokład kadłuba (poszycie wewnętrzne)
  plats.push({
    id: 'ares_hull_floor',
    type: 'hull',
    x: m.x,
    w: m.w,
    y: m.hullFloorY,
    h: 26,
    thickness: 26,
    solid: true,
    isHull: true,
    dropThrough: false,
    isDropThrough: false
  });

  // Dwie pionowe ściany osłonowe na dachu
  for (const w of ARENA_4_SPACE_CONFIG.coverWalls) {
    plats.push({
      id: w.id,
      type: 'blast_wall',
      x: w.x,
      y: w.y,
      w: w.w,
      h: w.h,
      thickness: w.w,
      solid: true,
      isWall: true,
      isCoverWall: true
    });
  }

  // --- B. PIONOWE REPULSORY KINETYCZNE (JUMP PADY, vy = -16) ---
  for (const r of ARENA_4_SPACE_CONFIG.repulsors) {
    plats.push({
      id: r.id,
      type: 'jump_pad',
      isJumpPad: true,
      launchVy: r.launchVy,
      x: r.x,
      w: r.w,
      y: r.y,
      h: r.h,
      thickness: r.h,
      solid: true
    });
  }

  // --- C. SKRZYDŁA PANELI SŁONECZNYCH (6 segmentów po 120 px) ---
  for (const p of arenaSpaceState.solarPanels) {
    const plat = {
      id: p.id,
      type: 'solar_panel',
      x: p.x,
      w: p.w,
      y: p.y,
      h: p.h,
      thickness: p.h,
      solid: !p.disabled,
      isSolarPanel: true
    };
    p.platformRef = plat;
    plats.push(plat);
  }

  return plats;
}

export const ARENA_4_PLATFORMS = createSpaceStationPlatforms();

// =========================================================================
// 5. FUNKCJA ŚMIERTELNEJ PRÓŻNI: killByHazard(victim, "PRÓŻNIA KOSMICZNA")
// =========================================================================
export function killByHazard(victim, hazardName = "PRÓŻNIA KOSMICZNA") {
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
  // Efekt ekspozycji na próżnię: rozproszenie mikrokropelek krwi
  spawnBloodSpurt(victim.x, victim.y + 30, 0, -1, 16, 2.0);
}

// =========================================================================
// 6. OBSŁUGA EKSPLOZJI: NISZCZENIE PANELI SŁONECZNYCH (8 SEKUND COOLDOWN)
// =========================================================================
export function handleSpaceExplosion(expX, expY, radius) {
  let hitAny = false;
  const effectiveRadius = Math.max(radius || 100, 110);

  for (const seg of arenaSpaceState.solarPanels) {
    const segCenterX = seg.x + seg.w * 0.5;
    const segCenterY = seg.y + seg.h * 0.5;
    const d = Math.hypot(segCenterX - expX, segCenterY - expY);

    if (d <= effectiveRadius + seg.w * 0.45) {
      seg.disabled = true;
      seg.disabledTimer = ARENA_4_SPACE_CONFIG.solarWings.cooldownDuration; // 8.0s
      if (seg.platformRef) {
        seg.platformRef.solid = false;
      }
      hitAny = true;

      // Cyfrowe iskry wyłączenia i rozpadu osłony segmentu
      for (let i = 0; i < 14; i++) {
        arenaSpaceState.glitchParticles.push({
          x: seg.x + Math.random() * seg.w,
          y: seg.y + Math.random() * seg.h,
          vx: (Math.random() - 0.5) * 160,
          vy: -Math.random() * 140 - 20,
          life: 0.8 + Math.random() * 0.6,
          maxLife: 1.4,
          color: Math.random() > 0.4 ? '#38bdf8' : '#ffffff',
          size: 2.0 + Math.random() * 2.5
        });
      }
    }
  }

  return hitAny;
}

// =========================================================================
// 7. PRE-RENDEROWANE TŁO (OFFSCREEN CANVAS BUFFER, ZERO SHADOWBLUR)
// =========================================================================
let bgBufferCanvas = null;

function renderOffscreenSpaceBackground(w, h) {
  let offCanvas = null;
  if (typeof OffscreenCanvas !== 'undefined') {
    offCanvas = new OffscreenCanvas(w, h);
  } else if (typeof document !== 'undefined') {
    offCanvas = document.createElement('canvas');
    offCanvas.width = w;
    offCanvas.height = h;
  }
  if (!offCanvas) return null;

  const bgCtx = offCanvas.getContext('2d');
  if (!bgCtx) return null;

  // 1. Głębia kosmicznej próżni (abyssal deep-space gradient)
  const spaceGrad = bgCtx.createLinearGradient(0, 0, 0, h);
  spaceGrad.addColorStop(0, '#01030a');
  spaceGrad.addColorStop(0.35, '#030718');
  spaceGrad.addColorStop(0.7, '#040b22');
  spaceGrad.addColorStop(1, '#06102b');
  bgCtx.fillStyle = spaceGrad;
  bgCtx.fillRect(0, 0, w, h);

  // 2. Kosmiczne mgławice (Translucent Interstellar Nebulae - bez shadowBlur)
  // 2A. Błękitno-turkusowa mgławica gazowa (Sektor Zachodni)
  const nebGrad1 = bgCtx.createRadialGradient(920, 260, 40, 920, 260, 780);
  nebGrad1.addColorStop(0, 'rgba(14, 165, 233, 0.30)');
  nebGrad1.addColorStop(0.35, 'rgba(56, 189, 248, 0.16)');
  nebGrad1.addColorStop(0.7, 'rgba(14, 116, 144, 0.07)');
  nebGrad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  bgCtx.fillStyle = nebGrad1;
  bgCtx.fillRect(0, 0, w, h);

  // 2B. Fioletowo-purpurowa mgławica gwiezdna (Sektor Wschodni)
  const nebGrad2 = bgCtx.createRadialGradient(2580, 230, 50, 2580, 230, 720);
  nebGrad2.addColorStop(0, 'rgba(139, 92, 246, 0.26)');
  nebGrad2.addColorStop(0.4, 'rgba(99, 102, 241, 0.14)');
  nebGrad2.addColorStop(0.75, 'rgba(79, 70, 229, 0.05)');
  nebGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  bgCtx.fillStyle = nebGrad2;
  bgCtx.fillRect(0, 0, w, h);

  // 2C. Centralna poświata jądra galaktycznego
  const nebGrad3 = bgCtx.createRadialGradient(1750, 190, 30, 1750, 190, 520);
  nebGrad3.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
  nebGrad3.addColorStop(0.5, 'rgba(125, 211, 252, 0.06)');
  nebGrad3.addColorStop(1, 'rgba(0, 0, 0, 0)');
  bgCtx.fillStyle = nebGrad3;
  bgCtx.fillRect(0, 0, w, h);

  // 3. Deterministyczne pole gwiezdne (Multi-magnitude Starfield - 580 gwiazd)
  let seed = 42891;
  function lcgRandom() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  }

  for (let i = 0; i < 580; i++) {
    const starX = lcgRandom() * w;
    const starY = lcgRandom() * (h * 0.72);
    const starType = lcgRandom();
    let r = 0.75;
    let alpha = 0.35 + lcgRandom() * 0.60;
    let color = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;

    if (starType > 0.90) {
      r = 1.9;
      color = `rgba(186, 230, 253, ${alpha.toFixed(2)})`;
    } else if (starType > 0.76) {
      r = 1.35;
      color = `rgba(254, 240, 138, ${alpha.toFixed(2)})`;
    } else if (starType > 0.60) {
      r = 1.0;
      color = `rgba(224, 242, 254, ${alpha.toFixed(2)})`;
    }

    bgCtx.fillStyle = color;
    bgCtx.beginPath();
    bgCtx.arc(starX, starY, r, 0, Math.PI * 2);
    bgCtx.fill();

    // 4-ramienne subtelne promienie dyfrakcyjne dla 28 najjaśniejszych gwiazd
    if (starType > 0.95) {
      bgCtx.strokeStyle = `rgba(255, 255, 255, ${(alpha * 0.45).toFixed(2)})`;
      bgCtx.lineWidth = 1;
      const flareLen = 4 + lcgRandom() * 5;
      bgCtx.beginPath();
      bgCtx.moveTo(starX - flareLen, starY);
      bgCtx.lineTo(starX + flareLen, starY);
      bgCtx.moveTo(starX, starY - flareLen);
      bgCtx.lineTo(starX, starY + flareLen);
      bgCtx.stroke();
    }
  }

  // 4. Daleka stacja przekaźnikowa w głębokim tle (Orbital Deep Space Relay)
  bgCtx.save();
  const relayX = 620;
  const relayY = 175;
  bgCtx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
  bgCtx.lineWidth = 1.5;
  // Główny maszt i pierścień
  bgCtx.beginPath();
  bgCtx.moveTo(relayX - 50, relayY);
  bgCtx.lineTo(relayX + 50, relayY);
  bgCtx.moveTo(relayX, relayY - 38);
  bgCtx.lineTo(relayX, relayY + 38);
  bgCtx.stroke();

  bgCtx.beginPath();
  bgCtx.arc(relayX, relayY, 20, 0, Math.PI * 2);
  bgCtx.stroke();

  // Panele słoneczne stacji przekaźnikowej
  bgCtx.fillStyle = 'rgba(56, 189, 248, 0.45)';
  bgCtx.fillRect(relayX - 84, relayY - 10, 30, 20);
  bgCtx.fillRect(relayX + 54, relayY - 10, 30, 20);
  bgCtx.strokeStyle = 'rgba(125, 211, 252, 0.7)';
  bgCtx.lineWidth = 1;
  bgCtx.strokeRect(relayX - 84, relayY - 10, 30, 20);
  bgCtx.strokeRect(relayX + 54, relayY - 10, 30, 20);

  // Mrugające czerwone światło nawigacyjne
  bgCtx.fillStyle = '#ef4444';
  bgCtx.beginPath();
  bgCtx.arc(relayX, relayY - 38, 2.5, 0, Math.PI * 2);
  bgCtx.fill();
  bgCtx.restore();

  // 5. Majestatyczna krzywizna Ziemi (Luminous Earth Horizon - widoczna na każdym ekranie)
  bgCtx.save();
  const earthCenterX = w * 0.50;
  const earthRadius = 1750;
  const earthCenterY = 2200; // Apex na Y = 450 (w tle stacji)

  // A. Płynna aureola egzosfery i atmosfery (warstwy gradientowe bez shadowBlur)
  const atmoGrad = bgCtx.createRadialGradient(
    earthCenterX, earthCenterY, earthRadius - 20,
    earthCenterX, earthCenterY, earthRadius + 140
  );
  atmoGrad.addColorStop(0, 'rgba(56, 189, 248, 0.72)');
  atmoGrad.addColorStop(0.25, 'rgba(14, 165, 233, 0.40)');
  atmoGrad.addColorStop(0.65, 'rgba(2, 132, 199, 0.16)');
  atmoGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');

  bgCtx.fillStyle = atmoGrad;
  bgCtx.beginPath();
  bgCtx.arc(earthCenterX, earthCenterY, earthRadius + 140, 0, Math.PI * 2);
  bgCtx.fill();

  // B. Tarcza oceaniczna planety Ziemia
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

  // C. Zarysy lądów i kontynentów (biomy leśno-górskie z płytkim szelfem)
  // Szelf przybrzeżny (jasny turkus)
  bgCtx.fillStyle = 'rgba(14, 165, 233, 0.35)';
  bgCtx.beginPath();
  bgCtx.arc(earthCenterX - 380, earthCenterY - earthRadius + 110, 190, 0, Math.PI * 2);
  bgCtx.arc(earthCenterX + 320, earthCenterY - earthRadius + 130, 240, 0, Math.PI * 2);
  bgCtx.fill();

  // Kontynenty
  bgCtx.fillStyle = 'rgba(22, 101, 52, 0.50)';
  bgCtx.beginPath();
  bgCtx.arc(earthCenterX - 380, earthCenterY - earthRadius + 120, 170, 0, Math.PI * 2);
  bgCtx.arc(earthCenterX + 320, earthCenterY - earthRadius + 140, 220, 0, Math.PI * 2);
  bgCtx.fill();

  // Wewnętrzne pasma górskie
  bgCtx.fillStyle = 'rgba(63, 98, 18, 0.40)';
  bgCtx.beginPath();
  bgCtx.arc(earthCenterX - 350, earthCenterY - earthRadius + 140, 110, 0, Math.PI * 2);
  bgCtx.arc(earthCenterX + 350, earthCenterY - earthRadius + 160, 140, 0, Math.PI * 2);
  bgCtx.fill();

  // D. Złote skupiska świateł miast po nocnej stronie planety
  bgCtx.fillStyle = 'rgba(254, 240, 138, 0.85)';
  for (let c = 0; c < 65; c++) {
    const cx = earthCenterX - 550 + lcgRandom() * 1100;
    const cy = earthCenterY - earthRadius + 45 + lcgRandom() * 160;
    const sz = 1.5 + (c % 3) * 0.7;
    bgCtx.fillRect(cx, cy, sz, sz);
  }

  // E. Pasma chmur i formacji cyklonicznych w atmosferze
  bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  bgCtx.lineWidth = 18;
  bgCtx.beginPath();
  bgCtx.arc(earthCenterX, earthCenterY, earthRadius - 28, Math.PI * 1.24, Math.PI * 1.76);
  bgCtx.stroke();

  bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  bgCtx.lineWidth = 12;
  bgCtx.beginPath();
  bgCtx.arc(earthCenterX, earthCenterY, earthRadius - 65, Math.PI * 1.27, Math.PI * 1.73);
  bgCtx.stroke();

  bgCtx.strokeStyle = 'rgba(240, 249, 255, 0.18)';
  bgCtx.lineWidth = 8;
  bgCtx.beginPath();
  bgCtx.arc(earthCenterX, earthCenterY, earthRadius - 105, Math.PI * 1.30, Math.PI * 1.70);
  bgCtx.stroke();

  // F. Krawędź ozonowa (Luminous Cyan Ozone Rim)
  bgCtx.strokeStyle = 'rgba(125, 211, 252, 0.95)';
  bgCtx.lineWidth = 3.5;
  bgCtx.beginPath();
  bgCtx.arc(earthCenterX, earthCenterY, earthRadius, Math.PI * 1.21, Math.PI * 1.79);
  bgCtx.stroke();

  bgCtx.restore();

  return offCanvas;
}

export function initSpaceStationBackground(w = 3600, h = 2000) {
  bgBufferCanvas = renderOffscreenSpaceBackground(w, h);
}

// =========================================================================
// 8. RENDEROWANIE TŁA I ELEMENTÓW DALEKIEJ STACJI (ONE DRAWIMAGE CALL)
// =========================================================================
export function drawArena4SpaceBackground(ctx, camera) {
  if (!bgBufferCanvas) {
    initSpaceStationBackground(3600, 2000);
  }
  if (!bgBufferCanvas) return;

  const camX = camera?.x || 0;
  const camY = camera?.y || 0;

  // Paralaksa głębokiego kosmosu
  const bgOffsetX = -camX * 0.10;
  const bgOffsetY = -camY * 0.08;

  // Jedna operacja drawImage dla całego tła kosmicznego (60 FPS)
  ctx.drawImage(bgBufferCanvas, bgOffsetX, bgOffsetY);
}

// =========================================================================
// 9. RENDEROWANIE FOREGROUND (MODUŁ BOJOWY, PANELE, REPULSORY)
// =========================================================================
export function drawArena4SpaceForeground(ctx, camera) {
  const m = ARENA_4_SPACE_CONFIG.module;
  const t = arenaSpaceState.animTime;
  const wingY = ARENA_4_SPACE_CONFIG.solarWings.y; // 620
  const panelBottom = wingY + ARENA_4_SPACE_CONFIG.solarWings.h; // 636

  ctx.save();

  // --- A. GŁÓWNA OŚ NOŚNA I PODWIESZANA KRATOWNICA SKRZYDEŁ PANELI ---
  // 1. Centralny dźwigar tytanowy w osi paneli (Y = 628, brak wystających elementów w górę!)
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 8;
  ctx.beginPath();
  // Lewe ramię osiowe
  ctx.moveTo(m.x, wingY + 8);
  ctx.lineTo(600, wingY + 8);
  // Prawe ramię osiowe
  ctx.moveTo(m.x + m.w, wingY + 8);
  ctx.lineTo(2600, wingY + 8);
  ctx.stroke();

  // Rdzeń dźwigara (metaliczny odblask)
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(m.x, wingY + 8);
  ctx.lineTo(600, wingY + 8);
  ctx.moveTo(m.x + m.w, wingY + 8);
  ctx.lineTo(2600, wingY + 8);
  ctx.stroke();

  // 2. Węzły obrotowe przy kadłubie (Gimbal Actuators ze złotą folią termiczną)
  ctx.fillStyle = '#d97706'; // Złota folia kaptonowa
  ctx.fillRect(m.x - 14, wingY - 4, 14, 24);
  ctx.fillRect(m.x + m.w, wingY - 4, 14, 24);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(m.x - 14, wingY - 4, 14, 24);
  ctx.strokeRect(m.x + m.w, wingY - 4, 14, 24);

  // Pierścienie łożysk obrotu paneli
  ctx.fillStyle = '#475569';
  ctx.fillRect(m.x - 6, wingY - 7, 6, 30);
  ctx.fillRect(m.x + m.w, wingY - 7, 6, 30);

  // 3. Dolna kratownica podwieszana (POD panelami, Y = 636 do 656)
  const trussY = panelBottom + 18; // 654
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(630, trussY);
  ctx.lineTo(m.x - 20, trussY);
  ctx.moveTo(m.x + m.w + 20, trussY);
  ctx.lineTo(2570, trussY);
  ctx.stroke();

  // Zastrzały trójkątne podtrzymujące panele od spodu
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let x = 640; x < m.x - 40; x += 60) {
    ctx.moveTo(x, panelBottom);
    ctx.lineTo(x + 30, trussY);
    ctx.lineTo(x + 60, panelBottom);
  }
  for (let x = m.x + m.w + 40; x < 2560; x += 60) {
    ctx.moveTo(x, panelBottom);
    ctx.lineTo(x + 30, trussY);
    ctx.lineTo(x + 60, panelBottom);
  }
  ctx.stroke();

  // Końcówki skrzydeł (Wingtip navigation caps z diodami pozycyjnymi)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(600, wingY - 2, 20, 20);
  ctx.fillRect(2580, wingY - 2, 20, 20);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(600, wingY - 2, 20, 20);
  ctx.strokeRect(2580, wingY - 2, 20, 20);

  // Lewa dioda czerwona (Port), prawa zielona (Starboard)
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(602, wingY + 6, 4, 4);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(2594, wingY + 6, 4, 4);

  // --- B. CENTRALNY MODUŁ BOJOWY ARES (KORPUS, WNĘTRZE, POSZYCIE) ---
  // 1. Wewnętrzne tło korytarza (głęboki kompozyt próżniowy)
  ctx.fillStyle = '#070c18';
  ctx.fillRect(m.x, m.roofY, m.w, m.h);

  // Wzmocnione ożebrowanie kadłuba
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  for (let gx = m.x + 90; gx < m.x + m.w; gx += 100) {
    ctx.beginPath();
    ctx.moveTo(gx, m.roofY);
    ctx.lineTo(gx, m.roofY + m.h);
    ctx.stroke();

    // Wewnętrzne nity i łączniki grodzi
    ctx.fillStyle = '#334155';
    ctx.fillRect(gx - 4, m.roofY + 40, 8, 4);
    ctx.fillRect(gx - 4, m.catwalkY - 12, 8, 4);
    ctx.fillRect(gx - 4, m.hullFloorY - 12, 8, 4);
  }

  // Wewnętrzne magistrale kablowe i przewody zasilania
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(m.x + 30, m.roofY + 36);
  ctx.lineTo(m.x + m.w - 30, m.roofY + 36);
  ctx.stroke();

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(m.x + 30, m.roofY + 44);
  ctx.lineTo(m.x + m.w - 30, m.roofY + 44);
  ctx.stroke();

  // Śluzy ciśnieniowe na skrajach modułu (Docking Airlocks)
  // Lewa śluza
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(m.x, m.catwalkY - 60, 22, 60);
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 2;
  ctx.strokeRect(m.x, m.catwalkY - 60, 22, 60);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(m.x + 6, m.catwalkY - 45, 10, 8); // Status terminal

  // Prawa śluza
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(m.x + m.w - 22, m.catwalkY - 60, 22, 60);
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 2;
  ctx.strokeRect(m.x + m.w - 22, m.catwalkY - 60, 22, 60);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(m.x + m.w - 16, m.catwalkY - 45, 10, 8); // Status terminal

  // 2. Kładka techniczna w korytarzu (m.catwalkY = 735, drop-through)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(m.x + 50, m.catwalkY, m.w - 100, 18);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.strokeRect(m.x + 50, m.catwalkY, m.w - 100, 18);

  // Ażurowa siatka antypoślizgowa pomostu
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
  ctx.lineWidth = 1;
  for (let kx = m.x + 56; kx < m.x + m.w - 56; kx += 14) {
    ctx.beginPath();
    ctx.moveTo(kx, m.catwalkY);
    ctx.lineTo(kx, m.catwalkY + 18);
    ctx.stroke();
  }

  // Żółte listwy ostrzegawcze krawędzi kładki
  ctx.fillStyle = '#eab308';
  ctx.fillRect(m.x + 50, m.catwalkY + 14, m.w - 100, 3);

  // 3. Dolny pokład kadłuba (poszycie wewnętrzne, solidne - bez drop-through!)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(m.x, m.hullFloorY, m.w, 26);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(m.x, m.hullFloorY, m.w, 26);

  // Wojskowe oznaczenia na kadłubie
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('ARES-04 // PRIMARY HABITAT MODULE // SECTOR ORBITAL', m.x + 30, m.hullFloorY + 18);

  // Wzmocnienia konstrukcyjne dolnej krawędzi kadłuba
  for (let bx = m.x + 40; bx < m.x + m.w; bx += 80) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx, m.hullFloorY + 22, 24, 4);
  }

  // 4. Dach modułu centralnego (m.roofY = 560)
  // Lewa twarda płyta dachu (solid hull)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(m.x, m.roofY, 310, 24);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(m.x, m.roofY, 310, 24);

  // Płyty pancerne i nity sekcji zachodniej
  ctx.fillStyle = '#334155';
  ctx.fillRect(m.x + 10, m.roofY + 4, 130, 16);
  ctx.fillRect(m.x + 150, m.roofY + 4, 150, 16);
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 9px monospace';
  ctx.fillText('SEC-W // HULL-01', m.x + 20, m.roofY + 16);

  // Prawa twarda płyta dachu (solid hull)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(m.x + 590, m.roofY, 310, 24);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(m.x + 590, m.roofY, 310, 24);

  ctx.fillStyle = '#334155';
  ctx.fillRect(m.x + 600, m.roofY + 4, 140, 16);
  ctx.fillRect(m.x + 750, m.roofY + 4, 140, 16);
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 9px monospace';
  ctx.fillText('SEC-E // HULL-02', m.x + 610, m.roofY + 16);

  // Środkowa kładka włazu dachowego (drop-through hatch)
  ctx.fillStyle = '#0a1224';
  ctx.fillRect(m.x + 310, m.roofY, 280, 14);
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2;
  ctx.strokeRect(m.x + 310, m.roofY, 280, 14);

  // Ostrzegawcze żółto-czarne pasy na włazie centralnym
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 3.5;
  for (let hx = m.x + 320; hx < m.x + 580; hx += 22) {
    ctx.beginPath();
    ctx.moveTo(hx, m.roofY + 2);
    ctx.lineTo(hx + 10, m.roofY + 12);
    ctx.stroke();
  }

  // Pulsujące bursztynowe diody ostrzegawcze na włazie
  const hatchPulse = Math.sin(t * 5.0) * 0.35 + 0.65;
  ctx.fillStyle = `rgba(245, 158, 11, ${hatchPulse.toFixed(2)})`;
  ctx.fillRect(m.x + 314, m.roofY + 4, 5, 5);
  ctx.fillRect(m.x + 571, m.roofY + 4, 5, 5);

  // 5. Dwie pionowe osłony balistyczne na dachu (Tactical Cover Shields)
  for (const w of ARENA_4_SPACE_CONFIG.coverWalls) {
    // Korpus tarczy balistycznej
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x, w.y, w.w, w.h);

    // Wzmocnienia pancerne
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(w.x + 4, w.y + 6, w.w - 8, 8);

    // Wizjer ze szkła pancernego
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(w.x + 6, w.y + 18, w.w - 12, 14);
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x + 6, w.y + 18, w.w - 12, 14);

    // Oznaczenia chevrons
    ctx.fillStyle = '#eab308';
    ctx.fillRect(w.x + 4, w.y + 38, w.w - 8, 4);
    ctx.fillRect(w.x + 4, w.y + 48, w.w - 8, 4);

    // Maszt telemetryczny ze stroboskopem kolizyjnym
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w.x + w.w * 0.5, w.y);
    ctx.lineTo(w.x + w.w * 0.5, w.y - 18);
    ctx.stroke();

    // Mrugający stroboskop czerwony na szczycie osłony
    const beaconFlash = (Math.floor(t * 3.0) % 2 === 0);
    ctx.fillStyle = beaconFlash ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(w.x + w.w * 0.5, w.y - 18, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- C. PIONOWE REPULSORY KINETYCZNE (JUMP PADY, 60 px, vy = -16) ---
  for (const rep of ARENA_4_SPACE_CONFIG.repulsors) {
    // Podstawa emitera
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(rep.x, rep.y, rep.w, rep.h);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(rep.x, rep.y, rep.w, rep.h);

    // Cewki kinetyczne (kinetyczny generator pola)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(rep.x + 4, rep.y + 4, rep.w - 8, 5);

    // Animowane pulsujące strzałki ciągu w górę (▲)
    const phase = (t * 4.0) % 1.0;
    const arrowY = rep.y - 6 - phase * 22;
    ctx.fillStyle = `rgba(56, 189, 248, ${(1.0 - phase).toFixed(2)})`;
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('▲', rep.x + rep.w * 0.5, arrowY);
    ctx.textAlign = 'start';

    // Płynny snop pola kinetycznego (linear gradient, zero shadowBlur)
    const beamGrad = ctx.createLinearGradient(0, rep.y, 0, rep.y - 50);
    beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(rep.x + 8, rep.y - 50, rep.w - 16, 50);
  }

  // --- D. SKRZYDŁA PANELI SŁONECZNYCH (6 SEGMENTÓW PO 120 PX) ---
  for (const seg of arenaSpaceState.solarPanels) {
    if (!seg.disabled) {
      // 1. Panel sprawny: głęboki błękit krzemu fotowoltaicznego
      ctx.fillStyle = '#0b1a36';
      ctx.fillRect(seg.x, seg.y, seg.w, seg.h);

      // Siatka ogniw fotowoltaicznych z mikroskopijnymi liniami busbarów
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.40)';
      ctx.lineWidth = 1;
      for (let cx = seg.x + 15; cx < seg.x + seg.w; cx += 15) {
        ctx.beginPath();
        ctx.moveTo(cx, seg.y);
        ctx.lineTo(cx, seg.y + seg.h);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.50)'; // Złote linie szyn zbiorczych
      ctx.beginPath();
      ctx.moveTo(seg.x, seg.y + seg.h * 0.5);
      ctx.lineTo(seg.x + seg.w, seg.y + seg.h * 0.5);
      ctx.stroke();

      // Neonowo-niebieski wyrazisty obrys (#38bdf8)
      ctx.strokeStyle = ARENA_4_SPACE_CONFIG.solarWings.outlineColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(seg.x, seg.y, seg.w, seg.h);

      // Odblask powłoki antyrefleksyjnej
      const sheenGrad = ctx.createLinearGradient(seg.x, seg.y, seg.x + seg.w, seg.y + seg.h);
      sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.24)');
      sheenGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.06)');
      sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sheenGrad;
      ctx.fillRect(seg.x, seg.y, seg.w, seg.h);

      // Dioda statusu online
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(seg.x + 4, seg.y + 3, 3, 3);
    } else {
      // 2. Panel wyłączony eksplozją: efekt holograficznego zanikania i regeneracji (8s)
      const progress = 1.0 - (seg.disabledTimer / ARENA_4_SPACE_CONFIG.solarWings.cooldownDuration);
      const glitchAlpha = (0.2 + progress * 0.5) * (0.6 + 0.4 * Math.sin(t * 18));

      // Przerywany zarys siatki naprawczej
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = `rgba(56, 189, 248, ${glitchAlpha.toFixed(2)})`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(seg.x, seg.y, seg.w, seg.h);

      // Pasek postępu regeneracji poszycia
      ctx.fillStyle = `rgba(56, 189, 248, 0.28)`;
      ctx.fillRect(seg.x, seg.y + seg.h - 4, seg.w * progress, 4);

      // Etykieta naprawy nanobotów / restartu zasilania
      ctx.fillStyle = `rgba(56, 189, 248, ${(0.4 + 0.5 * progress).toFixed(2)})`;
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`REBOOT ${Math.ceil(seg.disabledTimer)}s`, seg.x + 14, seg.y + 11);
      ctx.restore();
    }
  }

  // --- E. CZĄSTECZKI GLITCHA I ROZPADU PANELI ---
  for (let i = 0; i < arenaSpaceState.glitchParticles.length; i++) {
    const p = arenaSpaceState.glitchParticles[i];
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }

  ctx.restore();
}

// =========================================================================
// 10. GŁÓWNA PĘTLA LOGIKI ARENY (UPDATE: PRÓŻNIA, REPULSORY, JETPACK FUEL)
// =========================================================================
export function updateArena4Space(dt, combatants) {
  const safeDt = Math.min(dt || (1 / 60), 0.1);
  arenaSpaceState.animTime += safeDt;

  // 1. Aktualizacja timerów regeneracji zniszczalnych paneli słonecznych (8s)
  for (const seg of arenaSpaceState.solarPanels) {
    if (seg.disabled) {
      seg.disabledTimer -= safeDt;
      if (seg.disabledTimer <= 0) {
        seg.disabledTimer = 0;
        seg.disabled = false;
        if (seg.platformRef) {
          seg.platformRef.solid = true;
        }
      }
    }
  }

  // 2. Aktualizacja cząsteczek glitcha
  for (let i = arenaSpaceState.glitchParticles.length - 1; i >= 0; i--) {
    const p = arenaSpaceState.glitchParticles[i];
    p.life -= safeDt;
    p.x += p.vx * safeDt;
    p.y += p.vy * safeDt;
    if (p.life <= 0) {
      arenaSpaceState.glitchParticles.splice(i, 1);
    }
  }

  // 3. Monitorowanie parametrów combatants (gracze, boty)
  const targets = Array.isArray(combatants) ? combatants : [];
  const repulsors = ARENA_4_SPACE_CONFIG.repulsors;
  const deathY = arenaSpaceState.deathY;

  for (let i = 0; i < targets.length; i++) {
    const c = targets[i];
    if (!c) continue;

    // A. Dolna granica mapy: śmierć w śmiertelnej próżni kosmicznej
    const feetY = (c.y || 0) + (c.h || 70);
    if (!c.isDead && feetY > deathY) {
      killByHazard(c, "PRÓŻNIA KOSMICZNA");
      continue;
    }

    if (c.isDead) continue;

    // B. Mnożnik zużycia jetpacka (jetpackDrainMultiplier = 0.6)
    // Refundacja 40% zużytego paliwa w każdej klatce bez modyfikacji player.js
    if (typeof c.jetFuel === 'number') {
      if (c._aresPrevFuel !== undefined && c.jetFuel < c._aresPrevFuel) {
        const drained = c._aresPrevFuel - c.jetFuel;
        const refund = drained * (1.0 - ARENA_4_SPACE_CONFIG.jetpackDrainMultiplier);
        c.jetFuel = Math.min(c.jetMax || 100, c.jetFuel + refund);
      }
      c._aresPrevFuel = c.jetFuel;
    }

    // C. Weryfikacja wejścia w strefę repulsorów kinetycznych (vy = -16)
    const centerX = (c.x || 0) + (c.w || 24) * 0.5;
    for (let r = 0; r < repulsors.length; r++) {
      const rep = repulsors[r];
      if (centerX >= rep.x - 8 && centerX <= rep.x + rep.w + 8) {
        if (feetY >= rep.y - 14 && feetY <= rep.y + 26) {
          c.y = rep.y - (c.h || 70) - 4;
          c.vy = rep.launchVy; // -16
          c.isJumping = true;
          c.onGround = false;
          c.currentPlatform = null;
          c.isCrouching = false;
          c.airVx = c.vx;
          triggerScreenShake(4.5);
          break;
        }
      }
    }
  }
}

// =========================================================================
// 11. RESET ARENY
// =========================================================================
export function resetArena4Space() {
  arenaSpaceState.animTime = 0;
  arenaSpaceState.glitchParticles.length = 0;

  for (const seg of arenaSpaceState.solarPanels) {
    seg.disabled = false;
    seg.disabledTimer = 0;
    if (seg.platformRef) {
      seg.platformRef.solid = true;
    }
  }
}

// =========================================================================
// 12. DEFINICJA I EKSPORT WTYCZKI ARENY (ARENA CONTRACT)
// =========================================================================
export const arena4 = {
  id: ARENA_4_SPACE_CONFIG.id,
  alias: ARENA_4_SPACE_CONFIG.codeName,
  mapId: 'ares_orbital_station_01',
  name: ARENA_4_SPACE_CONFIG.name,
  width: ARENA_4_SPACE_CONFIG.mapWidth,
  height: ARENA_4_SPACE_CONFIG.mapHeight,
  gravityMultiplier: ARENA_4_SPACE_CONFIG.gravityMultiplier,
  jetpackDrainMultiplier: ARENA_4_SPACE_CONFIG.jetpackDrainMultiplier,
  spawns: ARENA_4_SPACE_SPAWNS,
  platforms: ARENA_4_PLATFORMS,
  customObjects: [],

  reset() {
    resetArena4Space();
  },

  drawBackground(ctx, camera) {
    drawArena4SpaceBackground(ctx, camera);
  },

  draw(ctx, camera) {
    drawArena4SpaceForeground(ctx, camera);
  },

  update(dt, combatants, ball) {
    updateArena4Space(dt, combatants);
  },

  onExplosion(expX, expY, radius, context) {
    return handleSpaceExplosion(expX, expY, radius);
  },

  onBulletHit(bullet) {
    return false;
  },

  onKickHit(player, kickBox) {
    return false;
  }
};

if (typeof window !== 'undefined') {
  window.arena4 = arena4;
}

export default arena4;
