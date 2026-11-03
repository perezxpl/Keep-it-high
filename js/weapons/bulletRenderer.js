// =========================================================================
// WEAPONS/BULLETRENDERER.JS - FILMOWY SYSTEM BALISTYKI I RENDEROWANIA POCISKÓW
// Ostre igły naddźwiękowe (Sharp Supersonic Tracers), fizyczne dziury po kulach
// (Bullet Hole Decals z mikropęknięciami), szybkie iskry rykoszetowe i fale Macha.
// Całkowity brak rozmytego bluru na ścianach.
// =========================================================================

import { drawBulletCasings } from '../particles.js';
import { camera, getCanvasLogicalWidth, getCanvasLogicalHeight, triggerScreenShake } from '../camera.js';
import { bullets, bulletParticles } from './transform.js';

/**
 * Profile balistyczne i wizualne dla poszczególnych rodzajów broni
 * Ostre, wąskie smugi igłowe o wysokiej prędkości naddźwiękowej.
 */
export const BALLISTIC_PROFILES = {
  AK47: {
    name: 'AK-47 (7.62x39mm)',
    tracerLengthMult: 0.95,
    glowWidth: 2.4,
    glowColor: 'rgba(245, 158, 11, 0.22)',
    bodyWidth: 1.5,
    bodyGradient: ['#f59e0b', '#dc2626'],
    coreWidth: 0.9,
    coreColor: '#ffffff',
    tipRadius: 1.1,
    tipColor: '#ffffff',
    holeRadius: 2.5,
    smokeChance: 0.20,
    smokeColor: 'rgba(203, 213, 225, ',
    impactSparks: 6
  },
  SHOTGUN: {
    name: 'SPAS-12 (12 Gauge Buckshot)',
    tracerLengthMult: 0.55,
    glowWidth: 1.8,
    glowColor: 'rgba(249, 115, 22, 0.25)',
    bodyWidth: 1.2,
    bodyGradient: ['#ea580c', '#991b1b'],
    coreWidth: 0.7,
    coreColor: '#ffedd5',
    tipRadius: 0.9,
    tipColor: '#fff7ed',
    holeRadius: 1.6,
    smokeChance: 0.12,
    smokeColor: 'rgba(156, 163, 175, ',
    sparkChance: 0.08,
    impactSparks: 4
  },
  SAWED_OFF: {
    name: 'Sawed-Off (12G Double Barrel)',
    tracerLengthMult: 0.50,
    glowWidth: 2.0,
    glowColor: 'rgba(239, 68, 68, 0.28)',
    bodyWidth: 1.3,
    bodyGradient: ['#f97316', '#7f1d1d'],
    coreWidth: 0.8,
    coreColor: '#fed7aa',
    tipRadius: 1.0,
    tipColor: '#ffffff',
    holeRadius: 1.8,
    smokeChance: 0.15,
    smokeColor: 'rgba(148, 163, 184, ',
    sparkChance: 0.10,
    impactSparks: 4
  },
  REVOLVER: {
    name: 'Magnum .44 Hand Cannon',
    tracerLengthMult: 1.15,
    glowWidth: 2.8,
    glowColor: 'rgba(251, 191, 36, 0.30)',
    bodyWidth: 1.8,
    bodyGradient: ['#f59e0b', '#b45309'],
    coreWidth: 1.0,
    coreColor: '#ffffff',
    tipRadius: 1.4,
    tipColor: '#ffffff',
    holeRadius: 3.2,
    shockwaveRing: true,
    smokeChance: 0.35,
    smokeColor: 'rgba(226, 232, 240, ',
    impactSparks: 9,
    impactShake: 1.6
  },
  GLOCK: {
    name: 'Glock 17 (9x19mm Parabellum)',
    tracerLengthMult: 0.70,
    glowWidth: 1.8,
    glowColor: 'rgba(250, 204, 21, 0.22)',
    bodyWidth: 1.2,
    bodyGradient: ['#facc15', '#f97316'],
    coreWidth: 0.7,
    coreColor: '#fef9c3',
    tipRadius: 0.9,
    tipColor: '#ffffff',
    holeRadius: 1.9,
    smokeChance: 0.15,
    smokeColor: 'rgba(203, 213, 225, ',
    impactSparks: 4
  },
  SNIPER: {
    name: 'Barrett .50 BMG Anti-Material',
    tracerLengthMult: 1.65,
    glowWidth: 3.6,
    glowColor: 'rgba(56, 189, 248, 0.30)',
    midWidth: 1.8,
    midGradient: ['#38bdf8', '#0284c7'],
    coreWidth: 1.0,
    coreColor: '#ffffff',
    tipRadius: 1.6,
    tipColor: '#ffffff',
    holeRadius: 4.2,
    machCavitation: true,
    smokeChance: 0.45,
    smokeColor: 'rgba(224, 242, 254, ',
    impactSparks: 14,
    impactShake: 2.8
  }
};

