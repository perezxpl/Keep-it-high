import { CONFIG, START_X } from './config.js';
import { distToSegment } from './world.js';
import { player, getFreestyleChoreography, drawFrontLegOnly } from './player.js';

export const ball = {
  x: START_X - 38,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 12,
  rotation: 0,
  spin: 0,
  trail: []
};

export function resetBallToPlayer(p, GROUND_Y) {
  p.x = START_X - 60; // Start przed linią 0m (x = 100)
  p.isIntro = true;
  p.juggleTimer = 0;
  p.vx = 0;
  p.intendedVx = 0;
  p.kickState = 'IDLE';
  p.gaitMode = 'PODBICIE Z ZIEMI';
  ball.x = p.x + (20 * p.facing);
  ball.y = GROUND_Y - ball.radius;
  ball.vx = 0;
  ball.vy = 0;
  ball.spin = 0;
  ball.trail = [];
}

/**
 * Prawidłowy model rakietowy:
 * Piłka wystrzeliwuje ze znacznie wyższą prędkością początkową vx0,
 * wytraca pęd w locie (dX) i opada precyzyjnie na stopę biegacza.
 */
function launchRocketTrajectory(baseVy, targetOffsetX, groundY, playerObj, effectiveVx) {
  const g = CONFIG.GRAVITY;
  const dragCoeffY = 0.0010; // Subtelny opór pionowy (nie ścina maksymalnej wysokości!)
  const dX = 0.982;          // Wytracanie prędkości poziomej w locie
  const targetLandingY = groundY - ball.radius;

  // 1. Dokładna symulacja czasu lotu T w pionie
  let simY = ball.y;
  let simVy = baseVy;
  let T = 0;

  while (T < 400) {
    const dragY = simVy < 0 ? (dragCoeffY * simVy * simVy) : 0;
    simVy += g + dragY;
    simY += simVy;
    T++;
    if (simY >= targetLandingY && T > 3) break;
  }
  if (T < 8) T = 8;

  // 2. Pozycja docelowa lądowania przy zachowaniu tempa gracza
  const hipX = playerObj.x + playerObj.w / 2;
  const targetX = hipX + (targetOffsetX * playerObj.facing) + (effectiveVx * T);
  const totalDx = targetX - ball.x;

  // 3. Obliczenie wybuchowej prędkości startowej vx0
  const sumFactors = (1.0 - Math.pow(dX, T)) / (1.0 - dX);
  const vx0 = totalDx / sumFactors;

  ball.vx = vx0;
  ball.vy = baseVy;
  ball.spin = playerObj.facing * (0.35 + playerObj.chargePower * 0.75);
}

export function updateBall(GROUND_Y) {
  // Żonglerka przed startem
  if (player.isIntro) {
    const hipX = player.x + player.w / 2;
    const hipY = player.y + player.h - 40;
    const choreo = getFreestyleChoreography(player.juggleTimer, hipX, hipY, GROUND_Y, player.facing, ball.radius);

    ball.x = choreo.ballX;
    ball.y = choreo.ballY;
    ball.vx = 0;
    ball.vy = 0;
    ball.trail = [];

    if (player.juggleTimer < 38) {
      ball.rotation -= 0.08 * player.facing;
    } else {
      ball.rotation += 0.07 * player.facing;
    }
    return;
  }

  // W locie: wyhamowywanie prędkości początkowej
  if (ball.y + ball.radius < GROUND_Y) {
    const dragY = ball.vy < 0 ? (0.0010 * ball.vy * ball.vy) : 0;
    ball.vy += CONFIG.GRAVITY + dragY;
    ball.vx *= 0.982;

    const curSpeed = Math.hypot(ball.vx, ball.vy);
    if (curSpeed > 9.0) {
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 3) ball.trail.shift();
    } else if (ball.trail.length > 0) {
      ball.trail.shift();
    }
  } else {
    ball.vy += CONFIG.GRAVITY;
    if (ball.trail.length > 0) ball.trail.shift();
  }

  ball.x += ball.vx;
  ball.y += ball.vy;

  // Lądowanie na trawie
  if (ball.y + ball.radius >= GROUND_Y) {
    ball.y = GROUND_Y - ball.radius;
    if (Math.abs(ball.vy) > 0.8) {
      ball.vy = -ball.vy * 0.58;
    } else {
      ball.vy = 0;
    }
    ball.vx *= 0.985;
    ball.spin *= 0.94;
    ball.rotation += (ball.vx * 0.08);
  } else {
    ball.rotation += ball.spin + (ball.vx * 0.04);
    ball.spin *= 0.96;
  }
}

