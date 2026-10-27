// =========================================================================
// ARENAS/ARENA4_SPACE.JS - STACJA ORBITALNA ARES (2400x1400 PX)
// Moduł Areny 4: Środowisko Niskiej Grawitacji, Śmiertelna Próżnia,
// Lita Konstrukcja Bojowa, Most Fotowoltaiczny, Pionowe Repulsory Kinetyczne
// Standard: Zero ctx.shadowBlur, Zero Emotikonów, Pre-rendered Offscreen Background, 60 FPS
// =========================================================================

import { triggerScreenShake } from '../camera.js';
import { spawnBloodSpurt } from '../world/gore.js';

// =========================================================================
// 1. STAŁE KONFIGURACYJNE I FIZYKA ARENY
// =========================================================================
export const ARENA_SPACE = {
  id: 'arena-4',
  name: 'STACJA ORBITALNA ARES',
  codeName: 'ARES_ORBITAL_STATION',
  mapWidth: 2400,
  mapHeight: 1400,
  centerX: 1200,
  mainDeckY: 560,
  lowerDeckY: 740,
  deathY: 1050, // Granica próżni: co najmniej 300 px poniżej najniższej platformy (740 + 310)
  gravityMultiplier: 0.72,
  jetpackDrainMultiplier: 0.60,

  // Twarde punkty odrodzenia powiązane bezpośrednio z fizycznymi współrzędnymi powierzchni głównego pokładu
  SPAWN_POINTS: [
    { x: 350,  y: 560 - 60, facing: 1,  team: 'CYAN',   label: 'LEWE_SKRZYDLO' }, // Lewe skrzydło stacji
    { x: 700,  y: 560 - 60, facing: 1,  team: 'CYAN',   label: 'CENTRUM_POKLADU' }, // Centrum głównego pokładu
    { x: 1050, y: 560 - 60, facing: -1, team: 'ORANGE', label: 'PRAWE_PRZEJSCIE' }, // Prawe przejście techniczne
    { x: 1400, y: 560 - 60, facing: -1, team: 'ORANGE', label: 'PRAWY_PYLON' }  // Prawy pylon przy panelach
  ],

  // Kompaktowe pionowe emitery grawitacyjne (vy = -16, zero rozmytych okręgów)
  repulsors: [
    { id: 'ares_repulsor_west', x: 230, y: 560, w: 56, h: 18, launchVy: -16 },
    { id: 'ares_repulsor_east', x: 1680, y: 560, w: 56, h: 18, launchVy: -16 }
  ],

  // Ściany osłonowe (2 pionowe osłony balistyczne na dachu)
  coverWalls: [
    { id: 'ares_blastwall_west', x: 500, y: 495, w: 24, h: 65 },
    { id: 'ares_blastwall_east', x: 980, y: 495, w: 24, h: 65 }
  ]
};

export const ARENA_4_SPACE_CONFIG = ARENA_SPACE;
export const ARENA_4_SPACE_SPAWNS = ARENA_SPACE.SPAWN_POINTS;

// =========================================================================
// 2. STAN DYNAMICZNY ARENY
// =========================================================================
export const arenaSpaceState = {
  animTime: 0,
  gravityMultiplier: ARENA_SPACE.gravityMultiplier,
  jetpackDrainMultiplier: ARENA_SPACE.jetpackDrainMultiplier,
  deathY: ARENA_SPACE.deathY
};

