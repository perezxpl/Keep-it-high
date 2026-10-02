import { CONFIG, START_X, ARENA_LEFT, ARENA_RIGHT } from './config.js';
import { distToSegment, triggerScreenShake, triggerGoalCelebration } from './world.js';
import { player, getFreestyleChoreography, drawFrontLegOnly } from './player.js';
import { resolveBallObstacleCollisions, activeArenaId, GOALS, arenaScore, resetArena } from './obstacles.js';

export const ball = {
  x: START_X - 38,
  y: 0,
  prevX: START_X - 38,
  prevY: 0,
  vx: 0,
  vy: 0,
  radius: 8.0,
  colRadius: 5.2,
  stuckFrames: 0,
  rotation: 0,
  spin: 0,
  trail: [],
  lowGravityFrames: 0
};

export function resetBallToPlayer(p, GROUND_Y) {
  p.x = START_X - 60; // Start przed linią 0m (x = 100)
  p.isIntro = true;
  p.juggleTimer = 0;
  p.vx = 0;
  p.intendedVx = 0;
  p.kickState = 'IDLE';
  p.gaitMode = 'PODBICIE Z ZIEMI';
  if (p.aimX === undefined || p.aimX === 0) p.aimX = p.x + (160 * p.facing);
  if (p.aimY === undefined || p.aimY === 0) p.aimY = GROUND_Y - 50;
  ball.x = p.x + (20 * p.facing);
  ball.y = GROUND_Y - ball.colRadius;
  ball.prevX = ball.x;
  ball.prevY = ball.y;
  ball.vx = 0;
  ball.vy = 0;
  ball.spin = 0;
  ball.trail = [];
  ball.lowGravityFrames = 0;
  ball.stuckFrames = 0;
}

/**
 * Wystrzelenie piłki jako kinetycznego pocisku balistycznego w stronę punktu aimX, aimY.
 */
function launchBallKinetic(playerObj, spawnGrass, baseSpeedOverride, isSpinVolley) {
  playerObj.hitThisSwing = true;
  playerObj.kickBufferTimer = 0;
  if (playerObj.isIntro) {
    playerObj.isIntro = false;
    playerObj.frontLegOverBall = false;
  }

  // Wektor kierunku w stronę punktu celowania (aimX, aimY)
  const targetX = (typeof playerObj.aimX === 'number' && !isNaN(playerObj.aimX)) ? playerObj.aimX : (ball.x + playerObj.facing * 100);
  const targetY = (typeof playerObj.aimY === 'number' && !isNaN(playerObj.aimY)) ? playerObj.aimY : (ball.y - 60);

  const dx = targetX - ball.x;
  const dy = targetY - ball.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;

  // Statystyki aktywnej klasy postaci
  const classStats = playerObj.currentClass?.stats;
  const baseSpeedDef = classStats?.baseKickSpeed || 30.0;
  const powerMult = classStats?.kickPowerMult || 1.0;
  const spinMult = classStats?.spinMult || 1.0;

  // Prędkość pocisku bazująca na sile naładowania strzału (chargePower) i modyfikatorach klasy (mnożnik x2.0 - dynamiczny, szybki lot)
  const charge = playerObj.chargePower || 0;
  let baseSpeed = (baseSpeedOverride || (baseSpeedDef + charge * 28.0)) * powerMult * 2.0;

  if (isSpinVolley || playerObj.kickMode === 'SPIN_VOLLEY') {
    // Bonus do prędkości x1.2, precyzyjny kąt myszy i minimalna grawitacja przez 20 klatek
    baseSpeed *= 1.2;
    ball.vx = nx * baseSpeed;
    ball.vy = ny * baseSpeed;
    ball.lowGravityFrames = 20;
  } else {
    // Nadanie wektora z uwzględnieniem pędu gracza (+ 50% player.vx)
    ball.vx = (nx * baseSpeed) + (playerObj.vx * 0.50);
    ball.vy = ny * baseSpeed;
    ball.lowGravityFrames = 0;
  }

  // Rotacja i wyczyszczenie śladu pędu (z uwzględnieniem spinMult klasy)
  ball.spin = (ball.vx > 0 ? 1 : -1) * (0.35 + charge * 0.65) * spinMult;
  ball.trail = [];

  playerObj.chargePower = 0;
  if (spawnGrass) {
    spawnGrass(ball.x, ball.y, playerObj.facing);
  }

  // Hook wykopu klasy (pozwala na unikalną modyfikację parametrów lotu)
  playerObj.currentClass?.onKick?.(playerObj, ball, {
    nx,
    ny,
    isSpinVolley: (isSpinVolley || playerObj.kickMode === 'SPIN_VOLLEY'),
    baseSpeed
  });
}

