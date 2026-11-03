// =========================================================================
// WEAPONS/BULLETRENDERER.JS - FILMOWY SYSTEM BALISTYKI I RENDEROWANIA POCISKÓW
// Wielowarstwowe smugi naddźwiękowe (Multi-layer Photonic Tracers),
// pierścienie kawitacji Macha, mikro-dym smugowy i iskry z rozciąganiem prędkości.
// =========================================================================

import { drawBulletCasings } from '../particles.js';
import { camera, getCanvasLogicalWidth, getCanvasLogicalHeight, triggerScreenShake } from '../camera.js';
import { bullets, bulletParticles } from './transform.js';
import { addDynamicLight } from '../lighting/index.js';

/**
 * Profile balistyczne i wizualne dla poszczególnych rodzajów broni
 */
export const BALLISTIC_PROFILES = {
  AK47: {
    name: 'AK-47 (7.62x39mm)',
    tracerLengthMult: 0.95,
    glowWidth: 4.8,
    glowColor: 'rgba(245, 158, 11, 0.35)',
    glowAlpha: 0.35,
    bodyWidth: 2.4,
    bodyGradient: ['#f59e0b', '#dc2626'],
    coreWidth: 1.2,
    coreColor: '#fffbeb',
    tipRadius: 1.8,
    tipColor: '#ffffff',
    smokeChance: 0.35,
    smokeColor: 'rgba(203, 213, 225, ',
    impactSparks: 6,
    impactLight: { radius: 48, color: '#fbbf24', duration: 4, intensity: 0.75 }
  },
  SHOTGUN: {
    name: 'SPAS-12 (12 Gauge Buckshot)',
    tracerLengthMult: 0.60,
    glowWidth: 3.6,
    glowColor: 'rgba(249, 115, 22, 0.40)',
    glowAlpha: 0.40,
    bodyWidth: 1.8,
    bodyGradient: ['#ea580c', '#991b1b'],
    coreWidth: 0.9,
    coreColor: '#ffedd5',
    tipRadius: 1.3,
    tipColor: '#fff7ed',
    smokeChance: 0.15,
    smokeColor: 'rgba(156, 163, 175, ',
    sparkChance: 0.10,
    impactSparks: 4,
    impactLight: { radius: 38, color: '#fb923c', duration: 3, intensity: 0.60 }
  },
  SAWED_OFF: {
    name: 'Sawed-Off (12G Double Barrel)',
    tracerLengthMult: 0.55,
    glowWidth: 3.8,
    glowColor: 'rgba(239, 68, 68, 0.45)',
    glowAlpha: 0.45,
    bodyWidth: 2.0,
    bodyGradient: ['#f97316', '#7f1d1d'],
    coreWidth: 1.0,
    coreColor: '#fed7aa',
    tipRadius: 1.4,
    tipColor: '#ffffff',
    smokeChance: 0.20,
    smokeColor: 'rgba(148, 163, 184, ',
    sparkChance: 0.14,
    impactSparks: 5,
    impactLight: { radius: 42, color: '#ea580c', duration: 4, intensity: 0.65 }
  },
  REVOLVER: {
    name: 'Magnum .44 Hand Cannon',
    tracerLengthMult: 1.25,
    glowWidth: 7.2,
    glowColor: 'rgba(251, 191, 36, 0.48)',
    glowAlpha: 0.48,
    bodyWidth: 3.4,
    bodyGradient: ['#f59e0b', '#b45309'],
    coreWidth: 1.6,
    coreColor: '#ffffff',
    tipRadius: 2.4,
    tipColor: '#ffffff',
    shockwaveRing: true,
    smokeChance: 0.45,
    smokeColor: 'rgba(226, 232, 240, ',
    impactSparks: 10,
    impactShake: 1.8,
    impactLight: { radius: 64, color: '#f59e0b', duration: 5, intensity: 0.95 }
  },
  GLOCK: {
    name: 'Glock 17 (9x19mm Parabellum)',
    tracerLengthMult: 0.75,
    glowWidth: 3.8,
    glowColor: 'rgba(250, 204, 21, 0.35)',
    glowAlpha: 0.35,
    bodyWidth: 1.9,
    bodyGradient: ['#facc15', '#f97316'],
    coreWidth: 1.0,
    coreColor: '#fef9c3',
    tipRadius: 1.4,
    tipColor: '#ffffff',
    smokeChance: 0.20,
    smokeColor: 'rgba(203, 213, 225, ',
    impactSparks: 4,
    impactLight: { radius: 36, color: '#facc15', duration: 3, intensity: 0.55 }
  },
  SNIPER: {
    name: 'Barrett .50 BMG Anti-Material',
    tracerLengthMult: 1.75,
    glowWidth: 9.0,
    glowColor: 'rgba(56, 189, 248, 0.45)',
    glowAlpha: 0.45,
    midWidth: 3.6,
    midGradient: ['#38bdf8', '#0284c7'],
    coreWidth: 1.6,
    coreColor: '#ffffff',
    tipRadius: 2.8,
    tipColor: '#ffffff',
    machCavitation: true,
    smokeChance: 0.65,
    smokeColor: 'rgba(224, 242, 254, ',
    impactSparks: 15,
    impactShake: 3.2,
    impactLight: { radius: 76, color: '#93c5fd', duration: 6, intensity: 1.10 }
  }
};

