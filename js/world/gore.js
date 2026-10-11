// =========================================================================
// WORLD/GORE.JS - SYSTEM GORE: KREW, PLAMY, ODCIĘTA GŁOWA, GIBS I UPUSZCZONA BROŃ
// Wydzielony moduł z js/world.js
// =========================================================================

import { CONFIG } from '../config.js';
import {
  GROUND_Y,
  _worldPlatforms,
  _worldCustomObstacles,
  isGroundAt
} from './state.js';

// =========================================================================
// SYSTEM GORE: KREW, PLAMY, ODCIĘTA GŁOWA, GIBS I UPUSZCZONA BROŃ
// =========================================================================
export const bloodParticles = [];
export const bloodDecals = [];
export const headGibs = [];
export const bodyGibs = [];
export const droppedWeapons = [];

export function clearGore() {
  bloodParticles.length = 0;
  headGibs.length = 0;
  bodyGibs.length = 0;
  droppedWeapons.length = 0;
}

export function spawnBloodSpurt(x, y, dirX, dirY, count = 10, speedMult = 1.0) {
  if (!CONFIG.GORE_ENABLED) return;
  for (let i = 0; i < count; i++) {
    const spread = (Math.random() - 0.5) * 0.85;
    const spd = (Math.random() * 4.5 + 2.0) * speedMult;
    const baseAngle = Math.atan2(dirY, dirX) + spread;
    bloodParticles.push({
      x: x + (Math.random() * 4 - 2),
      y: y + (Math.random() * 4 - 2),
      vx: Math.cos(baseAngle) * spd,
      vy: Math.sin(baseAngle) * spd,
      size: Math.random() * 2.6 + 1.8,
      life: 1.0,
      decay: Math.random() * 0.003 + 0.002, // Trwałe w locie – swobodnie spada grawitacyjnie
      color: Math.random() < 0.35 ? '#7f1d1d' : (Math.random() < 0.7 ? '#991b1b' : '#b91c1c')
    });
  }
}

export function spawnBloodFountain(x, y, facing, count = 4) {
  if (!CONFIG.GORE_ENABLED) return;
  for (let i = 0; i < count; i++) {
    bloodParticles.push({
      x: x + (Math.random() * 4 - 2),
      y: y,
      vx: (facing * (Math.random() * 2.2 + 0.5)) + (Math.random() - 0.5) * 1.4,
      vy: -(Math.random() * 4.5 + 2.8),
      size: Math.random() * 2.6 + 2.0,
      life: 1.0,
      decay: Math.random() * 0.003 + 0.002,
      color: Math.random() < 0.35 ? '#7f1d1d' : (Math.random() < 0.7 ? '#991b1b' : '#b91c1c')
    });
  }
}

export function spawnBloodDrip(x, y, vx = 0, vy = 1.0, count = 2) {
  if (!CONFIG.GORE_ENABLED) return;
  for (let i = 0; i < count; i++) {
    bloodParticles.push({
      x: x + (Math.random() * 4 - 2),
      y: y + (Math.random() * 2),
      vx: vx + (Math.random() - 0.5) * 1.2,
      vy: vy + Math.random() * 1.5,
      size: Math.random() * 2.4 + 1.8,
      life: 1.0,
      decay: 0.002,
      color: Math.random() < 0.35 ? '#7f1d1d' : (Math.random() < 0.7 ? '#991b1b' : '#b91c1c')
    });
  }
}

export function getSurfaceYForPlatform(plat, px, groundY = GROUND_Y) {
  if (!plat) return groundY;
  if (plat.surfacePoints && Array.isArray(plat.surfacePoints) && plat.surfacePoints.length >= 2) {
    let bestY = null;
    for (let i = 0; i < plat.surfacePoints.length - 1; i++) {
      const p1 = plat.surfacePoints[i];
      const p2 = plat.surfacePoints[i + 1];
      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      if (px >= minX - 4 && px <= maxX + 4) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        let yAtPx = Math.abs(dx) < 0.001 ? Math.min(p1.y, p2.y) : (p1.y + Math.max(0, Math.min(1, (px - p1.x) / dx)) * dy);
        if (bestY === null || yAtPx < bestY) bestY = yAtPx;
      }
    }
    if (bestY !== null) return bestY;
  }
  return plat.y !== undefined ? plat.y : (groundY - (plat.relY || 0));
}