export function checkBallPlayerCollisions(playerObj, GROUND_Y, spawnGrass) {
  const hipX = playerObj.x + playerObj.w / 2;
  const hipY = playerObj.y + playerObj.h - 40 + playerObj.pelvisY;

  // =========================================================================
  // WYJŚCIE ZE STANU INTRO
  // =========================================================================
  if (playerObj.isIntro) {
    const isKicking = (playerObj.kickState === 'SWING' || playerObj.kickBufferTimer > 0);
    if (isKicking) {
      playerObj.isIntro = false;
      playerObj.frontLegOverBall = false;
      playerObj.hitThisSwing = true;
      playerObj.kickBufferTimer = 0;

      const wantsToRunForward = (playerObj.intendedVx * playerObj.facing) > 0.5;

      if (wantsToRunForward) {
        playerObj.vx = playerObj.intendedVx;
        // Od tap = -7.2 (60px) do pełnego charge = -27.2 (518px)
        const baseVy = -7.2 - (playerObj.chargePower * 20.0);
        launchRocketTrajectory(baseVy, 18, GROUND_Y, playerObj, playerObj.vx);
        ball.y -= 8;
      } else {
        // Świeca w miejscu pod kątem 80°
        const rad80 = (80 * Math.PI) / 180;
        const speed = 11.5 + (playerObj.chargePower * 18.5);
        ball.vx = speed * Math.cos(rad80) * playerObj.facing;
        ball.vy = -speed * Math.sin(rad80);
        ball.spin = playerObj.facing * 0.45;
        ball.y -= 8;
      }

      playerObj.chargePower = 0;
      if (spawnGrass) spawnGrass(ball.x, GROUND_Y, playerObj.facing);
    }
    return;
  }

  // =========================================================================
  // 1. WŚLIZG (KLIN RATUNKOWY)
  // =========================================================================
  if (playerObj.isSliding) {
    const batEndX = hipX + (50 * playerObj.facing);
    const batEndY = GROUND_Y - 4;

    const hit = distToSegment(ball.x, ball.y, hipX, hipY, batEndX, batEndY);
    const batThickness = 14;

    if (hit.dist < ball.radius + batThickness) {
      const scoopVy = -13.0 - Math.min(Math.abs(playerObj.vx) * 0.35, 3.5);
      launchRocketTrajectory(scoopVy, 22, GROUND_Y, playerObj, playerObj.vx);
      ball.y = Math.min(ball.y, GROUND_Y - ball.radius - 8);

      if (spawnGrass) spawnGrass(ball.x, GROUND_Y, playerObj.facing);
    }
    return;
  }

  // =========================================================================
  // 2. TIMING & TEMPO: TAP = 60 PX (KAPKA), FULL CHARGE = 518 PX (POTĘŻNY PUŁAP)
  // =========================================================================
  const isKicking = (playerObj.kickState === 'SWING' || playerObj.kickBufferTimer > 0);

  if (isKicking && !playerObj.hitThisSwing) {
    const footReach = playerObj.thighLen + playerObj.shinLen + 2;
    const currentAngle = playerObj.kickState === 'SWING' ? playerObj.kickAngle : 0.6;

    const footX = hipX + Math.sin(currentAngle) * footReach * playerObj.facing;
    const footY = hipY + Math.cos(currentAngle) * footReach;

    const hit = distToSegment(ball.x, ball.y, hipX, hipY, footX, footY);
    const batThickness = 14;

    if (hit.dist < ball.radius + batThickness) {
      playerObj.hitThisSwing = true;
      playerObj.kickBufferTimer = 0;

      // Zwykły tap = -7.2 (~60 px wysokości)
      // Pełny charge = -27.2 (~518 px wysokości!)
      const baseVy = -7.2 - (playerObj.chargePower * 20.0);

      let effectiveVx = playerObj.vx;
      if (Math.abs(playerObj.vx) < 1.2 && (playerObj.intendedVx * playerObj.facing) > 0.5) {
        effectiveVx = playerObj.intendedVx;
        playerObj.vx = playerObj.intendedVx;
      }

      launchRocketTrajectory(baseVy, 18, GROUND_Y, playerObj, effectiveVx);

      ball.y = Math.min(ball.y, footY - ball.radius - 2);
      playerObj.chargePower = 0;

      if (spawnGrass) spawnGrass(ball.x, GROUND_Y, playerObj.facing);
    }
  }
}

export function drawBall(ctx) {
  // 1. Dyskretny, półprzezroczysty biały cień pędu (bardzo delikatny, bez żółtego koloru)
  if (ball.trail && ball.trail.length > 0) {
    for (let i = 0; i < ball.trail.length; i++) {
      const tr = ball.trail[i];
      const alpha = (i + 1) * 0.04; // maksymalnie 0.12 przezroczystości
      ctx.save();
      ctx.translate(tr.x, tr.y);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, ball.radius * 0.95, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 2. Czysta, idealnie okrągła piłka (zero zniekształceń i iskier)
  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.rotate(ball.rotation);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1b1b1b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Wzór łat piłki
  ctx.fillStyle = '#222';
  for (let a = 0; a < 3; a++) {
    ctx.beginPath();
    ctx.arc(Math.cos(a * 2.1) * 5, Math.sin(a * 2.1) * 5, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 3. Warstwowość 2D: noga zasłaniająca piłkę w intro
  if (player.isIntro && player.frontLegOverBall) {
    drawFrontLegOnly(ctx, ball.y + ball.radius);
  }
}