const DEFAULT_PROFILE = BALLISTIC_PROFILES.AK47;

// Pula fizycznych przestrzelin / kraterów na ścianach (Bullet Hole Decals)
export const bulletHoles = [];
export const MAX_BULLET_HOLES = 100;

// Pule cząstek w locie (Tracer Smoke & Mach Condensation Rings)
const machRings = [];
const tracerVaporPuffs = [];
const MAX_MACH_RINGS = 35;
const MAX_VAPOR_PUFFS = 50;

/**
 * Zwraca konfigurację balistyczną dla danego identyfikatora broni
 */
export function getBallisticProfile(weaponId) {
  if (!weaponId) return DEFAULT_PROFILE;
  const key = String(weaponId).toUpperCase();
  return BALLISTIC_PROFILES[key] || DEFAULT_PROFILE;
}

/**
 * Dodaje fizyczną dziurę po kuli na ścianie lub platformie z mikropęknięciami
 */
export function addBulletHole(x, y, nx = 0, ny = -1, weaponId = 'AK47') {
  const prof = getBallisticProfile(weaponId);
  const baseRadius = prof.holeRadius || 2.4;
  const radius = baseRadius * (0.85 + Math.random() * 0.3);

  if (bulletHoles.length >= MAX_BULLET_HOLES) {
    bulletHoles.shift();
  }

  // Generuj 3-5 mikropęknięć tynku / betonu wokół otworu wlotowego
  const crackCount = Math.floor(Math.random() * 3) + 3;
  const cracks = [];
  for (let i = 0; i < crackCount; i++) {
    const a = (Math.PI * 2 * i / crackCount) + (Math.random() - 0.5) * 0.55;
    cracks.push({
      angle: a,
      len: (Math.random() * 3.5 + 2.0) * (baseRadius / 2.0),
      bendAngle: a + (Math.random() - 0.5) * 0.7,
      bendLen: Math.random() * 2.2 + 1.0
    });
  }

  bulletHoles.push({
    x,
    y,
    nx,
    ny,
    radius,
    cracks,
    life: 720,      // 12 sekund pełnej widoczności przy 60 fps
    maxLife: 720,
    fadeTime: 90,   // 1.5 sekundy płynnego wygaszania
    alpha: 1.0
  });
}

/**
 * Aktualizacja efektów wizualnych pocisków w locie i na ścianach (co klatkę)
 */
