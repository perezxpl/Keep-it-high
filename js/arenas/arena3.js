// =========================================================================
// ARENAS/ARENA3.JS - JUNGLE ARENA / MILITARNA DŻUNGLA (4400x1400 PX)
// Główny orkiestrator fizyki updateArena3 i eksporter wtyczki areny.
// Geometria/stan -> ./arena3/state.js | Renderowanie -> ./arena3/renderer.js | Zniszczenia -> ./arena3/destruction.js
// =========================================================================

import { triggerScreenShake } from '../camera.js';
import {
  animTime,
  addArena3AnimTime,
  WATER_RIPPLES,
  LEFT_OVAL_POINTS,
  RIGHT_OVAL_POINTS,
  getRiverbankGroundY,
  ARENA_3_BRIDGE_BLOCKS,
  BRIDGE_BLOCK_COUNT,
  BRIDGE_START_X,
  BRIDGE_TOTAL_W,
  BRIDGE_BLOCK_W,
  BRIDGE_BASE_Y,
  BRIDGE_BLOCK_H,
  getApproachInclineY,
  ARENA_3_RAMP_BLOCKS,
  breakRampBlock,
  BRIDGE_SPLINTERS,
  spawnBridgeSplinters,
  ARENA_3_WATER_SPLASHES,
  spawnArena3WaterSplash,
  breakBridgeBlock,
  ARENA_3_PYLONS,
  destroyPylon,
  ARENA_3_CANOPY_PLATFORMS,
  ALL_CANOPY_BLOCKS,
  evaluateCanopyPlatformIntegrity,
  onCanopyRopeSnapped,
  breakCanopyBlock,
  evaluateBridgeIntegrity,
  resetArena3,
  STONE_DEBRIS,
  spawnStoneDebris,
  ARENA_3_SNIPER_SLABS,
  breakSniperSlab,
  ARENA_3_TOWER_PILLARS,
  ARENA_3_TOWER_BLOCKS,
  breakTowerBlock,
  destroyTowerPillar,
  ARENA_3_PLATFORMS,
  ARENA_3_CUSTOM_OBJECTS,
  ARENA_3_SPAWNS,
  ARENA_3_MINECARTS,
  resetArena3Minecarts,
  resetArena3Breaches,
  GROUND_LEFT_POINTS,
  GROUND_RIGHT_POINTS,
  ARENA_3_CRATERS,
  carveTerrainCrater,
  GROUND_WATER_TABLE_Y,
  GROUND_BEDROCK_Y
} from './arena3/state.js';

import {
  drawArena3Background,
  drawArena3Foreground
} from './arena3/renderer.js';

import {
  onArena3BulletHit,
  onArena3KickHit,
  onArena3Explosion
} from './arena3/destruction.js';

export {
  LEFT_OVAL_POINTS,
  RIGHT_OVAL_POINTS,
  getRiverbankGroundY,
  ARENA_3_BRIDGE_BLOCKS,
  getApproachInclineY,
  ARENA_3_RAMP_BLOCKS,
  breakRampBlock,
  BRIDGE_SPLINTERS,
  spawnBridgeSplinters,
  ARENA_3_WATER_SPLASHES,
  spawnArena3WaterSplash,
  breakBridgeBlock,
  ARENA_3_PYLONS,
  destroyPylon,
  ARENA_3_CANOPY_PLATFORMS,
  ALL_CANOPY_BLOCKS,
  evaluateCanopyPlatformIntegrity,
  onCanopyRopeSnapped,
  breakCanopyBlock,
  evaluateBridgeIntegrity,
  resetArena3,
  STONE_DEBRIS,
  spawnStoneDebris,
  ARENA_3_SNIPER_SLABS,
  breakSniperSlab,
  ARENA_3_TOWER_PILLARS,
  ARENA_3_TOWER_BLOCKS,
  breakTowerBlock,
  destroyTowerPillar,
  ARENA_3_PLATFORMS,
  ARENA_3_CUSTOM_OBJECTS,
  ARENA_3_SPAWNS,
  ARENA_3_MINECARTS,
  resetArena3Minecarts,
  resetArena3Breaches,
  GROUND_LEFT_POINTS,
  GROUND_RIGHT_POINTS,
  ARENA_3_CRATERS,
  carveTerrainCrater,
  GROUND_WATER_TABLE_Y,
  GROUND_BEDROCK_Y,
  drawArena3Background,
  drawArena3Foreground,
  onArena3BulletHit,
  onArena3KickHit,
  onArena3Explosion
};