const DEFAULT_PROFILE = BALLISTIC_PROFILES.AK47;

// Pule cząstek w locie (Tracer Smoke & Mach Condensation Rings)
const machRings = [];
const tracerVaporPuffs = [];
const MAX_MACH_RINGS = 35;
const MAX_VAPOR_PUFFS = 65;

/**
 * Zwraca konfigurację balistyczną dla danego identyfikatora broni
 */
export function getBallisticProfile(weaponId) {
  if (!weaponId) return DEFAULT_PROFILE;
  const key = String(weaponId).toUpperCase();
  return BALLISTIC_PROFILES[key] || DEFAULT_PROFILE;
}

/**
 * Aktualizacja efektów wizualnych pocisków w locie (dzwoniona co klatkę)
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

    // A. Pierścienie fali uderzeniowej Macha (Mach Cavitation Rings) dla kalibru .50 i .44
    if (prof.machCavitation || prof.shockwaveRing) {
      b.machDistTraveled = (b.machDistTraveled || 0) + spd;
      const ringInterval = prof.machCavitation ? 42 : 55;

      if (b.machDistTraveled >= ringInterval) {
        b.machDistTraveled = 0;
        if (machRings.length >= MAX_MACH_RINGS) {
          machRings.shift();
        }
        machRings.push({
          x: b.x,
          y: b.y,
          angle: Math.atan2(b.vy, b.vx),
          radius: prof.machCavitation ? 3.0 : 2.5,
          maxRadius: prof.machCavitation ? 20.0 : 14.0,
          growthRate: prof.machCavitation ? 75.0 : 55.0,
          alpha: 0.85,
          life: 1.0,
          decay: prof.machCavitation ? 4.8 : 5.8,
          color: prof.machCavitation ? 'rgba(56, 189, 248, ' : 'rgba(251, 191, 36, '
        });
      }
    }

    // B. Mikro-smugi dymu smugowego (Tracer Smoke Filament)
    if (prof.smokeChance && Math.random() < prof.smokeChance) {
      if (tracerVaporPuffs.length >= MAX_VAPOR_PUFFS) {
        tracerVaporPuffs.shift();
      }
      const dirX = b.vx / spd;
      const dirY = b.vy / spd;
      const puffX = b.x - dirX * (Math.random() * 8 + 4);
      const puffY = b.y - dirY * (Math.random() * 8 + 4);

      tracerVaporPuffs.push({
        x: puffX,
        y: puffY,
        vx: (Math.random() - 0.5) * 0.4 - dirX * 0.2,
        vy: (Math.random() - 0.5) * 0.4 - 0.35,
        radius: Math.random() * 1.5 + 1.2,
        maxRadius: Math.random() * 4.5 + 3.5,
        growthRate: 14.0,
        alpha: 0.38,
        life: 1.0,
        decay: 5.5,
        colorPrefix: prof.smokeColor
      });
    }

    // C. Drobne żarzące się odpryski prochu (dla strzelb)
    if (prof.sparkChance && Math.random() < prof.sparkChance) {
      if (bulletParticles.length < 120) {
        const spreadAngle = Math.atan2(b.vy, b.vx) + (Math.random() - 0.5) * 0.8;
        const sparkSpd = Math.random() * 2.5 + 0.8;
        bulletParticles.push({
          prevX: b.x,
          prevY: b.y,
          x: b.x,
          y: b.y,
          vx: Math.cos(spreadAngle) * sparkSpd,
          vy: Math.sin(spreadAngle) * sparkSpd,
          size: Math.random() * 1.4 + 0.8,
          color: Math.random() < 0.6 ? '#f97316' : '#ef4444',
          life: 0.5 + Math.random() * 0.3,
          maxLife: 0.8,
          gravity: 0.15,
          friction: 0.94,
          decay: 0.075
        });
      }
    }
  }

  // 2. Aktualizacja pierścieni fali Macha
  for (let i = machRings.length - 1; i >= 0; i--) {
    const ring = machRings[i];
    ring.radius += ring.growthRate * dt;
    ring.life -= ring.decay * dt;
    ring.alpha = Math.max(0, ring.life * 0.85);
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
    p.alpha = Math.max(0, p.life * 0.38);
    if (p.life <= 0 || p.radius >= p.maxRadius) {
      tracerVaporPuffs.splice(i, 1);
    }
  }
}

/**
 * Spawnuje bogaty, dynamiczny pakiet trafienia pocisku w przeszkodę (Sparks + Light + Shake)
 */
