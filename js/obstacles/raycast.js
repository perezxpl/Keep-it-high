// =========================================================================
// OBSTACLES/RAYCAST.JS - DETEKCJA PRZECIĘĆ PROMIENI POCISKÓW Z PRZESZKODAMI
// Wydzielony moduł z js/obstacles.js
// =========================================================================

import { triggerScreenShake } from '../world.js';
import { getActiveArena } from '../arenas/index.js';
import { normalizeObstacleType } from './palette.js';
import {
  obstacles,
  customObstacles,
  spawnObstacleSparks,
  activeArenaId,
  ARENA_PLATFORMS,
  GROUND_BARRICADES,
  getPlatformSurfaceY,
  explodeBarrel
} from './state.js';

// =========================================================================
// INTERSEKCJE TRAJEKTORII POCISKÓW Z PRZESZKODAMI I TERENEM
// =========================================================================

export function getSegmentAABBIntersection(x1, y1, x2, y2, left, top, right, bottom) {
  let t0 = 0.0;
  let t1 = 1.0;
  const dx = x2 - x1;
  const dy = y2 - y1;

  const p = [-dx, dx, -dy, dy];
  const q = [x1 - left, right - x1, y1 - top, bottom - y1];
  const normals = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
  ];

  let hitNorm = [0, -1];

  for (let k = 0; k < 4; k++) {
    if (p[k] === 0) {
      if (q[k] < 0) return null;
    } else {
      const t = q[k] / p[k];
      if (p[k] < 0) {
        if (t > t1) return null;
        if (t > t0) {
          t0 = t;
          hitNorm = normals[k];
        }
      } else {
        if (t < t0) return null;
        if (t < t1) {
          t1 = t;
        }
      }
    }
  }

  if (t0 <= t1) {
    const startInside = (x1 >= left && x1 <= right && y1 >= top && y1 <= bottom);
    const hitT = startInside ? 0 : t0;
    return {
      hit: true,
      t: hitT,
      x: x1 + dx * hitT,
      y: y1 + dy * hitT,
      nx: hitNorm[0],
      ny: hitNorm[1]
    };
  }

  return null;
}

export function getSegmentCircleIntersection(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;

  if (c <= 0) {
    const d = Math.hypot(fx, fy) || 1;
    return {
      hit: true,
      t: 0,
      x: x1,
      y: y1,
      nx: fx / d,
      ny: fy / d
    };
  }

  if (a === 0) return null;

  const discriminant = b * b - 4 * a * c;
  if (discriminant >= 0) {
    const sqrtDisc = Math.sqrt(discriminant);
    const t0 = (-b - sqrtDisc) / (2 * a);
    if (t0 >= 0 && t0 <= 1) {
      const hx = x1 + dx * t0;
      const hy = y1 + dy * t0;
      const d = Math.hypot(hx - cx, hy - cy) || 1;
      return {
        hit: true,
        t: t0,
        x: hx,
        y: hy,
        nx: (hx - cx) / d,
        ny: (hy - cy) / d
      };
    }
  }
  return null;
}

export function getSegmentSegmentIntersection(x1, y1, x2, y2, sx1, sy1, sx2, sy2) {
  const d1x = x2 - x1;
  const d1y = y2 - y1;
  const d2x = sx2 - sx1;
  const d2y = sy2 - sy1;

  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 0.0001) return null;

  const u = ((sx1 - x1) * d2y - (sy1 - y1) * d2x) / denom;
  const v = ((sx1 - x1) * d1y - (sy1 - y1) * d1x) / denom;

  if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
    const len = Math.hypot(d2x, d2y) || 1;
    let nx = -d2y / len;
    let ny = d2x / len;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    return {
      hit: true,
      t: u,
      x: x1 + d1x * u,
      y: y1 + d1y * u,
      nx,
      ny
    };
  }
  return null;
}