export function updateBulletVisuals(bulletsList, dt = 1 / 60) {
  const activeBullets = bulletsList || bullets;

  // 1. Generowanie mikro-efektów w locie dla aktywnych pocisków
  for (let i = 0; i < activeBullets.length; i++) {
    const b = activeBullets[i];
    if (!b || b.life <= 0) continue;

    const prof = getBallisticProfile(b.weaponId);
    const spd = Math.hypot(b.vx, b.vy);
    if (spd < 1.0) continue;

    // A. Ostre pierścienie fali uderzeniowej Macha (Mach Cavitation Rings)
    if (prof.machCavitation || prof.shockwaveRing) {
      b.machDistTraveled = (b.machDistTraveled || 0) + spd;
      const ringInterval = prof.machCavitation ? 45 : 60;

      if (b.machDistTraveled >= ringInterval) {
        b.machDistTraveled = 0;
        if (machRings.length >= MAX_MACH_RINGS) {
          machRings.shift();
        }
        machRings.push({
          x: b.x,
          y: b.y,
          angle: Math.atan2(b.vy, b.vx),
          radius: prof.machCavitation ? 2.5 : 2.0,
          maxRadius: prof.machCavitation ? 16.0 : 12.0,
          growthRate: prof.machCavitation ? 75.0 : 55.0,
          alpha: 0.75,
          life: 1.0,
          decay: prof.machCavitation ? 5.5 : 6.5,
          color: prof.machCavitation ? 'rgba(56, 189, 248, ' : 'rgba(251, 191, 36, '
        });
      }
    }

    // B. Subtelne, wąskie mikro-smugi dymu smugowego
    if (prof.smokeChance && Math.random() < prof.smokeChance) {
      if (tracerVaporPuffs.length >= MAX_VAPOR_PUFFS) {
        tracerVaporPuffs.shift();
      }
      const dirX = b.vx / spd;
      const dirY = b.vy / spd;
      const puffX = b.x - dirX * (Math.random() * 6 + 3);
      const puffY = b.y - dirY * (Math.random() * 6 + 3);

      tracerVaporPuffs.push({
        x: puffX,
        y: puffY,
        vx: (Math.random() - 0.5) * 0.3 - dirX * 0.15,
        vy: (Math.random() - 0.5) * 0.3 - 0.25,
        radius: Math.random() * 1.2 + 0.8,
        maxRadius: Math.random() * 3.0 + 2.2,
        growthRate: 10.0,
        alpha: 0.30,
        life: 1.0,
        decay: 6.5,
        colorPrefix: prof.smokeColor
      });
    }

    // C. Drobne żarzące się odpryski prochu (dla strzelb)
    if (prof.sparkChance && Math.random() < prof.sparkChance) {
      if (bulletParticles.length < 120) {
        const spreadAngle = Math.atan2(b.vy, b.vx) + (Math.random() - 0.5) * 0.7;
        const sparkSpd = Math.random() * 2.5 + 1.0;
        bulletParticles.push({
          prevX: b.x,
          prevY: b.y,
          x: b.x,
          y: b.y,
          vx: Math.cos(spreadAngle) * sparkSpd,
          vy: Math.sin(spreadAngle) * sparkSpd,
          size: Math.random() * 1.2 + 0.8,
          color: Math.random() < 0.6 ? '#f97316' : '#ef4444',
          life: 0.4 + Math.random() * 0.25,
          maxLife: 0.65,
          gravity: 0.20,
          friction: 0.93,
          decay: 0.08
        });
      }
    }
  }

  // 2. Aktualizacja pierścieni fali Macha
  for (let i = machRings.length - 1; i >= 0; i--) {
    const ring = machRings[i];
    ring.radius += ring.growthRate * dt;
    ring.life -= ring.decay * dt;
    ring.alpha = Math.max(0, ring.life * 0.75);
    if (ring.life <= 0 || ring.radius >= ring.maxRadius) {
      machRings.splice(i, 1);
    }
  }

  // 3. Aktualizacja mikro-dymu
  for (let i = tracerVaporPuffs.length - 1; i >= 0; i--) {
    const p = tracerVaporPuffs[i];
    p.x += p.vx;
    p.y += p.vy;
    p.radius += p.growthRate * dt;
    p.life -= p.decay * dt;
    p.alpha = Math.max(0, p.life * 0.30);
    if (p.life <= 0 || p.radius >= p.maxRadius) {
      tracerVaporPuffs.splice(i, 1);
    }
  }

  // 4. Aktualizacja dziur po kulach (wygaszanie najstarszych)
  for (let i = bulletHoles.length - 1; i >= 0; i--) {
    const h = bulletHoles[i];
    h.life--;
    if (h.life <= h.fadeTime) {
      h.alpha = Math.max(0, h.life / h.fadeTime);
    }
    if (h.life <= 0) {
      bulletHoles.splice(i, 1);
    }
  }
}