// =========================================================================
// 3. GENEROWANIE STATYCZNYCH I DYNAMICZNYCH PLATFORM
// =========================================================================
export function createSpaceStationPlatforms() {
  const plats = [];
  const deckY = ARENA_SPACE.mainDeckY; // 560
  const lowerY = ARENA_SPACE.lowerDeckY; // 740

  // --- A. GŁÓWNY POKŁAD BOJOWY (Y = 560) ---
  // 1. Lewe skrzydło stacji (solidna lita płyta grafitowa)
  plats.push({
    id: 'ares_deck_west',
    type: 'hull',
    x: 200,
    w: 440,
    y: deckY,
    h: 28,
    thickness: 28,
    solid: true,
    isHull: true,
    dropThrough: false,
    isDropThrough: false
  });

  // 2. Centralny właz techniczny (catwalk z drop-through na dolny pokład)
  plats.push({
    id: 'ares_deck_hatch',
    type: 'catwalk',
    x: 640,
    w: 220,
    y: deckY,
    h: 16,
    thickness: 16,
    solid: true,
    isCatwalk: true,
    isOneWay: true,
    dropThrough: true,
    isDropThrough: true
  });

  // 3. Wschodnia sekcja głównego pokładu (solidna lita płyta grafitowa)
  plats.push({
    id: 'ares_deck_east',
    type: 'hull',
    x: 860,
    w: 340,
    y: deckY,
    h: 28,
    thickness: 28,
    solid: true,
    isHull: true,
    dropThrough: false,
    isDropThrough: false
  });

  // --- B. MOST FOTOWOLTAICZNY (PRAWA STRONA: JEDNOLITY CIĄG KŁADKI SERWISOWEJ) ---
  plats.push({
    id: 'ares_photovoltaic_catwalk',
    type: 'hull',
    x: 1200,
    w: 560,
    y: deckY,
    h: 24,
    thickness: 24,
    solid: true,
    isHull: true,
    dropThrough: false,
    isDropThrough: false
  });

  // --- C. DOLNY POKŁAD KADŁUBA (Y = 740, SOLIDNA PŁYTA TECHNICZNA) ---
  plats.push({
    id: 'ares_lower_deck',
    type: 'hull',
    x: 280,
    w: 860,
    y: lowerY,
    h: 30,
    thickness: 30,
    solid: true,
    isHull: true,
    dropThrough: false,
    isDropThrough: false
  });

  // --- D. DWOJE ŚCIAN OSŁONOWYCH NA GÓRNYM POKŁADZIE ---
  for (const w of ARENA_SPACE.coverWalls) {
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

  // --- E. KOMPAKTOWE PIONOWE EMITERY GRAWITACYJNE (vy = -16) ---
  for (const r of ARENA_SPACE.repulsors) {
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

  return plats;
}

export const ARENA_4_PLATFORMS = createSpaceStationPlatforms();

// =========================================================================
// 4. FUNKCJA ŚMIERTELNEJ PRÓŻNI: killByHazard(victim, "PRÓŻNIA KOSMICZNA")
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
  spawnBloodSpurt(victim.x, victim.y + 30, 0, -1, 16, 2.0);
}

// =========================================================================
// 5. OBSŁUGA EKSPLOZJI (KOMPATYBILNOŚĆ Z POTOKIEM BRONI)
// =========================================================================
export function handleSpaceExplosion(expX, expY, radius) {
  return false;
}

// =========================================================================
// 6. PRE-RENDEROWANE TŁO (OFFSCREEN CANVAS BUFFER, ZERO SHADOWBLUR)
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
  // Sektor Zachodni (błękitno-turkusowa)
  const nebGrad1 = bgCtx.createRadialGradient(800, 260, 40, 800, 260, 780);
  nebGrad1.addColorStop(0, 'rgba(14, 165, 233, 0.28)');
  nebGrad1.addColorStop(0.35, 'rgba(56, 189, 248, 0.14)');
  nebGrad1.addColorStop(0.7, 'rgba(14, 116, 144, 0.05)');
  nebGrad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  bgCtx.fillStyle = nebGrad1;
  bgCtx.fillRect(0, 0, w, h);

  // Sektor Wschodni (fioletowo-purpurowa)
  const nebGrad2 = bgCtx.createRadialGradient(2400, 230, 50, 2400, 230, 720);
  nebGrad2.addColorStop(0, 'rgba(139, 92, 246, 0.22)');
  nebGrad2.addColorStop(0.4, 'rgba(99, 102, 241, 0.12)');
  nebGrad2.addColorStop(0.75, 'rgba(79, 70, 229, 0.04)');
  nebGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  bgCtx.fillStyle = nebGrad2;
  bgCtx.fillRect(0, 0, w, h);

  // Centralna poświata
  const nebGrad3 = bgCtx.createRadialGradient(1600, 190, 30, 1600, 190, 520);
  nebGrad3.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
  nebGrad3.addColorStop(0.5, 'rgba(125, 211, 252, 0.05)');
  nebGrad3.addColorStop(1, 'rgba(0, 0, 0, 0)');
  bgCtx.fillStyle = nebGrad3;
  bgCtx.fillRect(0, 0, w, h);

  // 3. Deterministyczne pole gwiezdne (580 gwiazd o różnej magnitudo)
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

    // 4-ramienne promienie dyfrakcyjne dla najjaśniejszych gwiazd
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

  // 5. Majestatyczna krzywizna Ziemi (Luminous Earth Horizon - bez wielkich zielonych bąbli)
  bgCtx.save();
  const earthCenterX = w * 0.50;
  const earthRadius = 1750;
  const earthCenterY = 2200; // Apex horyzontu na Y = 450 (w tle stacji)

  // A. Płynna aureola egzosfery i atmosfery
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

  // C. Złote skupiska świateł miast po nocnej stronie planety
  bgCtx.fillStyle = 'rgba(254, 240, 138, 0.85)';
  for (let c = 0; c < 65; c++) {
    const cx = earthCenterX - 650 + lcgRandom() * 1300;
    const cy = earthCenterY - earthRadius + 45 + lcgRandom() * 160;
    const sz = 1.5 + (c % 3) * 0.7;
    bgCtx.fillRect(cx, cy, sz, sz);
  }

  // D. Pasma chmur i formacji cyklonicznych wzdłuż krzywizny planety
  bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  bgCtx.lineWidth = 16;
  bgCtx.beginPath();
  bgCtx.arc(earthCenterX, earthCenterY, earthRadius - 28, Math.PI * 1.24, Math.PI * 1.76);
  bgCtx.stroke();

  bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  bgCtx.lineWidth = 10;
  bgCtx.beginPath();
  bgCtx.arc(earthCenterX, earthCenterY, earthRadius - 65, Math.PI * 1.27, Math.PI * 1.73);
  bgCtx.stroke();

  // E. Krawędź ozonowa (Luminous Cyan Ozone Rim)
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
// 7. RENDEROWANIE TŁA KOSMICZNEGO (JEDNO DRAWIMAGE, 60 FPS)
// =========================================================================
export function drawArena4SpaceBackground(ctx, camera) {
  if (!bgBufferCanvas) {
    initSpaceStationBackground(3600, 2000);
  }
  if (!bgBufferCanvas) return;

  const camX = camera?.x || 0;
  const camY = camera?.y || 0;

  // Subtelna paralaksa głębokiego kosmosu
  const bgOffsetX = -camX * 0.10;
  const bgOffsetY = -camY * 0.08;

  ctx.drawImage(bgBufferCanvas, bgOffsetX, bgOffsetY);
}

// =========================================================================
// 8. RENDEROWANIE FOREGROUND (LITA PLATFORMA BOJOWA, MOST FOTOWOLTAICZNY, REPULSORY)
// =========================================================================
export function drawArena4SpaceForeground(ctx, camera) {
  const t = arenaSpaceState.animTime;
  const deckY = ARENA_SPACE.mainDeckY; // 560
  const lowerY = ARENA_SPACE.lowerDeckY; // 740

  ctx.save();

  // =======================================================================
  // 1. STRUKTURALNA ŚCIANA / BULKHEAD POMIĘDZY POKŁADAMI (X: 200..1200, Y: 560..740)
  // =======================================================================
  // Jednolite, wypełnione tło kompozytowe kadłuba stacji
  ctx.fillStyle = '#0a101d';
  ctx.fillRect(200, deckY, 1000, lowerY - deckY + 30);

  // Pionowe wręgi i żebra wzmacniające kadłuba
  ctx.fillStyle = '#162235';
  for (let rx = 240; rx < 1180; rx += 70) {
    ctx.fillRect(rx, deckY + 14, 10, lowerY - deckY - 14);
  }

  // Poziome magistrale kablowe i przewody ciśnieniowe
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(220, deckY + 50);
  ctx.lineTo(1180, deckY + 50);
  ctx.stroke();

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(220, deckY + 60);
  ctx.lineTo(1180, deckY + 60);
  ctx.stroke();

  // Oznaczenia wojskowe i techniczne na grodzi
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('ARES-04 // ORBITAL DEFENSE BATTALION // CORE HABITAT', 260, deckY + 80);
  ctx.fillText('SECTOR: 04-A // PRESSURE: NOMINAL // O2: 99.4%', 260, lowerY - 30);

  // =======================================================================
  // 2. WSPORNIKI HYDRAULICZNE ŁĄCZĄCE GÓRNY POKŁAD Z DOLNYM PYLONEM
  // =======================================================================
  const pistonPositions = [380, 580, 880, 1060];
  for (const px of pistonPositions) {
    // Górne mocowanie wspornika (dark steel bracket)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px - 14, deckY + 24, 28, 16);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px - 14, deckY + 24, 28, 16);

    // Błyszczący chromowany tłok hydrauliczny
    const pistonGrad = ctx.createLinearGradient(px - 5, 0, px + 5, 0);
    pistonGrad.addColorStop(0, '#64748b');
    pistonGrad.addColorStop(0.35, '#f8fafc');
    pistonGrad.addColorStop(0.7, '#cbd5e1');
    pistonGrad.addColorStop(1, '#475569');
    ctx.fillStyle = pistonGrad;
    ctx.fillRect(px - 5, deckY + 40, 10, 60);

    // Ciężki cylinder hydrauliczny (dolna komora siłownika)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px - 10, deckY + 95, 20, lowerY - (deckY + 95));
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(px - 10, deckY + 95, 20, lowerY - (deckY + 95));

    // Pierścień statusu neonowego cyjanu
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(px - 10, deckY + 115, 20, 3);

    // Dolne mocowanie sworznia siłownika
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px - 12, lowerY - 12, 24, 12);
  }

  // =======================================================================
  // 3. DOLNY POKŁAD KADŁUBA (Y = 740, SOLIDNA PLATFORMA BOJOWA)
  // =======================================================================
  // Twarda bryła nośna dolnego pokładu
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(280, lowerY, 860, 30);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.strokeRect(280, lowerY, 860, 30);

  // Pancerne segmenty górne dolnego pokładu
  ctx.fillStyle = '#1e293b';
  for (let bx = 290; bx < 1130; bx += 110) {
    ctx.fillRect(bx, lowerY + 4, 98, 20);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, lowerY + 4, 98, 20);
  }

  // Neonowa krawędź chodu dolnego pokładu (#00f0ff)
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(280, lowerY);
  ctx.lineTo(1140, lowerY);
  ctx.stroke();

  // Dolny zwężający się pylon stacji (tapered belly hull)
  ctx.fillStyle = '#080d17';
  ctx.beginPath();
  ctx.moveTo(340, lowerY + 30);
  ctx.lineTo(440, lowerY + 90);
  ctx.lineTo(980, lowerY + 90);
  ctx.lineTo(1080, lowerY + 30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dysze manewrowe RCS na spodzie pylonu
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(520, lowerY + 90, 40, 12);
  ctx.fillRect(860, lowerY + 90, 40, 12);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(528, lowerY + 100, 24, 3);
  ctx.fillRect(868, lowerY + 100, 24, 3);

  // =======================================================================
  // 4. MOST FOTOWOLTAICZNY (PRAWA STRONA: X: 1200..1760)
  // =======================================================================
  // A. Płytki paneli słonecznych umieszczone TUŻ POD KŁADKĄ jako tło dekoracyjne
  const solarStartY = deckY + 28;
  const solarHeight = 58;
  ctx.fillStyle = '#061328';
  ctx.fillRect(1220, solarStartY, 520, solarHeight);
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2;
  ctx.strokeRect(1220, solarStartY, 520, solarHeight);

  // Siatka ogniw fotowoltaicznych z mikroskopijnymi szynami busbarów
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 1;
  for (let sx = 1240; sx < 1740; sx += 26) {
    ctx.beginPath();
    ctx.moveTo(sx, solarStartY);
    ctx.lineTo(sx, solarStartY + solarHeight);
    ctx.stroke();
  }
  // Złote linie magistrali fotowoltaicznej
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.65)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(1220, solarStartY + solarHeight * 0.33);
  ctx.lineTo(1740, solarStartY + solarHeight * 0.33);
  ctx.moveTo(1220, solarStartY + solarHeight * 0.66);
  ctx.lineTo(1740, solarStartY + solarHeight * 0.66);
  ctx.stroke();

  // B. Kratownica nośna łącząca most fotowoltaiczny z głównym kadłubem
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(1200, deckY + 24);
  ctx.lineTo(1760, deckY + 24);
  ctx.moveTo(1200, solarStartY + solarHeight + 14);
  ctx.lineTo(1760, solarStartY + solarHeight + 14);
  ctx.stroke();

  // Zastrzały trójkątne kratownicy
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let tx = 1210; tx < 1750; tx += 45) {
    ctx.moveTo(tx, deckY + 24);
    ctx.lineTo(tx + 22, solarStartY + solarHeight + 14);
    ctx.lineTo(tx + 45, deckY + 24);
  }
  ctx.stroke();

  // C. Jednolity ciąg kładki serwisowej na moście (solid platform)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(1200, deckY, 560, 24);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.strokeRect(1200, deckY, 560, 24);

  // Płytki antypoślizgowe na kładce
  ctx.fillStyle = '#1e293b';
  for (let kx = 1215; kx < 1745; kx += 65) {
    ctx.fillRect(kx, deckY + 3, 52, 18);
  }

  // Neonowa krawędź kładki serwisowej (#00f0ff)
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(1200, deckY);
  ctx.lineTo(1760, deckY);
  ctx.stroke();

  // Taśma ostrzegawcza na łączeniu z głównym kadłubem i na prawym krańcu
  drawHazardStripes(ctx, 1200, deckY, 32, 24);
  drawHazardStripes(ctx, 1728, deckY, 32, 24);

  // Podpis kładki
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 9px monospace';
  ctx.fillText('BRIDGE-01 // SOLAR ARRAY SERVICE CATWALK', 1260, deckY + 16);

  // =======================================================================
  // 5. GŁÓWNY KADŁUB STACJI (GÓRNY POKŁAD BOJOWY, Y = 560)
  // =======================================================================
  // A. LEWE SKRZYDŁO STACJI (X: 200..640, SOLIDNA PŁYTA GRAFITOWA)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(200, deckY, 440, 28);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(200, deckY, 440, 28);

  // Pancerne moduły sekcji zachodniej
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(210, deckY + 4, 180, 20);
  ctx.fillRect(410, deckY + 4, 210, 20);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(210, deckY + 4, 180, 20);
  ctx.strokeRect(410, deckY + 4, 210, 20);

  // Neonowa krawędź górna lewego skrzydła (#00f0ff)
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(200, deckY);
  ctx.lineTo(640, deckY);
  ctx.stroke();

  // Żółto-czarna taśma ostrzegawcza na skrajach lewego skrzydła
  drawHazardStripes(ctx, 200, deckY, 35, 28);
  drawHazardStripes(ctx, 605, deckY, 35, 28);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('SEC-W // HULL-01 // DROP ZONE ALPHA', 250, deckY + 18);

  // B. ŚRODKOWY WŁAZ TECHNICZNY (X: 640..860, DROP-THROUGH NA DOLNY POKŁAD)
  ctx.fillStyle = '#0a1224';
  ctx.fillRect(640, deckY, 220, 16);
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2;
  ctx.strokeRect(640, deckY, 220, 16);

  // Ażurowa siatka antypoślizgowa włazu
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 1;
  for (let hx = 648; hx < 852; hx += 12) {
    ctx.beginPath();
    ctx.moveTo(hx, deckY);
    ctx.lineTo(hx + 8, deckY + 16);
    ctx.stroke();
  }

  // Żółto-czarne pasy ostrzegawcze na krawędzi włazu
  drawHazardStripes(ctx, 640, deckY, 24, 16);
  drawHazardStripes(ctx, 836, deckY, 24, 16);

  // Pulsujące bursztynowe diody sygnalizacyjne na włazie
  const hatchPulse = Math.sin(t * 5.0) * 0.35 + 0.65;
  ctx.fillStyle = `rgba(245, 158, 11, ${hatchPulse.toFixed(2)})`;
  ctx.fillRect(644, deckY + 5, 6, 6);
  ctx.fillRect(850, deckY + 5, 6, 6);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 9px monospace';
  ctx.fillText('[HATCH // DROP-THROUGH]', 680, deckY + 12);

  // C. WSCHODNIA SEKCJA GŁÓWNEGO POKŁADU (X: 860..1200, SOLIDNA PŁYTA GRAFITOWA)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(860, deckY, 340, 28);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(860, deckY, 340, 28);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(875, deckY + 4, 140, 20);
  ctx.fillRect(1035, deckY + 4, 150, 20);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(875, deckY + 4, 140, 20);
  ctx.strokeRect(1035, deckY + 4, 150, 20);

  // Neonowa krawędź górna wschodniej sekcji (#00f0ff)
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(860, deckY);
  ctx.lineTo(1200, deckY);
  ctx.stroke();

  // Żółto-czarna taśma ostrzegawcza
  drawHazardStripes(ctx, 860, deckY, 35, 28);
  drawHazardStripes(ctx, 1165, deckY, 35, 28);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('SEC-E // TECHNICAL ACCESS // GRID 02', 885, deckY + 18);

  // =======================================================================
  // 6. ŚCIANY OSŁONOWE NA GÓRNYM POKŁADZIE (Cover Walls)
  // =======================================================================
  for (const w of ARENA_SPACE.coverWalls) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x, w.y, w.w, w.h);

    // Wizjer ze szkła pancernego
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(w.x + 6, w.y + 16, w.w - 12, 14);
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x + 6, w.y + 16, w.w - 12, 14);

    // Paski ostrzegawcze
    ctx.fillStyle = '#eab308';
    ctx.fillRect(w.x + 4, w.y + 36, w.w - 8, 4);
    ctx.fillRect(w.x + 4, w.y + 46, w.w - 8, 4);

    // Maszt stroboskopowy
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w.x + w.w * 0.5, w.y);
    ctx.lineTo(w.x + w.w * 0.5, w.y - 18);
    ctx.stroke();

    const beaconFlash = (Math.floor(t * 3.0) % 2 === 0);
    ctx.fillStyle = beaconFlash ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(w.x + w.w * 0.5, w.y - 18, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // =======================================================================
  // 7. KOMPAKTOWE PIONOWE EMITERY GRAWITACYJNE (REPULSORY, ZERO ROZMYTYCH KÓŁ)
  // =======================================================================
  for (const rep of ARENA_SPACE.repulsors) {
    // Podstawa emitera osadzona w litym pokładzie
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(rep.x, rep.y, rep.w, rep.h);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(rep.x, rep.y, rep.w, rep.h);

    // Wewnętrzna cewka kinetyczna
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(rep.x + 4, rep.y + 4, rep.w - 8, 4);

    // Subtelny pionowy snop kinetyczny (linear gradient w górę o wys. 45px, zero rozmytych kół!)
    const beamGrad = ctx.createLinearGradient(0, rep.y, 0, rep.y - 45);
    beamGrad.addColorStop(0, 'rgba(0, 240, 255, 0.40)');
    beamGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(rep.x + 8, rep.y - 45, rep.w - 16, 45);

    // Animowany pulsujący pojedynczy grot ciągu kinetycznego (▲)
    const phase = (t * 3.5) % 1.0;
    const arrowY = rep.y - 4 - phase * 26;
    ctx.fillStyle = `rgba(0, 240, 255, ${(1.0 - phase).toFixed(2)})`;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('▲', rep.x + rep.w * 0.5, arrowY);
    ctx.textAlign = 'start';
  }

  ctx.restore();
}

