// =========================================================================
// ARENAS/ARENA3/DESTRUCTION.JS - DETEKCJA TRAFIEŃ, KOPNIĘĆ I EKSPLOZJI W ARENIE 3
// Wydzielony moduł z js/arenas/arena3.js
// =========================================================================

import { triggerScreenShake } from '../../camera.js';
import {
  ARENA_3_BRIDGE_BLOCKS,
  ARENA_3_RAMP_BLOCKS,
  breakRampBlock,
  spawnBridgeSplinters,
  spawnArena3WaterSplash,
  breakBridgeBlock,
  ARENA_3_PYLONS,
  destroyPylon,
  ARENA_3_CANOPY_PLATFORMS,
  ALL_CANOPY_BLOCKS,
  onCanopyRopeSnapped,
  breakCanopyBlock,
  evaluateBridgeIntegrity,
  spawnStoneDebris,
  ARENA_3_SNIPER_SLABS,
  breakSniperSlab,
  ARENA_3_TOWER_PILLARS,
  ARENA_3_TOWER_BLOCKS,
  breakTowerBlock,
  destroyTowerPillar
} from './state.js';

function rayIntersectsAABB(x1, y1, x2, y2, left, top, right, bottom) {
  if (x2 >= left && x2 <= right && y2 >= top && y2 <= bottom) return true;
  if (x1 >= left && x1 <= right && y1 >= top && y1 <= bottom) return true;
  let t0 = 0.0, t1 = 1.0;
  const dx = x2 - x1, dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - left, right - x1, y1 - top, bottom - y1];
  for (let k = 0; k < 4; k++) {
    if (p[k] === 0) {
      if (q[k] < 0) return false;
    } else {
      const t = q[k] / p[k];
      if (p[k] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return t0 <= t1;
}

function rayIntersectsVerticalLine(x1, y1, x2, y2, lineX, topY, bottomY, tolerance = 7) {
  const minX = Math.min(x1, x2) - tolerance;
  const maxX = Math.max(x1, x2) + tolerance;
  if (lineX < minX || lineX > maxX) return false;
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  if (maxY < topY - 4 || minY > bottomY + 4) return false;
  const dx = x2 - x1;
  if (Math.abs(dx) < 0.001) {
    return Math.abs(x1 - lineX) <= tolerance;
  }
  const t = (lineX - x1) / dx;
  if (t < 0 || t > 1) return false;
  const hitY = y1 + t * (y2 - y1);
  return hitY >= topY - 4 && hitY <= bottomY + 4;
}

export function onArena3BulletHit(bullet) {
  if (!bullet) return false;
  const bx = bullet.x;
  const by = bullet.y;
  const bx0 = bullet.prevX !== undefined ? bullet.prevX : (bx - (bullet.vx || 0));
  const by0 = bullet.prevY !== undefined ? bullet.prevY : (by - (bullet.vy || 0));
  const bDamage = bullet.damage || 14;

  // 1. Lustro wody w rzece (X: 1600 do 2800, linia wody Y: 1305) - absorpcja i rozbryzg wodny
  if ((by >= 1305 || (by0 < 1305 && by >= 1305)) && bx >= 1600 && bx <= 2800) {
    spawnArena3WaterSplash(bx, 1305, 8);
    return true;
  }

  // 2. Liny nośne pomostów wiszących (swept ray zapobiega przenikaniu pocisków snajperskich)
  for (let pIdx = 0; pIdx < ARENA_3_CANOPY_PLATFORMS.length; pIdx++) {
    const plat = ARENA_3_CANOPY_PLATFORMS[pIdx];

    // Lewa lina
    if (plat.ropeLeft.intact) {
      const attachX = plat.attachLX !== undefined ? plat.attachLX : plat.ropeLeft.x;
      const attachY = plat.attachLY !== undefined ? plat.attachLY : plat.origY;
      if (rayIntersectsVerticalLine(bx0, by0, bx, by, attachX, 0, attachY + 6, 8)) {
        plat.ropeLeft.hp -= bDamage * 0.60;
        spawnBridgeSplinters(attachX, by, (bullet.vx || 0) * 0.15, -1.5, 5);
        if (plat.ropeLeft.hp <= 0) {
          plat.ropeLeft.intact = false;
          onCanopyRopeSnapped(plat, 'left');
        }
        return true;
      }
    }

    // Prawa lina
    if (plat.ropeRight.intact) {
      const attachX = plat.attachRX !== undefined ? plat.attachRX : plat.ropeRight.x;
      const attachY = plat.attachRY !== undefined ? plat.attachRY : plat.origY;
      if (rayIntersectsVerticalLine(bx0, by0, bx, by, attachX, 0, attachY + 6, 8)) {
        plat.ropeRight.hp -= bDamage * 0.60;
        spawnBridgeSplinters(attachX, by, (bullet.vx || 0) * 0.15, -1.5, 5);
        if (plat.ropeRight.hp <= 0) {
          plat.ropeRight.intact = false;
          onCanopyRopeSnapped(plat, 'right');
        }
        return true;
      }
    }
  }

  // 3. Pylony mostu (drewniana wieża A-frame oraz masywne podwodne kesony kamienne)
  for (const k of ['left', 'right']) {
    const p = ARENA_3_PYLONS[k];
    // Drewniana wieża A-frame (Y: topY do baseY)
    if (p.intact && rayIntersectsAABB(bx0, by0, bx, by, p.x - 28, p.topY, p.x + 28, p.baseY)) {
      p.hp -= bDamage * 0.40;
      spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.2, -1.5, 6);
      if (p.hp <= 0) {
        destroyPylon(k);
      }
      return true;
    }
    // Kamienny fundament kesonu w wodzie (Y: baseY do caissonBottomY)
    const caissonBot = p.caissonBottomY || 1395;
    if (rayIntersectsAABB(bx0, by0, bx, by, p.x - 30, p.baseY, p.x + 30, caissonBot)) {
      spawnStoneDebris(bx, by, (bullet.vx || 0) * 0.2, -1.5, 6);
      return true;
    }
  }

  // 4. Klocki ramp podejścia do mostu (ARENA_3_RAMP_BLOCKS) - całe i zawalone
  for (let i = 0; i < ARENA_3_RAMP_BLOCKS.length; i++) {
    const b = ARENA_3_RAMP_BLOCKS[i];
    if (rayIntersectsAABB(bx0, by0, bx, by, b.x - 2, b.y - 10, b.x + b.w + 2, b.y + b.h + 16)) {
      if (b.intact) {
        b.hp -= bDamage * 0.45;
        spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.25, -2, 6);
        if (b.hp <= 0) {
          const impX = (bullet.vx || 0) * 0.1;
          const impY = Math.min(3.5, Math.max(1.2, (bullet.vy || 0) * 0.1 + 1.5));
          breakRampBlock(b, impX, impY, (Math.random() - 0.5) * 0.2);
        }
      } else {
        // Zawalony element jest namacalny: odrzucenie i drzazgi
        spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.2, -1.5, 5);
        b.vx += (bullet.vx || 0) * 0.05;
        b.vy += (bullet.vy || 0) * 0.05;
        b.vRot += (Math.random() - 0.5) * 0.08;
        b.isAsleep = false;
        b.sleepTimer = 0;
      }
      return true;
    }
  }

  // 5. Klocki mostu głównego (ARENA_3_BRIDGE_BLOCKS) - całe i zawalone pływające deski
  for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
    const b = ARENA_3_BRIDGE_BLOCKS[i];
    if (rayIntersectsAABB(bx0, by0, bx, by, b.x - 2, b.y - 6, b.x + b.w + 2, b.y + b.h + 8)) {
      if (b.intact) {
        b.hp -= bDamage * 0.45;
        spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.25, -2, 6);
        if (b.hp <= 0) {
          const impX = (bullet.vx || 0) * 0.1;
          const impY = Math.min(3.5, Math.max(1.2, (bullet.vy || 0) * 0.1 + 1.5));
          breakBridgeBlock(b, impX, impY, (Math.random() - 0.5) * 0.2);
          evaluateBridgeIntegrity();
        }
      } else {
        spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.2, -1.5, 5);
        b.vx += (bullet.vx || 0) * 0.06;
        b.vy += (bullet.vy || 0) * 0.06;
        b.vRot += (Math.random() - 0.5) * 0.08;
        b.isAsleep = false;
        b.sleepTimer = 0;
      }
      return true;
    }
  }

  // 6. Klocki wiszących pomostów taktycznych (ALL_CANOPY_BLOCKS)
  for (let i = 0; i < ALL_CANOPY_BLOCKS.length; i++) {
    const b = ALL_CANOPY_BLOCKS[i];
    if (rayIntersectsAABB(bx0, by0, bx, by, b.x - 2, b.y - 6, b.x + b.w + 2, b.y + b.h + 8)) {
      if (b.intact) {
        b.hp -= bDamage * 0.45;
        spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.25, -2, 6);
        const parentPlat = ARENA_3_CANOPY_PLATFORMS.find(p => p.id === b.parentPlatId);
        if (parentPlat) {
          const pushX = (bullet.vx || 0) * 0.035;
          if (parentPlat.isSplit) {
            if (b.blockIndex < parentPlat.blocks.length / 2) {
              parentPlat.leftVRot = (parentPlat.leftVRot || 0) - pushX * 0.45;
              parentPlat.leftSwayVx = (parentPlat.leftSwayVx || 0) + pushX * 0.35;
            } else {
              parentPlat.rightVRot = (parentPlat.rightVRot || 0) - pushX * 0.45;
              parentPlat.rightSwayVx = (parentPlat.rightSwayVx || 0) + pushX * 0.35;
            }
          } else {
            parentPlat.vRot = (parentPlat.vRot || 0) - pushX * 0.45;
            parentPlat.swayVx = (parentPlat.swayVx || 0) + pushX * 0.35;
          }
        }
        if (b.hp <= 0) {
          const impX = (bullet.vx || 0) * 0.1;
          const impY = Math.min(3.5, Math.max(1.2, (bullet.vy || 0) * 0.1 + 1.5));
          breakCanopyBlock(b, impX, impY, (Math.random() - 0.5) * 0.2);
        }
      } else {
        spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.2, -1.5, 5);
        b.vx += (bullet.vx || 0) * 0.06;
        b.vy += (bullet.vy || 0) * 0.06;
        b.vRot += (Math.random() - 0.5) * 0.08;
        b.isAsleep = false;
        b.sleepTimer = 0;
      }
      return true;
    }
  }

  // 7. Modularne płyty skalne snajperów (ARENA_3_SNIPER_SLABS)
  for (let i = 0; i < ARENA_3_SNIPER_SLABS.length; i++) {
    const slab = ARENA_3_SNIPER_SLABS[i];
    if (rayIntersectsAABB(bx0, by0, bx, by, slab.x - 2, slab.y - 4, slab.x + slab.w + 2, slab.y + slab.h + 6)) {
      if (slab.intact) {
        slab.hp -= bDamage * 0.35;
        spawnStoneDebris(bx, by, (bullet.vx || 0) * 0.25, -2, 6);
        if (slab.hp <= 0) {
          breakSniperSlab(slab, (bullet.vx || 0) * 0.08, Math.max(1.5, (bullet.vy || 0) * 0.1 + 1.8), (Math.random() - 0.5) * 0.15);
        }
      } else {
        spawnStoneDebris(bx, by, (bullet.vx || 0) * 0.2, -1.5, 6);
        slab.vx += (bullet.vx || 0) * 0.04;
        slab.vy += (bullet.vy || 0) * 0.04;
        slab.vRot += (Math.random() - 0.5) * 0.06;
        slab.isAsleep = false;
        slab.sleepTimer = 0;
      }
      return true;
    }
  }

  // 8. Modularne drewniane podesty wież strażniczych (ARENA_3_TOWER_BLOCKS)
  for (let i = 0; i < ARENA_3_TOWER_BLOCKS.length; i++) {
    const b = ARENA_3_TOWER_BLOCKS[i];
    if (rayIntersectsAABB(bx0, by0, bx, by, b.x - 2, b.y - 6, b.x + b.w + 2, b.y + b.h + 8)) {
      if (b.intact) {
        b.hp -= bDamage * 0.45;
        spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.25, -2, 6);
        if (b.hp <= 0) {
          breakTowerBlock(b, (bullet.vx || 0) * 0.1, Math.min(3.5, Math.max(1.2, (bullet.vy || 0) * 0.1 + 1.5)), (Math.random() - 0.5) * 0.2);
        }
      } else {
        spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.2, -1.5, 5);
        b.vx += (bullet.vx || 0) * 0.06;
        b.vy += (bullet.vy || 0) * 0.06;
        b.vRot += (Math.random() - 0.5) * 0.08;
        b.isAsleep = false;
        b.sleepTimer = 0;
      }
      return true;
    }
  }

  // 9. Główne filary nośne wież strażniczych (ARENA_3_TOWER_PILLARS)
  for (const side of ['left', 'right']) {
    const pillar = ARENA_3_TOWER_PILLARS[side];
    if (!pillar || !pillar.intact) continue;
    if (rayIntersectsAABB(bx0, by0, bx, by, pillar.stemX - 6, pillar.topY + 22, pillar.stemX + pillar.w + 6, pillar.baseY)) {
      pillar.hp -= bDamage * 0.40;
      spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.2, -1.5, 6);
      if (pillar.hp <= 0) {
        destroyTowerPillar(side);
      }
      return true;
    }
  }

  return false;
}