/**
 * Spawnuje fizyczne uderzenie pocisku: ostra dziura po kuli + szybkie iskry rykoszetowe
 * ZERO rozmytego światła ani plam bluru na ścianach!
 */
export function spawnImpactVisuals(hitX, hitY, nx = 0, ny = -1, weaponId = 'AK47') {
  const prof = getBallisticProfile(weaponId);

  // 1. Fizyczna, ostra dziura po kuli (Bullet Hole Decal)
  addBulletHole(hitX, hitY, nx, ny, weaponId);

  // 2. Szybkie, ostre iskry rykoszetowe (Motion-stretched Sparks) odbijające się od powierzchni
  const sparkCount = prof.impactSparks || 5;
  const baseAngle = Math.atan2(ny, nx);

  if (bulletParticles.length > 120) {
    bulletParticles.splice(0, bulletParticles.length - 110);
  }

  for (let i = 0; i < sparkCount; i++) {
    const spread = (Math.random() - 0.5) * (Math.PI * 0.65);
    const angle = baseAngle + spread;
    const speed = Math.random() * 6.2 + 2.8;
    const initialLife = 0.35 + Math.random() * 0.25; // Szybkie wygasanie ~0.3s

    bulletParticles.push({
      prevX: hitX,
      prevY: hitY,
      x: hitX,
      y: hitY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 1.6 + 1.0,
      color: Math.random() < 0.65 ? '#facc15' : (Math.random() < 0.85 ? '#fb923c' : '#ffffff'),
      life: initialLife,
      maxLife: initialLife,
      gravity: 0.26,
      friction: 0.92,
      decay: 0.065
    });
  }

  // 3. Wstrząs ekranu dla potężnych kalibrów (Magnum, Snajperka)
  if (prof.impactShake) {
    triggerScreenShake(prof.impactShake);
  }
}

/**
 * Rysuje fizyczne dziury po kulach (Bullet Holes) na ścianach i przeszkodach
 */
