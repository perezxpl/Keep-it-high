// =========================================================================
// OBSTACLES/PLAYERPHYSICS.JS - KOLIZJE GRACZA Z PLATFORMAMI, DRABINAMI I PRZESZKODAMI
// Wydzielony moduł z js/obstacles.js
// =========================================================================

import {
  triggerScreenShake,
  spawnJetpackSparks,
  spawnDroppedWeapon,
  spawnGroundPuff,
  isGroundAt
} from '../world.js';
import { getActiveArena } from '../arenas/index.js';
import { centerX } from '../arenas/arena1.js';
import { ACID_SURGE_SYSTEM } from '../arenas/arena2.js';
import {
  customObstacles,
  spawnObstacleSparks,
  activeArenaId,
  ARENA_PLATFORMS,
  getPlatformBounds,
  getPlatformSurfaceInfo,
  getPlatformSurfaceY
} from './state.js';
import { getRiverbankGroundY } from '../arenas/arena3/state.js';

// =========================================================================
// OBSŁUGA LĄDOWANIA I ZESKOKU (DROP-THROUGH)
// =========================================================================
export function checkPlayerPlatformLanding(p, groundY) {
  if (!p || p.isIntro) return;

  if (p.boostCooldown > 0) p.boostCooldown--;
  if (p.laserCooldown > 0) p.laserCooldown--;

  const colH = (p.staggerTimer > 0) ? 15 : (p.h || 70);
  const feetY = p.y + colH;
  const centerX = p.x + p.w / 2;
  if (!p.dropThroughTimer || p.dropThroughTimer <= 0) {
    p.dropThroughPlatform = null;
    p.dropThroughTimer = 0;
  }
  const wantDrop = (p.dropThroughTimer > 0);
  const wasGrounded = !!(p.onGround && !p.isJumping);

  const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
  const isA3 = (curArena?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3');
  const isA2 = (curArena?.id === 'arena-2' || activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X');
  const hasNoFloor = isA3 || isA2;

  if (wantDrop && p.onGround && p.currentPlatform) {
    const curPlat = p.currentPlatform;
    const isDropAllowed = !!(curPlat.isDropThrough === true || curPlat.type === 'catwalk' || curPlat.type === 'cyber_catwalk' || curPlat.type === 'floating_hex');
    if (isDropAllowed) {
      p.dropThroughPlatform = curPlat;
      p.dropThroughTimer = Math.max(p.dropThroughTimer || 0, 22);
      p.currentPlatform = null;
      p.onGround = false;
      p.isJumping = true;
      p.isCrouching = false;
      const platThickness = curPlat.thickness || curPlat.h || 20;
      p.y += platThickness + 12;
      p.vy = Math.max(p.vy || 0, 4.5);
      p.airVx = p.vx;
      p.currentGroundY = hasNoFloor ? null : groundY;
      return;
    }
  }

  // Obsługa wyrzutni / gejzerów na platformach areny (np. industrial steam vents w tunelu Areny 3)
  for (const plat of ARENA_PLATFORMS) {
    if (plat && (plat.isJumpPad || plat.type === 'jump_pad')) {
      const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
      if (centerX >= plat.x - 6 && centerX <= plat.x + plat.w + 6) {
        if (feetY >= topY - 14 && feetY <= topY + Math.max(22, p.vy + 12)) {
          p.y = topY - p.h - 4;
          p.vy = plat.launchVy || -12.5;
          p.isJumping = true;
          p.onGround = false;
          p.currentPlatform = null;
          p.isCrouching = false;
          p.airVx = p.vx;
          triggerScreenShake(5.0);
          spawnJetpackSparks(centerX, topY, 0, 8);
          return;
        }
      }
    }
  }

  for (const obs of customObstacles) {
    const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
    const bottomY = topY + obs.h;

    if (obs.type === 'jump_pad') {
      if (centerX >= obs.x - 6 && centerX <= obs.x + obs.w + 6) {
        if (feetY >= topY - 14 && feetY <= topY + Math.max(22, p.vy + 12)) {
          p.y = topY - p.h - 4;
          p.vy = -12.5;
          p.isJumping = true;
          p.isCrouching = false;
          p.airVx = p.vx;
          triggerScreenShake(5.0);
          spawnJetpackSparks(centerX, topY, 0, 6);
          return;
        }
      }
    } else if (obs.type === 'speed_booster_pad') {
      if (centerX >= obs.x && centerX <= obs.x + obs.w && feetY >= topY - 8 && feetY <= topY + 12) {
        if (!p.boostCooldown || p.boostCooldown <= 0) {
          const facing = p.facing || (p.vx >= 0 ? 1 : -1);
          p.vx += facing * 8.5;
          p.boostCooldown = 18;
          spawnJetpackSparks(centerX, topY, facing, 5);
          triggerScreenShake(3.0);
        }
      }
    } else if (obs.type === 'gravity_lift') {
      if (p.x + p.w > obs.x && p.x < obs.x + obs.w && feetY > topY && p.y < bottomY) {
        p.vy = Math.max(-6.5, p.vy - 0.7);
        p.isJumping = true;
        p.airVx = p.vx;
        spawnJetpackSparks(centerX, p.y + p.h, 0, 1);
      }
    } else if (obs.type === 'cyber_bumper') {
      const cx = obs.x + obs.w / 2;
      const cy = topY + obs.h / 2;
      const px = p.x + p.w / 2;
      const py = p.y + p.h / 2;
      const bdist = Math.hypot(px - cx, py - cy);
      if (bdist < 20 + 16) {
        const nx = bdist > 0.001 ? (px - cx) / bdist : 0;
        const ny = bdist > 0.001 ? (py - cy) / bdist : -1;
        p.x = cx + nx * 38 - p.w / 2;
        p.y = cy + ny * 38 - p.h / 2;
        p.vx = nx * 15.0;
        p.vy = ny * 15.0;
        p.isJumping = true;
        obs.hitTimer = 14;
        triggerScreenShake(5.0);
        spawnJetpackSparks(cx + nx * 20, cy + ny * 20, 0, 8);
      }
    } else if (obs.type === 'barbed_wire') {
      if (p.x + p.w > obs.x && p.x < obs.x + obs.w && feetY >= topY && p.y <= bottomY) {
        p.vx *= 0.45;
        obs.wireDmgTick = (obs.wireDmgTick || 0) + 1;
        if (obs.wireDmgTick % 18 === 0 && (!p.spawnProtectionTimer || p.spawnProtectionTimer <= 0)) {
          p.hp = Math.max(0, (p.hp !== undefined ? p.hp : 100) - 1);
          if (p.hp <= 0 && !p.isDead) {
            p.isDead = true;
            p.respawnTimer = 180;
            p.hasHead = true;
            p.isGibbed = false;
            p.corpseAngle = 0;
            if (p.currentWeapon) spawnDroppedWeapon(p.x + p.w / 2, p.y + 20, p.vx, -3, p.currentWeapon, p.facing);
          }
        }
      }
    } else if (obs.type === 'laser_gate') {
      if (p.x + p.w > obs.x && p.x < obs.x + obs.w && feetY > topY && p.y < bottomY) {
        if (!p.laserCooldown || p.laserCooldown <= 0) {
          if (!p.spawnProtectionTimer || p.spawnProtectionTimer <= 0) {
            p.hp = Math.max(0, (p.hp !== undefined ? p.hp : 100) - 15);
          }
          p.laserCooldown = 30;
          triggerScreenShake(4.0);
          spawnObstacleSparks(obs.x + obs.w / 2, p.y + p.h / 2, 0, -1, 6);
          if (p.hp <= 0 && !p.isDead) {
            p.isDead = true;
            p.respawnTimer = 180;
            p.hasHead = true;
            p.isGibbed = false;
            p.corpseAngle = 0;
            if (p.currentWeapon) spawnDroppedWeapon(p.x + p.w / 2, p.y + 20, p.vx, -3, p.currentWeapon, p.facing);
          }
        }
      }
    }
  }

  let landedSurface = null;
  let landedSlope = 0;
  let landedPlatform = null;

  for (const plat of ARENA_PLATFORMS) {
    if (plat.isWall || plat.isJumpPad || plat.type === 'jump_pad' || plat.solid === false || plat.isPlatform === false || plat.type === 'water') continue;
    const bnds = getPlatformBounds(plat);
    // Histereza na krawędziach: uwzględnia szerokość modelu postaci (Raptor 24, Striker 26, Enforcer 30)
    const halfW = (p.w || 24) * 0.5;
    const isCurrent = (p.onGround && p.currentPlatform === plat);
    const horizMargin = isCurrent ? Math.max(16, halfW + 4) : Math.max(12, halfW);

    if (centerX >= bnds.minX - horizMargin && centerX <= bnds.maxX + horizMargin) {
      const surf = getPlatformSurfaceInfo(plat, centerX, groundY);
      let topY = surf.surfaceY;

      // Sprawdzenie podwyższeń i cokołów bezpośrednio na platformie (np. centralny ołtarz z cokołem w Arenie 1)
      if (plat.props && plat.props.length > 0) {
        const tier = plat.props.find(pr => (pr.type === 'altar_pedestal' || pr.type === 'sandbag_trench'));
        if (tier) {
          const tierLeft = plat.x + tier.rx;
          const tierRight = tierLeft + tier.w;
          if (centerX >= tierLeft - 4 && centerX <= tierRight + 4) {
            topY = surf.surfaceY - tier.h;
          }
        }
      }

      const prevFeetY = feetY - p.vy;
      const isFallenDebris = (plat.intact === false) || plat.isDebris;
      const platThickness = plat.thickness || plat.h || 20;
      const isA3Ground = isA3 && (plat.id === 'ground_left' || plat.id === 'ground_right' || plat.id === 'riverbank_left_oval' || plat.id === 'riverbank_right_oval');

      // 1. Lądowanie z powietrza (opadanie p.vy >= -1.0):
      // Pełny swept-test wzdłuż osi Y chroniący przed przenikaniem przy wysokiej prędkości pionowej i odrzucie
      const airMarginTop = Math.max(30, platThickness * 0.9);
      const isAirLanding = p.vy >= -1.0 && (
        (prevFeetY <= topY + airMarginTop && feetY >= topY - 14 && feetY <= topY + Math.max(36, p.vy + 24))
      );

      // 2. Stabilne utrzymanie na bieżącej platformie (Ground Retention):
      // Gracz nie odpada od platformy przy mikro-wahaniach pionowych ani przy wstawaniu ze staggara
      const maxRetentionDiff = isA3Ground ? 85 : ((p.staggerTimer > 0 || (p.staggerRecoveryTimer || 0) > 0) ? 60 : 36);
      const isGroundedRetention = isCurrent && !(p.isJumping && p.vy < -2.5) && !(p.rocketBoots?.dashing && p.rocketBoots.dashType === 'AIR' && p.rocketBoots.dashDirY < -0.1) && Math.abs(feetY - topY) <= maxRetentionDiff;

      // 3. Płynne przejście między sąsiadującymi klockami/platformami (Step-over transition na modularnych kładkach i rampach):
      const isStepOver = p.onGround && !p.isJumping && Math.abs(feetY - topY) <= 32;

      let isLanding = isAirLanding || isGroundedRetention || isStepOver;

      // Wejście na zawalony / leżący klocek (Step-up mechanic na leżący gruz):
      if (!isLanding && isFallenDebris) {
        const stepDiff = feetY - topY;
        if (stepDiff >= 0 && stepDiff <= 34 && feetY >= bnds.minY - 12 && feetY <= bnds.maxY + 18) {
          isLanding = true;
        }
      }

      // Twarde zabezpieczenie przed zapadaniem się w lity grunt / kratery na Arenie 3
      if (!isLanding && isA3Ground && !(p.isJumping && p.vy < -2.5)) {
        if (feetY >= topY - 14 && feetY <= topY + platThickness) {
          isLanding = true;
        }
      }

      if (isLanding) {
        if (p.dropThroughTimer > 0 && (plat === p.dropThroughPlatform || (p.dropThroughPlatform && plat.id === p.dropThroughPlatform.id)) && !isFallenDebris) {
          continue;
        }
        if (p.onGround && p.currentPlatform === plat) {
          landedSurface = topY;
          landedSlope = surf.slope;
          landedPlatform = plat;
          break;
        }
        if (landedSurface === null || topY < landedSurface) {
          landedSurface = topY;
          landedSlope = surf.slope;
          landedPlatform = plat;
        }
      }
    }
  }

  for (const obs of customObstacles) {
    if (!obs || obs.team || obs.holeCx !== undefined || obs.id?.startsWith('goal') || obs.type === 'goal') {
      continue;
    }
    if (obs.type === 'hedgehog' || obs.type === 'gravity_lift' || obs.type === 'barbed_wire' || obs.type === 'laser_gate' || obs.type === 'cyber_bumper' || obs.type === 'speed_booster_pad') {
      continue;
    }

    const baseTopY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
    const halfW = (p.w || 24) * 0.5;
    const isCurrentObs = (p.onGround && p.currentPlatform === obs);
    const obsMargin = isCurrentObs ? Math.max(16, halfW + 4) : Math.max(12, halfW);

    if (obs.type === 'metal_ramp_left') {
      if (centerX >= obs.x - obsMargin && centerX <= obs.x + obs.w + obsMargin) {
        const t = Math.max(0, Math.min(1, (centerX - obs.x) / obs.w));
        const rampSurfaceY = baseTopY + t * obs.h;
        const prevFeetY = feetY - p.vy;
        const isAirLanding = p.vy >= 0 && prevFeetY <= rampSurfaceY + Math.max(16, obs.h * 0.8) && feetY >= rampSurfaceY - 12 && feetY <= rampSurfaceY + Math.max(24, p.vy + 16);
        const isGroundedRetention = isCurrentObs && !(p.isJumping && p.vy < -2.0) && Math.abs(feetY - rampSurfaceY) <= 30;
        const isStepOver = p.onGround && !p.isJumping && Math.abs(feetY - rampSurfaceY) <= 26;

        if (isAirLanding || isGroundedRetention || isStepOver) {
          if (p.dropThroughTimer > 0 && (obs === p.dropThroughPlatform || (p.dropThroughPlatform && obs.id && obs.id === p.dropThroughPlatform.id))) {
            continue;
          }
          if (landedSurface === null || rampSurfaceY < landedSurface) {
            landedSurface = rampSurfaceY;
            landedPlatform = obs;
            landedSlope = obs.h / (obs.w || 1);
          }
        }
      }
    } else if (obs.type === 'metal_ramp_right') {
      if (centerX >= obs.x - obsMargin && centerX <= obs.x + obs.w + obsMargin) {
        const t = Math.max(0, Math.min(1, (centerX - obs.x) / obs.w));
        const rampSurfaceY = baseTopY + (1 - t) * obs.h;
        const prevFeetY = feetY - p.vy;
        const isAirLanding = p.vy >= 0 && prevFeetY <= rampSurfaceY + Math.max(16, obs.h * 0.8) && feetY >= rampSurfaceY - 12 && feetY <= rampSurfaceY + Math.max(24, p.vy + 16);
        const isGroundedRetention = isCurrentObs && !(p.isJumping && p.vy < -2.0) && Math.abs(feetY - rampSurfaceY) <= 30;
        const isStepOver = p.onGround && !p.isJumping && Math.abs(feetY - rampSurfaceY) <= 26;

        if (isAirLanding || isGroundedRetention || isStepOver) {
          if (p.dropThroughTimer > 0 && (obs === p.dropThroughPlatform || (p.dropThroughPlatform && obs.id && obs.id === p.dropThroughPlatform.id))) {
            continue;
          }
          if (landedSurface === null || rampSurfaceY < landedSurface) {
            landedSurface = rampSurfaceY;
            landedPlatform = obs;
            landedSlope = -obs.h / (obs.w || 1);
          }
        }
      }
    } else {
      if (centerX >= obs.x - obsMargin && centerX <= obs.x + obs.w + obsMargin) {
        const prevFeetY = feetY - p.vy;
        const isAirLanding = p.vy >= 0 && prevFeetY <= baseTopY + Math.max(16, (obs.h || 20) * 0.8) && feetY >= baseTopY - 12 && feetY <= baseTopY + Math.max(24, p.vy + 16);
        const isGroundedRetention = isCurrentObs && !(p.isJumping && p.vy < -2.0) && Math.abs(feetY - baseTopY) <= 30;
        const isStepOver = p.onGround && !p.isJumping && Math.abs(feetY - baseTopY) <= 26;

        if (isAirLanding || isGroundedRetention || isStepOver) {
          if (p.dropThroughTimer > 0 && (obs === p.dropThroughPlatform || (p.dropThroughPlatform && obs.id && obs.id === p.dropThroughPlatform.id))) {
            continue;
          }
          if (landedSurface === null || baseTopY < landedSurface) {
            landedSurface = baseTopY;
            landedPlatform = obs;
            landedSlope = 0;
          }
        }
      }
    }
  }

  for (const obs of customObstacles) {
    if (!obs || obs.team || obs.holeCx !== undefined || obs.id?.startsWith('goal') || obs.type === 'goal') {
      continue;
    }
    if (obs.type === 'bunker_block' || obs.type === 'cyber_pillar' || obs.type === 'tall_concrete_wall' || obs.type === 'explosive_barrel') {
      const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
      const bottomY = topY + obs.h;
      if (feetY > topY + 8 && p.y < bottomY - 4) {
        if (p.x + p.w > obs.x && p.x < obs.x + obs.w) {
          const midX = obs.x + obs.w / 2;
          if (p.x + p.w / 2 < midX) {
            p.x = obs.x - p.w;
            if (p.vx > 0) p.vx = 0;
          } else {
            p.x = obs.x + obs.w;
            if (p.vx < 0) p.vx = 0;
          }
        }
      }
    }
  }

  // Twarda blokada przechodzenia przez pionowe monolity i formacje skalne
  for (const plat of ARENA_PLATFORMS) {
    if (plat && plat.solid && plat.isMonolith) {
      const topY = groundY - plat.relY;
      const bottomY = topY + (plat.thickness || 470);
      if (feetY > topY + 8 && p.y < bottomY - 4) {
        if (p.x + p.w > plat.x && p.x < plat.x + plat.w) {
          const midX = plat.x + plat.w / 2;
          if (p.x + p.w / 2 < midX) {
            p.x = plat.x - p.w;
            if (p.vx > 0) p.vx = 0;
          } else {
            p.x = plat.x + plat.w;
            if (p.vx < 0) p.vx = 0;
          }
        }
      }
    }
  }

  // Twarda blokada przechodzenia przez pionowe ściany szybów i krawędzie skał (isWall)
  for (const plat of ARENA_PLATFORMS) {
    if (plat && plat.isWall && plat.solid !== false) {
      const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
      const bottomY = topY + (plat.h || plat.thickness || 200);
      if (feetY > topY + 6 && p.y < bottomY - 4) {
        if (p.x + p.w > plat.x && p.x < plat.x + plat.w) {
          if (plat.pushSide === 'left') {
            p.x = plat.x - p.w;
            if (p.vx > 0) p.vx = 0;
          } else if (plat.pushSide === 'right') {
            p.x = plat.x + plat.w;
            if (p.vx < 0) p.vx = 0;
          } else {
            const overlapLeft = (p.x + p.w) - plat.x;
            const overlapRight = (plat.x + plat.w) - p.x;
            if (overlapLeft < overlapRight) {
              p.x = plat.x - p.w;
              if (p.vx > 0) p.vx = 0;
            } else {
              p.x = plat.x + plat.w;
              if (p.vx < 0) p.vx = 0;
            }
          }
        }
      }
    }
  }

  // Twarda blokada przechodzenia przez zawalone klocki leżące (Solid Debris Obstacles)
  for (const plat of ARENA_PLATFORMS) {
    if (!plat || plat.intact !== false || plat.solid === false || plat.isWall || plat.oneWay || plat.isTowerBlock) continue;
    if (p.currentPlatform === plat) continue;

    const bnds = getPlatformBounds(plat);
    const stepDiff = feetY - bnds.minY;
    // Jeśli blok jest wyższy niż próg wejścia (stepDiff > 34) lub gracz uderza w bok wysokiego gruzu
    if (stepDiff > 34 && feetY > bnds.minY + 14 && p.y < bnds.maxY - 4) {
      if (p.x + p.w > bnds.minX && p.x < bnds.maxX) {
        const midX = bnds.cx;
        if (p.x + p.w / 2 < midX) {
          p.x = bnds.minX - p.w;
          if (p.vx > 0) p.vx = 0;
        } else {
          p.x = bnds.maxX;
          if (p.vx < 0) p.vx = 0;
        }
      }
    }
  }
  p.isClimbing = false;

  if (landedSurface === null) {
    for (const plat of ARENA_PLATFORMS) {
      if (plat.props) {
        const tier = plat.props.find(pr => pr.type === 'altar_pedestal' || pr.type === 'sandbag_trench');
        if (tier) {
          const tierLeft = plat.x + tier.rx;
          const tierRight = tierLeft + tier.w;
          const halfW = (p.w || 24) * 0.5;
          if (centerX >= tierLeft - halfW && centerX <= tierRight + halfW) {
            const tierTopY = getPlatformSurfaceY(plat, centerX, groundY) - tier.h;
            const prevFeetY = feetY - p.vy;
            const isAirLanding = p.vy >= 0 && prevFeetY <= tierTopY + Math.max(16, tier.h * 0.8) && feetY >= tierTopY - 12 && feetY <= tierTopY + Math.max(24, p.vy + 16);
            const isGrounded = p.onGround && !(p.isJumping && p.vy < -2.0) && Math.abs(feetY - tierTopY) <= 30;
            if (isAirLanding || isGrounded) {
              landedSurface = tierTopY;
              landedPlatform = plat;
              break;
            }
          }
        }
      }
    }
  }

  if (landedSurface !== null) {
    const impactVy = p.vy;
    p.y = landedSurface - colH;
    p.vy = 0;
    p.isJumping = false;
    p.isSprintJump = false;
    p.sprintJumpTimer = 0;
    p.coyoteTimer = 8;
    p.lastGroundVx = p.vx;
    p.lastGroundedFloorY = landedSurface;
    p.onGround = true;
    p.airVx = 0;
    p.currentGroundY = landedSurface;
    p.currentPlatform = landedPlatform;

    // Reset stanu drop-through po pomyślnym wylądowaniu na platformie
    p.dropThroughTimer = 0;
    p.dropThroughPlatform = null;

    // Przerwanie powietrznego dasha Strikera przy kontakcie z platformą
    if (p.rocketBoots?.dashing && p.rocketBoots.dashType === 'AIR') {
      p.rocketBoots.dashing = false;
      p.rocketBoots.dashType = 'NONE';
      p.rocketBoots.dashTimer = 0;
    }

    if (!wasGrounded && impactVy > 1.8 && !(p.staggerTimer > 0) && !p.isSliding) {
      p.landingSquatIntensity = Math.min(1.0, impactVy / 8.5);
      p.landingSquatTimer = Math.min(5, Math.max(2, Math.round(p.landingSquatIntensity * 5)));
    }

    // Obsługa nachylenia (slopes physics): ślizganie i dynamiczny bieg po pochyłym terenie
    if (Math.abs(landedSlope) > 0.01) {
      if (p.isSliding) {
        // Pęd grawitacyjny w dół zbocza (downhill slide boost)
        p.vx -= landedSlope * 0.28;
      }
      p.slopeAngle = Math.atan(-landedSlope) * 0.6;
    } else {
      p.slopeAngle = 0;
    }

    if (p.staggerTimer > 0 && !p.staggerLanded) {
      p.staggerLanded = true;
      p.vx *= 0.70;
      spawnGroundPuff(centerX, landedSurface);
    }
    if (!p.rocketBoots?.dashing && p.jetFuel < p.jetMax) {
      p.jetFuel = Math.min(p.jetMax, p.jetFuel + 2.5);
    }
  } else {
    p.currentPlatform = null;
    p.slopeAngle = 0;
    const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
    const isA3 = (curArena?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3');
    const isA2 = (curArena?.id === 'arena-2' || activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X');
    const hasNoFloor = isA3 || isA2;

    if (p.inMinecart || p._inCart) {
      // Pasażer w wagoniku kopalnianym stoi stabilnie na podłodze wózka
      p.onGround = true;
      p.isJumping = false;
      p.vy = 0;
      if (p._inCart) {
        const cartFloor = p._inCart.y + 48;
        p.currentGroundY = cartFloor;
        p.y = cartFloor - colH;
      }
    } else if (hasNoFloor) {
      if (isA3 && (centerX <= 1750 || centerX >= 2650)) {
        // W Arenie 3 na lądzie pod postacią zawsze znajduje się lita skała / dno krateru
        const maxFloorY = (typeof getRiverbankGroundY === 'function') ? getRiverbankGroundY(centerX) : 1200;
        if (feetY >= maxFloorY - 14) {
          p.y = maxFloorY - colH;
          p.vy = 0;
          p.isJumping = false;
          p.onGround = true;
          p.currentGroundY = maxFloorY;
        } else {
          p.onGround = false;
          p.currentGroundY = null;
        }
      } else {
        // W Arenie 3 (nad rzeką) oraz Arenie 2 (Pandora) brak płaskiej podłogi – mapa składa się wyłącznie z zawieszonych w powietrzu wysp i otchłani
        p.onGround = false;
        p.currentGroundY = null;
      }
    } else {
      // Sprawdzenie czy pod postacią znajduje się niezniszczony segment podłoża
      const isSupported = (typeof isGroundAt === 'function')
        ? (isGroundAt(p.x + 6) || isGroundAt(p.x + (p.w || 24) - 6))
        : true;

      if (isSupported) {
        p.currentGroundY = groundY;
        p.onGround = (p.y >= groundY - colH - 1);
        if (p.onGround && p.staggerTimer > 0 && !p.staggerLanded) {
          p.staggerLanded = true;
          p.vy = 0;
          p.vx *= 0.70;
          spawnGroundPuff(centerX, groundY);
        }
      } else {
        // Postać nad wyrwą w geometrii – natychmiast traci podparcie
        p.onGround = false;
        p.currentGroundY = null;
      }
    }
  }

  // Bezpieczne pobranie referencji do aktywnej areny
  const activeArena = (typeof getActiveArena === 'function' ? getActiveArena() : null) ||
    (typeof window !== 'undefined' ? (window.curArenaObj || window.currentArena) : null);

  const activeArenaRefId = activeArena?.id || (typeof activeArenaId !== 'undefined' ? activeArenaId : null);
  const isA2Active = (activeArenaRefId === 'arena-2' || activeArenaRefId === 'ARENA_2' || activeArenaRefId === 'ARENA_2_PANDORA' || activeArenaRefId === 'ARENA_2_SECTOR_X');
  const isA3Active = (activeArenaRefId === 'arena-3' || activeArenaRefId === 'ARENA_3' || activeArenaRefId === 'ARENA_FOUNDRY');

  // Bezpieczne wyznaczenie poziomu kwasu / strefy zagrożenia
  const hazardLevelY = (typeof ACID_SURGE_SYSTEM !== 'undefined' && ACID_SURGE_SYSTEM.currentY)
    ? ACID_SURGE_SYSTEM.currentY
    : (activeArena?.acidSurge?.currentY ?? activeArena?.hazardZoneY ?? 1440);

  // Obsługa strefy kwasu toksycznego w Sektorze X (Arena 2)
  if (isA2Active) {
    if (p && !p.isDead && !p.isAcidDying && (!p.acidDeath || !p.acidDeath.active)) {
      const px = (p.x !== undefined ? p.x : 0) + (p.w || 24) * 0.5;
      const time = performance.now() * 0.001;
      const waveOffset = Math.sin(time * 3.0 + px * 0.02) * 5.0;
      const exactSurfaceY = hazardLevelY + waveOffset;
      const playerFeetY = (p.origin === 'bottom') ? p.y : (p.y + (p.h || 70));
      const SUBMERGE_DEPTH = 15; // margines zanurzenia: 15 pikseli w głąb kwasu

      if (playerFeetY >= (exactSurfaceY + SUBMERGE_DEPTH)) {
        if (typeof window !== 'undefined' && typeof window.triggerPlayerAcidDeath === 'function') {
          window.triggerPlayerAcidDeath(p, exactSurfaceY);
        }
      }
    }
  }

  // Górny limit otwartego nieba w Arenie 3 (Y = 0)
  if (isA3Active) {
    if (p.y < 0) {
      p.y = 0;
      if (p.vy < 0) p.vy = 0;
    }
  }

  // Wpadnięcie do śmiertelnej rzeki w Arenie 3 (utonięcie po wejściu głębiej do wody)
  if (isA3Active && !p.isDead) {
    const pw = p.w || 24;
    const ph = p.h || 70;
    const pCenterX = p.x + pw * 0.5;
    const pFeetY = p.y + ph;
    const pCenterY = p.y + ph * 0.5;
    const inWaterX = (pCenterX >= 1560 && pCenterX <= 2840);
    const inWaterY = (pFeetY >= 1300);

    if (inWaterX && inWaterY) {
      const inOpenChannel = (pCenterX > 1750 && pCenterX < 2650);
      const isDeepWater = (pFeetY >= 1350) || (pCenterY >= 1325) || (inOpenChannel && pFeetY >= 1335);

      if (isDeepWater) {
        p.hp = 0;
        p.isDead = true;
        p.respawnTimer = 85;
        p.vx = 0;
        p.vy = 2.0; // tonie w głąb rzeki
        p.onGround = false;
        p.currentPlatform = null;
        if (typeof triggerScreenShake === 'function') {
          triggerScreenShake(6);
        }
      } else {
        // Płytka woda na brzegu - opór ruchu
        p.vx *= 0.82;
        if (p.vy > 0) p.vy *= 0.92;
      }
    }
  }

  // Wpadnięcie do strefy śmierci poniżej spągu (na Arenie 2 śmierć sterowana jest WYŁĄCZNIE przez kwas)
  const deathLimitY = isA3Active ? 1420 : (isA2Active ? 2000 : (groundY + 160));
  if (!isA2Active && !p.inMinecart && !p._inCart && p.y > deathLimitY && !p.isDead) {
    p.hp = 0;
    p.isDead = true;
    p.respawnTimer = 75;
    if (typeof triggerScreenShake === 'function') {
      triggerScreenShake(12);
    }
  }
}