// =========================================================================
// 5. GŁÓWNA PĘTLA AKTUALIZACJI ARENY 3 (UPDATE TICK)
// =========================================================================
export function updateArena3(dt, players, ball) {
  addArena3AnimTime(dt);



  // 2. Fizyka strefy wody (Trigger Area - X: 1600 do 2800, Y: 1300 do 1400)
  // W PŁYTKIEJ WODZIE (BRZEG) GRACZ ZWALNIA (DRAG), A PO WEJŚCIU GŁĘBIEJ TONIE
  if (Array.isArray(players)) {
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (!p) continue;

      const pw = p.w || 24;
      const ph = p.h || 70;
      const pCenterX = p.x + pw * 0.5;
      const pFeetY = p.y + ph;
      const pCenterY = p.y + ph * 0.5;

      const inWaterX = (pCenterX >= 1560 && pCenterX <= 2840);
      const inWaterY = (pFeetY >= 1300);

      if (inWaterX && inWaterY) {
        // Czy postać weszła GŁĘBIEJ do wody?
        // 1. Zanurzenie głębokie: tułów w wodzie (pCenterY >= 1325) lub stopy głęboko (pFeetY >= 1350)
        // 2. W otwartym kanale rzecznym bez dna (X: 1750-2650) przy zanurzeniu (pFeetY >= 1335)
        const inOpenChannel = (pCenterX > 1750 && pCenterX < 2650);
        const isDeepWater = (pFeetY >= 1350) || (pCenterY >= 1325) || (inOpenChannel && pFeetY >= 1335);

        if (isDeepWater) {
          if (!p.isDead) {
            // Śmierć przez utonięcie w głębokiej toni rzeki
            p.hp = 0;
            p.isDead = true;
            p.respawnTimer = 85;
            p.vx = 0;
            p.vy = 2.0; // powolne tonięcie na dno rzeki
            p.onGround = false;
            p.isJumping = false;
            p.currentPlatform = null;
            p.corpseAngle = 0;
            if (p.currentWeapon && typeof spawnDroppedWeapon === 'function') {
              spawnDroppedWeapon(pCenterX, p.y + 20, 0, -2, p.currentWeapon, p.facing);
              p.currentWeapon = null;
            }
            if (typeof triggerScreenShake === 'function') {
              triggerScreenShake(6);
            }
          } else {
            // Martwa postać powoli opada ku dnu
            p.vx *= 0.8;
            p.vy = Math.min(2.4, p.vy + 0.08);
            p.onGround = false;
          }
        } else if (!p.isDead) {
          // Płytka woda przy brzegu - postać NIE ginie, może brodzić i wyskoczyć; woda stawia opór
          p.vx *= 0.82;
          if (p.vy > 0) p.vy *= 0.92;
        }
      } else if (!inWaterX && pFeetY >= GROUND_WATER_TABLE_Y && !p.isDead) {
        // 2B. Brodzenie w wodzie gruntowej na dnie głębokich kraterów wyciętych eksplozjami
        p.vx *= 0.88;
        if (p.vy > 0) p.vy *= 0.94;
        if (Math.abs(p.vx) > 0.5 && Math.random() < 0.25) {
          spawnArena3WaterSplash(pCenterX, GROUND_WATER_TABLE_Y, 2, false);
        }
      }
    }
  }

  // Opór wody gruntowej dla piłki w lejach
  if (ball && typeof ball.y === 'number') {
    const ballBottomY = ball.y + (ball.radius || 12);
    if (ballBottomY >= GROUND_WATER_TABLE_Y) {
      ball.vx *= 0.92;
      ball.vy *= 0.92;
    }
  }

  // 3A. Fizyka i całkowity upadek pylonów mostu do rzeki (Complete Pylon Collapse)
  for (const k of ['left', 'right']) {
    const p = ARENA_3_PYLONS[k];
    if (!p.intact && !p.collapsed) {
      const pDir = (k === 'left' ? 1 : -1);
      // Grawitacyjne przyspieszenie kątowe obalania się wieży pylonu ku środkowi rzeki
      p.vRot += pDir * (0.0018 + Math.sin(Math.abs(p.tiltAngle)) * 0.0042) * dt * 60;
      p.tiltAngle += p.vRot;

      // Zsuwanie się / zapadanie odłamanego pylonu z kesonu w dół do rzeki (Y: 1100 -> 1305)
      if (Math.abs(p.tiltAngle) > 0.22) {
        p.fallDropVy = (p.fallDropVy || 0) + 0.38 * dt * 60;
        p.fallDropY = Math.min(205, (p.fallDropY || 0) + p.fallDropVy);
      }

      // Moment uderzenia o taflę rzeki i dno (kąt ~90 stopni lub pełne zanurzenie w wodzie)
      const hitWater = (k === 'left' && p.tiltAngle >= 1.50) || (k === 'right' && p.tiltAngle <= -1.50) || (p.fallDropY >= 200);
      if (hitWater) {
        p.tiltAngle = (k === 'left' ? 1.52 : -1.52);
        p.vRot = 0;
        p.fallDropVy = 0;
        p.fallDropY = 205;
        p.collapsed = true;

        const impactX = p.x + (k === 'left' ? 170 : -170);
        // Potężny gejzer rozbryzgu wody w rzece
        spawnArena3WaterSplash(impactX, 1305, 38, true);
        spawnArena3WaterSplash(impactX + (k === 'left' ? -60 : 60), 1305, 24, false);
        // Deszcz drzazg i pękających belek pylonu
        spawnBridgeSplinters(impactX, 1280, (k === 'left' ? 6 : -6), -4, 28);
        spawnBridgeSplinters(p.x, 1120, (k === 'left' ? 3 : -3), -3, 16);
        if (typeof triggerScreenShake === 'function') {
          triggerScreenShake(16);
        }
      }
    }
  }

  // 3B. Prawdziwa fizyka wiszących pomostów w koronach drzew (Canopy Platforms)
  for (let pIdx = 0; pIdx < ARENA_3_CANOPY_PLATFORMS.length; pIdx++) {
    const plat = ARENA_3_CANOPY_PLATFORMS[pIdx];

    // Detekcja graczy na pomostach: nacisk, bieg i moment obrotowy
    let playerTorque = 0;
    let playersCount = 0;
    if (Array.isArray(players)) {
      for (let pi = 0; pi < players.length; pi++) {
        const p = players[pi];
        if (!p || p.isDead) continue;
        const pw = p.w || 24;
        const ph = p.h || 70;
        const pFeetX = p.x + pw * 0.5;
        const pFeetY = p.y + ph;

        const platCurY = plat.origY + (plat.bounceY || 0);
        if (pFeetX >= plat.origX - 15 && pFeetX <= plat.origX + plat.w + 15 && Math.abs(pFeetY - platCurY) <= 30) {
          playersCount++;
          const platMidX = plat.origX + plat.w * 0.5 + (plat.swayX || 0);
          const normOffset = (pFeetX - platMidX) / (plat.w * 0.5);
          playerTorque += normOffset * 0.22;

          // Reakcja horyzontalna od biegu
          if (Math.abs(p.vx) > 0.4) {
            plat.swayVx = (plat.swayVx || 0) + (p.vx > 0 ? 0.3 : -0.3);
          }
          // Impuls lądowania
          if (p.vy > 1.2) {
            plat.bounceVy = (plat.bounceVy || 0) + p.vy * 0.35;
          }
        }
      }
    }

    if (plat.isSplit) {
      // 0. PLATFORMA PRZERWANA NA PÓŁ - DWIE OSOBNE POŁÓWKI WISZĄCE SWOBODNIE NA SWOICH LINACH
      if (plat.ropeLeft.intact) {
        const targetAngle = Math.PI * 0.5;
        const angleDiff = targetAngle - plat.leftTiltAngle;
        const pendAcc = Math.sin(angleDiff) * 14.5 - plat.leftVRot * 0.45 - plat.leftVRot * Math.abs(plat.leftVRot) * 0.05;
        plat.leftVRot += pendAcc * dt;
        plat.leftTiltAngle += plat.leftVRot * dt;
        if (Math.abs(angleDiff) < 0.002 && Math.abs(plat.leftVRot) < 0.01) {
          plat.leftTiltAngle = targetAngle;
          plat.leftVRot = 0;
        }
        const swayAcc = -0.05 * (plat.leftSwayX || 0) + Math.cos(plat.leftTiltAngle) * plat.leftVRot * 0.14;
        plat.leftSwayVx = ((plat.leftSwayVx || 0) + swayAcc) * 0.968;
        plat.leftSwayX = Math.max(-55, Math.min(55, (plat.leftSwayX || 0) + plat.leftSwayVx));
        if (Math.abs(plat.leftSwayX) < 0.12 && Math.abs(plat.leftSwayVx) < 0.04 && plat.leftVRot === 0) {
          plat.leftSwayX = 0;
          plat.leftSwayVx = 0;
        }
        plat.leftBounceY = Math.max(0, Math.min(18, (plat.leftBounceY || 0) * 0.92 + Math.abs(plat.leftVRot) * 0.35));
      }
      if (plat.ropeRight.intact) {
        const targetAngle = -Math.PI * 0.5;
        const angleDiff = targetAngle - plat.rightTiltAngle;
        const pendAcc = Math.sin(angleDiff) * 14.5 - plat.rightVRot * 0.45 - plat.rightVRot * Math.abs(plat.rightVRot) * 0.05;
        plat.rightVRot += pendAcc * dt;
        plat.rightTiltAngle += plat.rightVRot * dt;
        if (Math.abs(angleDiff) < 0.002 && Math.abs(plat.rightVRot) < 0.01) {
          plat.rightTiltAngle = targetAngle;
          plat.rightVRot = 0;
        }
        const swayAcc = -0.05 * (plat.rightSwayX || 0) - Math.cos(plat.rightTiltAngle) * plat.rightVRot * 0.14;
        plat.rightSwayVx = ((plat.rightSwayVx || 0) + swayAcc) * 0.968;
        plat.rightSwayX = Math.max(-55, Math.min(55, (plat.rightSwayX || 0) + plat.rightSwayVx));
        if (Math.abs(plat.rightSwayX) < 0.12 && Math.abs(plat.rightSwayVx) < 0.04 && plat.rightVRot === 0) {
          plat.rightSwayX = 0;
          plat.rightSwayVx = 0;
        }
        plat.rightBounceY = Math.max(0, Math.min(18, (plat.rightBounceY || 0) * 0.92 + Math.abs(plat.rightVRot) * 0.35));
      }
    } else if (plat.ropeLeft.intact && plat.ropeRight.intact) {
      // 1. OBYDWIE LINY CAŁE: fizyczne wahadło dwuliniowe + ugięcie sprężyste + wychył od ciężaru
      const swayForce = -0.045 * (plat.swayX || 0);
      plat.swayVx = ((plat.swayVx || 0) + swayForce) * 0.985;
      plat.swayX = Math.max(-45, Math.min(45, (plat.swayX || 0) + plat.swayVx));

      const springK = 38.0;
      const springDamp = 7.5;
      const targetBounce = playersCount * 4.5;
      const bounceForce = -springK * ((plat.bounceY || 0) - targetBounce) - springDamp * (plat.bounceVy || 0);
      plat.bounceVy = (plat.bounceVy || 0) + bounceForce * dt;
      plat.bounceY = Math.max(-4, Math.min(18, (plat.bounceY || 0) + plat.bounceVy * dt));

      const tiltSpring = (playerTorque - plat.tiltAngle) * 32.0 - plat.vRot * 7.5;
      plat.vRot += tiltSpring * dt;
      plat.tiltAngle = Math.max(-0.24, Math.min(0.24, plat.tiltAngle + plat.vRot * dt));
    } else if ((plat.ropeLeft.intact && !plat.ropeRight.intact) || (!plat.ropeLeft.intact && plat.ropeRight.intact)) {
      // 2 & 3. JEDNA LINA ZERWANA: swobodne fizyczne wahadło kołyszące się wokół zaczepu ocalałej liny aż do pionowego zatrzymania!
      const isLeftRope = plat.ropeLeft.intact;
      const targetAngle = isLeftRope ? (Math.PI * 0.5) : (-Math.PI * 0.5);
      const angleDiff = targetAngle - plat.tiltAngle;
      const pendAcc = Math.sin(angleDiff) * 13.5 - plat.vRot * 0.42 - plat.vRot * Math.abs(plat.vRot) * 0.045;
      plat.vRot += pendAcc * dt;
      plat.tiltAngle += plat.vRot * dt;

      if (Math.abs(angleDiff) < 0.002 && Math.abs(plat.vRot) < 0.01) {
        plat.tiltAngle = targetAngle;
        plat.vRot = 0;
      }

      const swayPull = (isLeftRope ? 1 : -1) * Math.cos(plat.tiltAngle) * plat.vRot * 0.16;
      const swayAcc = -0.05 * (plat.swayX || 0) + swayPull;
      plat.swayVx = ((plat.swayVx || 0) + swayAcc) * 0.968;
      plat.swayX = Math.max(-60, Math.min(60, (plat.swayX || 0) + plat.swayVx));
      if (Math.abs(plat.swayX) < 0.12 && Math.abs(plat.swayVx) < 0.04 && plat.vRot === 0) {
        plat.swayX = 0;
        plat.swayVx = 0;
      }

      const targetBounce = Math.min(10, Math.abs(plat.vRot) * 1.4);
      const bounceForce = -32.0 * ((plat.bounceY || 0) - targetBounce) - 6.5 * (plat.bounceVy || 0);
      plat.bounceVy = (plat.bounceVy || 0) + bounceForce * dt;
      plat.bounceY = Math.max(-4, Math.min(18, (plat.bounceY || 0) + plat.bounceVy * dt));
      if (plat.vRot === 0 && Math.abs(plat.bounceY) < 0.1 && Math.abs(plat.bounceVy) < 0.1) {
        plat.bounceY = 0;
        plat.bounceVy = 0;
      }
    } else {
      // 4. OBYDWIE LINY ZERWANE: wszystkie klocki odczepiają się i spadają
      for (let i = 0; i < plat.blocks.length; i++) {
        const b = plat.blocks[i];
        if (b.intact) {
          breakCanopyBlock(b, (Math.random() - 0.5) * 3, Math.random() * 2 + 1, (Math.random() - 0.5) * 0.2);
        }
      }
    }

    // Aktualizacja punktów zaczepienia lin i pozycji każdego bloku na pomostach wiszących
    const anchorLX = plat.ropeLeft.anchorX || plat.ropeLeft.x;
    const anchorRX = plat.ropeRight.anchorX || plat.ropeRight.x;
    const ropeLen = plat.origY;

    if (plat.isSplit) {
      const swayLX = plat.leftSwayX || 0;
      const swayRX = plat.rightSwayX || 0;
      plat.attachLX = anchorLX + swayLX;
      plat.attachLY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayLX * swayLX)) + (plat.leftBounceY || 0);
      plat.attachRX = anchorRX + swayRX;
      plat.attachRY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayRX * swayRX)) + (plat.rightBounceY || 0);

      for (let bIdx = 0; bIdx < plat.blocks.length; bIdx++) {
        const b = plat.blocks[bIdx];
        if (!b.intact) continue;
        const isLeftHalf = (bIdx < plat.blocks.length / 2);
        const tilt = isLeftHalf ? plat.leftTiltAngle : plat.rightTiltAngle;
        const pivotOrigX = isLeftHalf ? plat.ropeLeft.x : plat.ropeRight.x;
        const attachX = isLeftHalf ? plat.attachLX : plat.attachRX;
        const attachY = isLeftHalf ? plat.attachLY : plat.attachRY;

        const relX = (b.origX + b.w * 0.5) - pivotOrigX;
        const cosA = Math.cos(tilt);
        const sinA = Math.sin(tilt);

        b.x = attachX + relX * cosA - b.w * 0.5;
        b.y = attachY + relX * sinA - b.h * 0.5;
        b.angle = tilt;

        if (Math.abs(tilt) < 0.88) {
          b.solid = true;
          b.isPlatform = true;
          b.oneWay = true;
        } else {
          b.solid = false;
          b.isPlatform = false;
        }
      }
    } else if (plat.ropeLeft.intact && !plat.ropeRight.intact) {
      // Obrót wokół punktu zaczepienia LEWEJ liny
      const swayX = plat.swayX || 0;
      plat.attachLX = anchorLX + swayX;
      plat.attachLY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayX * swayX)) + (plat.bounceY || 0);
      const cosA = Math.cos(plat.tiltAngle);
      const sinA = Math.sin(plat.tiltAngle);
      const relRX = plat.ropeRight.x - plat.ropeLeft.x;
      plat.attachRX = plat.attachLX + relRX * cosA;
      plat.attachRY = plat.attachLY + relRX * sinA;

      for (let bIdx = 0; bIdx < plat.blocks.length; bIdx++) {
        const b = plat.blocks[bIdx];
        if (!b.intact) continue;
        const relX = (b.origX + b.w * 0.5) - plat.ropeLeft.x;
        b.x = plat.attachLX + relX * cosA - b.w * 0.5;
        b.y = plat.attachLY + relX * sinA - b.h * 0.5;
        b.angle = plat.tiltAngle;

        if (Math.abs(plat.tiltAngle) < 0.88) {
          b.solid = true;
          b.isPlatform = true;
          b.oneWay = true;
        } else {
          b.solid = false;
          b.isPlatform = false;
        }
      }
    } else if (!plat.ropeLeft.intact && plat.ropeRight.intact) {
      // Obrót wokół punktu zaczepienia PRAWEJ liny
      const swayX = plat.swayX || 0;
      plat.attachRX = anchorRX + swayX;
      plat.attachRY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayX * swayX)) + (plat.bounceY || 0);
      const cosA = Math.cos(plat.tiltAngle);
      const sinA = Math.sin(plat.tiltAngle);
      const relLX = plat.ropeLeft.x - plat.ropeRight.x;
      plat.attachLX = plat.attachRX + relLX * cosA;
      plat.attachLY = plat.attachRY + relLX * sinA;

      for (let bIdx = 0; bIdx < plat.blocks.length; bIdx++) {
        const b = plat.blocks[bIdx];
        if (!b.intact) continue;
        const relX = (b.origX + b.w * 0.5) - plat.ropeRight.x;
        b.x = plat.attachRX + relX * cosA - b.w * 0.5;
        b.y = plat.attachRY + relX * sinA - b.h * 0.5;
        b.angle = plat.tiltAngle;

        if (Math.abs(plat.tiltAngle) < 0.88) {
          b.solid = true;
          b.isPlatform = true;
          b.oneWay = true;
        } else {
          b.solid = false;
          b.isPlatform = false;
        }
      }
    } else {
      // Obydwie liny całe (lub obydwie zerwane) - obrót wokół środka pomostu
      const platCenterX = plat.origX + plat.w * 0.5 + (plat.swayX || 0);
      const platCenterY = plat.origY + (plat.bounceY || 0);
      const cosA = Math.cos(plat.tiltAngle);
      const sinA = Math.sin(plat.tiltAngle);
      const relLX = plat.ropeLeft.x - (plat.origX + plat.w * 0.5);
      plat.attachLX = platCenterX + relLX * cosA;
      plat.attachLY = platCenterY + relLX * sinA;
      const relRX = plat.ropeRight.x - (plat.origX + plat.w * 0.5);
      plat.attachRX = platCenterX + relRX * cosA;
      plat.attachRY = platCenterY + relRX * sinA;

      for (let bIdx = 0; bIdx < plat.blocks.length; bIdx++) {
        const b = plat.blocks[bIdx];
        if (!b.intact) continue;
        const relX = (b.origX + b.w * 0.5) - (plat.origX + plat.w * 0.5);
        b.x = platCenterX + relX * cosA - b.w * 0.5;
        b.y = platCenterY + relX * sinA - b.h * 0.5;
        b.angle = plat.tiltAngle;

        if (Math.abs(plat.tiltAngle) < 0.88) {
          b.solid = true;
          b.isPlatform = true;
          b.oneWay = true;
        } else {
          b.solid = false;
          b.isPlatform = false;
        }
      }
    }
  }

  // 3A2. Fizyka całkowitego zwalenia się filarów wież bojowych na ziemię (Complete Tower Pillar Collapse)
  for (const side of ['left', 'right']) {
    const pillar = ARENA_3_TOWER_PILLARS[side];
    if (!pillar.intact && !pillar.collapsed) {
      const dir = (side === 'left' ? 1 : -1);
      // Grawitacyjne przyspieszenie kątowe obalania się wieży ku środkowi mapy
      pillar.vRot += dir * (0.0016 + Math.sin(Math.abs(pillar.tiltAngle)) * 0.0040) * dt * 60;
      pillar.tiltAngle += pillar.vRot;

      // Opadanie złamanego pnia słupa ku poziomowi gruntu (Y: 1200)
      if (Math.abs(pillar.tiltAngle) > 0.28) {
        pillar.fallDropVy = (pillar.fallDropVy || 0) + 0.35 * dt * 60;
        pillar.fallDropY = Math.min(70, (pillar.fallDropY || 0) + pillar.fallDropVy);
      }

      // Moment uderzenia pnia wieży o ziemię (kąt ~90 stopni / poziomo na gruncie Y: 1200)
      const hitGround = (side === 'left' && pillar.tiltAngle >= 1.50) || (side === 'right' && pillar.tiltAngle <= -1.50);
      if (hitGround) {
        pillar.tiltAngle = (side === 'left' ? 1.52 : -1.52);
        pillar.vRot = 0;
        pillar.fallDropVy = 0;
        pillar.fallDropY = 70;
        pillar.collapsed = true;

        // Potężne uderzenie pnia o ziemię z kaskadową falą drzazg wzdłuż całego pnia
        spawnBridgeSplinters(pillar.stemX + dir * 180, 1195, dir * 4.5, -3.5, 22);
        spawnBridgeSplinters(pillar.stemX + dir * 420, 1195, dir * 3.0, -4.0, 24);
        spawnBridgeSplinters(pillar.stemX + dir * 650, 1195, dir * 2.0, -3.0, 20);
        spawnStoneDebris(pillar.stemX + dir * 300, 1200, 0, -2.5, 12);
        if (typeof triggerScreenShake === 'function') {
          triggerScreenShake(18);
        }
      }
    }
  }

  // 3A3. Sprężyste uginanie mostu wiszącego pod ciężarem i lądowaniem graczy
  if (Array.isArray(players)) {
    for (let pIdx = 0; pIdx < players.length; pIdx++) {
      const p = players[pIdx];
      if (!p || p.isDead) continue;
      const pw = p.w || 24;
      const ph = p.h || 70;
      const pFootX = p.x + pw * 0.5;
      const pFootY = p.y + ph;

      if (pFootX >= BRIDGE_START_X && pFootX <= BRIDGE_START_X + BRIDGE_TOTAL_W && Math.abs(pFootY - BRIDGE_BASE_Y) <= 18) {
        const bIdx = Math.floor((pFootX - BRIDGE_START_X) / BRIDGE_BLOCK_W);
        if (bIdx >= 0 && bIdx < ARENA_3_BRIDGE_BLOCKS.length) {
          const b = ARENA_3_BRIDGE_BLOCKS[bIdx];
          if (b.intact) {
            const impact = Math.max(0.8, Math.min(4.5, (p.vy > 0 ? p.vy * 0.45 : 1.2)));
            b.sagVel = (b.sagVel || 0) + impact * 2.2;
            if (bIdx > 0 && ARENA_3_BRIDGE_BLOCKS[bIdx - 1].intact) {
              ARENA_3_BRIDGE_BLOCKS[bIdx - 1].sagVel = (ARENA_3_BRIDGE_BLOCKS[bIdx - 1].sagVel || 0) + impact * 1.1;
            }
            if (bIdx < ARENA_3_BRIDGE_BLOCKS.length - 1 && ARENA_3_BRIDGE_BLOCKS[bIdx + 1].intact) {
              ARENA_3_BRIDGE_BLOCKS[bIdx + 1].sagVel = (ARENA_3_BRIDGE_BLOCKS[bIdx + 1].sagVel || 0) + impact * 1.1;
            }
          }
        }
      }
    }
  }

  // Tłumiony oscylator harmoniczny dla sprężystego uginania belek mostu
  for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
    const b = ARENA_3_BRIDGE_BLOCKS[i];
    if (b.intact) {
      const springK = 36.0;
      const damping = 7.0;
      const force = -springK * (b.sag || 0) - damping * (b.sagVel || 0);
      b.sagVel = (b.sagVel || 0) + force * dt;
      b.sag = Math.max(-2, Math.min(10, (b.sag || 0) + (b.sagVel || 0) * dt));
    } else {
      b.sag = 0;
      b.sagVel = 0;
    }
  }

  // 3C. Fizyka wszystkich zniszczalnych belek, ramp i płyt (namacalne platformy + crush damage)
  const allDestructibleBlocks = [
    ...ARENA_3_BRIDGE_BLOCKS,
    ...ARENA_3_RAMP_BLOCKS,
    ...ALL_CANOPY_BLOCKS,
    ...ARENA_3_TOWER_BLOCKS,
    ...ARENA_3_SNIPER_SLABS
  ];
  for (let i = 0; i < allDestructibleBlocks.length; i++) {
    const b = allDestructibleBlocks[i];

    // Obsługa kaskadowego zapadania się klocków
    if (b.collapseDelay > 0) {
      b.collapseDelay--;
      if (b.collapseDelay === 0 && b.intact) {
        if (b.isBridgeBlock) {
          breakBridgeBlock(b, (Math.random() - 0.5) * 2.5, Math.random() * 2.0 + 1.2, (Math.random() - 0.5) * 0.15);
        } else if (b.isRampBlock) {
          breakRampBlock(b, (Math.random() - 0.5) * 2.5, Math.random() * 2.0 + 1.2, (Math.random() - 0.5) * 0.15);
        } else if (b.isCanopyBlock) {
          breakCanopyBlock(b, (Math.random() - 0.5) * 2.5, Math.random() * 2.0 + 1.2, (Math.random() - 0.5) * 0.15);
        } else if (b.isTowerBlock) {
          breakTowerBlock(b, (Math.random() - 0.5) * 2.5, Math.random() * 2.0 + 1.2, (Math.random() - 0.5) * 0.15);
        } else if (b.isSniperSlab) {
          breakSniperSlab(b, (Math.random() - 0.5) * 2.0, Math.random() * 2.5 + 1.5, (Math.random() - 0.5) * 0.12);
        }
      }
    }

    if (b.intact) {
      if (b.isBridgeBlock) {
        b.x = b.origX;
        b.y = b.origY;
        b.solid = true;
        b.isPlatform = true;
        b.oneWay = true;
      }
      continue;
    }

    // ZAWALONE ELEMENTY SĄ NAMACALNE (NIE JAK DUCH)
    b.solid = true;
    b.isPlatform = true;
    b.oneWay = true;

    // OBRAŻENIA OD SPADAJĄCYCH ELEMENTÓW NA GRACZY (CRUSH DAMAGE)
    if (b.vy > 1.2 && Array.isArray(players)) {
      for (let pIdx = 0; pIdx < players.length; pIdx++) {
        const p = players[pIdx];
        if (!p || p.isDead) continue;
        const pw = p.w || 24;
        const ph = p.h || 70;
        const pLeft = p.x;
        const pRight = p.x + pw;
        const pTop = p.y;
        const pBottom = p.y + ph;

        const bLeft = b.x;
        const bRight = b.x + b.w;
        const bTop = b.y;
        const bBottom = b.y + b.h;

        if (bRight > pLeft + 4 && bLeft < pRight - 4 && bBottom >= pTop && bTop <= pBottom - 8) {
          if (!b.playerHitCooldown || b.playerHitCooldown <= 0) {
            b.playerHitCooldown = 18;
            let crushDmg = 0;
            if (b.isSniperSlab) {
              crushDmg = Math.round(40 + b.vy * 8);
              spawnStoneDebris(p.x + pw * 0.5, bBottom, b.vx, -2, 12);
            } else if (b.isTowerBlock || b.isRampBlock) {
              crushDmg = Math.round(26 + b.vy * 6);
              spawnBridgeSplinters(p.x + pw * 0.5, bBottom, b.vx, -2, 10);
            } else {
              crushDmg = Math.round(18 + b.vy * 5);
              spawnBridgeSplinters(p.x + pw * 0.5, bBottom, b.vx, -2, 8);
            }

            p.hp = Math.max(0, (p.hp || 100) - crushDmg);
            p.vy = Math.max(p.vy, b.vy * 0.6 + 2.0);
            p.vx += (b.vx || 0) * 0.5 + (p.x < b.x ? -2.5 : 2.5);

            if (typeof triggerScreenShake === 'function') {
              triggerScreenShake(b.isSniperSlab ? 10 : 6);
            }

            b.vy *= 0.35;
            b.vx *= 0.5;

            if (p.hp <= 0 && !p.isDead) {
              p.isDead = true;
              p.respawnTimer = 180;
            }
          }
        }
      }
    }
    if (b.playerHitCooldown > 0) b.playerHitCooldown--;

    if (b.isAsleep) continue;

    const inWater = (b.y + b.h >= 1305);

    if (b.isSniperSlab) {
      // FIZYKA PŁYTY SKALNEJ: Ciężka masa, tonie w rzece na dno
      if (inWater) {
        b.vy = Math.min(2.4, (b.vy + 0.14) * 0.94);
        b.vx *= 0.88;
        b.vRot *= 0.85;
      } else {
        b.vy += 0.46;
        b.vx *= 0.992;
        b.vy *= 0.995;
        b.vRot *= 0.99;
      }
    } else {
      // FIZYKA ELEMENTÓW DREWNIANYCH (Most, Rampy, Wieże, Pomosty wiszące)
      if (inWater) {
        // Wyporność drewna na wodzie (Buoyancy)
        const immersion = (b.y + b.h) - 1305;
        const buoyancy = Math.min(immersion * 0.055, 0.95);
        b.vy -= buoyancy;

        // Opór wody i tłumienie rotacji
        b.vx *= 0.90;
        b.vy *= 0.86;
        b.vRot *= 0.82;

        // Wyrównywanie deski poziomo na powierzchni wody
        b.vRot -= b.angle * 0.05;

        // Kołysanie na falach rzeki
        b.y += Math.sin(animTime * 3.0 + (b.blockIndex || b.rampIndex || 0) * 0.6) * 0.28;

        if (Math.abs(b.vx) < 0.08 && Math.abs(b.vy) < 0.12 && Math.abs(b.vRot) < 0.015) {
          b.sleepTimer++;
          if (b.sleepTimer > 35) {
            b.isAsleep = true;
          }
        } else {
          b.sleepTimer = 0;
        }
      } else {
        // Klocek w powietrzu - grawitacja
        b.vy += 0.38;
        b.vx *= 0.995;
        b.vy *= 0.995;
        b.vRot *= 0.992;
      }
    }

    // Kolizja ze zboczami brzegu rzeki i dnem
    const groundFloorY = getRiverbankGroundY(b.x + b.w / 2);
    if (b.y + b.h >= groundFloorY) {
      b.y = groundFloorY - b.h;
      b.vy = -b.vy * (b.isSniperSlab ? 0.18 : 0.26);
      b.vx *= (b.isSniperSlab ? 0.48 : 0.62);
      b.vRot *= 0.48;

      if (Math.abs(b.vx) < 0.1 && Math.abs(b.vy) < 0.15 && Math.abs(b.vRot) < 0.02) {
        b.sleepTimer++;
        if (b.sleepTimer > 35) {
          b.isAsleep = true;
        }
      } else {
        b.sleepTimer = 0;
      }
    }

    // Całkowanie kinematyki
    b.x += b.vx;
    b.y += b.vy;
    b.angle += b.vRot;
  }

  // 4. Detekcja graczy na belkach / płytach (jeśli solidne, gracz stoi; jeśli nie, spada)
  if (Array.isArray(players)) {
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (!p) continue;
      const cp = p.currentPlatform;
      if (cp && (cp.isBridgeBlock || cp.isCanopyBlock || cp.isTowerBlock || cp.isSniperSlab || cp.isRampBlock)) {
        if (!cp.solid) {
          p.currentPlatform = null;
          p.onGround = false;
          p.isJumping = true;
        } else if (!cp.intact) {
          // Gracz stoi na zawalonym / pływającym klocku - reakcja ugięcia pod ciężarem
          cp.isAsleep = false;
          cp.sleepTimer = 0;
          if (cp.y + cp.h >= 1300) {
            cp.vy = Math.min(1.8, (cp.vy || 0) + 0.12);
          }
        }
      }
    }
  }

  // 5. Aktualizacja cząsteczek drzazg (Bridge Splinters)
  for (let i = BRIDGE_SPLINTERS.length - 1; i >= 0; i--) {
    const sp = BRIDGE_SPLINTERS[i];
    sp.x += sp.vx;
    sp.y += sp.vy;
    sp.vy += 0.34;
    sp.rot += sp.vRot;
    sp.life--;
    if (sp.life <= 0 || sp.y > 1390) {
      BRIDGE_SPLINTERS.splice(i, 1);
    }
  }

  // 6. Aktualizacja cząsteczek odłamków skalnych (Stone Debris)
  for (let i = STONE_DEBRIS.length - 1; i >= 0; i--) {
    const sd = STONE_DEBRIS[i];
    sd.x += sd.vx;
    sd.y += sd.vy;
    sd.vy += 0.38;
    sd.rot += sd.vRot;
    sd.life--;
    if (sd.life <= 0 || sd.y > 1390) {
      STONE_DEBRIS.splice(i, 1);
    }
  }

  // 7. Aktualizacja rozbryzgów wody w rzece
  for (let i = ARENA_3_WATER_SPLASHES.length - 1; i >= 0; i--) {
    const ws = ARENA_3_WATER_SPLASHES[i];
    ws.x += ws.vx;
    ws.y += ws.vy;
    ws.vy += 0.30;
    ws.life--;
    ws.alpha = Math.max(0, ws.life / ws.maxLife);
    if (ws.life <= 0 || ws.y > 1395) {
      ARENA_3_WATER_SPLASHES.splice(i, 1);
    }
  }
}


