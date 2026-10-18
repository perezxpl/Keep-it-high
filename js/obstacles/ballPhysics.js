// =========================================================================
// OBSTACLES/BALLPHYSICS.JS - KOLIZJE PIŁKI Z PRZESZKODAMI, PLATFORMAMI I BRAMKAMI
// Wydzielony moduł z js/obstacles.js
// =========================================================================

import { ARENA_WIDTH } from '../config.js';
import {
  triggerScreenShake,
  triggerGoalCelebration,
  spawnJetpackSparks,
  resolveSegmentCollision
} from '../world.js';
import { arena1State, centerX } from '../arenas/arena1.js';
import { recordGoal } from '../progression.js';
import { normalizeObstacleType } from './palette.js';
import { spawnAltarShockwave } from './renderer.js';
import { checkPlayerPlatformLanding } from './playerPhysics.js';
import { getActiveBots } from '../bot.js';
import {
  customObstacles,
  _activePlayer,
  _activeBall,
  _activeBot,
  setActiveEntities,
  spawnObstacleSparks,
  activeArenaId,
  ARENA_PLATFORMS,
  GROUND_BARRICADES,
  GOALS,
  arenaScore,
  resetArena,
  getPlatformBounds,
  getPlatformSurfaceInfo,
  updateBarrelExplosionParticles
} from './state.js';