export function spawnImpactVisuals(hitX, hitY, nx = 0, ny = -1, weaponId = 'AK47') {
  const prof = getBallisticProfile(weaponId);

  // 1. Aerodynamiczne iskry z rozciąganiem prędkości (Motion-stretched Sparks)
  const sparkCount = prof.impactSparks || 5;
  const baseAngle = Math.atan2(ny, nx);

  if (bulletParticles.length > 120) {
    bulletParticles.splice(0, bulletParticles.length - 110);
  }

  for (let i = 0; i < sparkCount; i++) {
    const spread = (Math.random() - 0.5) * (Math.PI * 0.75);
    const angle = baseAngle + spread;
    const speed = Math.random() * 5.2 + 2.0;
    const initialLife = 0.75 + Math.random() * 0.5;

    bulletParticles.push({
      prevX: hitX,
      prevY: hitY,
      x: hitX,
      y: hitY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 2.2 + 1.2,
      color: Math.random() < 0.65 ? '#facc15' : (Math.random() < 0.85 ? '#fb923c' : '#ffffff'),
      life: initialLife,
      maxLife: initialLife,
      gravity: 0.24,
      friction: 0.93,
      decay: 0.045
    });
  }

  // 2. Drobny pył uderzeniowy / odłamki betonu
  const debrisCount = Math.min(4, Math.floor(sparkCount * 0.4));
  for (let i = 0; i < debrisCount; i++) {
    const spread = (Math.random() - 0.5) * (Math.PI * 0.6);
    const angle = baseAngle + spread;
    const speed = Math.random() * 2.8 + 1.2;
    const initialLife = 0.5 + Math.random() * 0.35;

    bulletParticles.push({
      prevX: hitX,
      prevY: hitY,
      x: hitX,
      y: hitY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 2.4 + 1.4,
      color: Math.random() < 0.5 ? '#94a3b8' : '#64748b',
      life: initialLife,
      maxLife: initialLife,
      gravity: 0.28,
      friction: 0.91,
      decay: 0.055
    });
  }

  // 3. Dynamiczny rozbłysk światła w punkcie trafienia
  if (prof.impactLight) {
    addDynamicLight({
      x: hitX,
      y: hitY,
      radius: prof.impactLight.radius,
      color: prof.impactLight.color,
      duration: prof.impactLight.duration,
      intensity: prof.impactLight.intensity
    });
  }

  // 4. Wstrząs ekranu dla potężnych kalibrów
  if (prof.impactShake) {
    triggerScreenShake(prof.impactShake);
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
    // Spłaszczona elipsa prostopadła do wektora lotu pocisku
    ctx.ellipse(0, 0, ring.radius * 0.32, ring.radius, 0, 0, Math.PI * 2);
    ctx.strokeStyle = ring.color + ring.alpha.toFixed(3) + ')';
    ctx.lineWidth = Math.max(0.8, 1.6 * (ring.alpha / 0.85));
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
 * Rysuje iskry i odłamki z rozciąganiem wzdłuż wektora ruchu (Motion-Stretched Sparks)
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

    if (spd > 0.9) {
      // Rozciągnięta aerodynamiczna iskra kierunkowa (Motion Stretch)
      const dirX = p.vx / spd;
      const dirY = p.vy / spd;
      const streakLen = Math.min(14, spd * 1.55);
      const tailX = p.x - dirX * streakLen;
      const tailY = p.y - dirY * streakLen;

      // 1. Zewnętrzna barwna smuga iskry
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1.0, (p.size || 1.5) * progress);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      // 2. Oślepiająco biały wierzchołek iskry dla wysokiej energii
      if (progress > 0.4 && p.color !== '#94a3b8' && p.color !== '#64748b') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(0.6, (p.size || 1.5) * 0.55 * progress);
        ctx.beginPath();
        ctx.moveTo(p.x - dirX * Math.min(streakLen * 0.5, 3.5), p.y - dirY * Math.min(streakLen * 0.5, 3.5));
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    } else {
      // Dogasający żarzący się punkt
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.8, (p.size || 1.4) * 0.65 * progress), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

/**
 * Główna procedura renderowania wielowarstwowych pocisków i smug balistycznych
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

  // 2. Pierścienie fali Macha i mikro-dym
  drawMachRings(ctx, minX, maxX, minY, maxY);
  drawTracerSmoke(ctx, minX, maxX, minY, maxY);

  // 3. Iskry i odłamki uderzeniowe (Motion-stretched)
  drawBulletSparks(ctx, minX, maxX, minY, maxY);

  // 4. Rysowanie wielowarstwowych smug pocisków
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

    const tracerLen = Math.max(14, spd * (prof.tracerLengthMult || 0.85));
    const tailX = b.x - dirX * tracerLen;
    const tailY = b.y - dirY * tracerLen;

    if (isSniper) {
      // =====================================================================
      // POCISK SNAJPERSKI BARRETT .50 - NADDŹWIĘKOWY STRUMIEŃ BALISTYCZNY
      // =====================================================================

      // Warstwa 1: Szeroka zewnętrzna poświata energii
      ctx.strokeStyle = prof.glowColor || 'rgba(56, 189, 248, 0.40)';
      ctx.lineWidth = prof.glowWidth || 8.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Warstwa 2: Środkowa smuga gradientowa od ciemnego błękitu do jaskrawego cyjanu
      const midGrad = ctx.createLinearGradient(tailX, tailY, b.x, b.y);
      midGrad.addColorStop(0.0, 'rgba(2, 132, 199, 0.20)');
      midGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.85)');
      midGrad.addColorStop(1.0, '#38bdf8');

      ctx.strokeStyle = midGrad;
      ctx.lineWidth = prof.midWidth || 3.4;
      ctx.beginPath();
      ctx.moveTo(tailX + dirX * (tracerLen * 0.20), tailY + dirY * (tracerLen * 0.20));
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Warstwa 3: Jaskrawy, biały rdzeń pocisku
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = prof.coreWidth || 1.6;
      ctx.beginPath();
      ctx.moveTo(tailX + dirX * (tracerLen * 0.50), tailY + dirY * (tracerLen * 0.50));
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Warstwa 4: Świecący wierzchołek i rozbłysk czubka
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(b.x, b.y, (prof.tipRadius || 2.6) * 1.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, (prof.tipRadius || 2.6) * 0.75, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // =====================================================================
      // BRONIE STANDARDOWE (AK-47, SHOTGUN, REVOLVER, GLOCK, SAWED-OFF)
      // =====================================================================

      // Warstwa 1: Zewnętrzna poświata jonizacji termicznej z zanikaniem ku tyłowi
      const glowGrad = ctx.createLinearGradient(tailX, tailY, b.x, b.y);
      glowGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
      glowGrad.addColorStop(0.5, prof.glowColor || 'rgba(245, 158, 11, 0.15)');
      glowGrad.addColorStop(1.0, prof.glowColor || 'rgba(245, 158, 11, 0.45)');

      ctx.strokeStyle = glowGrad;
      ctx.lineWidth = prof.glowWidth || 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Warstwa 2: Aerodynamiczne ciało smugi (gradient pirotechniczny)
      const bodyGrad = ctx.createLinearGradient(tailX, tailY, b.x, b.y);
      bodyGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
      bodyGrad.addColorStop(0.35, prof.bodyGradient[1] || '#dc2626');
      bodyGrad.addColorStop(1.0, prof.bodyGradient[0] || '#f59e0b');

      ctx.strokeStyle = bodyGrad;
      ctx.lineWidth = prof.bodyWidth || 2.2;
      ctx.beginPath();
      ctx.moveTo(tailX + dirX * (tracerLen * 0.12), tailY + dirY * (tracerLen * 0.12));
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Warstwa 3: Oślepiający, biały rdzeń w strefie uderzenia (White-Hot Core)
      const coreStartX = tailX + dirX * (tracerLen * 0.58);
      const coreStartY = tailY + dirY * (tracerLen * 0.58);

      ctx.strokeStyle = prof.coreColor || '#ffffff';
      ctx.lineWidth = prof.coreWidth || 1.1;
      ctx.beginPath();
      ctx.moveTo(coreStartX, coreStartY);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Warstwa 4: Rozżarzony czubek pocisku
      ctx.fillStyle = prof.tipColor || '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, prof.tipRadius || 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