function drawBulletHoles(ctx, minX, maxX, minY, maxY) {
  if (bulletHoles.length === 0) return;

  for (let i = 0; i < bulletHoles.length; i++) {
    const h = bulletHoles[i];
    if (h.x < minX || h.x > maxX || h.y < minY || h.y > maxY) continue;
    if (h.alpha <= 0.02) continue;

    ctx.save();
    ctx.globalAlpha = h.alpha;

    // 1. Ciemna obwódka osmolenia prochem (powder burn)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.40)';
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.radius * 1.55, 0, Math.PI * 2);
    ctx.fill();

    // 2. Ostre mikropęknięcia tynku / betonu wokół krateru
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    for (let c = 0; c < h.cracks.length; c++) {
      const cr = h.cracks[c];
      const startX = h.x + Math.cos(cr.angle) * (h.radius * 0.85);
      const startY = h.y + Math.sin(cr.angle) * (h.radius * 0.85);
      const midX = h.x + Math.cos(cr.angle) * (h.radius + cr.len);
      const midY = h.y + Math.sin(cr.angle) * (h.radius + cr.len);
      ctx.moveTo(startX, startY);
      ctx.lineTo(midX, midY);
      ctx.lineTo(midX + Math.cos(cr.bendAngle) * cr.bendLen, midY + Math.sin(cr.bendAngle) * cr.bendLen);
    }
    ctx.stroke();

    // 3. Wyszczerbiony brzeg wlotu (chipped concrete / metal rim)
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.radius * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // 4. Głęboki, smoliście czarny otwór wlotowy (deep penetration core)
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
    ctx.fill();

    // 5. Wewnętrzny cień przestrzeliny
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(h.x - h.nx * 0.35, h.y - h.ny * 0.35, h.radius * 0.65, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Rysuje pierścienie fali naddźwiękowej Macha (Mach Cavitation Rings)
 */
function drawMachRings(ctx, minX, maxX, minY, maxY) {
  if (machRings.length === 0) return;

  for (let i = 0; i < machRings.length; i++) {
    const ring = machRings[i];
    if (ring.x < minX || ring.x > maxX || ring.y < minY || ring.y > maxY) continue;
    if (ring.alpha <= 0.02) continue;

    ctx.save();
    ctx.translate(ring.x, ring.y);
    ctx.rotate(ring.angle);

    ctx.beginPath();
    ctx.ellipse(0, 0, ring.radius * 0.30, ring.radius, 0, 0, Math.PI * 2);
    ctx.strokeStyle = ring.color + ring.alpha.toFixed(3) + ')';
    ctx.lineWidth = Math.max(0.7, 1.2 * (ring.alpha / 0.75));
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Rysuje mikro-dym wzdłuż trajektorii pocisków smugowych
 */
function drawTracerSmoke(ctx, minX, maxX, minY, maxY) {
  if (tracerVaporPuffs.length === 0) return;

  for (let i = 0; i < tracerVaporPuffs.length; i++) {
    const p = tracerVaporPuffs[i];
    if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) continue;
    if (p.alpha <= 0.02) continue;

    ctx.fillStyle = p.colorPrefix + p.alpha.toFixed(3) + ')';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Rysuje ostre iskry rykoszetowe z rozciąganiem wzdłuż wektora ruchu
 */
function drawBulletSparks(ctx, minX, maxX, minY, maxY) {
  if (bulletParticles.length === 0) return;

  for (let i = 0; i < bulletParticles.length; i++) {
    const p = bulletParticles[i];
    if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) continue;

    const progress = Math.max(0, Math.min(1, p.life / (p.maxLife || 1.0)));
    if (progress <= 0.02) continue;

    const spd = Math.hypot(p.vx, p.vy);

    ctx.save();
    ctx.globalAlpha = progress;

    if (spd > 0.8) {
      // Ostra aerodynamiczna igła iskry kierunkowej
      const dirX = p.vx / spd;
      const dirY = p.vy / spd;
      const streakLen = Math.min(12, spd * 1.35);
      const tailX = p.x - dirX * streakLen;
      const tailY = p.y - dirY * streakLen;

      // 1. Zewnętrzna barwna smuga iskry
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(0.8, (p.size || 1.3) * progress);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      // 2. Oślepiająco biały wierzchołek iskry dla wysokiej energii
      if (progress > 0.35 && p.color !== '#94a3b8' && p.color !== '#64748b') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(0.5, (p.size || 1.3) * 0.5 * progress);
        ctx.beginPath();
        ctx.moveTo(p.x - dirX * Math.min(streakLen * 0.45, 2.8), p.y - dirY * Math.min(streakLen * 0.45, 2.8));
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    } else {
      // Drobny dogasający punkt
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.6, (p.size || 1.2) * 0.55 * progress), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

/**
 * Główna procedura renderowania pocisków, przestrzelin i efektów balistycznych
 */
export function drawBullets(ctx) {
  if (!ctx) return;

  // 1. Wyrzucone łuski broni
  drawBulletCasings(ctx);

  const camW = typeof getCanvasLogicalWidth === 'function' ? getCanvasLogicalWidth() : 1920;
  const camH = typeof getCanvasLogicalHeight === 'function' ? getCanvasLogicalHeight() : 1080;
  const zoom = camera && camera.zoom ? camera.zoom : 1;
  const viewW = camera.viewWidth || (camW / zoom);
  const viewH = camera.viewHeight || (camH / zoom);
  const margin = 80;
  const minX = camera.x - margin;
  const maxX = camera.x + viewW + margin;
  const minY = camera.y - margin;
  const maxY = camera.y + viewH + margin;

  // 2. Fizyczne przestrzeliny na ścianach (Bullet Holes / Decals)
  drawBulletHoles(ctx, minX, maxX, minY, maxY);

  // 3. Pierścienie fali Macha i mikro-dym
  drawMachRings(ctx, minX, maxX, minY, maxY);
  drawTracerSmoke(ctx, minX, maxX, minY, maxY);

  // 4. Ostre iskry rykoszetowe (Motion-stretched Sparks)
  drawBulletSparks(ctx, minX, maxX, minY, maxY);

  // 5. Rysowanie wąskich, naddźwiękowych smug igłowych
  const activeBullets = bullets;
  if (!activeBullets || activeBullets.length === 0) return;

  ctx.save();

  for (let i = 0; i < activeBullets.length; i++) {
    const b = activeBullets[i];
    if (b.x < minX || b.x > maxX || b.y < minY || b.y > maxY) continue;

    const spd = Math.hypot(b.vx, b.vy);
    if (spd < 0.1) continue;

    const dirX = b.vx / spd;
    const dirY = b.vy / spd;
    const isSniper = b.isSniper || b.weaponId === 'SNIPER';
    const prof = getBallisticProfile(b.weaponId);

    const tracerLen = Math.max(12, spd * (prof.tracerLengthMult || 0.85));
    const tailX = b.x - dirX * tracerLen;
    const tailY = b.y - dirY * tracerLen;

    if (isSniper) {
      // =====================================================================
      // POCISK SNAJPERSKI BARRETT .50 - PRECYZYJNA BŁĘKITNO-BIAŁA IGŁA
      // =====================================================================

      // Warstwa 1: Wąska, ostra poświata jonizacji
      ctx.strokeStyle = prof.glowColor || 'rgba(56, 189, 248, 0.30)';
      ctx.lineWidth = prof.glowWidth || 3.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Warstwa 2: Środkowa smuga gradientowa od kobaltu do cyjanu
      const midGrad = ctx.createLinearGradient(tailX, tailY, b.x, b.y);
      midGrad.addColorStop(0.0, 'rgba(2, 132, 199, 0.15)');
      midGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.85)');
      midGrad.addColorStop(1.0, '#38bdf8');

      ctx.strokeStyle = midGrad;
      ctx.lineWidth = prof.midWidth || 1.8;
      ctx.beginPath();
      ctx.moveTo(tailX + dirX * (tracerLen * 0.25), tailY + dirY * (tracerLen * 0.25));
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Warstwa 3: Niezwykle cienki, oślepiająco biały rdzeń
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = prof.coreWidth || 1.0;
      ctx.beginPath();
      ctx.moveTo(tailX + dirX * (tracerLen * 0.55), tailY + dirY * (tracerLen * 0.55));
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Warstwa 4: Precyzyjny czubek pocisku
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, prof.tipRadius || 1.6, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // =====================================================================
      // BRONIE STANDARDOWE (AK-47, SHOTGUN, REVOLVER, GLOCK, SAWED-OFF)
      // =====================================================================

      // Warstwa 1: Dyskretna, wąska poświata aerodynamiczna
      const glowGrad = ctx.createLinearGradient(tailX, tailY, b.x, b.y);
      glowGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
      glowGrad.addColorStop(0.6, prof.glowColor || 'rgba(245, 158, 11, 0.12)');
      glowGrad.addColorStop(1.0, prof.glowColor || 'rgba(245, 158, 11, 0.25)');

      ctx.strokeStyle = glowGrad;
      ctx.lineWidth = prof.glowWidth || 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Warstwa 2: Zwężające się ciało igły (gradient pirotechniczny)
      const bodyGrad = ctx.createLinearGradient(tailX, tailY, b.x, b.y);
      bodyGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
      bodyGrad.addColorStop(0.4, prof.bodyGradient[1] || '#dc2626');
      bodyGrad.addColorStop(1.0, prof.bodyGradient[0] || '#f59e0b');

      ctx.strokeStyle = bodyGrad;
      ctx.lineWidth = prof.bodyWidth || 1.4;
      ctx.beginPath();
      ctx.moveTo(tailX + dirX * (tracerLen * 0.20), tailY + dirY * (tracerLen * 0.20));
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Warstwa 3: Ostry biały rdzeń wierzchołka (White-Hot Core)
      const coreStartX = tailX + dirX * (tracerLen * 0.65);
      const coreStartY = tailY + dirY * (tracerLen * 0.65);

      ctx.strokeStyle = prof.coreColor || '#ffffff';
      ctx.lineWidth = prof.coreWidth || 0.85;
      ctx.beginPath();
      ctx.moveTo(coreStartX, coreStartY);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Warstwa 4: Punktowy wierzchołek
      ctx.fillStyle = prof.tipColor || '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, prof.tipRadius || 1.0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