export function onArena3KickHit(player, kickBox) {
  if (!player) return false;
  let hitAny = false;
  const kx = kickBox?.footX || (player.facing === 1 ? (player.x + (player.w || 24) + 25) : (player.x - 25));
  const ky = kickBox?.footY || (player.y + (player.h || 70) * 0.65);
  const kickPower = (player.chargePower || 0) > 0 ? (1.0 + player.chargePower * 1.5) : 1.0;
  const kickDamage = 85 * kickPower;
  const dirX = player.facing || 1;

  // 1. Spartan Kick w klocki ramp podejścia do mostu
  for (let i = 0; i < ARENA_3_RAMP_BLOCKS.length; i++) {
    const b = ARENA_3_RAMP_BLOCKS[i];
    const bcx = b.x + b.w / 2;
    const bcy = b.y + b.h / 2;
    if (Math.abs(kx - bcx) <= b.w * 0.6 + 10 && Math.abs(ky - bcy) <= 35) {
      hitAny = true;
      if (b.intact) {
        b.hp -= kickDamage;
        spawnBridgeSplinters(kx, ky, dirX * 5, -2, 10);
        if (b.hp <= 0) {
          breakRampBlock(b, dirX * 3.5, 4.0, dirX * 0.25);
        }
      } else {
        b.vx += dirX * 6.5;
        b.vy -= 3.8;
        b.vRot += dirX * 0.22;
        b.isAsleep = false;
        b.sleepTimer = 0;
        spawnBridgeSplinters(kx, ky, dirX * 4, -2, 6);
      }
      if (typeof triggerScreenShake === 'function') triggerScreenShake(6);
      return true;
    }
  }

  // 2. Spartan Kick w belki mostu głównego
  for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
    const b = ARENA_3_BRIDGE_BLOCKS[i];
    const bcx = b.x + b.w / 2;
    const bcy = b.y + b.h / 2;
    if (Math.abs(kx - bcx) <= b.w * 0.5 + 8 && Math.abs(ky - bcy) <= 30) {
      hitAny = true;
      if (b.intact) {
        b.hp -= kickDamage;
        spawnBridgeSplinters(kx, ky, dirX * 5, -2, 10);
        if (b.hp <= 0) {
          breakBridgeBlock(b, dirX * 3.5, 4.0, dirX * 0.25);
          evaluateBridgeIntegrity();
        }
      } else {
        b.vx += dirX * 6.5;
        b.vy -= 3.8;
        b.vRot += dirX * 0.22;
        b.isAsleep = false;
        b.sleepTimer = 0;
        spawnBridgeSplinters(kx, ky, dirX * 4, -2, 6);
      }
      if (typeof triggerScreenShake === 'function') triggerScreenShake(6);
      return true;
    }
  }

  // 2B. Spartan Kick w pomosty wiszące w koronach drzew
  for (let i = 0; i < ALL_CANOPY_BLOCKS.length; i++) {
    const b = ALL_CANOPY_BLOCKS[i];
    const bcx = b.x + b.w / 2;
    const bcy = b.y + b.h / 2;
    if (Math.abs(kx - bcx) <= b.w * 0.5 + 8 && Math.abs(ky - bcy) <= 30) {
      hitAny = true;
      if (b.intact) {
        b.hp -= kickDamage;
        spawnBridgeSplinters(kx, ky, dirX * 5, -2, 10);
        const parentPlat = ARENA_3_CANOPY_PLATFORMS.find(p => p.id === b.parentPlatId);
        if (parentPlat) {
          if (parentPlat.isSplit) {
            if (b.blockIndex < parentPlat.blocks.length / 2) {
              parentPlat.leftVRot = (parentPlat.leftVRot || 0) - dirX * 1.35;
              parentPlat.leftSwayVx = (parentPlat.leftSwayVx || 0) + dirX * 2.2;
            } else {
              parentPlat.rightVRot = (parentPlat.rightVRot || 0) - dirX * 1.35;
              parentPlat.rightSwayVx = (parentPlat.rightSwayVx || 0) + dirX * 2.2;
            }
          } else {
            parentPlat.vRot = (parentPlat.vRot || 0) - dirX * 1.35;
            parentPlat.swayVx = (parentPlat.swayVx || 0) + dirX * 2.2;
          }
        }
        if (b.hp <= 0) {
          breakCanopyBlock(b, dirX * 3.5, 3.5, dirX * 0.25);
        }
      } else {
        b.vx += dirX * 6.5;
        b.vy -= 3.8;
        b.vRot += dirX * 0.22;
        b.isAsleep = false;
        b.sleepTimer = 0;
        spawnBridgeSplinters(kx, ky, dirX * 4, -2, 6);
      }
      if (typeof triggerScreenShake === 'function') triggerScreenShake(6);
      return true;
    }
  }

  // 3. Spartan Kick w liny pomostów wiszących
  for (let pIdx = 0; pIdx < ARENA_3_CANOPY_PLATFORMS.length; pIdx++) {
    const plat = ARENA_3_CANOPY_PLATFORMS[pIdx];
    const curAttachLX = plat.attachLX ?? plat.ropeLeft.x;
    const curAttachLY = plat.attachLY ?? plat.origY;
    if (plat.ropeLeft.intact && Math.abs(kx - curAttachLX) <= 25 && ky >= 0 && ky <= curAttachLY + 20) {
      hitAny = true;
      plat.ropeLeft.hp -= kickDamage;
      plat.swayVx = (plat.swayVx || 0) + dirX * 1.8;
      spawnBridgeSplinters(curAttachLX, ky, dirX * 3, -2, 8);
      if (plat.ropeLeft.hp <= 0) {
        plat.ropeLeft.intact = false;
        onCanopyRopeSnapped(plat, 'left');
      }
      if (typeof triggerScreenShake === 'function') triggerScreenShake(6);
      return true;
    }
    const curAttachRX = plat.attachRX ?? plat.ropeRight.x;
    const curAttachRY = plat.attachRY ?? plat.origY;
    if (plat.ropeRight.intact && Math.abs(kx - curAttachRX) <= 25 && ky >= 0 && ky <= curAttachRY + 20) {
      hitAny = true;
      plat.ropeRight.hp -= kickDamage;
      plat.swayVx = (plat.swayVx || 0) + dirX * 1.8;
      spawnBridgeSplinters(curAttachRX, ky, dirX * 3, -2, 8);
      if (plat.ropeRight.hp <= 0) {
        plat.ropeRight.intact = false;
        onCanopyRopeSnapped(plat, 'right');
      }
      if (typeof triggerScreenShake === 'function') triggerScreenShake(6);
      return true;
    }
  }

  // 4. Spartan Kick w płyty skalne snajperów
  for (let i = 0; i < ARENA_3_SNIPER_SLABS.length; i++) {
    const slab = ARENA_3_SNIPER_SLABS[i];
    const scx = slab.x + slab.w / 2;
    const scy = slab.y + slab.h / 2;
    if (Math.abs(kx - scx) <= slab.w * 0.75 + 15 && Math.abs(ky - scy) <= 35) {
      hitAny = true;
      if (slab.intact) {
        slab.hp -= kickDamage * 0.95;
        spawnStoneDebris(kx, ky, dirX * 5, -2, 10);
        if (slab.hp <= 0) {
          breakSniperSlab(slab, dirX * 3.0, 3.5, dirX * 0.2);
        }
      } else {
        slab.vx += dirX * 5.5;
        slab.vy -= 3.2;
        slab.vRot += dirX * 0.18;
        slab.isAsleep = false;
        slab.sleepTimer = 0;
        spawnStoneDebris(kx, ky, dirX * 4, -2, 7);
      }
      if (typeof triggerScreenShake === 'function') triggerScreenShake(7);
      return true;
    }
  }

  // 5. Spartan Kick w podesty wież strażniczych
  for (let i = 0; i < ARENA_3_TOWER_BLOCKS.length; i++) {
    const b = ARENA_3_TOWER_BLOCKS[i];
    const bcx = b.x + b.w / 2;
    const bcy = b.y + b.h / 2;
    if (Math.abs(kx - bcx) <= b.w * 0.75 + 15 && Math.abs(ky - bcy) <= 35) {
      hitAny = true;
      if (b.intact) {
        b.hp -= kickDamage;
        spawnBridgeSplinters(kx, ky, dirX * 5, -2, 10);
        if (b.hp <= 0) {
          breakTowerBlock(b, dirX * 3.5, 3.5, dirX * 0.25);
        }
      } else {
        b.vx += dirX * 6.5;
        b.vy -= 3.8;
        b.vRot += dirX * 0.22;
        b.isAsleep = false;
        b.sleepTimer = 0;
        spawnBridgeSplinters(kx, ky, dirX * 4, -2, 6);
      }
      if (typeof triggerScreenShake === 'function') triggerScreenShake(6);
      return true;
    }
  }

  // 6. Spartan Kick w filary wież
  for (const side of ['left', 'right']) {
    const pillar = ARENA_3_TOWER_PILLARS[side];
    if (!pillar.intact) continue;
    if (Math.abs(kx - (pillar.stemX + pillar.w / 2)) <= 35 && ky >= pillar.topY && ky <= pillar.baseY) {
      hitAny = true;
      pillar.hp -= kickDamage * 0.8;
      spawnBridgeSplinters(kx, ky, dirX * 4, -2, 8);
      if (pillar.hp <= 0) {
        destroyTowerPillar(side);
      }
      if (typeof triggerScreenShake === 'function') triggerScreenShake(8);
      return true;
    }
  }

  // 7. Spartan Kick w pylony mostu
  for (const k of ['left', 'right']) {
    const p = ARENA_3_PYLONS[k];
    if (!p.intact) continue;
    if (Math.abs(kx - p.x) <= 35 && ky >= p.topY && ky <= p.baseY) {
      hitAny = true;
      p.hp -= kickDamage * 0.8;
      spawnBridgeSplinters(kx, ky, dirX * 4, -2, 8);
      if (p.hp <= 0) {
        destroyPylon(k);
      }
      if (typeof triggerScreenShake === 'function') triggerScreenShake(8);
      return true;
    }
  }

  return hitAny;
}