export function resolveBallObstacleCollisions(ball, groundY) {
  if (!ball || (ball.goalAnimation && ball.goalAnimation.active)) return;
  const speed = Math.hypot(ball.vx, ball.vy);
  const cR = ball.colRadius !== undefined ? ball.colRadius : ball.radius;
  const prevX = ball.prevX !== undefined ? ball.prevX : (ball.x - ball.vx);
  const prevY = ball.prevY !== undefined ? ball.prevY : (ball.y - ball.vy);

  for (const plat of ARENA_PLATFORMS) {
    if (plat.passBall || plat.isHatch || plat.id === 'hatch_l' || plat.id === 'hatch_r' || plat.type === 'water' || plat.solid === false || plat.isPlatform === false) {
      continue;
    }
    if (plat.isJumpPad || plat.type === 'jump_pad') {
      const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
      const bottomY = topY + (plat.h || 14);
      if (ball.x >= plat.x - cR && ball.x <= plat.x + plat.w + cR) {
        if (ball.y + cR >= topY - 2 && ball.y - cR <= bottomY) {
          ball.y = topY - cR - 3;
          ball.vy = plat.launchVy || -14.0;
          ball.vx *= 1.05;
          ball.spin = (ball.vx > 0 ? 1 : -1) * 0.8;
          triggerScreenShake(5.0);
          continue;
        }
      }
      continue;
    }

    if (plat.isWall && plat.solid !== false) {
      const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
      const bottomY = topY + (plat.h || plat.thickness || 200);
      const platLeft = plat.x;
      const platRight = plat.x + plat.w;

      if (ball.x + cR >= platLeft && ball.x - cR <= platRight && ball.y + cR >= topY && ball.y - cR <= bottomY) {
        if (plat.pushSide === 'right' || (ball.vx < 0 && ball.x >= platRight - 15)) {
          ball.x = platRight + cR;
          ball.vx = Math.abs(ball.vx) * 0.75;
          ball.spin = -ball.spin * 0.5;
        } else if (plat.pushSide === 'left' || (ball.vx > 0 && ball.x <= platLeft + 15)) {
          ball.x = platLeft - cR;
          ball.vx = -Math.abs(ball.vx) * 0.75;
          ball.spin = -ball.spin * 0.5;
        } else {
          const ol = (ball.x + cR) - platLeft;
          const or = platRight - (ball.x - cR);
          const ot = (ball.y + cR) - topY;
          const ob = bottomY - (ball.y - cR);
          const minO = Math.min(ol, or, ot, ob);
          if (minO === ot && ball.vy >= 0) {
            ball.y = topY - cR;
            ball.vy = -Math.abs(ball.vy) * 0.65;
          } else if (minO === ob && ball.vy <= 0) {
            ball.y = bottomY + cR;
            ball.vy = Math.abs(ball.vy) * 0.65;
          } else if (minO === ol) {
            ball.x = platLeft - cR;
            ball.vx = -Math.abs(ball.vx) * 0.75;
          } else {
            ball.x = platRight + cR;
            ball.vx = Math.abs(ball.vx) * 0.75;
          }
        }
      }
      continue;
    }

    if (plat.isCrossbar) {
      const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
      const bottomY = topY + (plat.h || plat.thickness || 14);
      const platLeft = plat.x;
      const platRight = plat.x + plat.w;

      // Odbicie od górnej lub dolnej krawędzi poprzeczki
      if (ball.x >= platLeft - cR && ball.x <= platRight + cR) {
        if (ball.vy > 0 && ball.y + cR >= topY && (ball.y - ball.vy) + cR <= topY + 12) {
          ball.y = topY - cR;
          ball.vy = -Math.abs(ball.vy) * 0.72;
          ball.vx *= 0.96;
          ball.spin *= 0.90;
          if (speed > 6.0) triggerScreenShake(2.5);
        } else if (ball.vy < 0 && ball.y - cR <= bottomY && (ball.y - ball.vy) - cR >= bottomY - 12) {
          ball.y = bottomY + cR;
          ball.vy = Math.abs(ball.vy) * 0.72;
          ball.vx *= 0.96;
          ball.spin *= 0.90;
          if (speed > 6.0) triggerScreenShake(2.5);
        }
      }

      // Odbicie od przedniego narożnika wlotu poprzeczki (słupek narożny)
      const postCornerX = (plat.x === 0) ? platRight : platLeft;
      const postCornerY = topY;
      const cdx = ball.x - postCornerX;
      const cdy = ball.y - postCornerY;
      const cdist = Math.hypot(cdx, cdy);
      if (cdist < cR && cdist > 0.001) {
        const cnx = cdx / cdist;
        const cny = cdy / cdist;
        ball.x = postCornerX + cnx * (cR + 1);
        ball.y = postCornerY + cny * (cR + 1);
        const vDotN = ball.vx * cnx + ball.vy * cny;
        if (vDotN < 0) {
          const restitution = 0.78;
          ball.vx -= (1 + restitution) * vDotN * cnx;
          ball.vy -= (1 + restitution) * vDotN * cny;
          ball.spin = (ball.vx > 0 ? 1 : -1) * 0.75;
          triggerScreenShake(3.5);
        }
      }
      continue;
    }

    if (plat.type === 'catwalk') {
      const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
      const platLeft = plat.x;
      const platRight = plat.x + plat.w;

      if (ball.x >= platLeft - cR && ball.x <= platRight + cR) {
        if (ball.vy > 0) {
          const prevBottomY = (ball.y - ball.vy) + cR;
          if (ball.y + cR >= topY && prevBottomY <= topY + 8) {
            ball.y = topY - cR;
            ball.vy = Math.abs(ball.vy) > 0.8 ? -ball.vy * 0.65 : 0;
            ball.vx *= 0.98;
            ball.spin *= 0.94;
            ball.rotation += ball.vx * 0.08;
            if (speed > 8.0) triggerScreenShake(2.5);
          }
        }
      }
    } else {
      const surf = getPlatformSurfaceInfo(plat, ball.x, groundY);
      const topY = surf.surfaceY;
      const bnds = getPlatformBounds(plat);
      const platLeft = bnds.minX;
      const platRight = bnds.maxX;
      const thickness = plat.thickness || plat.h || 20;

      if (plat.oneWay && ball.vy <= 0) continue;
      if (ball.x >= platLeft - cR && ball.x <= platRight + cR) {
        const prevBottomY = prevY + cR;
        const curBottomY = ball.y + cR;

        if (curBottomY >= topY && prevBottomY <= topY + 18 && ball.y - cR <= topY + thickness + 15) {
          if (Math.abs(surf.slope) > 0.05) {
            // Kolizja wektorowa ze stokiem / naturalną rampą kicker
            const nx = surf.nx;
            const ny = surf.ny;
            const vDotN = ball.vx * nx + ball.vy * ny;
            if (vDotN < 0) {
              const restitution = 0.68;
              ball.vx -= (1 + restitution) * vDotN * nx;
              ball.vy -= (1 + restitution) * vDotN * ny;
              // Rampa wybijająca w centrum (kicker ramp): wznoszący profil wyrzuca piłkę w powietrze
              if (surf.slope > 0.35 && ball.vx > 2.5) {
                ball.vy -= Math.min(8.2, ball.vx * 0.80);
              }
            }
            ball.y = topY - cR;
            ball.vx *= 0.985;
            ball.spin = -ball.vx * 0.12;
            ball.rotation += ball.vx * 0.08;
          } else {
            ball.y = topY - cR;
            ball.vy = Math.abs(ball.vy) > 0.8 ? -ball.vy * 0.65 : 0;
            ball.vx *= 0.98;
            ball.spin *= 0.94;
            ball.rotation += ball.vx * 0.08;
          }
          if (speed > 8.0) triggerScreenShake(2.5);
        }
      }

      // Odbicie boczne od pionowego monolitu skalnego
      if (plat.isMonolith) {
        const mTop = groundY - plat.relY;
        const mBottom = mTop + (plat.thickness || 470);
        if (ball.y >= mTop && ball.y <= mBottom) {
          if (ball.x + cR >= platLeft && ball.x - cR <= platRight) {
            if (ball.x < platLeft + plat.w / 2) {
              ball.x = platLeft - cR;
              if (ball.vx > 0) ball.vx = -ball.vx * 0.75;
            } else {
              ball.x = platRight + cR;
              if (ball.vx < 0) ball.vx = -ball.vx * 0.75;
            }
          }
        }
      }

      if (plat.props) {
        for (const prop of plat.props) {
          if (prop.type === 'altar_pedestal' || prop.type === 'sandbag_trench' || prop.type === 'wooden_log_bunker') {
            const bx = plat.x + prop.rx;
            const by = topY - prop.h;
            const bw = prop.w;
            const bh = prop.h;

            const clampX = Math.max(bx, Math.min(bx + bw, ball.x));
            const clampY = Math.max(by, Math.min(by + bh, ball.y));
            const cdx = ball.x - clampX;
            const cdy = ball.y - clampY;
            const cdist = Math.hypot(cdx, cdy);

            if (cdist < cR) {
              let cnx = 0, cny = -1;
              if (cdist > 0.001) {
                cnx = cdx / cdist;
                cny = cdy / cdist;
              }
              const pen = cR - cdist;
              ball.x += cnx * pen;
              ball.y += cny * pen;

              const bvn = ball.vx * cnx + ball.vy * cny;
              if (bvn < 0) {
                const bjn = -(1 + 0.65) * bvn;
                ball.vx += bjn * cnx;
                ball.vy += bjn * cny;
              }
            }
          }
        }
      }
    }
  }

  for (const bar of GROUND_BARRICADES) {
    const bType = normalizeObstacleType(bar.type);
    if (bType === 'sandbags' || bType === 'ammo_depot') {
      const barLeft = bar.x;
      const barRight = bar.x + bar.w;
      const barTop = groundY - bar.h;
      const barBottom = groundY;

      const ballLeft = ball.x - cR;
      const ballRight = ball.x + cR;
      const ballTop = ball.y - cR;
      const ballBottom = ball.y + cR;

      if (ballRight > barLeft && ballLeft < barRight && ballBottom > barTop && ballTop < barBottom) {
        const overlapLeft = ballRight - barLeft;
        const overlapRight = barRight - ballLeft;
        const overlapTop = ballBottom - barTop;

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop);
        const isRollingFlat = Math.abs(ball.vy) < 1.0 || (ball.y + cR >= groundY - 4);

        if (minOverlap === overlapTop && ball.vy >= 0) {
          ball.y = barTop - cR;
          ball.vy = -Math.abs(ball.vy) * 0.55;
          ball.vx *= 0.88;
        } else if (minOverlap === overlapLeft) {
          ball.x = barLeft - cR;
          ball.vx = -Math.abs(ball.vx) * 0.70;
          if (isRollingFlat) ball.vy = 0;
        } else if (minOverlap === overlapRight) {
          ball.x = barRight + cR;
          ball.vx = Math.abs(ball.vx) * 0.70;
          if (isRollingFlat) ball.vy = 0;
        }
      }
    } else if (bar.type === 'hedgehog') {
      const hcx = bar.x;
      const hcy = groundY - bar.size / 2;
      const hr = bar.size / 2;
      const hdx = ball.x - hcx;
      const hdy = ball.y - hcy;
      const hd = Math.hypot(hdx, hdy);
      const minDistH = cR + hr;

      if (hd < minDistH) {
        const hnx = hd > 0.001 ? hdx / hd : 0;
        const hny = hd > 0.001 ? hdy / hd : -1;
        const hpen = minDistH - hd;
        ball.x += hnx * hpen;
        ball.y += hny * hpen;
        ball.vx = -ball.vx * 0.65;
        ball.vy *= 0.5;
        if (ball.y + cR >= groundY - 4 && ball.vy < 0) ball.vy = 0;
        if (speed > 6.0) triggerScreenShake(2.2);
      }
    }
  }

  for (const obs of customObstacles) {
    if (!obs || obs.team || obs.holeCx !== undefined || obs.id?.startsWith('goal') || obs.type === 'goal') {
      continue;
    }
    const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
    const bottomY = topY + obs.h;
    const obsLeft = obs.x;
    const obsRight = obs.x + obs.w;

    if (obs.type === 'cyber_bumper') {
      const cx = obs.x + obs.w / 2;
      const cy = topY + obs.h / 2;
      const br = 20;
      const bdx = ball.x - cx;
      const bdy = ball.y - cy;
      const bdist = Math.hypot(bdx, bdy);
      if (bdist < br + cR) {
        const bnx = bdist > 0.001 ? bdx / bdist : 0;
        const bny = bdist > 0.001 ? bdy / bdist : -1;
        ball.x = cx + bnx * (br + cR + 2);
        ball.y = cy + bny * (br + cR + 2);
        const impulse = Math.max(16.0, Math.hypot(ball.vx, ball.vy) * 2.2);
        ball.vx = bnx * impulse;
        ball.vy = bny * impulse;
        ball.spin = (ball.vx > 0 ? 1 : -1) * 0.9;
        obs.hitTimer = 14;
        triggerScreenShake(5.0);
        spawnAltarShockwave(cx, cy);
        continue;
      }
    } else if (obs.type === 'speed_booster_pad') {
      if (ball.x >= obsLeft - cR && ball.x <= obsRight + cR && ball.y + cR >= topY - 3 && ball.y - cR <= bottomY) {
        const dir = Math.abs(ball.vx) > 0.5 ? Math.sign(ball.vx) : 1;
        ball.y = topY - cR;
        ball.vx = dir * (Math.abs(ball.vx) + 8.5);
        ball.vy = -3.2;
        spawnJetpackSparks(ball.x, topY, dir, 4);
        triggerScreenShake(2.5);
        continue;
      }
    } else if (obs.type === 'gravity_lift') {
      if (ball.x >= obsLeft - cR && ball.x <= obsRight + cR && ball.y >= topY - cR && ball.y <= bottomY + cR) {
        ball.vy = Math.max(-6.5, ball.vy - 0.7);
        continue;
      }
    } else if (obs.type === 'metal_ramp_left') {
      resolveSegmentCollision(ball, obs.x, topY, obs.x + obs.w, topY + obs.h, 6, 0, 0, 0, 0, 0.75, 0.20);
      continue;
    } else if (obs.type === 'metal_ramp_right') {
      resolveSegmentCollision(ball, obs.x, topY + obs.h, obs.x + obs.w, topY, 6, 0, 0, 0, 0, 0.75, 0.20);
      continue;
    } else if (obs.type === 'jump_pad') {
      if (ball.x >= obsLeft - cR && ball.x <= obsRight + cR) {
        if (ball.y + cR >= topY - 2 && ball.y - cR <= bottomY) {
          ball.y = topY - cR - 3;
          ball.vy = -14.0;
          ball.vx *= 1.05;
          ball.spin = (ball.vx > 0 ? 1 : -1) * 0.8;
          triggerScreenShake(5.0);
          spawnAltarShockwave(ball.x, topY);
          continue;
        }
      }
    } else if (obs.type === 'catwalk' || obs.type === 'cyber_catwalk' || obs.type === 'floating_hex' || obs.type === 'sniper_tower') {
      if (ball.x >= obsLeft - cR && ball.x <= obsRight + cR) {
        if (ball.vy > 0) {
          const prevBottomY = (ball.y - ball.vy) + cR;
          if (ball.y + cR >= topY && prevBottomY <= topY + 12) {
            ball.y = topY - cR;
            ball.vy = Math.abs(ball.vy) > 0.8 ? -ball.vy * 0.65 : 0;
            ball.vx *= 0.98;
            ball.spin *= 0.94;
            ball.rotation += ball.vx * 0.08;
            if (speed > 8.0) triggerScreenShake(2.5);
          }
        }
      }
    } else if (obs.type === 'barbed_wire') {
      if (ball.x >= obsLeft - cR && ball.x <= obsRight + cR && ball.y + cR >= topY && ball.y - cR <= bottomY) {
        ball.vx *= 0.94;
      }
    } else if (obs.type === 'hedgehog') {
      const hcx = obs.x + obs.w / 2;
      const hcy = topY + obs.h / 2;
      const hr = (obs.size || 32) / 2;
      const hdx = ball.x - hcx;
      const hdy = ball.y - hcy;
      const hd = Math.hypot(hdx, hdy);
      const minDistH = cR + hr;

      if (hd < minDistH) {
        const hnx = hd > 0.001 ? hdx / hd : 0;
        const hny = hd > 0.001 ? hdy / hd : -1;
        const hpen = minDistH - hd;
        ball.x += hnx * hpen;
        ball.y += hny * hpen;
        ball.vx = -ball.vx * 0.70;
        ball.vy = -ball.vy * 0.70;
        if (speed > 6.0) triggerScreenShake(2.2);
      }
    } else {
      const ballLeft = ball.x - cR;
      const ballRight = ball.x + cR;
      const ballTop = ball.y - cR;
      const ballBottom = ball.y + cR;

      if (ballRight > obsLeft && ballLeft < obsRight && ballBottom > topY && ballTop < bottomY) {
        const overlapLeft = ballRight - obsLeft;
        const overlapRight = obsRight - ballLeft;
        const overlapTop = ballBottom - topY;
        const overlapBottom = bottomY - ballTop;

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
        const rest = obs.type === 'laser_gate' ? 0.95 : (obs.type === 'neon_barrier' ? 0.82 : 0.65);

        if (minOverlap === overlapTop && ball.vy >= 0) {
          ball.y = topY - cR;
          ball.vy = -Math.abs(ball.vy) * rest;
          ball.vx *= 0.92;
        } else if (minOverlap === overlapBottom && ball.vy <= 0) {
          ball.y = bottomY + cR;
          ball.vy = Math.abs(ball.vy) * rest;
        } else if (minOverlap === overlapLeft) {
          ball.x = obsLeft - cR;
          ball.vx = -Math.abs(ball.vx) * rest;
        } else if (minOverlap === overlapRight) {
          ball.x = obsRight + cR;
          ball.vx = Math.abs(ball.vx) * rest;
        }
        if (obs.type === 'laser_gate') {
          spawnObstacleSparks(ball.x, ball.y, ball.vx > 0 ? 1 : -1, 0, 4);
        }
        if (speed > 6.0) triggerScreenShake(2.2);
      }
    }
  }
}