export function getDecalSupportingSurfaceY(x, y, maxDistance = 16) {
  // 1. Grunt zerowy (GROUND_Y)
  if (Math.abs(y - GROUND_Y) <= maxDistance && isGroundAt(x)) {
    return GROUND_Y;
  }

  // 2. Platformy
  const plats = _worldPlatforms;
  if (Array.isArray(plats)) {
    for (const plat of plats) {
      if (!plat || plat.solid === false || plat.isWall) continue;
      const minX = plat.x !== undefined ? plat.x : 0;
      const maxX = minX + (plat.w || 0);
      if (x >= minX - 6 && x <= maxX + 6) {
        const topY = getSurfaceYForPlatform(plat, x, GROUND_Y);
        if (!isNaN(topY) && Math.abs(y - topY) <= maxDistance) {
          return topY;
        }
      }
    }
  }

  // 3. Przeszkody
  const obsList = _worldCustomObstacles;
  if (Array.isArray(obsList)) {
    for (const obs of obsList) {
      if (!obs || obs.holeCx !== undefined || obs.type === 'goal') continue;
      const minX = obs.x !== undefined ? obs.x : 0;
      const maxX = minX + (obs.w || 0);
      if (x >= minX - 6 && x <= maxX + 6) {
        const topY = obs.y !== undefined ? obs.y : (GROUND_Y - (obs.relY || 0));
        if (!isNaN(topY) && Math.abs(y - topY) <= maxDistance) {
          return topY;
        }
      }
    }
  }

  return null;
}

export function addBloodDecal(x, y, radiusMult = 1.0, impactVx = 0) {
  if (!CONFIG.GORE_ENABLED) return;
  // Walidacja: plama krwi MUSI leżeć na stałym podłożu/platformie, nigdy nie lewituje w powietrzu
  const surfaceY = getDecalSupportingSurfaceY(x, y, 18);
  if (surfaceY === null) return;

  // Zlewanie się kropel w rozrastającą się kałużę (gdy krew kapie w to samo miejsce)
  for (let j = bloodDecals.length - 1; j >= Math.max(0, bloodDecals.length - 20); j--) {
    const d = bloodDecals[j];
    if (Math.abs(d.y - surfaceY) <= 4 && Math.abs(d.x - x) <= 14) {
      d.w = Math.min(28, d.w + (Math.random() * 1.5 + 0.6) * radiusMult);
      d.h = Math.min(7.0, d.h + (Math.random() * 0.45 + 0.15) * radiusMult);
      d.lifeTime = Math.min(360, (d.lifeTime || 300) + 40);
      d.alpha = Math.min(0.95, (d.alpha || 0.7) + 0.05);
      if (d.splats && d.splats.length < 6 && Math.random() < 0.65) {
        d.splats.push({
          dx: (x - d.x) + (Math.random() - 0.5) * 8,
          dy: (Math.random() - 0.5) * 2,
          r: (Math.random() * 1.8 + 0.8) * radiusMult
        });
      }
      return;
    }
  }

  if (bloodDecals.length >= (CONFIG.MAX_BLOOD_DECALS || 120)) {
    bloodDecals.shift();
  }

  // Generuj mikro-odpryski wokół plamy dla realistycznego rozbryzgu
  const splatCount = Math.floor(Math.random() * 3) + 2;
  const splats = [];
  for (let s = 0; s < splatCount; s++) {
    const spreadX = (Math.random() * 18 - 9) + (impactVx || 0) * 1.1;
    splats.push({
      dx: spreadX,
      dy: (Math.random() - 0.5) * 2.2,
      r: (Math.random() * 1.6 + 0.6) * radiusMult
    });
  }

  const baseW = (Math.random() * 8 + 6) * radiusMult;
  const baseH = (Math.random() * 2.6 + 1.8) * radiusMult;

  bloodDecals.push({
    x: x + (Math.random() * 4 - 2),
    y: surfaceY,
    w: baseW,
    h: baseH,
    splats,
    baseAlpha: Math.random() * 0.30 + 0.65,
    alpha: Math.random() * 0.30 + 0.65,
    lifeTime: 300,      // 5 sekund przy 60 FPS – pełne krycie
    fadeDuration: 60,   // 1 sekunda płynnego wygaszania
    fadeTimer: 60
  });
}
export const spawnBloodDecal = addBloodDecal;