export function updateBall(GROUND_Y) {
  // Żonglerka przed startem
  if (player.isIntro) {
    const hipX = player.x + player.w / 2;
    const hipY = player.y + player.h - 40;
    const choreo = getFreestyleChoreography(player.juggleTimer, hipX, hipY, GROUND_Y, player.facing, ball.radius);

    ball.x = choreo.ballX;
    ball.y = choreo.ballY;
    ball.prevX = ball.x;
    ball.prevY = ball.y;
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

  // W locie: opór powietrza i grawitacja
  if (ball.y + ball.colRadius < GROUND_Y) {
    let grav = CONFIG.GRAVITY;
    if (ball.lowGravityFrames > 0) {
      grav *= 0.12; // Minimalny opad grawitacyjny dla SPIN_VOLLEY / Enforcera
      ball.lowGravityFrames--;
    }
    const dragY = ball.vy < 0 ? (0.0010 * ball.vy * ball.vy) : 0;
    ball.vy += grav + dragY;
    ball.vx *= 0.996;
  } else {
    ball.vy += CONFIG.GRAVITY;
  }

  // Continuous Collision Detection (CCD): Sub-stepping przy wysokich prędkościach
  const speed = Math.hypot(ball.vx, ball.vy);
  const steps = speed > 24 ? 8 : (speed > 10 ? 4 : 1);
  const subDt = 1 / steps;

  for (let s = 0; s < steps; s++) {
    ball.prevX = ball.x;
    ball.prevY = ball.y;

    ball.x += ball.vx * subDt;
    ball.y += ball.vy * subDt;

    // Sprężyste odbijanie piłki (rykoszety) od pionowych neonowych ścian areny (300m bariera)
    const isArena2 = (activeArenaId === 'ARENA_2');
    const wallLeft = isArena2 ? 150 : ARENA_LEFT;
    const wallRight = isArena2 ? 1770 : ARENA_RIGHT;
    const wallTop = GROUND_Y - 3000;

    if (ball.y >= wallTop) {
      if (ball.x - ball.colRadius <= wallLeft) {
        ball.x = wallLeft + ball.colRadius;
        ball.vx = Math.abs(ball.vx) * 0.88;
        ball.spin = -ball.spin * 0.75;
      } else if (ball.x + ball.colRadius >= wallRight) {
        ball.x = wallRight - ball.colRadius;
        ball.vx = -Math.abs(ball.vx) * 0.88;
        ball.spin = -ball.spin * 0.75;
      }
    }

    // Lądowanie na trawie
    if (ball.y + ball.colRadius >= GROUND_Y) {
      ball.y = GROUND_Y - ball.colRadius;
      if (Math.abs(ball.vy) > 0.8) {
        ball.vy = -ball.vy * 0.58;
      } else {
        ball.vy = 0;
      }
      ball.vx *= Math.pow(0.985, subDt);
      ball.spin *= Math.pow(0.94, subDt);
      ball.rotation += (ball.vx * 0.08 * subDt);
    } else {
      ball.rotation += (ball.spin + (ball.vx * 0.04)) * subDt;
      ball.spin *= Math.pow(0.96, subDt);
    }

    // Rozwiązanie kolizji z przeszkodami i terenem
    resolveBallObstacleCollisions(ball, GROUND_Y);
  }

  // Detekcja gola na Arenie 2 (Cyber Stadium)
  if (activeArenaId === 'ARENA_2') {
    for (const g of GOALS) {
      const bottomY = GROUND_Y - g.relY;
      const topY = bottomY - g.h;
      const leftX = g.x;
      const rightX = g.x + g.w;

      if (ball.x >= leftX && ball.x <= rightX && ball.y >= topY && ball.y <= bottomY) {
        const scoringTeam = (g.team === 'CYAN') ? 'ORANGE' : 'CYAN';
        if (scoringTeam === 'CYAN') {
          arenaScore.cyan++;
        } else {
          arenaScore.orange++;
        }

        triggerScreenShake(14);
        triggerGoalCelebration(scoringTeam, scoringTeam === 'CYAN' ? '#06b6d4' : '#f97316');
        resetArena();

        // Reset piłki na środek murawy
        ball.x = 960;
        ball.y = GROUND_Y - ball.colRadius - 20;
        ball.prevX = ball.x;
        ball.prevY = ball.y;
        ball.vx = 0;
        ball.vy = -3.0;
        ball.spin = 0;
        ball.trail = [];
        break;
      }
    }
  }

  // Anti-Stuck Watchdog: zabezpieczenie przed uwięzieniem w szczelinach lub pod kładkami
  const ballSpeed = Math.hypot(ball.vx, ball.vy);
  if (ball.y < GROUND_Y - ball.colRadius - 2) {
    if (ballSpeed < 0.25) {
      ball.stuckFrames = (ball.stuckFrames || 0) + 1;
      if (ball.stuckFrames > 14) {
        ball.vy = -4.5;
        ball.vx = (ball.x < 960) ? 3.5 : -3.5;
        ball.stuckFrames = 0;
      }
    } else {
      ball.stuckFrames = 0;
    }
  } else {
    ball.stuckFrames = 0;
  }

  // Ślad pędu (trail) aktualizowany na klatkę na podstawie ostatecznej pozycji
  const finalSpeed = Math.hypot(ball.vx, ball.vy);
  if (ball.y + ball.colRadius < GROUND_Y) {
    if (finalSpeed > 7.5) {
      if (ball.trail.length < 5) {
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
  } else if (ball.trail.length > 0) {
    ball.trail.shift();
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
      launchBallKinetic(playerObj, spawnGrass);
      ball.y -= 8;
    }
    return;
  }

  // =========================================================================
  // 1. WŚLIZG
  // =========================================================================
  if (playerObj.isSliding) {
    const batEndX = hipX + (50 * playerObj.facing);
    const batEndY = GROUND_Y - 4;

    const hit = distToSegment(ball.x, ball.y, hipX, hipY, batEndX, batEndY);
    const batThickness = 16;

    if (hit.dist < ball.colRadius + batThickness) {
      // Sztywny wektor uderzenia z wślizgu - skalowany siłą klasy (podwojona dynamika)
      playerObj.hitThisSwing = true;
      const powerMult = playerObj.currentClass?.stats?.kickPowerMult || 1.0;
      ball.vx = playerObj.facing * (22.0 * powerMult);
      ball.vy = -3.2;
      ball.spin = playerObj.facing * 0.8;
      ball.trail = [];
      ball.lowGravityFrames = 0;
      ball.stuckFrames = 0;
      ball.y = Math.min(ball.y, GROUND_Y - ball.colRadius - 8);
      if (spawnGrass) {
        spawnGrass(ball.x, ball.y, playerObj.facing);
      }
      playerObj.currentClass?.onKick?.(playerObj, ball, { isSlide: true });
    }
    return;
  }

  // =========================================================================
  // 2. STRZAŁ / WYKOP W STRONĘ CELOWNIKA (W TYM SPIN_VOLLEY)
  // =========================================================================
  const isKicking = (playerObj.kickState === 'SWING' || playerObj.kickBufferTimer > 0);

  if (isKicking && !playerObj.hitThisSwing) {
    const footReach = playerObj.thighLen + playerObj.shinLen + 2;
    const currentAngle = playerObj.kickState === 'SWING' ? playerObj.kickAngle : 0.6;

    const footX = (playerObj.kickingFootX !== undefined && playerObj.kickingFootX !== 0)
      ? playerObj.kickingFootX
      : (hipX + Math.sin(currentAngle) * footReach * playerObj.facing);
    const footY = (playerObj.kickingFootY !== undefined && playerObj.kickingFootY !== 0)
      ? playerObj.kickingFootY
      : (hipY + Math.cos(currentAngle) * footReach);

    const footRadius = 15;
    const ballRadius = ball.colRadius || ball.radius || 12;
    const distBall = Math.hypot(ball.x - footX, ball.y - footY);

    if (distBall <= (footRadius + ballRadius)) {
      launchBallKinetic(playerObj, spawnGrass, undefined, playerObj.kickMode === 'SPIN_VOLLEY');
      ball.y = Math.min(ball.y, footY - ballRadius - 2);
    }
  } else if (!isKicking) {
    // 3. Pasywny kontakt z ciałem / nogami zawodnika (np. amortyzacja piłki przez Libero / Sweeper)
    const bodyDist = Math.hypot(ball.x - hipX, ball.y - hipY);
    if (bodyDist < ball.colRadius + 32) {
      playerObj.currentClass?.onBallPassiveContact?.(playerObj, ball);
    }
  }
}

/**
 * Klasyczne czarne łaty Telstar ze sferyczną rotacją wokół osi Z i obrotem bocznym z pozycji X.
 */
function drawTelstarPatches(ctx, r, rotation, worldX) {
  ctx.save();

  // Obrót wokół osi Z
  ctx.rotate(rotation);

  // Pozorny obrót boczny (sferyczne rolowanie na osi X)
  const lateralPhase = (worldX / (r * 2.2));
  const latX = Math.sin(lateralPhase) * (r * 0.28);
  const latY = Math.cos(lateralPhase * 0.5) * (r * 0.10);
  ctx.translate(latX, latY);

  const TWO_PI = Math.PI * 2;
  const pentagonColor = '#18181b';
  const seamColor = 'rgba(0, 0, 0, 0.22)';
  const seamWidth = 1.0;

  // 1. Centralny czarny pięciokąt
  const pRad = r * 0.38;
  const pVerts = [];
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const ang = (i * TWO_PI / 5) - Math.PI / 2;
    const vx = Math.cos(ang) * pRad;
    const vy = Math.sin(ang) * pRad;
    pVerts.push({ x: vx, y: vy, ang: ang });
    if (i === 0) ctx.moveTo(vx, vy);
    else ctx.lineTo(vx, vy);
  }
  ctx.closePath();
  ctx.fillStyle = pentagonColor;
  ctx.fill();
  ctx.strokeStyle = seamColor;
  ctx.lineWidth = seamWidth;
  ctx.stroke();

  // 2. Promieniście rozchodzące się krawędzie sześciokątów zniekształcone sferycznie ku obrysowi
  for (let i = 0; i < 5; i++) {
    const v = pVerts[i];
    const outerRad = r * 0.76;
    const ox = Math.cos(v.ang) * outerRad;
    const oy = Math.sin(v.ang) * outerRad;

    // Szew promienisty od wierzchołka pięciokąta
    ctx.beginPath();
    ctx.moveTo(v.x, v.y);
    ctx.lineTo(ox, oy);
    ctx.strokeStyle = seamColor;
    ctx.lineWidth = seamWidth;
    ctx.stroke();

    // Łącznik szwów bocznych tworzący sześciokąty
    const nextI = (i + 1) % 5;
    const nextV = pVerts[nextI];
    const nextOx = Math.cos(nextV.ang) * outerRad;
    const nextOy = Math.sin(nextV.ang) * outerRad;

    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(nextOx, nextOy);
    ctx.strokeStyle = seamColor;
    ctx.lineWidth = seamWidth;
    ctx.stroke();
  }

  // 3. Zewnętrzne czarne łaty na obwodzie (sferycznie zniekształcone ku krawędzi)
  for (let i = 0; i < 5; i++) {
    const midAng = (i * TWO_PI / 5) - Math.PI / 2 + (Math.PI / 5);
    const distPatch = r * 0.88;
    const cx = Math.cos(midAng) * distPatch;
    const cy = Math.sin(midAng) * distPatch;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(midAng + Math.PI / 2);

    ctx.beginPath();
    const pw = r * 0.32;
    const ph = r * 0.28;
    ctx.moveTo(-pw * 0.7, -ph * 0.5);
    ctx.lineTo(pw * 0.7, -ph * 0.5);
    ctx.lineTo(pw, ph * 0.8);
    ctx.lineTo(-pw, ph * 0.8);
    ctx.closePath();
    ctx.fillStyle = pentagonColor;
    ctx.fill();
    ctx.strokeStyle = seamColor;
    ctx.lineWidth = seamWidth;
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

export function drawBall(ctx) {
  const r = ball.radius;

  // 1. Dyskretny, półprzezroczysty biały cień pędu (trail) przy wysokich prędkościach
  const trailLen = ball.trail.length;
  if (trailLen > 0) {
    for (let i = 0; i < trailLen; i++) {
      const tr = ball.trail[i];
      const factor = (i + 1) / (trailLen + 1);
      const alpha = factor * 0.08;
      const scale = 0.55 + factor * 0.35;
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, r * scale, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      ctx.fill();
    }
  }

  // 2. Kula piłki Telstar
  ctx.save();
  ctx.translate(ball.x, ball.y);

  // Maska kuli
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();

  // Baza kuli: białe koło z radialnym gradientem 3D
  const lightX = -r * 0.3;
  const lightY = -r * 0.3;
  const baseGrad = ctx.createRadialGradient(lightX, lightY, r * 0.06, 0, 0, r);
  baseGrad.addColorStop(0.0, '#ffffff');
  baseGrad.addColorStop(0.45, '#f1f5f9');
  baseGrad.addColorStop(1.0, '#94a3b8');

  ctx.fillStyle = baseGrad;
  ctx.fillRect(-r, -r, r * 2, r * 2);

  // Klasyczne czarne łaty Telstar ze sferyczną rotacją
  drawTelstarPatches(ctx, r, ball.rotation, ball.x);

  // Odbłysk jupiterów: mały, miękki eliptyczny blik na szczycie piłki
  ctx.save();
  ctx.translate(lightX * 0.9, lightY * 0.9);
  ctx.rotate(-Math.PI / 4);
  ctx.beginPath();
  if (ctx.ellipse) {
    ctx.ellipse(0, 0, Math.max(1.8, r * 0.32), Math.max(0.9, r * 0.16), 0, 0, Math.PI * 2);
  } else {
    ctx.arc(0, 0, Math.max(1.4, r * 0.24), 0, Math.PI * 2);
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fill();
  ctx.restore();

  // Zamknięcie maski przycinającej
  ctx.restore();

  // Cienki, elegancki obrys zewnętrzny
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.lineWidth = Math.max(0.8, r * 0.09);
  ctx.stroke();

  ctx.restore();

  // 3. Warstwowość 2D: noga zasłaniająca piłkę w intro
  if (player.isIntro && player.frontLegOverBall) {
    drawFrontLegOnly(ctx, ball.y + ball.radius);
  }
}
