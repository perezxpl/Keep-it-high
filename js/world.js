// =========================================================================
// WORLD.JS - MODUŁ ZAMKNIĘTEJ ARENY BOJOWEJ + SYSTEM GORE & KINEMATYKA ŚMIERCI
// =========================================================================

import { CONFIG, START_X, ARENA_LEFT, ARENA_RIGHT, ARENA_WIDTH, isTouchDevice, setTouchDevice } from './config.js';
export { isTouchDevice, setTouchDevice };

export let _worldPlatforms = [];
export let _worldCustomObstacles = [];
export let activeArenaId = 'ARENA_1';
export let _worldArenaState = {
  get activeArenaId() { return activeArenaId; },
  set activeArenaId(val) { activeArenaId = val; },
  arenaScore: { cyan: 0, orange: 0 },
  arena1State: null
};

export function registerWorldObstacles(platforms, obstacles, arenaState) {
  if (platforms) _worldPlatforms = platforms;
  if (obstacles) _worldCustomObstacles = obstacles;
  if (arenaState) {
    if (arenaState.activeArenaId) activeArenaId = arenaState.activeArenaId;
    if (arenaState.arenaScore) _worldArenaState.arenaScore = arenaState.arenaScore;
    if (arenaState.arena1State) _worldArenaState.arena1State = arenaState.arena1State;
  }
}

export function setActiveArenaId(id) {
  activeArenaId = id;
}

export const goalCelebration = {
  active: false,
  timer: 0,
  team: '',
  color: '#06b6d4'
};

export function triggerGoalCelebration(team, color) {
  goalCelebration.active = true;
  goalCelebration.timer = 110;
  goalCelebration.team = team;
  goalCelebration.color = color || (team === 'CYAN' ? '#06b6d4' : '#f97316');
}

export let canvas = null;
export let ctx = null;
export let W = window.innerWidth;
export let H = window.innerHeight;
export let DPR = Math.min(window.devicePixelRatio || 1, 2);
export let GROUND_Y = Math.round((H - 75) / 20) * 20;

export const camera = {
  x: START_X + 400,
  y: GROUND_Y,
  targetX: START_X + 400,
  targetY: GROUND_Y,
  zoom: 0.70,
  targetZoom: 0.70,
  smoothPos: 0.08,
  smoothZoom: 0.04,
  shakeIntensity: 0,
  shakeDecay: 0.88,
  shakeX: 0,
  shakeY: 0
};

export function triggerScreenShake(intensity) {
  camera.shakeIntensity = Math.min(26, Math.max(camera.shakeIntensity, intensity));
}

// =========================================================================
// SYSTEM HITSTOP (ZAMROŻENIE KLATKI PRZY EFEKTOWNEJ ŚMIERCI)
// =========================================================================
export let hitstopFrames = 0;
export function triggerHitstop(frames = 5) {
  hitstopFrames = Math.max(hitstopFrames, frames);
}
export function consumeHitstop() {
  if (hitstopFrames > 0) {
    hitstopFrames--;
    return true;
  }
  return false;
}

export let currentDist = 0;
export let bestDistance = 0;
export const grassParticles = [];

// =========================================================================
// INTERFEJS WYBORU BRONI W DOLNYM LEWYM ROGU (PIONOWE MAŁE IKONY)
// =========================================================================
export const weaponButtons = [
  { id: 'AK47', name: 'AK', fullName: 'AK-47', type: 'AUTO', x: 20, y: 0, w: 230, h: 32 },
  { id: 'SHOTGUN', name: 'SG', fullName: 'SHOTGUN', type: 'SEMI', x: 20, y: 0, w: 230, h: 32 }
];

export function initCanvas(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  resize();
}

export function resize(player) {
  W = window.innerWidth;
  H = window.innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas && ctx) {
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.resetTransform();
    ctx.scale(DPR, DPR);
  }
  GROUND_Y = Math.round((H - 75) / 20) * 20;
  invalidateSkyCache();
  if (player) {
    if (player.y >= GROUND_Y - player.h - 5) {
      player.y = GROUND_Y - player.h;
    }
  }
}

export let devZoomLevel = null; // null = automatyczny zoom gry, liczba = sztywny zoom DEV (np. 1.5)
export function setDevZoom(val) {
  devZoomLevel = val !== null ? Math.max(0.35, Math.min(2.5, val)) : null;
}

export function updateCamera(player, ball) {
  if (devZoomLevel !== null) {
    camera.targetZoom = devZoomLevel;
  } else {
    camera.targetZoom = 0.75; // domyślny zoom gry
  }
  camera.zoom += (camera.targetZoom - camera.zoom) * camera.smoothZoom;

  camera.targetX = (player.x + player.w / 2) + (player.vx * 12);
  camera.targetY = player.y + 20;

  if (camera.shakeIntensity > 0.1) {
    camera.shakeX = (Math.random() * 2 - 1) * camera.shakeIntensity;
    camera.shakeY = (Math.random() * 2 - 1) * camera.shakeIntensity;
    camera.shakeIntensity *= camera.shakeDecay;
  } else {
    camera.shakeIntensity = 0;
    camera.shakeX = 0;
    camera.shakeY = 0;
  }

  camera.x += (camera.targetX - camera.x) * camera.smoothPos + camera.shakeX;
  camera.y += (camera.targetY - camera.y) * camera.smoothPos + camera.shakeY;
}

export function updateDistance(ballX) {
  currentDist = Math.max(0, Math.floor((ballX - START_X) / 14));
  if (currentDist > bestDistance) {
    bestDistance = currentDist;
  }
}