export function spawnHeadGib(x, y, vx, vy, facing, visuals) {
  if (!CONFIG.GORE_ENABLED) return;
  headGibs.push({
    x,
    y,
    vx: vx * 1.05 + (facing * 2.0),
    vy: vy - 4.5,
    rot: 0,
    vRot: (Math.random() * 0.25 + 0.15) * facing,
    facing: facing || 1,
    visuals: visuals || {},
    radius: 7.5,
    groundBounces: 0,
    life: 300,
    sprayTimer: 45
  });
  spawnBloodSpurt(x, y, vx, vy - 3, 24, 1.4);
}

export function spawnBodyGibs(cx, cy, facing, visuals) {
  if (!CONFIG.GORE_ENABLED) return;
  const types = ['arm', 'leg', 'torso_chunk', 'boot', 'pelvis'];
  for (const t of types) {
    const angle = Math.random() * Math.PI * 2;
    const spd = Math.random() * 7.0 + 3.5;
    bodyGibs.push({
      type: t,
      x: cx + (Math.random() * 12 - 6),
      y: cy + (Math.random() * 16 - 8),
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 3.5,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.35,
      facing: Math.random() < 0.5 ? 1 : -1,
      visuals: visuals || {},
      groundBounces: 0,
      life: 280
    });
  }
  spawnBloodSpurt(cx, cy, 0, -1, 35, 1.8);
}

export function spawnDroppedWeapon(x, y, vx, vy, weapon, facing) {
  if (!weapon) return;
  droppedWeapons.push({
    weapon,
    x,
    y,
    vx: (vx || 0) * 0.4 + (facing * (Math.random() * 2.5 + 1.5)),
    vy: (vy || 0) * 0.3 - (Math.random() * 3.5 + 3.0),
    rot: 0,
    vRot: (Math.random() * 0.22 + 0.12) * (Math.random() < 0.5 ? 1 : -1),
    facing: facing || 1,
    bounces: 0,
    life: 360
  });
}

export function spawnKnockedHelmet(x, y, vx, vy, facing = 1, visuals = null) {
  const dir = (vx && Math.abs(vx) > 0.2) ? Math.sign(vx) : -facing;
  droppedWeapons.push({
    isHelmet: true,
    helmetColor: visuals?.helmetColor || '#27272a',
    visorColor: visuals?.helmetVisorGlow || '#00e5ff',
    x,
    y,
    vx: (vx || 0) * 0.18 + dir * (3.2 + Math.random() * 2.2),
    vy: -Math.abs(vy || 0) * 0.12 - (4.8 + Math.random() * 2.0),
    rot: 0,
    vRot: dir * (0.24 + Math.random() * 0.18),
    facing: facing || 1,
    bounces: 0,
    life: 420
  });
}

export function spawnVestShreds(x, y, vx = 0, vy = 0, vestColor = '#18181b') {
  for (let i = 0; i < 6; i++) {
    const ang = -Math.PI * 0.85 + Math.random() * Math.PI * 0.7;
    const spd = 2.2 + Math.random() * 3.8;
    droppedWeapons.push({
      isVestScrap: true,
      scrapColor: i % 2 === 0 ? vestColor : '#27272a',
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 12,
      vx: Math.cos(ang) * spd + (vx || 0) * 0.1,
      vy: Math.sin(ang) * spd - 2.0,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.35,
      facing: 1,
      bounces: 1,
      life: 180 + Math.floor(Math.random() * 60)
    });
  }
}