export function onArena3Explosion(expX, expY, radius, context) {
  let hitAny = false;
  const blastRad = radius || 140;

  // 1. Wybuch w klocki ramp podejścia do mostu
  for (let i = 0; i < ARENA_3_RAMP_BLOCKS.length; i++) {
    const b = ARENA_3_RAMP_BLOCKS[i];
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const d = Math.hypot(cx - expX, cy - expY);

    if (d <= blastRad + 40) {
      hitAny = true;
      const intensity = Math.max(0, 1 - d / (blastRad + 40));
      const dirX = d > 0.001 ? (cx - expX) / d : 0;
      const dirY = d > 0.001 ? (cy - expY) / d : -1;

      const blastForce = intensity * 19;
      const impulseX = dirX * blastForce + (Math.random() - 0.5) * 4;
      const impulseY = (dirY - 0.55) * blastForce - 2.8;
      const angularImpulse = (dirX >= 0 ? 1 : -1) * (0.12 + Math.random() * 0.24) * intensity;

      if (b.intact) {
        b.hp -= intensity * 170;
        if (b.hp <= 0 || d <= blastRad) {
          breakRampBlock(b, impulseX, impulseY, angularImpulse);
        }
      } else {
        b.vx += impulseX * 0.85;
        b.vy += impulseY * 0.85;
        b.vRot += angularImpulse * 0.8;
        b.isAsleep = false;
        b.sleepTimer = 0;
      }
    }
  }

  // 2. Wybuch w klocki mostu głównego
  for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
    const b = ARENA_3_BRIDGE_BLOCKS[i];
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const d = Math.hypot(cx - expX, cy - expY);

    if (d <= blastRad + 40) {
      hitAny = true;
      const intensity = Math.max(0, 1 - d / (blastRad + 40));
      const dirX = d > 0.001 ? (cx - expX) / d : 0;
      const dirY = d > 0.001 ? (cy - expY) / d : -1;

      const blastForce = intensity * 19;
      const impulseX = dirX * blastForce + (Math.random() - 0.5) * 4;
      const impulseY = (dirY - 0.55) * blastForce - 2.8;
      const angularImpulse = (dirX >= 0 ? 1 : -1) * (0.12 + Math.random() * 0.24) * intensity;

      if (b.intact) {
        b.hp -= intensity * 170;
        if (b.hp <= 0 || d <= blastRad) {
          breakBridgeBlock(b, impulseX, impulseY, angularImpulse);
        }
      } else {
        b.vx += impulseX * 0.85;
        b.vy += impulseY * 0.85;
        b.vRot += angularImpulse * 0.8;
        b.isAsleep = false;
        b.sleepTimer = 0;
      }
    }
  }

  // 2. Wybuch w klocki pomostów wiszących
  for (let i = 0; i < ALL_CANOPY_BLOCKS.length; i++) {
    const b = ALL_CANOPY_BLOCKS[i];
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const d = Math.hypot(cx - expX, cy - expY);

    if (d <= blastRad + 40) {
      hitAny = true;
      const intensity = Math.max(0, 1 - d / (blastRad + 40));
      const dirX = d > 0.001 ? (cx - expX) / d : 0;
      const dirY = d > 0.001 ? (cy - expY) / d : -1;

      const blastForce = intensity * 19;
      const impulseX = dirX * blastForce + (Math.random() - 0.5) * 4;
      const impulseY = (dirY - 0.55) * blastForce - 2.8;
      const angularImpulse = (dirX >= 0 ? 1 : -1) * (0.12 + Math.random() * 0.24) * intensity;

      if (b.intact) {
        const parentPlat = ARENA_3_CANOPY_PLATFORMS.find(p => p.id === b.parentPlatId);
        if (parentPlat) {
          if (parentPlat.isSplit) {
            if (b.blockIndex < parentPlat.blocks.length / 2) {
              parentPlat.leftVRot = (parentPlat.leftVRot || 0) - dirX * intensity * 1.1;
              parentPlat.leftSwayVx = (parentPlat.leftSwayVx || 0) + dirX * intensity * 1.6;
            } else {
              parentPlat.rightVRot = (parentPlat.rightVRot || 0) - dirX * intensity * 1.1;
              parentPlat.rightSwayVx = (parentPlat.rightSwayVx || 0) + dirX * intensity * 1.6;
            }
          } else {
            parentPlat.vRot = (parentPlat.vRot || 0) - dirX * intensity * 1.1;
            parentPlat.swayVx = (parentPlat.swayVx || 0) + dirX * intensity * 1.6;
          }
        }
        b.hp -= intensity * 160;
        if (b.hp <= 0 || d <= blastRad) {
          breakCanopyBlock(b, impulseX, impulseY, angularImpulse);
        }
      } else {
        b.vx += impulseX * 0.85;
        b.vy += impulseY * 0.85;
        b.vRot += angularImpulse * 0.8;
        b.isAsleep = false;
        b.sleepTimer = 0;
      }
    }
  }

  // 3. Wybuch w liny pomostów wiszących
  for (let pIdx = 0; pIdx < ARENA_3_CANOPY_PLATFORMS.length; pIdx++) {
    const plat = ARENA_3_CANOPY_PLATFORMS[pIdx];

    // Lewa lina
    if (plat.ropeLeft.intact) {
      const curAttachLX = plat.attachLX ?? plat.ropeLeft.x;
      const curAttachLY = plat.attachLY ?? plat.origY;
      const clampRopeY = Math.max(0, Math.min(curAttachLY, expY));
      const distL = Math.hypot(curAttachLX - expX, clampRopeY - expY);
      if (distL <= blastRad + 25) {
        hitAny = true;
        const intensity = 1 - distL / (blastRad + 25);
        plat.ropeLeft.hp -= intensity * 110;
        if (plat.ropeLeft.hp <= 0) {
          plat.ropeLeft.intact = false;
          onCanopyRopeSnapped(plat, 'left');
        }
      }
    }

    // Prawa lina
    if (plat.ropeRight.intact) {
      const curAttachRX = plat.attachRX ?? plat.ropeRight.x;
      const curAttachRY = plat.attachRY ?? plat.origY;
      const clampRopeY = Math.max(0, Math.min(curAttachRY, expY));
      const distR = Math.hypot(curAttachRX - expX, clampRopeY - expY);
      if (distR <= blastRad + 25) {
        hitAny = true;
        const intensity = 1 - distR / (blastRad + 25);
        plat.ropeRight.hp -= intensity * 110;
        if (plat.ropeRight.hp <= 0) {
          plat.ropeRight.intact = false;
          onCanopyRopeSnapped(plat, 'right');
        }
      }
    }
  }

  // 4. Wybuch w filary pylonów mostu
  for (const k of ['left', 'right']) {
    const p = ARENA_3_PYLONS[k];
    if (!p.intact) continue;

    const clampPylonY = Math.max(p.topY, Math.min(p.baseY, expY));
    const distP = Math.hypot(p.x - expX, clampPylonY - expY);
    if (distP <= blastRad + 50) {
      hitAny = true;
      const intensity = 1 - distP / (blastRad + 50);
      p.hp -= intensity * 260;
      spawnBridgeSplinters(p.x, clampPylonY, (p.x - expX) * 0.2, -3, 14);
      if (p.hp <= 0) {
        destroyPylon(k);
      }
    }
  }

  // 5. Wybuch w płyty skalne snajperów
  for (let i = 0; i < ARENA_3_SNIPER_SLABS.length; i++) {
    const slab = ARENA_3_SNIPER_SLABS[i];
    const cx = slab.x + slab.w / 2;
    const cy = slab.y + slab.h / 2;
    const d = Math.hypot(cx - expX, cy - expY);

    if (d <= blastRad + 50) {
      hitAny = true;
      const intensity = Math.max(0, 1 - d / (blastRad + 50));
      const dirX = d > 0.001 ? (cx - expX) / d : 0;
      const dirY = d > 0.001 ? (cy - expY) / d : -1;

      const blastForce = intensity * 18;
      const impulseX = dirX * blastForce + (Math.random() - 0.5) * 3;
      const impulseY = (dirY - 0.4) * blastForce - 2.5;
      const angularImpulse = (dirX >= 0 ? 1 : -1) * (0.08 + Math.random() * 0.16) * intensity;

      if (slab.intact) {
        slab.hp -= intensity * 180;
        if (slab.hp <= 0 || d <= blastRad * 0.8) {
          breakSniperSlab(slab, impulseX, impulseY, angularImpulse);
        }
      } else {
        slab.vx += impulseX * 0.8;
        slab.vy += impulseY * 0.8;
        slab.vRot += angularImpulse * 0.8;
        slab.isAsleep = false;
        slab.sleepTimer = 0;
      }
    }
  }

  // 6. Wybuch w podesty wież strażniczych
  for (let i = 0; i < ARENA_3_TOWER_BLOCKS.length; i++) {
    const b = ARENA_3_TOWER_BLOCKS[i];
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const d = Math.hypot(cx - expX, cy - expY);

    if (d <= blastRad + 40) {
      hitAny = true;
      const intensity = Math.max(0, 1 - d / (blastRad + 40));
      const dirX = d > 0.001 ? (cx - expX) / d : 0;
      const dirY = d > 0.001 ? (cy - expY) / d : -1;

      const blastForce = intensity * 19;
      const impulseX = dirX * blastForce + (Math.random() - 0.5) * 4;
      const impulseY = (dirY - 0.55) * blastForce - 2.8;
      const angularImpulse = (dirX >= 0 ? 1 : -1) * (0.12 + Math.random() * 0.24) * intensity;

      if (b.intact) {
        b.hp -= intensity * 160;
        if (b.hp <= 0 || d <= blastRad) {
          breakTowerBlock(b, impulseX, impulseY, angularImpulse);
        }
      } else {
        b.vx += impulseX * 0.85;
        b.vy += impulseY * 0.85;
        b.vRot += angularImpulse * 0.8;
        b.isAsleep = false;
        b.sleepTimer = 0;
      }
    }
  }

  // 7. Wybuch w filary wież strażniczych
  for (const side of ['left', 'right']) {
    const pillar = ARENA_3_TOWER_PILLARS[side];
    if (!pillar.intact) continue;

    const clampPillarY = Math.max(pillar.topY, Math.min(pillar.baseY, expY));
    const distP = Math.hypot(pillar.stemX - expX, clampPillarY - expY);
    if (distP <= blastRad + 50) {
      hitAny = true;
      const intensity = 1 - distP / (blastRad + 50);
      pillar.hp -= intensity * 260;
      spawnBridgeSplinters(pillar.stemX, clampPillarY, (pillar.stemX - expX) * 0.2, -3, 14);
      if (pillar.hp <= 0) {
        destroyTowerPillar(side);
      }
    }
  }

  if (hitAny) {
    evaluateBridgeIntegrity();
  }

  return hitAny;
}