export function checkRayObstacleCollision(x1, y1, x2, y2, groundY, extraObstacles = null, bulletObj = null) {
  let closestHit = null;

  function recordHit(candidate, sourceName = 'unknown') {
    if (!candidate || !candidate.hit) return;
    if (!closestHit || candidate.t < closestHit.t) {
      closestHit = candidate;
      closestHit.source = sourceName;
    }
  }

  const curArenaObj = getActiveArena?.();
  const isA3 = (curArenaObj?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY');
  const isA2 = (curArenaObj?.id === 'arena-2' || activeArenaId === 'ARENA_2' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'ARENA_2_SECTOR_X');

  if (!isA3 && !isA2 && y2 >= groundY) {
    if (y1 < groundY) {
      const dy = y2 - y1;
      const t = dy !== 0 ? Math.max(0, Math.min(1, (groundY - y1) / dy)) : 0;
      recordHit({
        hit: true,
        t,
        x: x1 + (x2 - x1) * t,
        y: groundY,
        nx: 0,
        ny: -1
      }, 'ground');
    } else {
      recordHit({
        hit: true,
        t: 0,
        x: x1,
        y: groundY,
        nx: 0,
        ny: -1
      }, 'ground');
    }
  }

  // W Arenie 2 (Sektor X) toksyczny kwas (y >= 1260) pochłania pociski
  if (isA2) {
    if (y2 >= 1260) {
      if (y1 < 1260) {
        const dy = y2 - y1;
        const t = dy !== 0 ? Math.max(0, Math.min(1, (1260 - y1) / dy)) : 0;
        recordHit({ hit: true, t, x: x1 + (x2 - x1) * t, y: 1260, nx: 0, ny: -1 }, 'acid_pool');
      } else {
        recordHit({ hit: true, t: 0, x: x1, y: 1260, nx: 0, ny: -1 }, 'acid_pool');
      }
    }
  }

  // W Arenie 3 sprawdzamy dolną granicę koryta rzeki / próżni wąwozu (y >= 1395)
  if (isA3) {
    if (y2 >= 1395) {
      if (y1 < 1395) {
        const dy = y2 - y1;
        const t = dy !== 0 ? Math.max(0, Math.min(1, (1395 - y1) / dy)) : 0;
        recordHit({ hit: true, t, x: x1 + (x2 - x1) * t, y: 1395, nx: 0, ny: -1 }, 'void_bottom');
      } else {
        recordHit({ hit: true, t: 0, x: x1, y: 1395, nx: 0, ny: -1 }, 'void_bottom');
      }
    }
  }

  if (Array.isArray(GROUND_BARRICADES)) {
    for (const bar of GROUND_BARRICADES) {
      const bType = normalizeObstacleType(bar.type);
      if (bType === 'sandbags' || bType === 'ammo_depot') {
        const left = bar.x;
        const right = bar.x + bar.w;
        const top = groundY - bar.h;
        const bottom = groundY;
        const hit = getSegmentAABBIntersection(x1, y1, x2, y2, left, top, right, bottom);
        recordHit(hit, bType);
      } else if (bar.type === 'hedgehog') {
        const cx = bar.x;
        const r = (bar.size || 30) / 2;
        const cy = groundY - r;
        const hit = getSegmentCircleIntersection(x1, y1, x2, y2, cx, cy, r);
        recordHit(hit, 'hedgehog');
      }
    }
  }

  if (Array.isArray(ARENA_PLATFORMS)) {
    for (const plat of ARENA_PLATFORMS) {
      if (!plat) continue;

      // W Arenie 3 zniszczalne segmenty (most, kładki w koronach, rampy, płyty snajperskie, podesty wież)
      // są w całości i precyzyjnie obsługiwane przez activeArena.onBulletHit() wraz z fizyką i cząstkami!
      if (isA3 && (plat.isBridgeBlock || plat.isRampBlock || plat.isCanopyBlock || plat.isSniperSlab || plat.isTowerBlock)) {
        continue;
      }

      // 1. Rampa lub profil skośny
      if (plat.isSlope || plat.type === 'ramp') {
        const topY1 = plat.startY !== undefined ? plat.startY : (plat.startRelY !== undefined ? groundY - plat.startRelY : plat.y);
        const topY2 = plat.endY !== undefined ? plat.endY : (plat.endRelY !== undefined ? groundY - plat.endRelY : plat.y);
        const slopeHit = getSegmentSegmentIntersection(x1, y1, x2, y2, plat.x, topY1, plat.x + plat.w, topY2);
        if (slopeHit) recordHit(slopeHit, plat.id || 'ramp');

        if (plat.solid) {
          const bottomY = Math.max(topY1, topY2) + (plat.h || 20);
          const bottomHit = getSegmentSegmentIntersection(x1, y1, x2, y2, plat.x, bottomY, plat.x + plat.w, bottomY);
          if (bottomHit) recordHit(bottomHit, plat.id || 'ramp_bottom');
          const leftHit = getSegmentSegmentIntersection(x1, y1, x2, y2, plat.x, topY1, plat.x, bottomY);
          if (leftHit) recordHit(leftHit, plat.id || 'ramp_left');
          const rightHit = getSegmentSegmentIntersection(x1, y1, x2, y2, plat.x + plat.w, topY2, plat.x + plat.w, bottomY);
          if (rightHit) recordHit(rightHit, plat.id || 'ramp_right');
        }
        continue;
      }

      // 2. Skaliste wyspy i profile wielokątne z surfacePoints
      if (plat.type === 'rock_platform' || plat.type === 'citadel_island' || plat.type === 'altar_island' || Array.isArray(plat.surfacePoints)) {
        if (Array.isArray(plat.surfacePoints) && plat.surfacePoints.length >= 2) {
          const pts = plat.surfacePoints;
          for (let i = 0; i < pts.length - 1; i++) {
            const p1y = pts[i].y !== undefined ? pts[i].y : (groundY - pts[i].relY);
            const p2y = pts[i + 1].y !== undefined ? pts[i + 1].y : (groundY - pts[i + 1].relY);
            const hit = getSegmentSegmentIntersection(x1, y1, x2, y2, pts[i].x, p1y, pts[i + 1].x, p2y);
            if (hit) recordHit(hit, plat.id || 'rock_surface');
          }
          // Ściany boczne i spód do groundY pomijamy dla ramp i zboczy w Arenie 2 i Arenie 3
          const isTerrainSlope = (plat.isSlope || plat.id === 'riverbank_left_oval' || plat.id === 'riverbank_right_oval' || plat.isRampBlock || plat.id === 'ground_left' || plat.id === 'ground_right');
          if (!isTerrainSlope && !isA3 && !isA2) {
            const p0y = pts[0].y !== undefined ? pts[0].y : (groundY - pts[0].relY);
            const plastY = pts[pts.length - 1].y !== undefined ? pts[pts.length - 1].y : (groundY - pts[pts.length - 1].relY);
            const leftHit = getSegmentSegmentIntersection(x1, y1, x2, y2, pts[0].x, p0y, pts[0].x, groundY);
            if (leftHit) recordHit(leftHit, plat.id || 'rock_left');
            const rightHit = getSegmentSegmentIntersection(x1, y1, x2, y2, pts[pts.length - 1].x, plastY, pts[pts.length - 1].x, groundY);
            if (rightHit) recordHit(rightHit, plat.id || 'rock_right');
            const bottomHit = getSegmentSegmentIntersection(x1, y1, x2, y2, pts[0].x, groundY, pts[pts.length - 1].x, groundY);
            if (bottomHit) recordHit(bottomHit, plat.id || 'rock_bottom');
          }
        } else {
          const topY = plat.y !== undefined ? plat.y : (groundY - plat.relY);
          const thick = plat.thickness || plat.h || 20;
          const rockHit = getSegmentAABBIntersection(x1, y1, x2, y2, plat.x, topY, plat.x + plat.w, topY + thick);
          recordHit(rockHit, plat.id || 'rock_slab');
        }

        if (Array.isArray(plat.props)) {
          for (const prop of plat.props) {
            if (prop.w && prop.h) {
              const topY = getPlatformSurfaceY(plat, plat.x + prop.rx, groundY);
              const bx = plat.x + prop.rx;
              const by = topY - prop.h;
              const propHit = getSegmentAABBIntersection(x1, y1, x2, y2, bx, by, bx + prop.w, topY);
              recordHit(propHit, prop.type || 'prop');
            }
          }
        }
        continue;
      }

      // 3. Kładki catwalk
      if (plat.type === 'catwalk') {
        if (!plat.isTowerDeck && !plat.isSkywalk && !plat.isLadder && !plat.isRavineDeck && !plat.isRavineRoof && !plat.isTunnelFloor) {
          const topY = plat.y !== undefined ? plat.y : (groundY - plat.relY);
          const thick = plat.thickness || plat.h || 14;
          const catHit = getSegmentAABBIntersection(x1, y1, x2, y2, plat.x, topY, plat.x + plat.w, topY + thick);
          recordHit(catHit, plat.id || 'catwalk');
        }
        continue;
      }

      // 4. Lite platformy przemysłowe areny (np. floor_l1, floor_l2, floor_r1, floor_r2, furnace_deck, tunnel_floor)
      if (plat.solid && !plat.oneWay) {
        const topY = plat.y !== undefined ? plat.y : (plat.relY !== undefined ? groundY - plat.relY : null);
        const thick = plat.h || plat.thickness || 20;
        if (topY !== null) {
          const solidHit = getSegmentAABBIntersection(x1, y1, x2, y2, plat.x, topY, plat.x + plat.w, topY + thick);
          if (solidHit) recordHit(solidHit, plat.id || 'solid_platform');
        }
      }
    }
  }

  const obsList = extraObstacles || obstacles;
  if (Array.isArray(obsList)) {
    for (const obs of obsList) {
      const oType = normalizeObstacleType(obs.type);
      if (oType === 'sandbags' || oType === 'ammo_depot') {
        const left = obs.x;
        const right = obs.x + obs.w;
        const top = groundY - obs.h;
        const bottom = groundY;
        const hit = getSegmentAABBIntersection(x1, y1, x2, y2, left, top, right, bottom);
        recordHit(hit);
      } else if (obs.type === 'hedgehog') {
        const cx = obs.x;
        const r = (obs.size || 30) / 2;
        const cy = groundY - r;
        const hit = getSegmentCircleIntersection(x1, y1, x2, y2, cx, cy, r);
        recordHit(hit);
      }
    }
  }

  if (Array.isArray(customObstacles)) {
    for (const obs of customObstacles) {
      if (!obs || obs.team || obs.holeCx !== undefined || obs.id?.startsWith('goal') || obs.type === 'goal') {
        continue;
      }
      const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
      const bottomY = topY + obs.h;

      if (obs.type === 'hedgehog') {
        const cx = obs.x + obs.w / 2;
        const cy = topY + obs.h / 2;
        const r = (obs.size || 32) / 2;
        const hit = getSegmentCircleIntersection(x1, y1, x2, y2, cx, cy, r);
        recordHit(hit, 'custom_hedgehog');
      } else if (obs.type === 'cyber_bumper') {
        const cx = obs.x + obs.w / 2;
        const cy = topY + obs.h / 2;
        const r = 20;
        const hit = getSegmentCircleIntersection(x1, y1, x2, y2, cx, cy, r);
        if (hit) {
          obs.hitTimer = 10;
          recordHit(hit, 'custom_cyber_bumper');
        }
      } else if (obs.type === 'metal_ramp_left') {
        const rampHit = getSegmentSegmentIntersection(x1, y1, x2, y2, obs.x, topY, obs.x + obs.w, topY + obs.h);
        if (rampHit) recordHit(rampHit, 'custom_metal_ramp_left');
        const backHit = getSegmentSegmentIntersection(x1, y1, x2, y2, obs.x, topY, obs.x, topY + obs.h);
        if (backHit) recordHit(backHit, 'custom_metal_ramp_left');
        const botHit = getSegmentSegmentIntersection(x1, y1, x2, y2, obs.x, topY + obs.h, obs.x + obs.w, topY + obs.h);
        if (botHit) recordHit(botHit, 'custom_metal_ramp_left');
      } else if (obs.type === 'metal_ramp_right') {
        const rampHit = getSegmentSegmentIntersection(x1, y1, x2, y2, obs.x, topY + obs.h, obs.x + obs.w, topY);
        if (rampHit) recordHit(rampHit, 'custom_metal_ramp_right');
        const backHit = getSegmentSegmentIntersection(x1, y1, x2, y2, obs.x + obs.w, topY, obs.x + obs.w, topY + obs.h);
        if (backHit) recordHit(backHit, 'custom_metal_ramp_right');
        const botHit = getSegmentSegmentIntersection(x1, y1, x2, y2, obs.x, topY + obs.h, obs.x + obs.w, topY + obs.h);
        if (botHit) recordHit(botHit, 'custom_metal_ramp_right');
      } else if (obs.type === 'explosive_barrel') {
        const hit = getSegmentAABBIntersection(x1, y1, x2, y2, obs.x, topY, obs.x + obs.w, bottomY);
        if (hit) {
          recordHit(hit, 'custom_explosive_barrel');
          explodeBarrel(obs, groundY);
        }
      } else if (obs.type === 'laser_gate') {
        const hit = getSegmentAABBIntersection(x1, y1, x2, y2, obs.x, topY, obs.x + obs.w, bottomY);
        if (hit) {
          let ricocheted = false;
          const b = bulletObj;
          if (b && (!b.laserBounces || b.laserBounces < 3)) {
            b.laserBounces = (b.laserBounces || 0) + 1;
            b.vx = -b.vx * 0.92;
            b.x = hit.x + (b.vx > 0 ? 3 : -3);
            b.prevX = b.x;
            spawnObstacleSparks(hit.x, hit.y, b.vx > 0 ? 1 : -1, 0, 5);
            triggerScreenShake(2.5);
            ricocheted = true;
          }
          if (!ricocheted) {
            recordHit(hit, 'custom_laser_gate');
          }
        }
      } else if (obs.type === 'barbed_wire' || obs.type === 'gravity_lift' || obs.type === 'speed_booster_pad') {
        continue;
      } else {
        const hit = getSegmentAABBIntersection(x1, y1, x2, y2, obs.x, topY, obs.x + obs.w, bottomY);
        recordHit(hit, 'custom_' + obs.type);
      }
    }
  }

  return closestHit;
}