export function updateGore(groundY, platforms = null, obstacles = null) {
  const plats = platforms || _worldPlatforms;
  const obsList = obstacles || _worldCustomObstacles;

  // Uaktualnij czas życia i alpha plam krwi (zanikanie po 5 sekundach)
  updateBloodDecals();

  for (let i = bloodParticles.length - 1; i >= 0; i--) {
    const p = bloodParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += CONFIG.GRAVITY * 0.85;
    p.vx *= 0.98;
    p.life -= p.decay;

    let hitFloor = false;
    let floorY = groundY;

    if (Array.isArray(plats)) {
      for (const plat of plats) {
        if (!plat || plat.solid === false || plat.isWall) continue;
        const minX = plat.x !== undefined ? plat.x : 0;
        const maxX = minX + (plat.w || 0);
        if (p.x >= minX - 2 && p.x <= maxX + 2) {
          const topY = getSurfaceYForPlatform(plat, p.x, groundY);
          if (!isNaN(topY) && p.y >= topY && p.y <= topY + 14 && p.vy > 0) {
            hitFloor = true;
            floorY = topY;
            break;
          }
        }
      }
    }

    if (!hitFloor && Array.isArray(obsList)) {
      for (const obs of obsList) {
        if (!obs || obs.holeCx !== undefined || obs.type === 'goal') continue;
        const minX = obs.x !== undefined ? obs.x : 0;
        const maxX = minX + (obs.w || 0);
        if (p.x >= minX - 2 && p.x <= maxX + 2) {
          const topY = obs.y !== undefined ? obs.y : (groundY - (obs.relY || 0));
          if (!isNaN(topY) && p.y >= topY && p.y <= topY + 14 && p.vy > 0) {
            hitFloor = true;
            floorY = topY;
            break;
          }
        }
      }
    }

    const hasGround = (typeof isGroundAt === 'function') ? isGroundAt(p.x) : true;
    if (hitFloor || (hasGround && p.y >= groundY)) {
      const surfaceY = hitFloor ? floorY : groundY;
      const impactSpeed = Math.hypot(p.vx, p.vy);

      // 1. Ochlapanie powierzchni – rozbryzg i rozrost plamy krwi
      addBloodDecal(p.x, surfaceY, Math.min(1.5, (p.size || 2.0) / 2.0), p.vx);

      // 2. Dynamiczny rozbryzg kropel (micro-splash) odbijających się od powierzchni
      if (!p.isSplash && impactSpeed > 1.8 && Math.random() < 0.65) {
        const splashCount = Math.min(3, Math.floor(impactSpeed * 0.4) + 1);
        for (let s = 0; s < splashCount; s++) {
          bloodParticles.push({
            x: p.x + (Math.random() * 4 - 2),
            y: surfaceY - 1,
            vx: (Math.random() - 0.5) * (impactSpeed * 0.5 + 1.2) + p.vx * 0.25,
            vy: -(Math.random() * 1.8 + 0.6),
            size: Math.random() * 1.4 + 1.0,
            life: 0.45,
            decay: 0.035,
            color: '#b91c1c',
            isSplash: true
          });
        }
      }

      bloodParticles.splice(i, 1);
      continue;
    } else if (!hasGround && p.y > groundY + 500) {
      bloodParticles.splice(i, 1);
      continue;
    }

    if (p.life <= 0) {
      bloodParticles.splice(i, 1);
    }
  }

  for (let i = headGibs.length - 1; i >= 0; i--) {
    const hg = headGibs[i];
    hg.x += hg.vx;
    hg.y += hg.vy;
    hg.vy += CONFIG.GRAVITY;
    hg.rot += hg.vRot;
    hg.vx *= 0.985;
    hg.life--;

    if (hg.sprayTimer > 0) {
      hg.sprayTimer--;
      if (hg.sprayTimer % 3 === 0) {
        spawnBloodSpurt(hg.x, hg.y, -hg.vx * 0.4, -hg.vy * 0.4, 2, 0.6);
      }
    }

    const hasGround = (typeof isGroundAt === 'function') ? isGroundAt(hg.x) : true;
    let floorY = hasGround ? (groundY - hg.radius) : (groundY + 600);
    let landed = false;

    if (hasGround && hg.y >= floorY) {
      landed = true;
    } else if (Array.isArray(plats)) {
      for (const plat of plats) {
        if (!plat || plat.solid === false || plat.isWall) continue;
        const minX = plat.x !== undefined ? plat.x : 0;
        const maxX = minX + (plat.w || 0);
        if (hg.x >= minX && hg.x <= maxX) {
          const topY = getSurfaceYForPlatform(plat, hg.x, groundY);
          if (!isNaN(topY) && hg.y >= topY - hg.radius && hg.y <= topY + 8 && hg.vy > 0) {
            floorY = topY - hg.radius;
            landed = true;
            break;
          }
        }
      }
    }

    if (landed) {
      hg.y = floorY;
      if (Math.abs(hg.vy) > 1.2 && hg.groundBounces < 4) {
        hg.vy = -hg.vy * 0.48;
        hg.vx *= 0.75;
        hg.vRot *= 0.7;
        hg.groundBounces++;
        addBloodDecal(hg.x, floorY + hg.radius);
      } else {
        hg.vy = 0;
        hg.vx *= 0.85;
        hg.vRot = 0;
      }
    }

    if (hg.life <= 0 || (!hasGround && hg.y > groundY + 500)) {
      headGibs.splice(i, 1);
    }
  }

  for (let i = bodyGibs.length - 1; i >= 0; i--) {
    const bg = bodyGibs[i];
    bg.x += bg.vx;
    bg.y += bg.vy;
    bg.vy += CONFIG.GRAVITY;
    bg.rot += bg.vRot;
    bg.vx *= 0.98;
    bg.life--;

    const hasGround = (typeof isGroundAt === 'function') ? isGroundAt(bg.x) : true;
    if (hasGround && bg.y >= groundY - 4) {
      bg.y = groundY - 4;
      if (Math.abs(bg.vy) > 1.5 && bg.groundBounces < 3) {
        bg.vy = -bg.vy * 0.42;
        bg.vx *= 0.75;
        bg.groundBounces++;
        addBloodDecal(bg.x, groundY);
      } else {
        bg.vy = 0;
        bg.vx = 0;
        bg.vRot = 0;
      }
    }

    if (bg.life <= 0 || (!hasGround && bg.y > groundY + 500)) {
      bodyGibs.splice(i, 1);
    }
  }

  for (let i = droppedWeapons.length - 1; i >= 0; i--) {
    const dw = droppedWeapons[i];
    dw.x += dw.vx;
    dw.y += dw.vy;
    dw.vy += CONFIG.GRAVITY;
    dw.rot += dw.vRot;
    dw.vx *= 0.98;
    dw.life--;

    const hasGround = (typeof isGroundAt === 'function') ? isGroundAt(dw.x) : true;
    let floorY = hasGround ? (groundY - 4) : (groundY + 600);
    let landed = false;

    if (hasGround && dw.y >= floorY) {
      landed = true;
    } else if (Array.isArray(plats)) {
      for (const plat of plats) {
        if (!plat || plat.solid === false || plat.isWall) continue;
        const minX = plat.x !== undefined ? plat.x : 0;
        const maxX = minX + (plat.w || 0);
        if (dw.x >= minX && dw.x <= maxX) {
          const topY = getSurfaceYForPlatform(plat, dw.x, groundY);
          if (!isNaN(topY) && dw.y >= topY - 4 && dw.y <= topY + 8 && dw.vy > 0) {
            floorY = topY - 4;
            landed = true;
            break;
          }
        }
      }
    }

    if (landed) {
      dw.y = floorY;
      if (Math.abs(dw.vy) > 1.2 && dw.bounces < 3) {
        dw.vy = -dw.vy * 0.45;
        dw.vx *= 0.72;
        dw.vRot *= 0.6;
        dw.bounces++;
      } else {
        dw.vy = 0;
        dw.vx *= 0.82;
        dw.vRot = 0;
      }
    }

    if (dw.life <= 0 || (!hasGround && dw.y > groundY + 500)) {
      droppedWeapons.splice(i, 1);
    }
  }
}