// =========================================================================
// 9. KONTRAKT ARENY 3 (PLUGIN DEFINITION / LIFECYCLE HOOKS)
// =========================================================================
const arena3 = {
  id: 'arena-3',
  alias: 'JUNGLE_ARENA',
  mapId: 'jungle_arena_01',
  name: 'Tajemnicza Dżungla',
  width: 4400,
  height: 1400,
  physics: {
    gravity: 9.8,
    waterDrag: 0.6
  },
  spawns: [
    { x: 1050, y: 1130, facing: 1 }, // Team A (Cyan): rampa mostu lewa
    { x: 3350, y: 1130, facing: -1 }, // Team B (Orange): rampa mostu prawa
    { x: 800, y: 730, facing: 1 }, // Platforma snajperska lewa
    { x: 3600, y: 730, facing: -1 }, // Platforma snajperska prawa
    { x: 500, y: 1130, facing: 1 }, // Dolny poziom zachodni
    { x: 3900, y: 1130, facing: -1 }, // Dolny poziom wschodni
    { x: 2200, y: 780, facing: 1 } // Środek mostu kamiennego
  ],
  detailedSpawns: ARENA_3_SPAWNS,
  platforms: ARENA_3_PLATFORMS,
  customObjects: ARENA_3_CUSTOM_OBJECTS,
  minecarts: ARENA_3_MINECARTS,
  reset() {
    resetArena3();
    resetArena3Minecarts();
    resetArena3Breaches();
  },
  drawBackground(ctx, camera) {
    drawArena3Background(ctx, camera);
  },
  draw(ctx, camera) {
    drawArena3Foreground(ctx, camera);
  },
  update(dt, players, ball) {
    updateArena3(dt, players, ball);
  },
  onBulletHit(bullet) {
    return onArena3BulletHit(bullet);
  },
  onKickHit(player, kickBox) {
    return onArena3KickHit(player, kickBox);
  },
  onExplosion(expX, expY, radius, context) {
    return onArena3Explosion(expX, expY, radius, context);
  }
};

if (typeof window !== 'undefined') {
  window.spawnArena3WaterSplash = spawnArena3WaterSplash;
  window.ARENA_3_WATER_SPLASHES = ARENA_3_WATER_SPLASHES;
  window.ARENA_3_RAMP_BLOCKS = ARENA_3_RAMP_BLOCKS;
  window.breakRampBlock = breakRampBlock;
  window.ARENA_3_BRIDGE_BLOCKS = ARENA_3_BRIDGE_BLOCKS;
  window.ARENA_3_PYLONS = ARENA_3_PYLONS;
  window.ARENA_3_CANOPY_PLATFORMS = ARENA_3_CANOPY_PLATFORMS;
  window.ALL_CANOPY_BLOCKS = ALL_CANOPY_BLOCKS;
  window.ARENA_3_SNIPER_SLABS = ARENA_3_SNIPER_SLABS;
  window.ARENA_3_TOWER_PILLARS = ARENA_3_TOWER_PILLARS;
  window.ARENA_3_TOWER_BLOCKS = ARENA_3_TOWER_BLOCKS;
  window.STONE_DEBRIS = STONE_DEBRIS;
  window.arena3 = arena3;
}

export default arena3;

