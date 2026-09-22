import { CONFIG } from './config.js';
import { distToSegment, resolveSegmentCollision } from './world.js';
import { solve2BoneIK, getBiomechanicFootTrajectory } from './player.js';

// PiĹ‚ka
export const ball = {
  x: 220,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 12,
  rotation: 0,
  spin: 0
};

export function resetBallToPlayer(player, GROUND_Y) {
  ball.x = player.x + (25 * player.facing);
  ball.y = GROUND_Y - ball.radius;
  ball.vx = player.vx;
  ball.vy = 0;
  ball.spin = 0;
}

export function updateBall(GROUND_Y) {
  ball.vy += CONFIG.GRAVITY;
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Odbicie i toczenie siÄ™ po trawie
  if (ball.y + ball.radius >= GROUND_Y) {
    ball.y = GROUND_Y - ball.radius;
    if (Math.abs(ball.vy) > 0.8) {
      ball.vy = -ball.vy * 0.58; // SprÄ™ĹĽyste odbicie od darni
    } else {
      ball.vy = 0;
    }
    ball.vx *= 0.985; // OpĂłr toczenia po trawie
    ball.spin *= 0.94;
    ball.rotation += (ball.vx * 0.08);
  } else {
    // W powietrzu
    ball.vx *= 0.998;
    ball.rotation += ball.spin + (ball.vx * 0.04);
    ball.spin *= 0.96;
  }
}

export function checkBallPlayerCollisions(player, GROUND_Y, spawnGrass) {
  const hipX = player.x + player.w / 2;
  const hipY = player.y + player.h - 40 + player.pelvisY;
  const speed = Math.abs(player.vx);

  // Pozycje nĂłg
  let fFrontTargetX, fFrontTargetY, fBackTargetX, fBackTargetY;

  if (player.isSliding) {
    fFrontTargetX = hipX + (46 * player.facing);
    fFrontTargetY = GROUND_Y - 4;
    fBackTargetX = hipX - (18 * player.facing);
    fBackTargetY = GROUND_Y - 3;
  } else if (player.gaitMode === 'IDLE' && !player.isJumping) {
    fFrontTargetX = hipX + (3 * player.facing);
    fFrontTargetY = GROUND_Y;
    fBackTargetX = hipX - (3 * player.facing);
    fBackTargetY = GROUND_Y;
  } else {
    const legBackTraj = getBiomechanicFootTrajectory(player.stridePhase + Math.PI, player.gaitMode, speed);
    const legFrontTraj = getBiomechanicFootTrajectory(player.stridePhase, player.gaitMode, speed);
    fBackTargetX = hipX + (legBackTraj.lx * player.facing);
    fBackTargetY = GROUND_Y + legBackTraj.ly;
    fFrontTargetX = hipX + (legFrontTraj.lx * player.facing);
    fFrontTargetY = GROUND_Y + legFrontTraj.ly;
  }

  const ikBack = solve2BoneIK(hipX - (2 * player.facing), hipY, fBackTargetX, fBackTargetY, player.thighLen, player.shinLen, player.facing);
  const ikFront = solve2BoneIK(hipX + (2 * player.facing), hipY, fFrontTargetX, fFrontTargetY, player.thighLen, player.shinLen, player.facing);

  // 1. Podbicie klinem we wĹ›lizgu
  if (player.isSliding) {
    const slideHit = distToSegment(ball.x, ball.y, hipX, hipY, fFrontTargetX, fFrontTargetY);
    if (slideHit.dist < ball.radius + 12) {
      const scoopPower = 7.8 + Math.abs(player.vx) * 0.45;
      ball.vy = -scoopPower;
      ball.vx = (player.facing * 3.2) + (player.vx * 0.45);
      ball.spin = player.facing * 0.6;
      ball.y = Math.min(ball.y, GROUND_Y - ball.radius - 8);
      if (spawnGrass) {
        spawnGrass(ball.x, GROUND_Y, player.facing);
      }
    }
  } else {
    // Normalne zderzenia z nogami (drybling i odbicia z ziemi i powietrza)
    resolveSegmentCollision(ball, hipX, hipY, ikBack.kneeX, ikBack.kneeY, 7.5, player.vx, player.vy, player.vx, player.vy, 0.55, 0.4);
    resolveSegmentCollision(ball, ikBack.kneeX, ikBack.kneeY, ikBack.footX, ikBack.footY, 8.5, player.vx, player.vy, player.vx, player.vy, 0.65, 0.45);
    resolveSegmentCollision(ball, hipX, hipY, ikFront.kneeX, ikFront.kneeY, 7.5, player.vx, player.vy, player.vx, player.vy, 0.55, 0.4);
    resolveSegmentCollision(ball, ikFront.kneeX, ikFront.kneeY, ikFront.footX, ikFront.footY, 8.5, player.vx, player.vy, player.vx, player.vy, 0.65, 0.45);
  }

  // 2. Aktywny wykop
  if ((player.kickState === 'SWING' || player.kickBufferTimer > 0) && !player.hitThisSwing) {
    const footReach = player.thighLen + player.shinLen;
    const kAngle = player.kickState === 'SWING' ? player.kickAngle : 0.6;
    const kFootX = hipX + Math.sin(kAngle) * footReach * player.facing;
    const kFootY = hipY + Math.cos(kAngle) * footReach;

    const dFoot = Math.hypot(ball.x - kFootX, ball.y - kFootY);
    if (dFoot < ball.radius + 20) {
      player.hitThisSwing = true;
      player.kickBufferTimer = 0;
      const kickPower = 7.2 + (player.chargePower * 7.5);
      ball.vx = (player.facing * 2.8) + (player.vx * 0.6);
      ball.vy = -kickPower;
      ball.spin = player.facing * 0.5;
      player.chargePower = 0;
    }
  }
}

export function drawBall(ctx) {
  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.rotate(ball.rotation);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#222';
  for (let a = 0; a < 3; a++) {
    ctx.beginPath();
    ctx.arc(Math.cos(a * 2.1) * 5, Math.sin(a * 2.1) * 5, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}