// =================================================================
// FIZYKA I RENDEROWANIE ODPADAJACEJ GLOWY (severedHead)
// =================================================================
export function updateSeveredHeads(chars, groundY, platforms = null) {
  const plats = platforms || _worldPlatforms;
  for (const ch of chars) {
    const head = ch.severedHead;
    if (!head) continue;
    if (!head.onGround) {
      head.vy += 0.38;
      head.x += head.vx;
      head.y += head.vy;
      head.rotation += head.rotSpeed;
      const hasGround = (typeof isGroundAt === 'function') ? isGroundAt(head.x) : true;
      if (hasGround && head.y >= groundY - 6) {
        head.y = groundY - 6;
        head.vy = -head.vy * 0.32;
        head.vx *= 0.78;
        head.rotSpeed *= 0.65;
        if (Math.abs(head.vy) < 0.8) { head.vy = 0; head.onGround = true; }
        addBloodDecal(head.x, groundY);
      }
      if (Array.isArray(plats)) {
        for (const plat of plats) {
          if (!plat || plat.solid === false || plat.isWall) continue;
          const minX = plat.x !== undefined ? plat.x : 0;
          const maxX = minX + (plat.w || 0);
          if (head.x >= minX && head.x <= maxX) {
            const topY = getSurfaceYForPlatform(plat, head.x, groundY);
            if (!isNaN(topY) && head.y >= topY - 6 && head.y <= topY + 4 && head.vy > 0) {
              head.y = topY - 6;
              head.vy = -head.vy * 0.32;
              head.vx *= 0.78;
              head.rotSpeed *= 0.65;
              if (Math.abs(head.vy) < 0.8) { head.vy = 0; head.onGround = true; }
              addBloodDecal(head.x, topY);
              break;
            }
          }
        }
      }
    } else {
      head.vx *= 0.92;
      head.rotSpeed *= 0.88;
    }
    head.life--;
    if (head.life <= head.fadeTimer) { head.alpha = Math.max(0, head.life / head.fadeTimer); }
    if (head.life <= 0) { ch.severedHead = null; }
  }
}

