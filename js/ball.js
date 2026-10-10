import { CONFIG, START_X, ARENA_WIDTH, MAP_WIDTH, ARENA_LEFT, ARENA_RIGHT } from './config.js';
import { distToSegment, triggerScreenShake, triggerGoalCelebration, isGroundAt } from './world.js?v=v62_kick_slide_balance';
import { player, getFreestyleChoreography, drawFrontLegOnly } from './player.js?v=v62_kick_slide_balance';
import { resolveBallObstacleCollisions, activeArenaId, GOALS, ARENA_FOUNDRY_GOALS, arenaScore, resetArena, arena1State, goalTriggerLeft, goalTriggerRight } from './obstacles.js?v=v62_kick_slide_balance';

const _mapW = (typeof MAP_WIDTH !== 'undefined' ? MAP_WIDTH : ARENA_WIDTH) || 3600;
const _centerX = _mapW / 2; // 1800

export const ball = {
  x: _centerX,
  y: 750,
  prevX: _centerX,
  prevY: 750,
  vx: 0,
  vy: 0,
  radius: 8.0,
  colRadius: 5.2,
  stuckFrames: 0,
  rotation: 0,
  spin: 0,
  trail: [],
  lowGravityFrames: 0,
  isLevitating: false,
  hoverBaseY: 750,
  goalAnimation: null
};

export function resetBallToPlayer(p, GROUND_Y) {
  const isA3 = (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3');
  const isA2 = (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2');
  if (isA3) {
    p.x = 600;
    p.y = 1130;
    p.facing = 1;
    if (typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('spawnX')) p.x = Number(urlParams.get('spawnX'));
      if (urlParams.has('spawnY')) p.y = Number(urlParams.get('spawnY'));
    }
    ball.active = false;
    ball.x = -9999;
    ball.y = -9999;
    p.isIntro = false;
    p.gaitMode = 'IDLE';
    p.onGround = true;
    p.currentGroundY = p.y + (p.h || 70);
  } else if (isA2) {
    p.x = 420;
    p.y = 910;
    p.facing = 1;
    if (typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('spawnX')) p.x = Number(urlParams.get('spawnX'));
      if (urlParams.has('spawnY')) p.y = Number(urlParams.get('spawnY'));
    }
    ball.active = false;
    ball.x = -9999;
    ball.y = -9999;
    ball.isLevitating = false;
    p.isIntro = false;
    p.gaitMode = 'IDLE';
    p.onGround = true;
    p.currentGroundY = p.y + (p.h || 70);
  } else {
    // Arena 1: Centrum mapy (Cokół środkowy)
    const spawnY = (arena1State?.altarY || 760) - ball.radius - 2; // 750
    p.x = 240;
    p.y = 580;
    p.facing = 1;
    p.isIntro = false;
    p.gaitMode = 'IDLE';
    p.onGround = true;
    p.currentGroundY = 650;
    ball.x = _centerX;
    ball.y = spawnY;
    ball.hoverBaseY = spawnY;
    ball.isLevitating = false;
    if (arena1State) {
      arena1State.waitingForKickoff = true;
      arena1State.kickoffCooldown = 0;
    }
  }
  p.juggleTimer = 0;
  p.vx = 0;
  p.intendedVx = 0;
  p.kickState = 'IDLE';
  if (p.aimX === undefined || p.aimX === 0) p.aimX = p.x + (160 * p.facing);
  if (p.aimY === undefined || p.aimY === 0) p.aimY = (isA3 ? 900 : GROUND_Y) - 50;
  ball.prevX = ball.x;
  ball.prevY = ball.y;
  ball.vx = 0;
  ball.vy = 0;
  ball.spin = 0;
  ball.trail = [];
  ball.lowGravityFrames = 0;
  ball.stuckFrames = 0;
  if (ball.goalAnimation) ball.goalAnimation.active = false;
}

/**
 * Wystrzelenie piłki jako kinetycznego pocisku balistycznego w stronę punktu aimX, aimY.
 */
