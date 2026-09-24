import { CONFIG, START_X } from './config.js';
import { distToSegment } from './world.js';
import { player, getFreestyleChoreography, drawFrontLegOnly } from './player.js';

export const ball = {
  x: START_X - 38,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 8,
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
    if (curSpeed > 8.5) {
      if (ball.trail.length < 4) {
        ball.trail.push({ x: ball.x, y: ball.y });
      } else {
        const pt = ball.trail.shift();
        pt.x = ball.x;
        pt.y = ball.y;
        ball.trail.push(pt);
      }
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

/**
 * Rysowanie aerodynamicznych paneli turniejowych obracających się z rotacją piłki.
 */
function drawTournamentPanels(ctx, r) {
  const panelColor = '#181c26';
  const seamColor = '#0f172a';
  const accentColor = '#0ea5e9';
  const lineWidthSeam = Math.max(0.7, r * 0.08);
  const lineWidthAccent = Math.max(0.9, r * 0.12);
  const TWO_PI_OVER_3 = (Math.PI * 2) / 3;

  for (let i = 0; i < 3; i++) {
    const a = i * TWO_PI_OVER_3;

    const x1 = Math.cos(a) * r;
    const y1 = Math.sin(a) * r;

    const a2 = a + 1.15;
    const x2 = Math.cos(a2) * r;
    const y2 = Math.sin(a2) * r;

    const ai2 = a + 0.80;
    const xi2 = Math.cos(ai2) * (r * 0.22);
    const yi2 = Math.sin(ai2) * (r * 0.22);

    const ai1 = a + 0.12;
    const xi1 = Math.cos(ai1) * (r * 0.22);
    const yi1 = Math.sin(ai1) * (r * 0.22);

    const cpOutX = Math.cos(a + 0.95) * (r * 0.58);
    const cpOutY = Math.sin(a + 0.95) * (r * 0.58);

    const cpInX = Math.cos(a + 0.28) * (r * 0.58);
    const cpInY = Math.sin(a + 0.28) * (r * 0.58);

    // Główny łuk panelu
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.arc(0, 0, r, a, a2, false);
    ctx.bezierCurveTo(cpOutX, cpOutY, cpOutX, cpOutY, xi2, yi2);
    ctx.arc(0, 0, r * 0.22, ai2, ai1, true);
    ctx.bezierCurveTo(cpInX, cpInY, cpInX, cpInY, x1, y1);
    ctx.closePath();

    ctx.fillStyle = panelColor;
    ctx.fill();

    ctx.strokeStyle = seamColor;
    ctx.lineWidth = lineWidthSeam;
    ctx.stroke();

    // Aerodynamiczny akcent wewnątrz łuku
    ctx.beginPath();
    ctx.moveTo(xi1, yi1);
    ctx.bezierCurveTo(cpInX, cpInY, cpInX, cpInY, x1, y1);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = lineWidthAccent;
    ctx.stroke();
  }

  // Węzeł centralny
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(1.3, r * 0.18), 0, Math.PI * 2);
  ctx.fillStyle = panelColor;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, Math.max(0.5, r * 0.06), 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
}

/**
 * Statyczny światłocień 3D niezależny od rotacji:
 * - Górny blik świetlny (specular highlight / połysk)
 * - Delikatny cień własny u dołu kuli
 * - Światło krawędziowe (rim sheen)
 */
function drawStaticLighting(ctx, r) {
  // 1. Dolny cień własny (delikatna okluzja dolnej półkuli)
  ctx.beginPath();
  ctx.arc(0, r * 0.22, r * 0.95, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.20)';
  ctx.fill();

  // 2. Głębszy styk cieniowy na samym dole kuli
  ctx.beginPath();
  ctx.arc(0, r * 0.48, r * 0.75, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  ctx.fill();

  // 3. Górny blik świetlny (specular highlight / połysk)
  ctx.save();
  ctx.translate(-r * 0.35, -r * 0.35);
  ctx.rotate(-Math.PI / 4);

  ctx.beginPath();
  if (ctx.ellipse) {
    ctx.ellipse(0, 0, Math.max(1.8, r * 0.30), Math.max(0.9, r * 0.15), 0, 0, Math.PI * 2);
  } else {
    ctx.arc(0, 0, Math.max(1.4, r * 0.22), 0, Math.PI * 2);
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fill();

  // Ostra, skupiona kropka światła (pinpoint specular)
  ctx.beginPath();
  ctx.arc(-r * 0.05, -r * 0.02, Math.max(0.5, r * 0.08), 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fill();

  ctx.restore();

  // 4. Subtelne światło krawędziowe (rim sheen) na górno-lewej krawędzi
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.90, -0.92 * Math.PI, -0.32 * Math.PI, false);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
  ctx.lineWidth = Math.max(0.6, r * 0.08);
  ctx.stroke();
}

export function drawBall(ctx) {
  const r = ball.radius;

  // 1. Dyskretny, półprzezroczysty biały cień pędu (trail) przy wysokich prędkościach
  const trailLen = ball.trail.length;
  if (trailLen > 0) {
    for (let i = 0; i < trailLen; i++) {
      const tr = ball.trail[i];
      const factor = (i + 1) / (trailLen + 1);
      const alpha = factor * 0.07;
      const scale = 0.55 + factor * 0.35;
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, r * scale, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      ctx.fill();
    }
  }

  // 2. Kula piłki z warstwami 3D (bez shadowBlur, czysta geometria 2D)
  ctx.save();
  ctx.translate(ball.x, ball.y);

  // Baza kuli - idealna turniejowa biel
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();

  // Maska przycinająca do obwodu kuli
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();

  // Warstwa A: obracające się panele turniejowe
  ctx.save();
  ctx.rotate(ball.rotation);
  drawTournamentPanels(ctx, r);
  ctx.restore();

  // Warstwa B: statyczny światłocień 3D (niezależny od rotacji)
  drawStaticLighting(ctx, r);

  // Zamknięcie maski
  ctx.restore();

  // Warstwa C: wyrazisty obrys zewnętrzny
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = Math.max(1.0, r * 0.09);
  ctx.stroke();

  ctx.restore();

  // 3. Warstwowość 2D: noga zasłaniająca piłkę w intro
  if (player.isIntro && player.frontLegOverBall) {
    drawFrontLegOnly(ctx, ball.y + ball.radius);
  }
}