export function checkObstacleCollisions(ball, groundY, p = null, botObj = null) {
  setActiveEntities(ball, p, botObj);

  updateBarrelExplosionParticles();
  for (const obs of customObstacles) {
    if (obs.hitTimer > 0) obs.hitTimer--;
  }

  if (p) {
    checkPlayerPlatformLanding(p, groundY);
  }
  if (ball) {
    resolveBallObstacleCollisions(ball, groundY);
  }

  if (activeArenaId === 'ARENA_1') {
    const _mapW = ARENA_WIDTH || 3600;
    const centerX = _mapW / 2; // 1800
    const altarX = arena1State.altarX || centerX;
    const altarY = arena1State.altarY || 570;
    const spawnBallY = altarY;

    if (!arena1State.initialSetupDone) {
      arena1State.initialSetupDone = true;
      arena1State.waitingForKickoff = true;
      if (p) {
        p.x = 220;
        p.y = 420;
        p.vx = 0;
        p.vy = 0;
        p.facing = 1;
        p.isIntro = false;
        p.gaitMode = 'IDLE';
      }
      if (ball) {
        ball.x = altarX;
        ball.y = spawnBallY;
        ball.prevX = altarX;
        ball.prevY = spawnBallY;
        ball.vx = 0;
        ball.vy = 0;
        ball.spin = 0;
        ball.trail = [];
      }
    }

    if (p && p.isIntro) {
      p.isIntro = false;
      p.gaitMode = 'IDLE';
      p.x = 220;
      p.y = 420;
      p.facing = 1;
      arena1State.waitingForKickoff = true;
      arena1State.kickoffCooldown = 0;
      if (ball) {
        ball.x = altarX;
        ball.y = spawnBallY;
        ball.prevX = altarX;
        ball.prevY = spawnBallY;
        ball.vx = 0;
        ball.vy = 0;
        ball.spin = 0;
        ball.trail = [];
      }
    }

    if (arena1State.kickoffCooldown > 0) {
      arena1State.kickoffCooldown--;
    }

    if (arena1State.waitingForKickoff && ball) {
      const time = performance.now() * 0.003;
      const hoverY = spawnBallY + Math.sin(time) * 5;
      ball.x = altarX;
      ball.y = hoverY;
      ball.prevX = altarX;
      ball.prevY = hoverY;
      ball.vx = 0;
      ball.vy = 0;
      ball.spin = 0;
      ball.rotation += 0.015;
      ball.trail = [];

      if (arena1State.kickoffCooldown <= 0) {
        const pCenterX = p ? p.x + p.w / 2 : Infinity;
        const pCenterY = p ? p.y + p.h / 2 : Infinity;
        const distP = Math.hypot(ball.x - pCenterX, ball.y - pCenterY);

        let nearestBot = null;
        let distB = Infinity;
        const activeBotsList = (typeof getActiveBots === 'function') ? getActiveBots() : (botObj ? (Array.isArray(botObj) ? botObj : [botObj]) : (_activeBot ? [_activeBot] : []));
        for (const b of activeBotsList) {
          if (!b || !b.active) continue;
          const bcx = b.x + b.w / 2;
          const bcy = b.y + b.h / 2;
          const d = Math.hypot(ball.x - bcx, ball.y - bcy);
          if (d < distB) {
            distB = d;
            nearestBot = b;
          }
        }

        const isNear = distP < 55 || distB < 55;
        const isKicking = (p && (p.kickState === 'SWING' || p.kickBufferTimer > 0) && distP < 85) ||
                          (nearestBot && nearestBot.kickState === 'SWING' && distB < 85);

        if (isNear || isKicking) {
          arena1State.waitingForKickoff = false;
          triggerScreenShake(7);
          ball.vy = -6.5;
          ball.vx = (distP <= distB) ? ((p?.facing || 1) * 7.5) : ((nearestBot?.facing || -1) * 7.5);
          ball.spin = (ball.vx > 0 ? 1 : -1) * 0.6;
          spawnAltarShockwave(ball.x, ball.y);
        }
      }
    }

    if (!arena1State.waitingForKickoff && ball && (!ball.goalAnimation || !ball.goalAnimation.active)) {
      for (const g of GOALS) {
        const topY = (g.y !== undefined) ? g.y : (groundY - (g.relY || 0) - (g.h || 140));
        const bottomY = (g.bottomY !== undefined) ? g.bottomY : ((g.y !== undefined) ? (g.y + (g.h || 140)) : (groundY - (g.relY || 0)));
        const leftX = g.x;
        const rightX = g.x + (g.w || 220);

        const insideAABB = (ball.x >= leftX && ball.x <= rightX && ball.y >= topY && ball.y <= bottomY);
        const passedLine = (g.facing === 1 && ball.x <= (g.lineX !== undefined ? g.lineX : rightX) && ball.x >= leftX - 40 && ball.y >= topY && ball.y <= bottomY) ||
                           (g.facing === -1 && ball.x >= (g.lineX !== undefined ? g.lineX : leftX) && ball.x <= rightX + 40 && ball.y >= topY && ball.y <= bottomY);

        if (insideAABB || passedLine) {
          const isCyanGoal = (g.team === 'CYAN');
          const scoringTeam = isCyanGoal ? 'ORANGE' : 'CYAN';
          if (scoringTeam === 'CYAN') {
            arenaScore.cyan++;
            recordGoal();
          } else {
            arenaScore.orange++;
          }

          triggerScreenShake(16);
          triggerGoalCelebration(scoringTeam, scoringTeam === 'CYAN' ? '#00F0FF' : '#FF8800');

          ball.goalAnimation = {
            active: true,
            timer: 48,
            maxTimer: 48,
            startX: ball.x,
            startY: ball.y,
            targetX: (g.facing === 1) ? (leftX + 40) : (rightX - 40),
            targetY: (topY + bottomY) / 2,
            scoringTeam: scoringTeam,
            color: scoringTeam === 'CYAN' ? '#00F0FF' : '#FF8800',
            scale: 1.0,
            alpha: 1.0,
            spinDir: (ball.vx > 0 ? 1 : -1) || (isCyanGoal ? -1 : 1)
          };
          ball.vx = 0;
          ball.vy = 0;
          break;
        }
      }
    }
  }

  if ((activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA') && ball) {
    for (const g of GOALS) {
      const topY = (g.y !== undefined) ? g.y : (groundY - (g.relY || 0) - g.h);
      const bottomY = (g.y !== undefined) ? (g.y + g.h) : (groundY - (g.relY || 0));
      const leftX = g.x;
      const rightX = g.x + g.w;

      if (ball.x >= leftX && ball.x <= rightX && ball.y >= topY && ball.y <= bottomY) {
        const scoringTeam = (g.team === 'CYAN') ? 'ORANGE' : 'CYAN';
        if (scoringTeam === 'CYAN') {
          arenaScore.cyan++;
          recordGoal();
        } else {
          arenaScore.orange++;
        }

        triggerScreenShake(15);
        triggerGoalCelebration(scoringTeam, scoringTeam === 'CYAN' ? '#06b6d4' : '#f97316');
        resetArena();

        ball.x = 2000;
        ball.y = 560;
        ball.prevX = 2000;
        ball.prevY = 560;
        ball.vx = 0;
        ball.vy = 0;
        ball.spin = 0;
        ball.trail = [];
        break;
      }
    }
  }

  if ((activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY') && ball) {
    // Bramki w Arenie 3 i efekt zasysania piłki w głąb rurociągów są w pełni obsługiwane przez updateBall (js/ball.js)
    return;
  }
}