function launchBallKinetic(playerObj, spawnGrass, baseSpeedOverride, isSpinVolley) {
  ball.isLevitating = false;
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

/**
 * Sprawdza czy piłka wpadła w światło bramki (lub otworu w ścianie w Arenie 3).
 * Wywoływana zarówno w każdym mikrokroku (sub-step) CCD, jak i po pętli fizyki.
 * @param {Object} ballObj Obiekt piłki
 * @param {number} groundY Poziom podłoża
 * @returns {boolean} true jeśli gol został uznany
 */
export function checkGoalTrigger(ballObj, groundY) {
  if (!ballObj || (ballObj.goalAnimation && ballObj.goalAnimation.active)) return false;

  const isA3 = (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY');
  const goalsToCheck = (GOALS && GOALS.length > 0) ? GOALS : (isA3 ? ARENA_FOUNDRY_GOALS : [goalTriggerLeft, goalTriggerRight]);

  for (const g of goalsToCheck) {
    if (!g || !g.team) continue;

    const isCyanGoal = (g.team === 'CYAN');
    const scoringTeam = isCyanGoal ? 'ORANGE' : 'CYAN';
    const topY = (g.y !== undefined) ? g.y : (Math.min(groundY - (g.relY || 0), groundY - (g.relY || 0) - (g.h || 140)));
    const bottomY = (g.bottomY !== undefined) ? g.bottomY : ((g.y !== undefined) ? (g.y + (g.h || 140)) : (Math.max(groundY - (g.relY || 0), groundY - (g.relY || 0) + (g.h || 140))));
    const leftX = g.x;
    const rightX = g.x + (g.w || 220);

    let isInsideGoal = false;
    let targetX = 0;
    let targetY = (topY + bottomY) / 2;

    if (g.isCupGoal) {
      const cR = ballObj.colRadius || 12;
      if (ballObj.x + cR >= leftX && ballObj.x - cR <= rightX && ballObj.y + cR >= topY && ballObj.y - cR <= bottomY) {
        isInsideGoal = true;
        targetX = (g.targetX !== undefined) ? g.targetX : ((leftX + rightX) / 2);
        targetY = (g.targetY !== undefined) ? g.targetY : ((topY + bottomY) / 2);
      }
    } else if (isA3 || g.holeCx !== undefined) {
      const hCx = g.holeCx !== undefined ? g.holeCx : (leftX + rightX) / 2;
      const hCy = g.holeCy !== undefined ? g.holeCy : (topY + bottomY) / 2;
      const hR = g.holeR || 170;
      const dHole = Math.hypot(ballObj.x - hCx, ballObj.y - hCy);

      // Warunek 1: Piłka wewnątrz promienia okrągłego otworu w ścianie
      if (dHole <= hR + ballObj.colRadius) {
        isInsideGoal = true;
      }
      // Warunek 2: Piłka przekroczyła linię otworu na wysokości wlotu
      else if (ballObj.y >= topY - 15 && ballObj.y <= bottomY + 15) {
        if (g.facing === 1 && ballObj.x <= rightX && ballObj.x >= leftX - 60) {
          isInsideGoal = true;
        } else if (g.facing === -1 && ballObj.x >= leftX && ballObj.x <= rightX + 60) {
          isInsideGoal = true;
        }
      }

      if (isInsideGoal) {
        // Wciągnięcie głęboko w rurę/kanał techniczny za kołnierz ściany
        targetX = isCyanGoal ? 30 : 4370;
        targetY = hCy;
      }
    } else {
      // Standardowe prostokątne bramki neonowe (Arena 1 & 2)
      const insideAABB = (ballObj.x >= leftX && ballObj.x <= rightX && ballObj.y >= topY && ballObj.y <= bottomY);
      const passedLine = (g.facing === 1 && ballObj.x <= (g.lineX !== undefined ? g.lineX : rightX) && ballObj.x >= leftX - 40 && ballObj.y >= topY && ballObj.y <= bottomY) ||
                         (g.facing === -1 && ballObj.x >= (g.lineX !== undefined ? g.lineX : leftX) && ballObj.x <= rightX + 40 && ballObj.y >= topY && ballObj.y <= bottomY);

      if (insideAABB || passedLine) {
        isInsideGoal = true;
        targetX = (g.facing === 1) ? (leftX + 40) : (rightX - 40);
        targetY = (topY + bottomY) / 2;
      }
    }

    if (isInsideGoal) {
      if (scoringTeam === 'CYAN') {
        arenaScore.cyan++;
      } else {
        arenaScore.orange++;
      }

      triggerScreenShake(16);
      triggerGoalCelebration(scoringTeam, scoringTeam === 'CYAN' ? '#00F0FF' : '#FF8800');

      ballObj.goalAnimation = {
        active: true,
        timer: 48,
        maxTimer: 48,
        startX: ballObj.x,
        startY: ballObj.y,
        targetX: targetX,
        targetY: targetY,
        scoringTeam: scoringTeam,
        color: scoringTeam === 'CYAN' ? '#00F0FF' : '#FF8800',
        scale: 1.0,
        alpha: 1.0,
        spinDir: (ballObj.vx > 0 ? 1 : -1) || (isCyanGoal ? -1 : 1)
      };
      ballObj.vx = 0;
      ballObj.vy = 0;
      return true;
    }
  }
  return false;
}

export function updateBall(GROUND_Y) {
  // Animacja wpadania piłki w głąb bramki (Visual Goal Entry)
  if (ball.goalAnimation && ball.goalAnimation.active) {
    ball.goalAnimation.timer--;
    const progress = 1.0 - (ball.goalAnimation.timer / ball.goalAnimation.maxTimer);
    const easeP = 1.0 - Math.pow(1.0 - progress, 2.5);

    ball.x = ball.goalAnimation.startX + (ball.goalAnimation.targetX - ball.goalAnimation.startX) * easeP;
    ball.y = ball.goalAnimation.startY + (ball.goalAnimation.targetY - ball.goalAnimation.startY) * easeP;
    ball.prevX = ball.x;
    ball.prevY = ball.y;
    ball.vx = 0;
    ball.vy = 0;
    ball.trail = [];

    // Efekt głębi 3D - piłka zmniejsza się wpadając w głąb rury za kołnierz ściany
    ball.goalAnimation.scale = Math.max(0.04, Math.pow(1.0 - progress, 1.4));
    ball.goalAnimation.alpha = Math.max(0.0, 1.0 - Math.pow(progress, 2.2));
    ball.rotation += (ball.goalAnimation.spinDir || 1) * 0.28 * (1.0 + progress * 2.0);

    if (ball.goalAnimation.timer <= 0) {
      ball.goalAnimation.active = false;
      resetArena();

      const isA3 = (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY');
      const isA2Goal = (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA');
      if (isA3) {
        ball.x = 2200;
        ball.y = 680;
        ball.hoverBaseY = 680;
        ball.isLevitating = true;
        ball.vx = 0;
        ball.vy = 0;
      } else if (isA2Goal) {
        ball.x = 1800;
        ball.y = 560;
        ball.isLevitating = false;
        ball.vx = 0;
        ball.vy = 0;
      } else {
        const spawnY = (arena1State?.altarY || 760) - ball.radius - 2; // 750
        ball.x = arena1State?.altarX || _centerX; // 1800
        ball.y = spawnY;
        ball.hoverBaseY = spawnY;
        ball.isLevitating = false;
        ball.vx = 0;
        ball.vy = 0;
        if (arena1State) {
          arena1State.waitingForKickoff = true;
          arena1State.kickoffCooldown = 60;
        }
      }
      ball.prevX = ball.x;
      ball.prevY = ball.y;
      ball.spin = 0;
      ball.trail = [];
    }
    return;
  }

  // Stan lewitacji nad kotłem
  if (ball.isLevitating) {
    const isA3 = (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY');
    if (isA3) {
      const hoverOffset = Math.sin(performance.now() * 0.0035) * 8;
      ball.x = 2200;
      ball.y = (ball.hoverBaseY || 680) + hoverOffset;
      ball.prevX = ball.x;
      ball.prevY = ball.y;
      ball.vx = 0;
      ball.vy = 0;
      ball.rotation += 0.015;
      ball.trail = [];
      return;
    } else {
      ball.isLevitating = false;
    }
  }

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
  const isA3Air = (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY');
  const isA2Air = (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA');
  const isInAir = (isA3Air || isA2Air) ? (ball.y + ball.colRadius < 1390) : (ball.y + ball.colRadius < GROUND_Y);

  if (isInAir) {
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

    // Natychmiastowa detekcja wpadnięcia do bramki podczas mikrokroku (CCD)
    if (checkGoalTrigger(ball, GROUND_Y)) {
      break;
    }

    // Sprężyste odbijanie piłki (rykoszety) od pionowych neonowych ścian areny (300m bariera)
    const isArena3 = (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY');
    const isArena2 = (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA');
    const wallLeft = (isArena3 || isArena2) ? 0 : ARENA_LEFT;
    const wallRight = isArena3 ? 4400 : (isArena2 ? 3600 : ARENA_RIGHT);
    const wallTop = isArena2 ? 0 : (GROUND_Y - (isArena3 ? 1300 : 3000));

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


    // Lądowanie na podłożu / wpadanie w wyrwę w geometrii
    const hasNoFloor = (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2');
    const isGroundUnderBall = (!hasNoFloor && typeof isGroundAt === 'function')
      ? isGroundAt(ball.x, ball.colRadius * 0.6)
      : (!hasNoFloor);

    if (ball.y + ball.colRadius >= GROUND_Y && isGroundUnderBall && ball.y - ball.colRadius <= GROUND_Y + 12) {
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
      // W locie lub wpadanie w wyrwę (grawitacja ściąga piłkę w dół przez otwór w kładce)
      ball.rotation += (ball.spin + (ball.vx * 0.04)) * subDt;
      ball.spin *= Math.pow(0.96, subDt);
    }

    // Bezpieczny reset piłki na płytę boiska w razie wpadnięcia w czeluść kanału technicznego, otchłani lub śmiertelnej wody w Arenie 3
    const ballInA3Water = isArena3 && (ball.y + (ball.colRadius || 14) >= 1300) && (ball.x >= 1560 && ball.x <= 2840);
    const ballVoidLimit = isArena3 ? 1300 : (isArena2 ? 1380 : (GROUND_Y + 280));
    if (ball.y > ballVoidLimit || ballInA3Water) {
      if (isArena3) {
        ball.x = 2200;
        ball.y = 700;
        ball.hoverBaseY = 700;
        ball.isLevitating = true;
        ball.vx = 0;
        ball.vy = 0;
        ball.spin = 0;
      } else if (isArena2) {
        ball.x = 1800;
        ball.y = 560;
        ball.isLevitating = false;
        ball.vx = 0;
        ball.vy = 0;
      } else {
        ball.x = 960;
        ball.y = GROUND_Y - ball.colRadius - 30;
        ball.isLevitating = false;
        ball.vx = 0;
        ball.vy = -4.0;
      }
      ball.prevX = ball.x;
      ball.prevY = ball.y;
      ball.spin = 0;
      ball.trail = [];
    }

    // Rozwiązanie kolizji z przeszkodami i terenem
    resolveBallObstacleCollisions(ball, GROUND_Y);
  }

  // Detekcja gola po zintegrowaniu całej klatki (jeśli nie przechwycono w mikrokrokach)
  if (!ball.goalAnimation?.active) {
    checkGoalTrigger(ball, GROUND_Y);
  }

  // Anti-Stuck Watchdog: zabezpieczenie przed uwięzieniem w szczelinach lub pod kładkami
  const ballSpeed = Math.hypot(ball.vx, ball.vy);
  if (isInAir) {
    if (ballSpeed < 0.25) {
      ball.stuckFrames = (ball.stuckFrames || 0) + 1;
      if (ball.stuckFrames > 14) {
        const isA3 = (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY');
        const isA2Anti = (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA');
        const centerX = isA3 ? 2200 : (isA2Anti ? 1800 : 960);
        ball.vy = -4.5;
        ball.vx = (ball.x < centerX) ? 3.5 : -3.5;
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
  if (isInAir) {
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
  if (ball.goalAnimation && ball.goalAnimation.active) return;
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
    const feetY = playerObj.y + playerObj.h;
    const batEndX = hipX + (50 * playerObj.facing);
    const batEndY = feetY - 4;

    const hit = distToSegment(ball.x, ball.y, hipX, hipY, batEndX, batEndY);
    const batThickness = 16;

    if (hit.dist < ball.colRadius + batThickness) {
      // Sztywny wektor uderzenia z wślizgu - skalowany siłą klasy (podwojona dynamika)
      ball.isLevitating = false;
      playerObj.hitThisSwing = true;
      const powerMult = playerObj.currentClass?.stats?.kickPowerMult || 1.0;
      ball.vx = playerObj.facing * (22.0 * powerMult);
      ball.vy = -3.2;
      ball.spin = playerObj.facing * 0.8;
      ball.trail = [];
      ball.lowGravityFrames = 0;
      ball.stuckFrames = 0;
      const isCustomArena = (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'ARENA_2');
      if (!isCustomArena) {
        ball.y = Math.min(ball.y, GROUND_Y - ball.colRadius - 8);
      } else {
        ball.y = Math.min(ball.y, feetY - ball.colRadius - 8);
      }
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
      if (ball.isLevitating) {
        ball.isLevitating = false;
        ball.vx = (playerObj.facing || 1) * 4.5 + (playerObj.vx || 0) * 0.4;
        ball.vy = -3.2;
      }
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

  // 0. Efekt unoszenia termicznego / lewitacji nad kotłem
  if (ball.isLevitating) {
    const time = performance.now() * 0.001;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Termiczna łuna unosząca (Thermal Updraft Glow)
    const glowPulse = 0.75 + 0.25 * Math.sin(time * 4.0);
    const auraGrad = ctx.createRadialGradient(ball.x, ball.y, 2, ball.x, ball.y, r * 4.2);
    auraGrad.addColorStop(0.0, `rgba(254, 240, 138, ${0.80 * glowPulse})`);
    auraGrad.addColorStop(0.35, `rgba(249, 115, 22, ${0.50 * glowPulse})`);
    auraGrad.addColorStop(0.70, `rgba(234, 88, 12, ${0.22 * glowPulse})`);
    auraGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, r * 4.2, 0, Math.PI * 2);
    ctx.fill();

    // Pierścień unoszącej fali cieplnej
    const ringPhase = (time * 1.6) % 1.0;
    const ringR = r * (0.8 + ringPhase * 2.4);
    const ringAlpha = (1.0 - ringPhase) * 0.65;
    ctx.strokeStyle = `rgba(254, 240, 138, ${ringAlpha.toFixed(2)})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Wznoszące się mikro-iskry ciepła
    for (let i = 0; i < 4; i++) {
      const sparkSeed = i * 23.7;
      const sparkPhase = ((time * 2.2 + i * 0.25) % 1.0);
      const sparkY = ball.y + r * 1.8 - sparkPhase * r * 3.6;
      const sparkX = ball.x + Math.sin(time * 3.0 + sparkSeed) * (r * 1.2);
      const spAlpha = Math.sin(sparkPhase * Math.PI) * 0.85;
      ctx.fillStyle = `rgba(254, 240, 138, ${spAlpha.toFixed(2)})`;
      ctx.fillRect(sparkX - 1, sparkY - 1, 2, 2);
    }

    ctx.restore();
  }

  // 1. Dyskretny, półprzezroczysty biały cień pędu (trail) przy wysokich prędkościach
  const trailLen = ball.trail.length;
  if (trailLen > 0 && !ball.goalAnimation?.active) {
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

  // 2. Kula piłki Telstar z obsługą animacji wpadania do bramki
  const animScale = (ball.goalAnimation && ball.goalAnimation.active) ? ball.goalAnimation.scale : 1.0;
  const animAlpha = (ball.goalAnimation && ball.goalAnimation.active) ? ball.goalAnimation.alpha : 1.0;
  if (animAlpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, animAlpha));
  ctx.translate(ball.x, ball.y);
  if (animScale !== 1.0) {
    ctx.scale(animScale, animScale);
  }

  // Poświata zasysania w otchłań bramki (Vortex Glow)
  if (ball.goalAnimation && ball.goalAnimation.active) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const vGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 2.4);
    vGlow.addColorStop(0.0, ball.goalAnimation.color || '#00e5ff');
    vGlow.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = vGlow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

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
  if (player && player.isIntro && player.frontLegOverBall) {
    drawFrontLegOnly(ctx, ball.y + ball.radius, player);
  }
}