export function drawSeveredHeads(ctx, chars) {
  if (!CONFIG.GORE_ENABLED) return;
  for (const ch of chars) {
    const head = ch.severedHead;
    if (!head) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, head.alpha);
    ctx.translate(head.x, head.y);
    ctx.rotate(head.rotation);
    ctx.scale(head.facing, 1);
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(0, 5, 4.2, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    const vis = head.visuals;
    const faceGrad = ctx.createLinearGradient(-4.8, -6.0, 4.8, 6.0);
    faceGrad.addColorStop(0.0, (vis && vis.skinBack) ? vis.skinBack : '#de935e');
    faceGrad.addColorStop(0.5, (vis && vis.skinMid) ? vis.skinMid : '#f5b078');
    faceGrad.addColorStop(1.0, (vis && vis.skinLight) ? vis.skinLight : '#fed7aa');
    ctx.beginPath();
    ctx.ellipse(0, -1.0, 5.0, 5.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = faceGrad;
    ctx.fill();
    ctx.fillStyle = '#2e160a';
    ctx.beginPath();
    ctx.arc(0, -2.5, 5.1, Math.PI * 0.85, Math.PI * 0.15, true);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-1.8, -1.5, 1.2, 0.9, 0, 0, Math.PI * 2);
    ctx.ellipse(2.0, -1.5, 1.2, 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-1.8, -1.5, 0.5, 0, Math.PI * 2);
    ctx.arc(2.0, -1.5, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function updateBloodDecals() {
  for (let i = bloodDecals.length - 1; i >= 0; i--) {
    const d = bloodDecals[i];
    // Jeśli podłoże pod plamą zniknęło (np. zniszczona platforma lub wycięty krater w ziemi):
    if (getDecalSupportingSurfaceY(d.x, d.y, 20) === null) {
      bloodDecals.splice(i, 1);
      continue;
    }
    if (d.lifeTime === undefined) {
      // Stare dekale bez lifetime – dodaj pola
      d.lifeTime = 300;
      d.fadeDuration = 60;
      d.fadeTimer = 60;
      d.baseAlpha = d.alpha;
    }
    if (d.lifeTime > 0) {
      d.lifeTime--;
      d.alpha = d.baseAlpha; // pełne krycie przez 5 sekund
    } else {
      // Płynne wygaszanie przez 1 sekundę
      d.fadeTimer = Math.max(0, d.fadeTimer - 1);
      d.alpha = d.baseAlpha * (d.fadeTimer / d.fadeDuration);
      if (d.alpha <= 0.005) {
        bloodDecals.splice(i, 1);
        continue;
      }
    }
  }
}

export function drawBloodDecals(ctx) {
  if (!CONFIG.GORE_ENABLED || bloodDecals.length === 0) return;
  ctx.save();
  for (const d of bloodDecals) {
    const alphaStr = (d.alpha || 0.7).toFixed(3);
    ctx.fillStyle = `rgba(136, 19, 19, ${alphaStr})`;
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, d.w, d.h, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rysowanie drobnych rozbryzgów / kropel wokół plamy
    if (d.splats && d.splats.length > 0) {
      for (const sp of d.splats) {
        ctx.beginPath();
        ctx.arc(d.x + sp.dx, d.y + sp.dy, sp.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

export function drawGore(ctx) {
  if (!CONFIG.GORE_ENABLED) return;

  if (bloodParticles.length > 0) {
    ctx.save();
    for (const p of bloodParticles) {
      const spd = Math.hypot(p.vx, p.vy);
      if (spd > 1.2) {
        // Płynna, rozciągnięta kropla krwi w locie (liquid streak / teardrop)
        const tailLen = Math.min(9.0, spd * 1.6);
        const tailX = p.x - (p.vx / spd) * tailLen;
        const tailY = p.y - (p.vy / spd) * tailLen;
        ctx.strokeStyle = p.color || '#991b1b';
        ctx.lineWidth = p.size || 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color || '#991b1b';
        ctx.beginPath();
        ctx.arc(p.x, p.y, (p.size || 2.0) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  for (const hg of headGibs) {
    ctx.save();
    ctx.translate(hg.x, hg.y);
    ctx.rotate(hg.rot);
    ctx.scale(hg.facing, 1);

    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(0, 5, 4.2, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    const faceGrad = ctx.createLinearGradient(-4.8, -6.0, 4.8, 6.0);
    faceGrad.addColorStop(0.0, '#de935e');
    faceGrad.addColorStop(0.5, '#f5b078');
    faceGrad.addColorStop(1.0, '#fed7aa');

    ctx.beginPath();
    ctx.ellipse(0, -1.0, 5.0, 5.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = faceGrad;
    ctx.fill();

    ctx.fillStyle = '#2e160a';
    ctx.beginPath();
    ctx.arc(0, -2.5, 5.1, Math.PI * 0.85, Math.PI * 0.15, true);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-4.8, -2.8);
    ctx.lineTo(4.8, -2.8);
    ctx.stroke();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(1.2, -2.2); ctx.lineTo(3.2, -0.2);
    ctx.moveTo(3.2, -2.2); ctx.lineTo(1.2, -0.2);
    ctx.stroke();

    ctx.restore();
  }

  for (const bg of bodyGibs) {
    ctx.save();
    ctx.translate(bg.x, bg.y);
    ctx.rotate(bg.rot);

    if (bg.type === 'boot') {
      ctx.fillStyle = bg.visuals?.bootColor || '#18181b';
      ctx.fillRect(-4, -2, 9, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-4, -4, 3, 2);
    } else if (bg.type === 'leg') {
      ctx.fillStyle = bg.visuals?.legShinFront || '#ef4444';
      ctx.fillRect(-3, -7, 6, 14);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-3, -9, 6, 2);
    } else if (bg.type === 'arm') {
      ctx.fillStyle = bg.visuals?.armColorFront || '#dc2626';
      ctx.fillRect(-2.5, -5, 5, 10);
      ctx.fillStyle = '#f5b078';
      ctx.fillRect(-2, 5, 4, 3);
    } else {
      ctx.fillStyle = bg.visuals?.jerseyFront1 || '#991b1b';
      ctx.fillRect(-5, -5, 10, 10);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-5, -6, 10, 2);
    }

    ctx.restore();
  }

  for (const dw of droppedWeapons) {
    ctx.save();
    ctx.translate(dw.x, dw.y);
    ctx.rotate(dw.rot);
    ctx.scale(dw.facing, 1);

    if (dw.isHelmet) {
      // Strącony hełm balistyczny FAST z wizjerem i montażem NVG
      ctx.fillStyle = dw.helmetColor || '#27272a';
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(-5.5, 1.5);
      ctx.lineTo(-6.8, -3.2);
      ctx.quadraticCurveTo(-6.2, -7.2, -1.0, -7.5);
      ctx.quadraticCurveTo(4.5, -7.2, 5.5, -3.0);
      ctx.lineTo(4.8, 0.2);
      ctx.quadraticCurveTo(-1.0, 0.5, -5.5, 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Szyna boczna ARC
      ctx.fillStyle = '#09090b';
      ctx.fillRect(-4.2, -2.2, 6.2, 1.5);
      // Wizjer
      ctx.fillStyle = dw.visorColor || '#00e5ff';
      ctx.fillRect(2.0, -1.2, 3.0, 1.8);
    } else if (dw.isVestScrap) {
      // Odłamek zniszczonej kamizelki kuloodpornej
      ctx.fillStyle = dw.scrapColor || '#18181b';
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.7;
      ctx.fillRect(-3.0, -2.0, 6.0, 4.0);
      ctx.strokeRect(-3.0, -2.0, 6.0, 4.0);
    } else if (dw.weapon && dw.weapon.id === 'AK47') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-8, -1.5, 6, 3);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-2, -2, 14, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(4, 2, 4, 5);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(12, -1, 10, 2);
    } else if (dw.weapon) {
      ctx.fillStyle = '#3f2712';
      ctx.fillRect(-7, -1.5, 6, 3.5);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-1, -2.5, 11, 5);
      ctx.fillStyle = '#334155';
      ctx.fillRect(10, -2, 14, 3);
    }

    ctx.restore();
  }
}