export function spawnGrass(x, y, dir) {
  const colors = ['#166534', '#78350f', '#f59e0b', '#334155'];
  for (let i = 0; i < 2; i++) {
    grassParticles.push({
      x: x + (Math.random() * 8 - 4),
      y: y - 2,
      vx: -dir * (Math.random() * 3.5 + 1.2) + (Math.random() * 1.5 - 0.75),
      vy: -(Math.random() * 3.2 + 1.2),
      size: Math.random() * 2.8 + 1.6,
      life: 1.0,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

export function updateParticles() {
  for (let i = grassParticles.length - 1; i >= 0; i--) {
    const gp = grassParticles[i];
    gp.x += gp.vx;
    gp.y += gp.vy;
    gp.vy += 0.25;
    gp.life -= 0.04;
    if (gp.life <= 0 || gp.y >= GROUND_Y) {
      grassParticles.splice(i, 1);
    }
  }
}

export function drawParticles(ctx) {
  for (const gp of grassParticles) {
    ctx.fillStyle = gp.color || '#166534';
    ctx.fillRect(gp.x, gp.y, gp.size, gp.size * 1.5);
  }
}

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
    const spread = (Math.random() - 0.5) * 0.8;
    const spd = (Math.random() * 4.5 + 2.0) * speedMult;
    const baseAngle = Math.atan2(dirY, dirX) + spread;
    bloodParticles.push({
      x: x + (Math.random() * 4 - 2),
      y: y + (Math.random() * 4 - 2),
      vx: Math.cos(baseAngle) * spd,
      vy: Math.sin(baseAngle) * spd,
      size: Math.random() * 2.8 + 1.6,
      life: 1.0,
      decay: Math.random() * 0.015 + 0.015
    });
  }
}

export function spawnBloodFountain(x, y, facing, count = 4) {
  if (!CONFIG.GORE_ENABLED) return;
  for (let i = 0; i < count; i++) {
    bloodParticles.push({
      x: x + (Math.random() * 4 - 2),
      y: y,
      vx: (facing * (Math.random() * 2.2 + 0.5)) + (Math.random() - 0.5) * 1.2,
      vy: -(Math.random() * 4.2 + 2.8),
      size: Math.random() * 2.5 + 2.0,
      life: 1.0,
      decay: Math.random() * 0.02 + 0.02
    });
  }
}

export function addBloodDecal(x, y) {
  if (!CONFIG.GORE_ENABLED) return;
  if (bloodDecals.length >= (CONFIG.MAX_BLOOD_DECALS || 120)) {
    bloodDecals.shift();
  }
  bloodDecals.push({
    x: x + (Math.random() * 4 - 2),
    y,
    w: Math.random() * 9 + 5,
    h: Math.random() * 3 + 1.8,
    baseAlpha: Math.random() * 0.35 + 0.55,
    alpha: Math.random() * 0.35 + 0.55,
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

    for (const plat of plats) {
      const topY = groundY - plat.relY;
      if (p.x >= plat.x && p.x <= plat.x + plat.w && p.y >= topY && p.y <= topY + 12 && p.vy > 0) {
        hitFloor = true;
        floorY = topY;
        break;
      }
    }
    if (!hitFloor) {
      for (const obs of obsList) {
        const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
        if (p.x >= obs.x && p.x <= obs.x + obs.w && p.y >= topY && p.y <= topY + 12 && p.vy > 0) {
          hitFloor = true;
          floorY = topY;
          break;
        }
      }
    }

    if (p.y >= groundY || hitFloor) {
      addBloodDecal(p.x, hitFloor ? floorY : groundY);
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

    let floorY = groundY - hg.radius;
    let landed = false;

    if (hg.y >= floorY) {
      landed = true;
    } else {
      for (const plat of plats) {
        const topY = groundY - plat.relY;
        if (hg.x >= plat.x && hg.x <= plat.x + plat.w && hg.y >= topY - hg.radius && hg.y <= topY + 8 && hg.vy > 0) {
          floorY = topY - hg.radius;
          landed = true;
          break;
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

    if (hg.life <= 0) {
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

    if (bg.y >= groundY - 4) {
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

    if (bg.life <= 0) {
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

    let floorY = groundY - 4;
    let landed = false;

    if (dw.y >= floorY) {
      landed = true;
    } else {
      for (const plat of plats) {
        const topY = groundY - plat.relY;
        if (dw.x >= plat.x && dw.x <= plat.x + plat.w && dw.y >= topY - 4 && dw.y <= topY + 8 && dw.vy > 0) {
          floorY = topY - 4;
          landed = true;
          break;
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

    if (dw.life <= 0) {
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
      if (head.y >= groundY - 6) {
        head.y = groundY - 6;
        head.vy = -head.vy * 0.32;
        head.vx *= 0.78;
        head.rotSpeed *= 0.65;
        if (Math.abs(head.vy) < 0.8) { head.vy = 0; head.onGround = true; }
        addBloodDecal(head.x, groundY);
      }
      for (const plat of plats) {
        const topY = groundY - plat.relY;
        if (head.x >= plat.x && head.x <= plat.x + plat.w && head.y >= topY - 6 && head.y <= topY + 4 && head.vy > 0) {
          head.y = topY - 6;
          head.vy = -head.vy * 0.32;
          head.vx *= 0.78;
          head.rotSpeed *= 0.65;
          if (Math.abs(head.vy) < 0.8) { head.vy = 0; head.onGround = true; }
          break;
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
    ctx.fillStyle = `rgba(136, 19, 19, ${d.alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, d.w, d.h, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawGore(ctx) {
  if (!CONFIG.GORE_ENABLED) return;

  if (bloodParticles.length > 0) {
    ctx.save();
    for (const p of bloodParticles) {
      ctx.fillStyle = Math.random() < 0.3 ? '#7f1d1d' : '#991b1b';
      ctx.fillRect(p.x, p.y, p.size, p.size);
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

    if (dw.weapon.id === 'AK47') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-8, -1.5, 6, 3);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-2, -2, 14, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(4, 2, 4, 5);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(12, -1, 10, 2);
    } else {
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

// =========================================================================
// NEONOWY SYSTEM CZĄSTECZEK JETPACKA (CYJAN, BŁĘKIT, FIOLET)
// =========================================================================
export const jetpackParticles = [];

export function spawnJetpackSparks(x, y, facing, count = 3, customColors = null, inheritVx = 0, inheritVy = 0, nozzleAngle = Math.PI / 2) {
  const colors = customColors || ['#00e5ff', '#38bdf8', '#ffffff'];

  for (let i = 0; i < count; i++) {
    // Stożkowy rozrzut wokół wektora dyszy (+/- 14 stopni)
    const coneAngle = nozzleAngle + (Math.random() - 0.5) * 0.48;
    const thrustSpeed = Math.random() * 5.0 + 4.0;

    // Prędkość wylotowa z uwzględnieniem części wektora prędkości gracza
    const vx = Math.cos(coneAngle) * thrustSpeed + inheritVx * 0.35;
    const vy = Math.sin(coneAngle) * thrustSpeed + inheritVy * 0.35;

    const isSmoke = Math.random() < 0.35;
    const col = isSmoke 
      ? '#64748b' 
      : colors[Math.floor(Math.random() * colors.length)];

    jetpackParticles.push({
      x: x + (Math.random() * 2.0 - 1.0),
      y: y + (Math.random() * 2.0 - 1.0),
      vx,
      vy,
      size: isSmoke ? (Math.random() * 2.0 + 3.0) : (Math.random() * 1.5 + 2.5),
      maxSize: isSmoke ? 8.5 : 5.5,
      life: 1.0,
      decay: isSmoke ? 0.032 : 0.046,
      isFlame: !isSmoke,
      color: col,
      glowColor: colors[0] || '#00e5ff'
    });
  }

  if (jetpackParticles.length > 200) {
    jetpackParticles.splice(0, jetpackParticles.length - 200);
  }
}

export function updateJetpackParticles() {
  for (let i = jetpackParticles.length - 1; i >= 0; i--) {
    const p = jetpackParticles[i];
    p.x += p.vx;
    p.y += p.vy;

    // Opór powietrza
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.life -= p.decay;

    // Chłodzenie ognia w rozszerzający się dym
    if (p.isFlame) {
      if (p.life < 0.55) {
        p.isFlame = false;
        p.color = '#64748b';
      }
    } else {
      // Dym rozszerza się i lekko unosi
      p.size = Math.min(p.maxSize, p.size + 0.18);
      p.vy -= 0.04;
    }

    if (p.life <= 0) {
      jetpackParticles.splice(i, 1);
    }
  }
}

export function drawJetpackParticles(ctx) {
  if (jetpackParticles.length === 0) return;

  for (let i = 0; i < jetpackParticles.length; i++) {
    const p = jetpackParticles[i];
    ctx.save();

    if (p.isFlame) {
      // Gorący płomień z neonowym blaskiem
      ctx.shadowColor = p.glowColor || p.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1.0, p.life * 1.4);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Białe jądro w środku świeżego płomienia
      if (p.life > 0.8) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Rozszerzający się, gasnący dym (fade-out przez alpha)
      ctx.shadowBlur = 0;
      ctx.fillStyle = p.color || '#64748b';
      ctx.globalAlpha = Math.max(0, p.life * 0.35);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return { dist: Math.hypot(px - x1, py - y1), t: 0 };
  const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2));
  return { dist: Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1))), t };
}

export function resolveSegmentCollision(b, x1, y1, x2, y2, thickness, v1x, v1y, v2x, v2y, restitution, friction) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return false;

  const t = Math.max(0, Math.min(1, ((b.x - x1) * dx + (b.y - y1) * dy) / l2));
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  const d = Math.hypot(b.x - px, b.y - py);
  const cR = b.colRadius !== undefined ? b.colRadius : b.radius;
  const minDist = cR + thickness;

  if (d < minDist) {
    let nx = 0;
    let ny = -1;
    if (d > 0.0001) {
      nx = (b.x - px) / d;
      ny = (b.y - py) / d;
    } else {
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        nx = -dy / len;
        ny = dx / len;
      }
    }

    const pen = minDist - d;
    b.x += nx * pen;
    b.y += ny * pen;

    const svx = v1x + t * (v2x - v1x);
    const svy = v1y + t * (v2y - v1y);

    const rvx = b.vx - svx;
    const rvy = b.vy - svy;
    const vn = rvx * nx + rvy * ny;

    if (vn < 0) {
      const rest = restitution !== undefined ? restitution : 0.72;
      const fric = friction !== undefined ? friction : 0.35;
      const jn = -(1 + rest) * vn;
      const tx = -ny;
      const ty = nx;
      const vt = rvx * tx + rvy * ty;
      const jt = -vt * fric;

      b.vx += (jn * nx) + (jt * tx);
      b.vy += (jn * ny) + (jt * ty);
      b.spin += jt * 0.08;
    }
    return true;
  }
  return false;
}

// =========================================================================
// OFFSCREEN SKYLINE CANVAS CACHE (Eliminacja migotania okien i sub-pixel aliasingu)
// =========================================================================

let cachedArena1Towers = null;
let cachedArena1H = 0;

const FAR_TOWERS_ARENA1 = [
  { x: 40,   w: 68,  h: 300, spire: 40, side: 'cyan' },
  { x: 160,  w: 105, h: 410, spire: 60, side: 'cyan' },
  { x: 310,  w: 58,  h: 250, spire: 30, side: 'cyan' },
  { x: 410,  w: 125, h: 450, spire: 75, side: 'cyan' },
  { x: 580,  w: 80,  h: 330, spire: 45, side: 'cyan' },
  { x: 720,  w: 95,  h: 370, spire: 50, side: 'center' },
  { x: 870,  w: 115, h: 430, spire: 70, side: 'center' },
  { x: 1030, w: 85,  h: 320, spire: 40, side: 'orange' },
  { x: 1160, w: 130, h: 460, spire: 80, side: 'orange' },
  { x: 1340, w: 60,  h: 270, spire: 35, side: 'orange' },
  { x: 1450, w: 110, h: 400, spire: 60, side: 'orange' },
  { x: 1620, w: 75,  h: 310, spire: 40, side: 'orange' }
];

function getArena1TowersCanvas(horizonY) {
  const curH = Math.ceil(H);
  if (cachedArena1Towers && cachedArena1H === curH) {
    return cachedArena1Towers;
  }

  const cvs = document.createElement('canvas');
  cvs.width = 1800;
  cvs.height = curH;
  const cctx = cvs.getContext('2d');
  cctx.clearRect(0, 0, 1800, curH);

  for (let bIdx = 0; bIdx < FAR_TOWERS_ARENA1.length; bIdx++) {
    const b = FAR_TOWERS_ARENA1[bIdx];
    const bx = Math.round(b.x);
    const by = Math.round(horizonY + 35 - b.h);
    const bw = Math.round(b.w);
    const bh = Math.round(b.h + 120);

    // Bryła wieży w ciemnym graficie
    cctx.fillStyle = '#070a13';
    cctx.fillRect(bx, by, bw, bh);

    // Neonowa krawędź dachu
    const edgeCol = b.side === 'cyan' 
      ? 'rgba(6, 182, 212, 0.45)' 
      : (b.side === 'orange' ? 'rgba(249, 115, 22, 0.45)' : 'rgba(168, 85, 247, 0.35)');
    cctx.fillStyle = edgeCol;
    cctx.fillRect(bx, by, bw, 2);

    // Pasy okien LED / poziome szczeliny świetlne o stałej grubości 3px
    const winCol = b.side === 'cyan' 
      ? 'rgba(34, 211, 238, 0.28)' 
      : (b.side === 'orange' ? 'rgba(251, 146, 60, 0.28)' : 'rgba(192, 132, 252, 0.22)');
    cctx.fillStyle = winCol;
    let row = 0;
    for (let wy = by + 28; wy < by + b.h - 30; wy += 28, row++) {
      let col = 0;
      for (let wx = bx + 8; wx < bx + b.w - 8; wx += 14, col++) {
        // Stabilny, statyczny układ okien (nie zależy od pozycji kamery)
        if (((col * 3 + row * 5 + bIdx) % 7) < 4) {
          cctx.fillRect(Math.round(wx), Math.round(wy), 6, 3);
        }
      }
    }
  }

  cachedArena1Towers = cvs;
  cachedArena1H = curH;
  return cachedArena1Towers;
}

let cachedArena2FarTowers = null;
let cachedArena2NearTowers = null;
let cachedArena2H = 0;

const FAR_TOWERS_ARENA2 = [
  { x: 80, w: 90, h: 320 },
  { x: 220, w: 140, h: 420 },
  { x: 410, w: 85, h: 290 },
  { x: 540, w: 160, h: 470 },
  { x: 740, w: 110, h: 360 },
  { x: 890, w: 150, h: 430 },
  { x: 1080, w: 95, h: 310 }
];

const NEAR_TOWERS_ARENA2 = [
  { x: 60, w: 85, h: 260 },
  { x: 180, w: 120, h: 350 },
  { x: 340, w: 80, h: 230 },
  { x: 460, w: 140, h: 390 },
  { x: 640, w: 95, h: 280 },
  { x: 780, w: 130, h: 360 }
];

function getCyberFarCanvas() {
  const curH = Math.ceil(H);
  if (cachedArena2FarTowers && cachedArena2H === curH) {
    return cachedArena2FarTowers;
  }
  const cvs = document.createElement('canvas');
  cvs.width = 1200;
  cvs.height = curH;
  const cctx = cvs.getContext('2d');
  cctx.clearRect(0, 0, 1200, curH);
  cctx.fillStyle = '#080c14';

  for (const b of FAR_TOWERS_ARENA2) {
    const bx = Math.round(b.x);
    const by = Math.round(curH * 0.88 - b.h);
    cctx.fillRect(bx, by, Math.round(b.w), Math.round(b.h + 120));
  }
  cachedArena2FarTowers = cvs;
  return cachedArena2FarTowers;
}

function getCyberNearCanvas() {
  const curH = Math.ceil(H);
  if (cachedArena2NearTowers && cachedArena2H === curH) {
    return cachedArena2NearTowers;
  }
  const cvs = document.createElement('canvas');
  cvs.width = 960;
  cvs.height = curH;
  const cctx = cvs.getContext('2d');
  cctx.clearRect(0, 0, 960, curH);

  for (let bIdx = 0; bIdx < NEAR_TOWERS_ARENA2.length; bIdx++) {
    const b = NEAR_TOWERS_ARENA2[bIdx];
    const bx = Math.round(b.x);
    const by = Math.round(curH * 0.90 - b.h);
    const bw = Math.round(b.w);
    const bh = Math.round(b.h + 120);

    cctx.fillStyle = '#0f172a';
    cctx.fillRect(bx, by, bw, bh);

    let row = 0;
    for (let wy = by + 26; wy < by + b.h - 25; wy += 26, row++) {
      const isWinCyan = ((bIdx + row) % 2 === 0);
      cctx.fillStyle = isWinCyan ? 'rgba(6, 182, 212, 0.45)' : 'rgba(249, 115, 22, 0.45)';
      for (let wx = bx + 10; wx < bx + b.w - 10; wx += 16) {
        cctx.fillRect(Math.round(wx), Math.round(wy), 8, 4);
      }
    }
  }
  cachedArena2NearTowers = cvs;
  cachedArena2H = curH;
  return cachedArena2NearTowers;
}

export function invalidateSkyCache() {
  cachedArena1Towers = null;
  cachedArena2FarTowers = null;
  cachedArena2NearTowers = null;
  cachedArena1H = 0;
  cachedArena2H = 0;
}

export function drawNeonNightOpsSky(ctx, camX) {
  const time = performance.now() * 0.001;
  const horizonY = H * 0.74;

  // =========================================================================
  // 1. DUAL-TONE GRADIENT NIEBA (GŁĘBOKA CZERŃ KOSMICZNA + NEONOWA ŁUNA)
  // =========================================================================
  // A. Głęboka czerń kosmiczna i ciemny fiolet / obsydian
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0.0, '#020208');
  skyGrad.addColorStop(0.35, '#060714');
  skyGrad.addColorStop(0.68, '#0d0f22');
  skyGrad.addColorStop(1.0, '#15132d');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // B. Ambientowa poświata skrzydeł areny (Cyan po lewej, Orange po prawej)
  const leftGlowX = W * 0.20 + (ARENA_LEFT - camX) * 0.12;
  const rightGlowX = W * 0.80 + (ARENA_RIGHT - camX) * 0.12;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // Horyzontalna łuna na horyzoncie z płynnym wymieszaniem w ciemny, chłodny fiolet w centrum
  const horizGlow = ctx.createLinearGradient(0, 0, W, 0);
  horizGlow.addColorStop(0.0, 'rgba(6, 182, 212, 0.18)');
  horizGlow.addColorStop(0.28, 'rgba(6, 182, 212, 0.08)');
  horizGlow.addColorStop(0.50, 'rgba(79, 70, 229, 0.06)'); // ciemny, chłodny fiolet
  horizGlow.addColorStop(0.72, 'rgba(249, 115, 22, 0.08)');
  horizGlow.addColorStop(1.0, 'rgba(249, 115, 22, 0.18)');
  ctx.fillStyle = horizGlow;
  ctx.fillRect(0, H * 0.46, W, H * 0.54);

  // Lewa mgławica / radialny ambient bazy Cyan (rgba(6, 182, 212, 0.18))
  const cyanRadius = Math.max(W * 0.60, 640);
  const cyanNebula = ctx.createRadialGradient(leftGlowX, horizonY, 20, leftGlowX, horizonY, cyanRadius);
  cyanNebula.addColorStop(0.0, 'rgba(6, 182, 212, 0.18)');
  cyanNebula.addColorStop(0.42, 'rgba(6, 182, 212, 0.05)');
  cyanNebula.addColorStop(1.0, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = cyanNebula;
  ctx.fillRect(0, 0, W, H);

  // Prawa mgławica / radialny ambient bazy Orange (rgba(249, 115, 22, 0.18))
  const orangeRadius = Math.max(W * 0.60, 640);
  const orangeNebula = ctx.createRadialGradient(rightGlowX, horizonY, 20, rightGlowX, horizonY, orangeRadius);
  orangeNebula.addColorStop(0.0, 'rgba(249, 115, 22, 0.18)');
  orangeNebula.addColorStop(0.42, 'rgba(249, 115, 22, 0.05)');
  orangeNebula.addColorStop(1.0, 'rgba(249, 115, 22, 0)');
  ctx.fillStyle = orangeNebula;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // =========================================================================
  // 2. CYFROWY PYŁ / NEONOWE ISKRY W TLE
  // =========================================================================
  const dustCount = 55;
  for (let i = 0; i < dustCount; i++) {
    const seed = i * 71.197;
    const periodX = 3600;
    const worldX = ((seed * 197.3 + time * 22 * ((i % 3 === 0) ? -1 : 1)) % periodX + periodX) % periodX;
    const scrX = Math.round(((worldX - camX * 0.04) % W + W) % W);
    const normY = (Math.sin(seed * 3.7) * 0.5 + 0.5);
    const scrY = Math.round(normY * (H * 0.70) + Math.sin(time * 1.5 + seed) * 10);

    const twinkle = Math.sin(time * 2.6 + seed * 4.1) * 0.5 + 0.5;
    const isCyanSide = (worldX < periodX * 0.5);
    const alpha = (0.28 + twinkle * 0.62).toFixed(2);
    ctx.fillStyle = isCyanSide ? `rgba(34, 211, 238, ${alpha})` : `rgba(251, 146, 60, ${alpha})`;
    const size = (i % 6 === 0) ? 2.4 : ((i % 2 === 0) ? 1.6 : 1.0);
    ctx.fillRect(scrX, scrY, size, size);
  }

  // =========================================================================
  // 3. SUBTELNA NEONOWA SIATKA WEKTOROWA (SYNTHWAVE GRID NA HORYZONCIE)
  // =========================================================================
  ctx.save();
  const gridTopY = H * 0.65;
  const gridBottomY = H * 0.88;
  const vanishX = W * 0.50 + (1760 - camX) * 0.12;

  // Poziome linie perspektywiczne (rozstaw zagęszczony ku horyzontowi)
  const horizLines = 6;
  for (let l = 1; l <= horizLines; l++) {
    const t = l / horizLines;
    const ly = Math.round(gridTopY + (gridBottomY - gridTopY) * (t * t));
    const lineGrad = ctx.createLinearGradient(0, ly, W, ly);
    lineGrad.addColorStop(0.0, `rgba(6, 182, 212, ${0.16 * t})`);
    lineGrad.addColorStop(0.5, `rgba(168, 85, 247, ${0.10 * t})`);
    lineGrad.addColorStop(1.0, `rgba(249, 115, 22, ${0.16 * t})`);
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, ly);
    ctx.lineTo(W, ly);
    ctx.stroke();
  }

  ctx.restore();

  // =========================================================================
  // 4. WARSTWA DALEKA: MEGA-WIEŻE I PYLONY (OFFSCREEN CACHING + ZERO ALIASING)
  // =========================================================================
  const towersCanvas = getArena1TowersCanvas(Math.round(horizonY));
  const farPeriod = 1800;
  const parallaxFactor = 0.03;
  // Całkowite zaokrąglenie przesunięcia kamery (eliminacja subpixel aliasingu):
  const farOffset = Math.floor(((camX * parallaxFactor) % farPeriod + farPeriod) % farPeriod);

  const minLoop = Math.floor((-farOffset) / farPeriod) - 1;
  const maxLoop = Math.ceil((W - farOffset) / farPeriod) + 1;
  for (let loop = minLoop; loop <= maxLoop; loop++) {
    const drawX = Math.floor(loop * farPeriod - farOffset);
    if (drawX + farPeriod < 0 || drawX > W) continue;
    ctx.drawImage(towersCanvas, drawX, 0);
  }

  // =========================================================================
  // 6. KRZYŻUJĄCE SIĘ NEONOWE LASERY / REFLEKTORY (SPOTLIGHTS)
  // =========================================================================
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  const leftSpotX = W * 0.18 + (ARENA_LEFT - camX) * 0.12;
  const rightSpotX = W * 0.82 + (ARENA_RIGHT - camX) * 0.12;
  const spotSourceY = horizonY + 30;
  const beamLen = Math.max(H * 2.2, 1300);

  // A. LEWY REFLEKTOR (CYAN)
  const leftAngle = 0.40 + Math.sin(time * 0.85) * 0.24;
  ctx.save();
  ctx.translate(leftSpotX, spotSourceY);
  ctx.rotate(leftAngle);

  // Szeroki snop światła Cyan: rgba(6, 182, 212, 0.28) -> rgba(6, 182, 212, 0)
  const cyanBeam = ctx.createLinearGradient(0, 0, 0, -beamLen);
  cyanBeam.addColorStop(0.0, 'rgba(6, 182, 212, 0.28)');
  cyanBeam.addColorStop(0.25, 'rgba(6, 182, 212, 0.16)');
  cyanBeam.addColorStop(0.65, 'rgba(6, 182, 212, 0.05)');
  cyanBeam.addColorStop(1.0, 'rgba(6, 182, 212, 0.0)');
  ctx.fillStyle = cyanBeam;

  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-160, -beamLen);
  ctx.lineTo(160, -beamLen);
  ctx.lineTo(18, 0);
  ctx.closePath();
  ctx.fill();

  // Wewnętrzny rdzeń lasera o wyższej jasności
  const cyanCore = ctx.createLinearGradient(0, 0, 0, -beamLen);
  cyanCore.addColorStop(0.0, 'rgba(165, 243, 252, 0.32)');
  cyanCore.addColorStop(0.35, 'rgba(34, 211, 238, 0.14)');
  cyanCore.addColorStop(1.0, 'rgba(6, 182, 212, 0.0)');
  ctx.fillStyle = cyanCore;
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(-55, -beamLen);
  ctx.lineTo(55, -beamLen);
  ctx.lineTo(6, 0);
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // B. PRAWY REFLEKTOR (ORANGE)
  const rightAngle = -0.40 - Math.sin(time * 0.75 + 1.4) * 0.24;
  ctx.save();
  ctx.translate(rightSpotX, spotSourceY);
  ctx.rotate(rightAngle);

  // Szeroki snop światła Orange: rgba(249, 115, 22, 0.28) -> rgba(249, 115, 22, 0)
  const orangeBeam = ctx.createLinearGradient(0, 0, 0, -beamLen);
  orangeBeam.addColorStop(0.0, 'rgba(249, 115, 22, 0.28)');
  orangeBeam.addColorStop(0.25, 'rgba(249, 115, 22, 0.16)');
  orangeBeam.addColorStop(0.65, 'rgba(249, 115, 22, 0.05)');
  orangeBeam.addColorStop(1.0, 'rgba(249, 115, 22, 0.0)');
  ctx.fillStyle = orangeBeam;

  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-160, -beamLen);
  ctx.lineTo(160, -beamLen);
  ctx.lineTo(18, 0);
  ctx.closePath();
  ctx.fill();

  // Wewnętrzny rdzeń lasera o wyższej jasności
  const orangeCore = ctx.createLinearGradient(0, 0, 0, -beamLen);
  orangeCore.addColorStop(0.0, 'rgba(254, 215, 170, 0.32)');
  orangeCore.addColorStop(0.35, 'rgba(251, 146, 60, 0.14)');
  orangeCore.addColorStop(1.0, 'rgba(249, 115, 22, 0.0)');
  ctx.fillStyle = orangeCore;
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(-55, -beamLen);
  ctx.lineTo(55, -beamLen);
  ctx.lineTo(6, 0);
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = '#f97316';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#fb923c';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

export const drawSoldatParallax = drawNeonNightOpsSky;

function drawCyberStadiumSky(ctx, camX) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0.0, '#030712');
  sky.addColorStop(0.42, '#090d16');
  sky.addColorStop(0.75, '#0f172a');
  sky.addColorStop(1.0, '#1e1b4b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const time = performance.now() * 0.0012;

  const farCanvas = getCyberFarCanvas();
  const farPeriod = 1200;
  const farOffset = Math.floor(((camX * 0.04) % farPeriod + farPeriod) % farPeriod);
  const minFarLoop = Math.floor((-farOffset) / farPeriod) - 1;
  const maxFarLoop = Math.ceil((W - farOffset) / farPeriod) + 1;
  for (let loop = minFarLoop; loop <= maxFarLoop; loop++) {
    const drawX = Math.floor(loop * farPeriod - farOffset);
    if (drawX + farPeriod < 0 || drawX > W) continue;
    ctx.drawImage(farCanvas, drawX, 0);
  }

  const nearCanvas = getCyberNearCanvas();
  const nearPeriod = 960;
  const nearOffset = Math.floor(((camX * 0.10) % nearPeriod + nearPeriod) % nearPeriod);
  const minNearLoop = Math.floor((-nearOffset) / nearPeriod) - 1;
  const maxNearLoop = Math.ceil((W - nearOffset) / nearPeriod) + 1;
  for (let loop = minNearLoop; loop <= maxNearLoop; loop++) {
    const drawX = Math.floor(loop * nearPeriod - nearOffset);
    if (drawX + nearPeriod < 0 || drawX > W) continue;
    ctx.drawImage(nearCanvas, drawX, 0);
  }

  if (camera) {
    const spots = [
      { worldX: 240, baseAngle: 0.38, color: 'rgba(6, 182, 212, ' },
      { worldX: 460, baseAngle: 0.20, color: 'rgba(56, 189, 248, ' },
      { worldX: 1460, baseAngle: -0.20, color: 'rgba(251, 146, 60, ' },
      { worldX: 1680, baseAngle: -0.38, color: 'rgba(249, 115, 22, ' }
    ];

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const beamLen = 950 * camera.zoom;
    for (let i = 0; i < spots.length; i++) {
      const s = spots[i];
      const sourceScreenX = W * 0.40 + (s.worldX - camera.x) * camera.zoom;
      const sourceScreenY = H * 0.68 + ((GROUND_Y - 520) - camera.y) * camera.zoom;

      const sway = Math.sin(time * 1.5 + i * 1.6) * 0.10;
      const currentAngle = s.baseAngle + sway;

      ctx.save();
      ctx.translate(sourceScreenX, sourceScreenY);
      ctx.rotate(currentAngle);

      const beamGrad = ctx.createLinearGradient(0, 0, 0, beamLen);
      beamGrad.addColorStop(0.0, `${s.color}0.55)`);
      beamGrad.addColorStop(0.35, `${s.color}0.22)`);
      beamGrad.addColorStop(0.75, `${s.color}0.07)`);
      beamGrad.addColorStop(1.0, `${s.color}0.0)`);

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(-16 * camera.zoom, 0);
      ctx.lineTo(-150 * camera.zoom, beamLen);
      ctx.lineTo(150 * camera.zoom, beamLen);
      ctx.lineTo(16 * camera.zoom, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 7 * camera.zoom, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }
}

export function drawSky(ctx) {
  if (activeArenaId === 'ARENA_2') {
    drawCyberStadiumSky(ctx, camera ? camera.x : 960);
  } else {
    drawNeonNightOpsSky(ctx, camera ? camera.x : 1760);
  }
}

export function drawGround(ctx, worldLeft, worldWidth) {
  const startX = ARENA_LEFT - 300;
  const endX = ARENA_RIGHT + 300;
  const w = endX - startX;

  // Głęboki techniczny korpus podłoża
  ctx.fillStyle = '#090d16';
  ctx.fillRect(startX, GROUND_Y, w, 700);

  // Podpowierzchniowy pas techniczny
  ctx.fillStyle = '#111827';
  ctx.fillRect(startX, GROUND_Y + 1, w, 14);

  // Znaczniki siatki technicznej co 60px
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let mx = ARENA_LEFT; mx <= ARENA_RIGHT; mx += 60) {
    ctx.fillRect(mx, GROUND_Y + 2, 2, 8);
  }

  // =========================================================================
  // NEONOWA POWIERZCHNIA PODŁOŻA (CYAN -> ORANGE SYNTHWAVE RAIL)
  // =========================================================================
  ctx.save();
  const surfaceGrad = ctx.createLinearGradient(ARENA_LEFT, GROUND_Y, ARENA_RIGHT, GROUND_Y);
  surfaceGrad.addColorStop(0.0, '#06b6d4');
  surfaceGrad.addColorStop(0.45, '#00e5ff');
  surfaceGrad.addColorStop(0.55, '#f97316');
  surfaceGrad.addColorStop(1.0, '#ff7700');

  // Szeroka poświata neonowa
  ctx.strokeStyle = surfaceGrad;
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 14;
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.moveTo(ARENA_LEFT, GROUND_Y);
  ctx.lineTo(ARENA_RIGHT, GROUND_Y);
  ctx.stroke();

  // Jaskrawy, biało-neonowy rdzeń świetlny
  const coreGrad = ctx.createLinearGradient(ARENA_LEFT, GROUND_Y, ARENA_RIGHT, GROUND_Y);
  coreGrad.addColorStop(0.0, '#a5f3fc');
  coreGrad.addColorStop(0.48, '#ffffff');
  coreGrad.addColorStop(0.52, '#ffffff');
  coreGrad.addColorStop(1.0, '#fed7aa');
  ctx.strokeStyle = coreGrad;
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 6;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(ARENA_LEFT, GROUND_Y);
  ctx.lineTo(ARENA_RIGHT, GROUND_Y);
  ctx.stroke();

  // Subtelne przedłużenie krawędzi poza liniami bramkowymi (bufor areny)
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2.0;
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(startX, GROUND_Y);
  ctx.lineTo(ARENA_LEFT, GROUND_Y);
  ctx.stroke();

  ctx.strokeStyle = '#f97316';
  ctx.shadowColor = '#f97316';
  ctx.beginPath();
  ctx.moveTo(ARENA_RIGHT, GROUND_Y);
  ctx.lineTo(endX, GROUND_Y);
  ctx.stroke();

  // Pionowe neonowe ściany energetyczne za bramkami
  drawArenaEnergyBoundaries(ctx, GROUND_Y);

  ctx.restore();
}

export function drawArenaEnergyBoundaries(ctx, groundY) {
  const isArena2 = (activeArenaId === 'ARENA_2');
  const leftX = isArena2 ? 150 : ARENA_LEFT;
  const rightX = isArena2 ? 1770 : ARENA_RIGHT;
  const barrierH = 3000; // ok. 300 jednostek/metrów w skali gry (1m = 10px)
  const topY = groundY - barrierH;
  const time = performance.now() * 0.0012;
  const pulse = 0.82 + 0.18 * Math.sin(time * 3.5);

  const walls = [
    {
      x: leftX,
      color: '#06b6d4',
      coreColor: '#a5f3fc',
      glowColor: '#00e5ff',
      fadeDir: 1
    },
    {
      x: rightX,
      color: '#f97316',
      coreColor: '#fed7aa',
      glowColor: '#ff7700',
      fadeDir: -1
    }
  ];

  for (const w of walls) {
    ctx.save();

    // 1. Półprzezroczysta pionowa kurtyna pola siłowego (fading 38px do wnętrza boiska)
    const fieldW = 38;
    const fieldGrad = ctx.createLinearGradient(w.x, 0, w.x + w.fadeDir * fieldW, 0);
    fieldGrad.addColorStop(0.0, w.fadeDir === 1 ? `rgba(6, 182, 212, ${0.28 * pulse})` : `rgba(249, 115, 22, ${0.28 * pulse})`);
    fieldGrad.addColorStop(0.35, w.fadeDir === 1 ? `rgba(0, 229, 255, ${0.12 * pulse})` : `rgba(255, 119, 0, ${0.12 * pulse})`);
    fieldGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = fieldGrad;
    const fx = w.fadeDir === 1 ? w.x : (w.x - fieldW);
    ctx.fillRect(fx, topY, fieldW, barrierH);

    // 2. Dynamiczne impulsy energii wznoszące się wzdłuż ściany
    const step = 50;
    const offset = (time * 75) % step;
    ctx.fillStyle = w.fadeDir === 1 ? 'rgba(165, 243, 252, 0.38)' : 'rgba(254, 215, 170, 0.38)';
    for (let py = groundY - offset; py > topY; py -= step) {
      const rw = 16 + Math.sin(py * 0.03 + time * 3) * 6;
      const rx = w.fadeDir === 1 ? w.x : (w.x - rw);
      ctx.fillRect(rx, py, rw, 1.8);
    }

    // 3. Główna pionowa neonowa linia energetyczna z potężnym rozbłyskiem (glow)
    ctx.strokeStyle = w.color;
    ctx.shadowColor = w.glowColor;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(w.x, groundY);
    ctx.lineTo(w.x, topY);
    ctx.stroke();

    // 4. Intensywny biały rdzeń lasera energetycznego
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = w.coreColor;
    ctx.shadowBlur = 6;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(w.x, groundY);
    ctx.lineTo(w.x, topY);
    ctx.stroke();

    // 5. Emiter podłożowy u nasady ściany
    ctx.fillStyle = w.color;
    ctx.shadowColor = w.glowColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(w.x, groundY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export function drawDistanceMarkers(ctx, worldLeft, worldRight) { }
export function drawStadiumForeground() { }
export function clearDesertSandstorm() { }
export function clearWinterBlizzard() { }

let lastTime = performance.now();
let frameCount = 0;
export let currentFps = 60;

export function updateFps() {
  frameCount++;
  const now = performance.now();
  const elapsed = now - lastTime;
  if (elapsed >= 500) {
    currentFps = Math.round((frameCount * 1000) / elapsed);
    frameCount = 0;
    lastTime = now;
  }
}

export function drawTouchControls(ctx, player, leftStick, btnCluster, rightStick, ball, inKickRange = null) {
  if (!isTouchDevice || !ctx || !player) return;

  ctx.save();

  // 1. LEWY DRĄŻEK: RUCH, SKOK W GÓRĘ I JETPACK
  if (leftStick && (leftStick.active || leftStick.waitingForJetpackTap)) {
    const isJetReady = leftStick.waitingForJetpackTap && leftStick.jetpackWindowTimer > 0;
    const isJetActive = leftStick.isJetpacking;

    let stickBorder = 'rgba(255, 255, 255, 0.2)';
    let stickGlow = 'transparent';

    if (isJetActive) {
      stickBorder = '#00e5ff';
      stickGlow = '#00e5ff';
    } else if (isJetReady) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.02);
      stickBorder = `rgba(0, 229, 255, ${0.4 + pulse * 0.5})`;
      stickGlow = '#00e5ff';
    }

    const bgGrad = ctx.createRadialGradient(leftStick.baseX, leftStick.baseY, 10, leftStick.baseX, leftStick.baseY, 55);
    bgGrad.addColorStop(0.0, 'rgba(30, 41, 59, 0.55)');
    bgGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.45)');

    ctx.beginPath();
    ctx.arc(leftStick.baseX, leftStick.baseY, 55, 0, Math.PI * 2);
    ctx.fillStyle = bgGrad;
    ctx.fill();
    ctx.shadowColor = stickGlow;
    ctx.shadowBlur = isJetActive ? 10 : (isJetReady ? 6 : 0);
    ctx.strokeStyle = stickBorder;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.font = 'bold 8.5px monospace';
    ctx.fillStyle = isJetActive ? '#00e5ff' : (isJetReady ? '#38bdf8' : 'rgba(255, 255, 255, 0.4)');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('▲ SKOK / JET', leftStick.baseX, leftStick.baseY - 60);

    if (isJetReady) {
      ctx.fillStyle = '#00e5ff';
      ctx.fillText('⚡ JETPACK READY', leftStick.baseX, leftStick.baseY + 68);
    }

    const knobX = leftStick.baseX + (leftStick.axisX * (leftStick.maxRadius || 55));
    const knobY = leftStick.baseY + (leftStick.axisY * (leftStick.maxRadius || 55));

    const knobGrad = ctx.createRadialGradient(knobX - 4, knobY - 4, 3, knobX, knobY, 24);
    if (isJetActive) {
      knobGrad.addColorStop(0.0, 'rgba(0, 229, 255, 0.95)');
      knobGrad.addColorStop(0.6, 'rgba(14, 116, 144, 0.85)');
      knobGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.90)');
    } else {
      knobGrad.addColorStop(0.0, 'rgba(56, 189, 248, 0.85)');
      knobGrad.addColorStop(0.6, 'rgba(14, 116, 144, 0.75)');
      knobGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.85)');
    }

    ctx.beginPath();
    ctx.arc(knobX, knobY, 24, 0, Math.PI * 2);
    ctx.fillStyle = knobGrad;
    ctx.fill();
    ctx.strokeStyle = isJetActive ? '#00e5ff' : '#38bdf8';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(knobX, knobY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  // 2. PRAWY DRĄŻEK: CELOWANIE, OGIEŃ ORAZ DYNAMICZNY WYKOP PIŁKI
  const rsVisible = (rightStick && (rightStick.active || rightStick.waitingForSecondTap || rightStick.lingerAlpha > 0.01));

  if (rsVisible) {
    const isFiring = rightStick.active && rightStick.isShooting;
    const isWaitingTap = rightStick.waitingForSecondTap && rightStick.windowTimer > 0;

    // Sprawdzenie stanu zasięgu do piłki i wychylenia drążka
    const activeBall = ball || player._ball;
    const inKickRangeVal = (inKickRange !== null && inKickRange !== undefined)
      ? inKickRange
      : (player.inKickReach !== undefined ? player.inKickReach : (activeBall && typeof player.isBallInKickReach === 'function' ? player.isBallInKickReach(player, activeBall) : false));
    const isStickDeflected = rightStick.active && (rightStick.power > 0.12 || (rightStick.movedDist || 0) > 8);
    const isKickReady = inKickRangeVal && isStickDeflected;

    let mainColor = '#00e5ff';
    let glowColor = '#00e5ff';
    let baseBorder = 'rgba(0, 229, 255, 0.35)';

    if (isKickReady) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.015);
      const isStrong = (player.chargePower >= 0.7) || (rightStick.power >= 0.7);
      mainColor = isStrong ? '#facc15' : '#00e5ff';
      glowColor = mainColor;
      baseBorder = isStrong
        ? `rgba(250, 204, 21, ${0.7 + pulse * 0.3})`
        : `rgba(0, 229, 255, ${0.7 + pulse * 0.3})`;
    } else if (isFiring) {
      mainColor = '#f97316';
      glowColor = '#ef4444';
      baseBorder = 'rgba(249, 115, 22, 0.6)';
    } else if (isWaitingTap) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.02);
      mainColor = pulse > 0.5 ? '#facc15' : '#00e5ff';
      glowColor = mainColor;
      baseBorder = `rgba(250, 204, 21, ${0.4 + pulse * 0.4})`;
    }

    ctx.save();
    ctx.globalAlpha = rightStick.lingerAlpha !== undefined ? rightStick.lingerAlpha : 1.0;

    const bx = rightStick.baseX;
    const by = rightStick.baseY;
    const maxR = rightStick.maxRadius || 65;

    const bgGrad = ctx.createRadialGradient(bx, by, 10, bx, by, maxR);
    bgGrad.addColorStop(0.0, isKickReady ? 'rgba(15, 23, 42, 0.75)' : 'rgba(30, 41, 59, 0.65)');
    bgGrad.addColorStop(1.0, isKickReady ? 'rgba(2, 6, 23, 0.85)' : 'rgba(15, 23, 42, 0.45)');

    ctx.beginPath();
    ctx.arc(bx, by, maxR, 0, Math.PI * 2);
    ctx.fillStyle = bgGrad;
    ctx.fill();

    ctx.shadowColor = isKickReady ? glowColor : 'transparent';
    ctx.shadowBlur = isKickReady ? 10 : 0;
    ctx.strokeStyle = baseBorder;
    ctx.lineWidth = isKickReady ? 2.2 : 1.6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (!isKickReady) {
      ctx.strokeStyle = isFiring ? 'rgba(249, 115, 22, 0.5)' : 'rgba(0, 229, 255, 0.4)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(bx - 10, by); ctx.lineTo(bx + 10, by);
      ctx.moveTo(bx, by - 10); ctx.lineTo(bx + 10, by);
      ctx.stroke();
    }

    let knobX = bx;
    let knobY = by;

    if (rightStick.active) {
      const dx = rightStick.curX - bx;
      const dy = rightStick.curY - by;
      const rawDist = Math.hypot(dx, dy);
      const normX = rawDist > 0.001 ? dx / rawDist : 1;
      const normY = rawDist > 0.001 ? dy / rawDist : 0;

      const clampedDist = Math.min(rawDist, maxR);
      knobX = bx + normX * clampedDist;
      knobY = by + normY * clampedDist;

      if (isKickReady) {
        // Wektorowa strzałka wskazująca dokładny tor lotu piłki po puszczeniu palca
        const arrowPower = Math.min(1.0, Math.max(0.15, rightStick.power || (clampedDist / maxR)));
        const arrowLen = 30 + arrowPower * 35;
        const arrowStartX = knobX + normX * 14;
        const arrowStartY = knobY + normY * 14;
        const arrowEndX = arrowStartX + normX * arrowLen;
        const arrowEndY = arrowStartY + normY * arrowLen;

        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(knobX, knobY);
        ctx.lineTo(arrowEndX, arrowEndY);
        ctx.stroke();

        // Grot wektora
        const headLen = 11;
        const headAngle = Math.atan2(normY, normX);
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.moveTo(arrowEndX, arrowEndY);
        ctx.lineTo(
          arrowEndX - headLen * Math.cos(headAngle - Math.PI / 6),
          arrowEndY - headLen * Math.sin(headAngle - Math.PI / 6)
        );
        ctx.lineTo(
          arrowEndX - headLen * Math.cos(headAngle + Math.PI / 6),
          arrowEndY - headLen * Math.sin(headAngle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.strokeStyle = isFiring ? 'rgba(249, 115, 22, 0.8)' : 'rgba(0, 229, 255, 0.6)';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(knobX, knobY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    const knobGrad = ctx.createRadialGradient(knobX - 4, knobY - 4, 3, knobX, knobY, 22);
    if (isKickReady) {
      if ((player.chargePower >= 0.7) || (rightStick.power >= 0.7)) {
        knobGrad.addColorStop(0.0, 'rgba(250, 204, 21, 0.95)');
        knobGrad.addColorStop(0.55, 'rgba(234, 179, 8, 0.80)');
        knobGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.90)');
      } else {
        knobGrad.addColorStop(0.0, 'rgba(0, 229, 255, 0.95)');
        knobGrad.addColorStop(0.55, 'rgba(14, 116, 144, 0.80)');
        knobGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.90)');
      }
    } else if (isFiring) {
      knobGrad.addColorStop(0.0, 'rgba(251, 146, 60, 0.95)');
      knobGrad.addColorStop(0.6, 'rgba(220, 38, 38, 0.75)');
      knobGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.85)');
    } else {
      knobGrad.addColorStop(0.0, 'rgba(0, 229, 255, 0.90)');
      knobGrad.addColorStop(0.55, 'rgba(6, 182, 212, 0.65)');
      knobGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.80)');
    }

    ctx.beginPath();
    ctx.arc(knobX, knobY, 22, 0, Math.PI * 2);
    ctx.fillStyle = knobGrad;
    ctx.fill();

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isKickReady ? 10 : 8;
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = isKickReady ? 2.6 : 2.2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (isKickReady) {
      // Czytelny napis ⚽ KOP na gałce zamiast celownika
      ctx.save();
      ctx.font = '900 10.5px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 6;
      ctx.fillText('⚽ KOP', knobX, knobY);
      ctx.restore();
    } else {
      // Standardowy celownik broni
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(knobX, knobY, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(knobX - 10, knobY); ctx.lineTo(knobX - 7, knobY);
      ctx.moveTo(knobX + 7, knobY); ctx.lineTo(knobX + 10, knobY);
      ctx.moveTo(knobX, knobY - 10); ctx.lineTo(knobX, knobY - 7);
      ctx.moveTo(knobX, knobY + 7); ctx.lineTo(knobX, knobY + 10);
      ctx.stroke();
    }

    let statusText = 'CELOWNIK';
    if (isKickReady) {
      const pPct = Math.round((player.chargePower || rightStick.power || 0) * 100);
      statusText = `⚽ WYKOP: ${pPct}% (PUŚĆ)`;
    } else if (isFiring) {
      statusText = '🔥 OGIEŃ CIĄGŁY';
    } else if (isWaitingTap) {
      statusText = '⚡ TAP = STRZAŁ';
    }

    ctx.font = 'bold 8.5px monospace';
    ctx.fillStyle = mainColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(statusText, bx, by + maxR + 15);

    ctx.restore();
  }

  // 3. PRZYCISK WŚLIZG
  if (btnCluster && btnCluster.slide) {
    const glassBg = 'rgba(15, 23, 42, 0.55)';
    const slide = btnCluster.slide;
    const slideR = slide.r || 30;
    const isSlideReady = Math.abs(player.vx) >= (player.currentClass?.stats?.sprintMax || CONFIG.SPRINT_MAX) * 0.82;
    const isSlideActive = player.isSliding || slide.active;

    let slideBorder = 'rgba(255, 255, 255, 0.15)';
    let slideBg = glassBg;
    let slideAccent = 'rgba(255, 255, 255, 0.4)';

    if (isSlideReady || isSlideActive) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.009);
      slideBorder = '#10b981';
      slideBg = `rgba(16, 185, 129, ${0.18 + pulse * 0.22})`;
      slideAccent = '#10b981';

      ctx.beginPath();
      ctx.arc(slide.x, slide.y, slideR + 3 + pulse * 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(16, 185, 129, ${(1 - pulse) * 0.65})`;
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(slide.x, slide.y, slideR, 0, Math.PI * 2);
    ctx.fillStyle = slideBg;
    ctx.fill();
    ctx.strokeStyle = slideBorder;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.save();
    ctx.translate(slide.x, slide.y);
    ctx.beginPath();
    ctx.moveTo(-10, 4); ctx.lineTo(8, 4); ctx.lineTo(10, 0); ctx.lineTo(4, -4); ctx.lineTo(-4, -4); ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fillStyle = slideAccent;
    ctx.fill();

    ctx.fillStyle = isSlideReady ? '#10b981' : 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 8.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WŚLIZG', 0, 16);
    ctx.restore();
  }

  ctx.restore();
}

export function drawEntityHealthBar(ctx, entity, yOffset = -12) {
  if (!entity || entity.isDead) return;
  const barW = 34;
  const barH = 4.5;
  const x = (entity.x + entity.w / 2) - barW / 2;
  const y = entity.y + yOffset;

  const maxHp = entity.maxHp || 100;
  const curHp = Math.max(0, entity.hp ?? 100);
  const ratio = Math.max(0, Math.min(1, curHp / maxHp));
  const col = ratio > 0.5 ? '#22c55e' : (ratio > 0.25 ? '#f97316' : '#ef4444');

  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(x - 1, y - 1, barW + 2, barH + 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x - 1, y - 1, barW + 2, barH + 2);

  if (ratio > 0) {
    ctx.fillStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 4;
    ctx.fillRect(x, y, barW * ratio, barH);
  }
  ctx.restore();
}

export function drawOffscreenBallIndicator(ctx, ball, camera, player) {
  if (!ball || !camera) return;

  const screenX = W * 0.40 + (ball.x - camera.x) * camera.zoom;
  const screenY = H * 0.68 + (ball.y - camera.y) * camera.zoom;

  const margin = 35;
  const minX = margin;
  const maxX = W - margin;
  const minY = margin;
  const maxY = H - margin;

  const isOffscreen = (screenX < minX || screenX > maxX || screenY < minY || screenY > maxY);
  if (!isOffscreen) return;

  const cx = W / 2;
  const cy = H / 2;
  const dx = screenX - cx;
  const dy = screenY - cy;
  if (dx === 0 && dy === 0) return;

  const angle = Math.atan2(dy, dx);
  let t = Infinity;

  if (dx > 0) {
    const tCandidate = (maxX - cx) / dx;
    if (tCandidate > 0 && tCandidate < t) t = tCandidate;
  } else if (dx < 0) {
    const tCandidate = (minX - cx) / dx;
    if (tCandidate > 0 && tCandidate < t) t = tCandidate;
  }

  if (dy > 0) {
    const tCandidate = (maxY - cy) / dy;
    if (tCandidate > 0 && tCandidate < t) t = tCandidate;
  } else if (dy < 0) {
    const tCandidate = (minY - cy) / dy;
    if (tCandidate > 0 && tCandidate < t) t = tCandidate;
  }

  const ix = Math.max(minX, Math.min(maxX, cx + dx * t));
  const iy = Math.max(minY, Math.min(maxY, cy + dy * t));

  ctx.save();
  ctx.translate(ix, iy);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-10, -9);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-10, 9);
  ctx.closePath();
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.restore();

  const pX = player ? (player.x + player.w / 2) : camera.x;
  const pY = player ? (player.y + player.h / 2) : camera.y;
  const distMeters = Math.round(Math.hypot(ball.x - pX, ball.y - pY) / 14);

  ctx.save();
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#facc15';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 6;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textDist = 24;
  const textX = ix - Math.cos(angle) * textDist;
  const textY = iy - Math.sin(angle) * textDist;
  ctx.fillText(`${distMeters}m`, textX, textY);
  ctx.restore();
}


/**
 * Rysowanie taktycznego prostokąta ze ściętym prawym górnym narożnikiem (tactical sci-fi chamfer)
 */
function drawChamferedBar(ctx, x, y, w, h, chamfer = 6) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w - chamfer, y);
  ctx.lineTo(x + w, y + chamfer);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
}

/**
 * Rysuje sylwetkę broni w slocie HUD.
 */
export function drawWeaponSilhouette(ctx, type, cx, cy, isSelected) {
  ctx.save();
  ctx.translate(cx, cy);

  if (isSelected) {
    ctx.fillStyle = type === 'SHOTGUN' ? 'rgba(251, 146, 60, 0.45)' : 'rgba(250, 204, 21, 0.45)';
  } else {
    ctx.fillStyle = '#94A3B8';
  }

  if (type === 'AK47') {
    // Kolba
    ctx.fillRect(-17, -1, 7, 3);
    // Komora i łoże
    ctx.fillRect(-10, -2, 16, 4);
    // Magazynek łukowy
    ctx.beginPath();
    ctx.moveTo(-5, 2);
    ctx.lineTo(-2, 7);
    ctx.lineTo(1, 7);
    ctx.lineTo(-1, 2);
    ctx.closePath();
    ctx.fill();
    // Lufa
    ctx.fillRect(6, -1, 10, 2);
  } else if (type === 'SHOTGUN') {
    // Kolba
    ctx.fillRect(-16, -1, 8, 4);
    // Komora zamkowa
    ctx.fillRect(-8, -2, 12, 5);
    // Długa lufa i podlufowy magazynek
    ctx.fillRect(4, -2, 12, 3);
    ctx.fillRect(4, 1, 10, 2);
  }

  ctx.restore();
}

/**
 * Rysuje pojedynczy slot broni w interfejsie HUD z zachowaniem maksymalnego kontrastu.
 */
export function drawWeaponSlot(ctx, btn, isSelected, player) {
  const isActive = isSelected;
  const accentCol = btn.id === 'SHOTGUN' ? '#fb923c' : '#f59e0b';

  // Pobranie stanu amunicji z obiektu gracza
  const ammoObj = player.ammo?.[btn.id];
  const defMag = (btn.id === 'SHOTGUN' ? 8 : 30);
  const defRes = (btn.id === 'SHOTGUN' ? 64 : 90);
  const bCurrentAmmo = ammoObj ? ammoObj.currentAmmo : defMag;
  const bReserveAmmo = ammoObj ? ammoObj.reserveAmmo : defRes;
  const bMagSize = ammoObj ? (ammoObj.magSize || defMag) : defMag;
  const bIsReloading = !!ammoObj?.isReloading;
  const bIsNoAmmo = (bCurrentAmmo === 0 && bReserveAmmo === 0);
  const bIsLowAmmo = (!bIsNoAmmo && bCurrentAmmo <= Math.ceil(bMagSize * 0.25));

  ctx.save();

  if (!isActive) {
    ctx.globalAlpha = 0.95;
  } else {
    ctx.globalAlpha = 1.0;
  }

  // 1. Tło w stylu Dark Glass ze ściętym narożnikiem (chamfer)
  ctx.beginPath();
  const chamfer = 6;
  ctx.moveTo(btn.x, btn.y);
  ctx.lineTo(btn.x + btn.w - chamfer, btn.y);
  ctx.lineTo(btn.x + btn.w, btn.y + chamfer);
  ctx.lineTo(btn.x + btn.w, btn.y + btn.h);
  ctx.lineTo(btn.x, btn.y + btn.h);
  ctx.closePath();

  ctx.fillStyle = isActive
    ? 'rgba(30, 41, 59, 0.88)'
    : 'rgba(15, 23, 42, 0.85)';
  ctx.fill();

  // 2. Obrys ramki
  let borderCol = isActive ? accentCol : 'rgba(148, 163, 184, 0.35)';
  if (isActive && bIsNoAmmo) borderCol = '#ef4444';
  else if (isActive && bIsLowAmmo) borderCol = '#f97316';

  ctx.strokeStyle = borderCol;
  ctx.lineWidth = isActive ? 1.4 : 1.0;
  if (isActive) {
    ctx.shadowColor = borderCol;
    ctx.shadowBlur = 6;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 3. Pionowy lewy pasek akcentu (grubość 3.2px)
  ctx.fillStyle = isActive ? accentCol : '#334155';
  ctx.fillRect(btn.x, btn.y, 3.2, btn.h);

  // Pasek postępu przeładowania na dolnej krawędzi kafelka
  if (bIsReloading && ammoObj) {
    const dur = ammoObj.reloadDuration || 120;
    const prog = Math.max(0, Math.min(1, 1 - (ammoObj.reloadTimer / dur)));
    ctx.save();
    ctx.fillStyle = accentCol;
    ctx.shadowColor = accentCol;
    ctx.shadowBlur = 6;
    ctx.fillRect(btn.x + 4, btn.y + btn.h - 3, (btn.w - 8) * prog, 2.2);
    ctx.restore();
  }

  // 4. Tag klawisza: [1] / [2] w estetycznej ramce
  const keyHint = btn.id === 'SHOTGUN' ? '[2]' : '[1]';
  const tagX = btn.x + 9;
  const tagY = btn.y + (btn.h - 18) / 2;
  const tagW = 20;
  const tagH = 18;

  ctx.fillStyle = isActive ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.08)';
  ctx.strokeStyle = isActive ? accentCol : 'rgba(148, 163, 184, 0.35)';
  ctx.lineWidth = 1.0;
  if (ctx.roundRect) ctx.roundRect(tagX, tagY, tagW, tagH, 3);
  else ctx.rect(tagX, tagY, tagW, tagH);
  ctx.fill();
  ctx.stroke();

  // 3. Tekst klawisza: [1] / [2]
  ctx.font = 'bold 9.5px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 1.0;
  ctx.fillText(keyHint, tagX + tagW / 2, tagY + tagH / 2 + 0.5);

  // 4. Ikonka broni w tle
  drawWeaponSilhouette(ctx, btn.id, btn.x + 44, btn.y + btn.h / 2, isActive);

  // 3. Nazwa broni
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 1.0;
  ctx.fillText(btn.name, btn.x + 64, btn.y + btn.h / 2 + 0.5);

  // 3. Licznik amunicji
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  if (!isActive) {
    ctx.font = 'bold 12px monospace';
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 1.0;
    ctx.fillText(`${bCurrentAmmo} / ${bReserveAmmo}`, btn.x + btn.w - 12, btn.y + btn.h / 2 + 0.5);
  } else {
    if (bIsReloading) {
      ctx.font = 'bold 10px monospace';
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 1.0;
      ctx.fillText('⚡ RELOAD', btn.x + btn.w - 12, btn.y + btn.h / 2 + 0.5);
    } else if (bIsNoAmmo) {
      ctx.font = 'bold 10.5px monospace';
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 1.0;
      ctx.fillText('⛔ EMPTY', btn.x + btn.w - 12, btn.y + btn.h / 2 + 0.5);
    } else {
      const resText = `/ ${bReserveAmmo}`;
      ctx.font = 'bold 10px monospace';
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 1.0;
      ctx.fillText(resText, btn.x + btn.w - 12, btn.y + btn.h / 2 + 1.5);

      const resWidth = ctx.measureText(resText).width;

      ctx.font = 'bold 15px monospace';
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 1.0;
      ctx.fillText(`${bCurrentAmmo}`, btn.x + btn.w - 15 - resWidth, btn.y + btn.h / 2 + 0.5);

      if (bCurrentAmmo < bMagSize && bReserveAmmo > 0) {
        ctx.font = '8.5px monospace';
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 1.0;
        ctx.fillText('[R]', btn.x + btn.w - 20 - resWidth - ctx.measureText(`${bCurrentAmmo}`).width, btn.y + btn.h / 2 + 0.5);
      }
    }
  }

  ctx.globalAlpha = 1.0;
  ctx.restore();
}

export function drawHUD(ctx, player, leftStick, btnCluster, rightStick, ball, inKickRange = null, arenaInfo = null) {
  updateFps();

  ctx.save();

  // =========================================================================
  // 1. STATYSTYKI GRY W LEWYM GÓRNYM ROGU (KLASA, STAN, BROŃ, FPS)
  // =========================================================================
  ctx.textAlign = 'left';

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 12px monospace';
  ctx.fillText(`KLASA: ${player.currentClass?.name || 'DOMYŚLNA'}`, 20, 26);

  let modeCol = '#94a3b8';
  if (player.gaitMode === 'SLIDE') modeCol = '#00e5ff';
  else if (player.isProne || player.gaitMode === 'PRONE' || player.gaitMode === 'CRAWL') modeCol = '#c084fc';
  else if (player.isCrouching) modeCol = '#38bdf8';
  else if (player.gaitMode === 'SPRINT') modeCol = '#ef4444';
  else if (player.gaitMode === 'JOG') modeCol = '#facc15';
  else if (player.gaitMode === 'WALK') modeCol = '#10b981';

  ctx.fillStyle = modeCol;
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`STAN: ${player.gaitMode}`, 20, 44);

  // Status aktywnej broni i amunicji w lewym górnym rogu
  const curWep = player.currentWeapon || { id: 'AK47', name: 'AK-47' };
  const wepShort = curWep.id === 'SHOTGUN' ? 'SG' : 'AK';
  const curAmmoObj = player.ammo?.[curWep.id];
  const cAmmo = curAmmoObj ? curAmmoObj.currentAmmo : (curWep.id === 'SHOTGUN' ? 8 : 30);
  const rAmmo = curAmmoObj ? curAmmoObj.reserveAmmo : (curWep.id === 'SHOTGUN' ? 64 : 90);
  const mSize = curAmmoObj ? (curAmmoObj.magSize || (curWep.id === 'SHOTGUN' ? 8 : 30)) : (curWep.id === 'SHOTGUN' ? 8 : 30);
  const isRel = curAmmoObj ? curAmmoObj.isReloading : !!player.isReloading;
  const isNoAmmo = (cAmmo === 0 && rAmmo === 0);
  const isLow = (!isNoAmmo && cAmmo <= Math.ceil(mSize * 0.25));

  let wepTextColor = '#facc15';
  let wepStatusText = `${wepShort} ${cAmmo}/${rAmmo}`;
  if (isRel) {
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.009);
    wepTextColor = `rgba(250, 204, 21, ${0.5 + pulse * 0.5})`;
    wepStatusText = `${wepShort} RELOADING...`;
  } else if (isNoAmmo) {
    wepTextColor = '#ef4444';
    wepStatusText = `${wepShort} NO AMMO`;
  } else if (isLow) {
    wepTextColor = cAmmo === 0 ? '#ef4444' : '#f97316';
  }

  ctx.fillStyle = wepTextColor;
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`BROŃ: ${wepStatusText}`, 20, 62);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '10px monospace';
  ctx.fillText(`FPS: ${currentFps}`, 20, 78);

  // =========================================================================
  // 2. PANEL DOLNY LEWY: HP, JETPACK ORAZ PIONOWY WYBÓR BRONI (TACTICAL SCI-FI)
  // =========================================================================
  const panelX = 20;
  const barW = 230;
  const spacing = 5; // Dokładny, spójny odstęp pionowy (gap: 5px)
  const hpBarHeight = 18;
  const jetBarHeight = 9;
  const btnH = 34;
  const totalWeaponHeight = (btnH * 2) + spacing;
  const totalHudHeight = hpBarHeight + spacing + jetBarHeight + spacing + totalWeaponHeight;
  const bottomMargin = 18;

  // Dynamiczne pozycjonowanie pionowe elementów od dołu ekranu
  const hpBarY = H - totalHudHeight - bottomMargin;
  const jetBarY = hpBarY + hpBarHeight + spacing;
  const akY = jetBarY + jetBarHeight + spacing;
  const sgY = akY + btnH + spacing;

  // -------------------------------------------------------------------------
  // A. PASEK HP (Główny pasek, ścięty narożnik, neonowe wypełnienie #22c55e)
  // -------------------------------------------------------------------------
  const maxHp = player.maxHp || 100;
  const curHp = Math.max(0, player.hp ?? 100);
  const hpRatio = Math.max(0, Math.min(1, curHp / maxHp));
  const hpColor = hpRatio > 0.5 ? '#22c55e' : (hpRatio > 0.25 ? '#f97316' : '#ef4444');

  // Ciemne tło i obrys paska HP
  drawChamferedBar(ctx, panelX, hpBarY, barW, hpBarHeight, 6);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1.0;
  ctx.fill();
  ctx.stroke();

  // Neonowe wypełnienie przy użyciu clip()
  if (hpRatio > 0) {
    ctx.save();
    drawChamferedBar(ctx, panelX, hpBarY, barW, hpBarHeight, 6);
    ctx.clip();

    ctx.fillStyle = hpColor;
    ctx.shadowColor = hpColor;
    ctx.shadowBlur = 8;
    ctx.fillRect(panelX, hpBarY, barW * hpRatio, hpBarHeight);
    ctx.restore();
  }

  // Wartość i oznaczenie HP
  ctx.save();
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 1.0;
  ctx.fillText('HP', panelX + 8, hpBarY + hpBarHeight / 2 + 0.5);

  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 1.0;
  ctx.fillText(`HP ${Math.ceil(curHp)}`, panelX + barW - 12, hpBarY + hpBarHeight / 2 + 0.5);
  ctx.restore();

  // -------------------------------------------------------------------------
  // B. PASEK JET (Cieńszy wskaźnik pomocniczy 9px, jasny cyjan #06b6d4)
  // -------------------------------------------------------------------------
  const maxJet = player.jetMax || 100;
  const curJet = Math.max(0, Math.min(maxJet, player.jetFuel ?? 100));
  const jetRatio = maxJet > 0 ? (curJet / maxJet) : 0;

  // Ciemne tło i obrys paska JET
  drawChamferedBar(ctx, panelX, jetBarY, barW, jetBarHeight, 4);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 1.0;
  ctx.fill();
  ctx.stroke();

  // Wypełnienie cyjanowe z poświatą neonową
  if (jetRatio > 0) {
    ctx.save();
    drawChamferedBar(ctx, panelX, jetBarY, barW, jetBarHeight, 4);
    ctx.clip();

    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 6;
    ctx.fillRect(panelX, jetBarY, barW * jetRatio, jetBarHeight);
    ctx.restore();
  }

  // Zwięzłe etykiety: mały "JET" po lewej, procent po prawej
  ctx.save();
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 1.0;
  ctx.fillText('JET', panelX + 8, jetBarY + jetBarHeight / 2 + 0.5);

  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 1.0;
  ctx.fillText(`${Math.round(jetRatio * 100)}%`, panelX + barW - 10, jetBarY + jetBarHeight / 2 + 0.5);
  ctx.restore();

  // -------------------------------------------------------------------------
  // C. KARTY BRONI (WEAPON SLOTS - DARK GLASS TACTICAL SCI-FI)
  // -------------------------------------------------------------------------
  const curWepId = player.currentWeapon?.id || 'AK47';

  weaponButtons[0].x = panelX;
  weaponButtons[0].y = akY;
  weaponButtons[0].w = barW;
  weaponButtons[0].h = btnH;

  weaponButtons[1].x = panelX;
  weaponButtons[1].y = sgY;
  weaponButtons[1].w = barW;
  weaponButtons[1].h = btnH;

  for (const btn of weaponButtons) {
    const isSelected = (curWepId === btn.id);
    drawWeaponSlot(ctx, btn, isSelected, player);
  }


  // =========================================================================
  // 3. TABLICA WYNIKÓW (GÓRA EKRANU)
  // =========================================================================
  const aState = arenaInfo || _worldArenaState;
  const curArenaId = aState.activeArenaId;
  const curScore = aState.arenaScore || { cyan: 0, orange: 0 };
  const curA1State = aState.arena1State;
  const isMatchArena = (curArenaId === 'ARENA_1' || curArenaId === 'ARENA_2');
  if (isMatchArena) {
    const scoreBoxW = 230;
    const scoreBoxH = 34;
    const scoreBoxX = (W - scoreBoxW) / 2;
    const scoreBoxY = 16;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.2;
    if (ctx.roundRect) ctx.roundRect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 6);
    else ctx.rect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 6;
    ctx.fillText(`CYAN ${curScore.cyan}`, scoreBoxX + scoreBoxW / 2 - 14, scoreBoxY + 22);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText(':', scoreBoxX + scoreBoxW / 2, scoreBoxY + 21);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 6;
    ctx.fillText(`${curScore.orange} ORANGE`, scoreBoxX + scoreBoxW / 2 + 14, scoreBoxY + 22);

    if (curArenaId === 'ARENA_1' && curA1State?.waitingForKickoff) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.005);
      ctx.textAlign = 'center';
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = `rgba(56, 189, 248, ${0.80 + pulse * 0.20})`;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 8;
      ctx.fillText('⚡ ROZPOCZNIJ MECZ: PIŁKA NA OŁTARZU CENTRALNYM (X: 1760) ⚡', W / 2, scoreBoxY + scoreBoxH + 16);
    }

    ctx.restore();
  }

  // 4. BANER CELEBRACJI GOLA
  if (goalCelebration.active && goalCelebration.timer > 0) {
    goalCelebration.timer--;
    if (goalCelebration.timer <= 0) goalCelebration.active = false;

    ctx.save();
    ctx.fillStyle = goalCelebration.color;
    ctx.globalAlpha = Math.min(0.40, (goalCelebration.timer / 110) * 0.40);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 36px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = goalCelebration.color;
    ctx.shadowBlur = 24;
    ctx.fillText(`⚽ ${goalCelebration.team} GOAL! ⚽`, W / 2, H * 0.32);
    ctx.restore();
  }
  ctx.restore();

  if (ball) {
    drawOffscreenBallIndicator(ctx, ball, camera, player);
  }

  if (isTouchDevice) {
    drawTouchControls(ctx, player, leftStick, btnCluster, rightStick, ball, inKickRange);
  }
}