/**
 * Pomocnicze rysowanie profesjonalnej żółto-czarnej taśmy ostrzegawczej
 */
function drawHazardStripes(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 4;
  for (let sx = x - h; sx < x + w + h; sx += 14) {
    ctx.beginPath();
    ctx.moveTo(sx, y + h);
    ctx.lineTo(sx + h, y);
    ctx.stroke();
  }
  ctx.restore();
}

// =========================================================================
// 9. GŁÓWNA PĘTLA LOGIKI ARENY (PRÓŻNIA, REPULSORY, JETPACK)
// =========================================================================
export function updateArena4Space(dt, combatants) {
  const safeDt = Math.min(dt || (1 / 60), 0.1);
  arenaSpaceState.animTime += safeDt;

  const targets = Array.isArray(combatants) ? combatants : [];
  const repulsors = ARENA_SPACE.repulsors;
  const deathY = ARENA_SPACE.deathY; // 1050

  for (let i = 0; i < targets.length; i++) {
    const c = targets[i];
    if (!c) continue;

    // Śmierć w próżni następuje WYŁĄCZNIE, gdy postać spadnie bezpowrotnie w dół poza ekran (entity.y > deathY)
    if (!c.isDead && c.y > deathY) {
      killByHazard(c, "PRÓŻNIA KOSMICZNA");
      continue;
    }

    if (c.isDead) continue;

    // Refundacja 40% zużytego paliwa jetpacka w niskiej grawitacji (drain multiplier 0.60)
    if (typeof c.jetFuel === 'number') {
      if (c._aresPrevFuel !== undefined && c.jetFuel < c._aresPrevFuel) {
        const drained = c._aresPrevFuel - c.jetFuel;
        const refund = drained * (1.0 - ARENA_SPACE.jetpackDrainMultiplier);
        c.jetFuel = Math.min(c.jetMax || 100, c.jetFuel + refund);
      }
      c._aresPrevFuel = c.jetFuel;
    }

    // Weryfikacja wejścia w strefę repulsorów kinetycznych (vy = -16)
    const centerX = (c.x || 0) + (c.w || 24) * 0.5;
    const feetY = (c.y || 0) + (c.h || 70);
    for (let r = 0; r < repulsors.length; r++) {
      const rep = repulsors[r];
      if (centerX >= rep.x && centerX <= rep.x + rep.w) {
        if (feetY >= rep.y - 12 && feetY <= rep.y + 24) {
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
// 10. RESET ARENY
// =========================================================================
export function resetArena4Space() {
  arenaSpaceState.animTime = 0;
}

// =========================================================================
// 11. DEFINICJA I EKSPORT WTYCZKI ARENY (ARENA CONTRACT)
// =========================================================================
export const arena4 = {
  id: ARENA_SPACE.id,
  alias: ARENA_SPACE.codeName,
  mapId: 'ares_orbital_station_01',
  name: ARENA_SPACE.name,
  width: ARENA_SPACE.mapWidth,
  height: ARENA_SPACE.mapHeight,
  mainDeckY: ARENA_SPACE.mainDeckY,
  lowerDeckY: ARENA_SPACE.lowerDeckY,
  deathY: ARENA_SPACE.deathY,
  gravityMultiplier: ARENA_SPACE.gravityMultiplier,
  jetpackDrainMultiplier: ARENA_SPACE.jetpackDrainMultiplier,
  spawns: ARENA_SPACE.SPAWN_POINTS,
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
