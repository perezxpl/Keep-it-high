// =========================================================================
// BOT.JS - SZTUCZNA INTELIGENCJA PRZECIWNIKA (AI CASUAL / INTERMEDIATE)
// =========================================================================

import { createPlayerInstance, updatePlayer, executeReleaseKick, playerSlide } from './player.js?v=v75_fabric_folds';
import { CLASSES } from './classes/index.js?v=v75_fabric_folds';
import { START_X, CONFIG } from './config.js';
import { WEAPONS, shootWeapon } from './weapons.js?v=v75_fabric_folds';

/**
 * Wirtualny kontroler bota przekazywany do silnika fizyki updatePlayer
 */
export const botKeys = {
  left: false,
  right: false,
  up: false,
  down: false,
  space: false,
  slide: false
};

/**
 * Instancja drugiego gracza kontrolowanego przez AI
 */
export const bot = createPlayerInstance({
  isBot: true,
  active: false,
  frozen: false, // Flaga zamrożenia bota w miejscu (Standstill)
  facing: -1,
  x: START_X + 600,
  y: 0,
  w: 24,
  h: 70,
  dropThroughTimer: 0,
  currentClass: CLASSES.STRIKER || CLASSES.RAPTOR,

  // Pola walki
  hp: 100,
  maxHp: 100,
  currentWeapon: WEAPONS.AK47,
  shootCooldown: 0,
  isDead: false,
  respawnTimer: 0,
  deathTilt: 0,
  deathRotVel: 0,
  isSettled: false,
  pelvisY: 0,
  burstShotsRemaining: 0,
  burstPauseTimer: 0,

  // Pola wewnętrzne sztucznego mózgu
  decisionTimer: 0,
  aimErrorAngle: 0,
  strafeTimer: 0,
  strafeDir: 0,
  chargeTarget: 0.55,
  idleDecisionTimer: 0,
  crouchTimer: 0
});

/**
 * Główna pętla sztucznej inteligencji bota (reakcje, taktyka, celowanie, fizyka)
 */
export function updateBotBrain(ball, humanPlayer, groundY, spawnGrass) {
  if (!bot.active) return;

  // Obsługa stanu śmierci oraz rozpuszczania w kwasie
  if (bot.isDead || bot.isAcidDying || (bot.acidDeath && bot.acidDeath.active)) {
    botKeys.left = false;
    botKeys.right = false;
    botKeys.up = false;
    botKeys.down = false;
    botKeys.space = false;
    botKeys.slide = false;
    bot.isShooting = false;
    bot.isCharging = false;
    bot.isJumpCharging = false;
    updatePlayer(botKeys, null, groundY, ball, spawnGrass, bot, [humanPlayer]);
    return;
  }

  // Obsługa oszołomienia po Spartan Kick
  if (bot.staggerTimer > 0) {
    botKeys.left = false;
    botKeys.right = false;
    botKeys.up = false;
    botKeys.down = false;
    botKeys.space = false;
    botKeys.slide = false;
    bot.isShooting = false;
    bot.isCharging = false;
    bot.decisionTimer = 0;
    bot.shootPoseTimer = 0;
    updatePlayer(botKeys, null, groundY, ball, spawnGrass, bot, [humanPlayer]);
    return;
  }

  // =========================================================================
  // TRYB ZATRZYMANIA W MIEJSCU (BOT FROZEN / STANDSTILL)
  // =========================================================================
  if (bot.frozen) {
    botKeys.left = false;
    botKeys.right = false;
    botKeys.up = false;
    botKeys.down = false;
    botKeys.space = false;
    botKeys.slide = false;
    bot.vx = 0;
    bot.airVx = 0;
    bot.isShooting = false;
    bot.isCharging = false;
    bot.shootPoseTimer = 0;
    updatePlayer(botKeys, null, groundY, ball, spawnGrass, bot, [humanPlayer]);
    return;
  }

  const botCenterX = bot.x + bot.w / 2;
  const botCenterY = bot.y + bot.h / 2;

  // Dekrementacja timerów decyzyjnych i strzeleckich
  if (bot.burstPauseTimer > 0) bot.burstPauseTimer--;
  if (bot.decisionTimer > 0) bot.decisionTimer--;
  if (bot.strafeTimer > 0) bot.strafeTimer--;
  if (bot.idleDecisionTimer > 0) bot.idleDecisionTimer--;
  if (bot.crouchTimer > 0) {
    bot.crouchTimer--;
    if (bot.crouchTimer <= 0) botKeys.down = false;
  }

  // =========================================================================
  // 1. WYBÓR BRONI NA BAZIE DYSTANSU DO GRACZA
  // =========================================================================
  const distToPlayer = humanPlayer ? Math.hypot((humanPlayer.x + humanPlayer.w / 2) - botCenterX, (humanPlayer.y + humanPlayer.h / 2) - botCenterY) : Infinity;

  if (distToPlayer < 180) {
    bot.currentWeapon = WEAPONS.SHOTGUN;
  } else if (distToPlayer > 480) {
    bot.currentWeapon = WEAPONS.SNIPER;
  } else {
    bot.currentWeapon = WEAPONS.AK47;
  }

  // =========================================================================
  // 2. CZAS REAKCJI I TAKTYCZNA MASZYNA STANÓW (Human Flaws: 6-10 klatek ~ 100-160ms)
  // =========================================================================
  if (bot.decisionTimer <= 0) {
    bot.decisionTimer = Math.floor(Math.random() * 5 + 6);

    // Dynamiczny błąd kąta celowania (losowy szum ±6° do ±14°)
    const errorDeg = (6 + Math.random() * 8) * (Math.random() < 0.5 ? -1 : 1);
    bot.aimErrorAngle = errorDeg * (Math.PI / 180);

    // Przewidywany punkt celu (piłka w trybie meczowym, przeciwnik w trybie Deathmatch)
    const hasBall = (ball && ball.active);
    let targetX;
    if (hasBall) {
      const predOffset = Math.sin(performance.now() * 0.002) * 20;
      targetX = ball.x + (ball.vx * 12) + predOffset;
    } else if (humanPlayer && !humanPlayer.isDead) {
      targetX = humanPlayer.x + humanPlayer.w / 2;
    } else {
      targetX = botCenterX;
    }

    // Martwa strefa (deadzone): nie szarp lewo-prawo, gdy cel jest blisko w poziomie
    const diffX = targetX - botCenterX;
    if (Math.abs(diffX) < 35) {
      botKeys.left = false;
      botKeys.right = false;
    } else if (diffX > 0) {
      botKeys.right = true;
      botKeys.left = false;
    } else {
      botKeys.left = true;
      botKeys.right = false;
    }

    // Nawigacja wertykalna: wspinaczka i zeskok
    const targetY = (hasBall && ball.y < groundY - 20) ? ball.y : (humanPlayer ? humanPlayer.y : groundY);

    // Cel znajduje się wyżej o > 50 px - skok na platformę lub rampę
    if (targetY < bot.y - 50) {
      if (!bot.isJumping && !bot.isSliding) {
        botKeys.up = true;
      }
    }

    // Cel znajduje się niżej o > 70 px - zeskok z kładki (drop-through)
    if (targetY > bot.y + 70) {
      if (bot.y < groundY - bot.h - 10) {
        bot.dropThroughTimer = 16;
      }
    }

    // Wślizg (Soldat Tackle)
    if (hasBall) {
      const ballSpeed = Math.hypot(ball.vx, ball.vy);
      const dxToBall = ball.x - botCenterX;
      const isBallMovingTowardsBot = (ball.vx * dxToBall < 0);
      const distToBallX = Math.abs(dxToBall);

      if (distToBallX >= 60 && distToBallX <= 110 && Math.abs(bot.vx) > 3.0 && (ballSpeed > 3.0 || isBallMovingTowardsBot)) {
        if (Math.random() < 0.40) {
          playerSlide(spawnGrass, groundY, bot);
        }
      }
    } else if (humanPlayer && !humanPlayer.isDead) {
      // W trybie Deathmatch: wślizg powalający w stronę gracza
      const dxToEnemy = (humanPlayer.x + humanPlayer.w / 2) - botCenterX;
      const distToEnemyX = Math.abs(dxToEnemy);
      if (distToEnemyX >= 50 && distToEnemyX <= 120 && Math.abs(bot.vx) > 3.2 && (bot.vx * dxToEnemy > 0)) {
        if (Math.random() < 0.35) {
          playerSlide(spawnGrass, groundY, bot);
        }
      }
    }
  }

  // =========================================================================
  // 3. STRAFE BOJOWY I ZACHOWANIA IDLE
  // =========================================================================
  const distToBallTotal = (ball && ball.active) ? Math.hypot(ball.x - botCenterX, ball.y - botCenterY) : Infinity;

  if (distToBallTotal > 260) {
    if (bot.idleDecisionTimer <= 0) {
      bot.idleDecisionTimer = Math.floor(Math.random() * 60 + 60);

      const roll = Math.random();
      if (roll < 0.40) {
        bot.strafeDir = Math.random() < 0.5 ? -1 : 1;
        bot.strafeTimer = Math.floor(Math.random() * 16 + 12);
      } else if (roll < 0.65) {
        if (!bot.isJumping && !bot.isSliding) {
          botKeys.up = true;
        }
      } else if (roll < 0.80) {
        botKeys.down = true;
        bot.crouchTimer = Math.floor(Math.random() * 20 + 10);
      }
    }

    if (bot.strafeTimer > 0) {
      if (bot.strafeDir > 0) {
        botKeys.right = true;
        botKeys.left = false;
      } else if (bot.strafeDir < 0) {
        botKeys.left = true;
        botKeys.right = false;
      }
    }
  }

  // =========================================================================
  // 4. CELOWANIE Z LUDZKIM BŁĘDEM (LERP + SZUM KĄTOWY)
  // =========================================================================
  const hitReach = bot.currentClass?.stats?.hitReach || 56;
  const hipX = botCenterX;
  const hipY = bot.y + bot.h - 40 + (bot.pelvisY || 0);
  const ballDistFromHip = (ball && ball.active) ? Math.hypot(ball.x - hipX, ball.y - hipY) : Infinity;

  let aimTargetX, aimTargetY;
  if (ball && ball.active) {
    aimTargetX = ball.x + (ball.vx * 3);
    aimTargetY = ball.y + (ball.vy * 3);
    if (humanPlayer && !humanPlayer.isDead && (ballDistFromHip > hitReach + 20 || distToBallTotal > 160)) {
      aimTargetX = humanPlayer.x + humanPlayer.w / 2;
      aimTargetY = humanPlayer.y + humanPlayer.h / 2;
    }
  } else if (humanPlayer && !humanPlayer.isDead) {
    aimTargetX = humanPlayer.x + humanPlayer.w / 2;
    aimTargetY = humanPlayer.y + humanPlayer.h / 2;
  } else {
    aimTargetX = botCenterX + (bot.facing || 1) * 160;
    aimTargetY = botCenterY;
  }

  const dxAim = aimTargetX - botCenterX;
  const dyAim = aimTargetY - botCenterY;
  const baseAngle = Math.atan2(dyAim, dxAim);
  const finalAimAngle = baseAngle + (bot.aimErrorAngle || 0);

  const aimDist = 160;
  const desiredAimX = botCenterX + Math.cos(finalAimAngle) * aimDist;
  const desiredAimY = botCenterY + Math.sin(finalAimAngle) * aimDist;

  if (typeof bot.aimX !== 'number' || isNaN(bot.aimX)) bot.aimX = desiredAimX;
  if (typeof bot.aimY !== 'number' || isNaN(bot.aimY)) bot.aimY = desiredAimY;

  bot.aimX += (desiredAimX - bot.aimX) * 0.15;
  bot.aimY += (desiredAimY - bot.aimY) * 0.15;

  // =========================================================================
  // 5. OSTRZAŁ BOTA
  // =========================================================================
  if (humanPlayer && !humanPlayer.isDead) {
    const playerCenterX = humanPlayer.x + humanPlayer.w / 2;
    const playerCenterY = humanPlayer.y + humanPlayer.h / 2;
    const shooterOriginY = bot.y + 20;

    const angleToPlayer = Math.atan2(playerCenterY - shooterOriginY, playerCenterX - botCenterX);
    const currentAimAngle = Math.atan2(bot.aimY - shooterOriginY, bot.aimX - botCenterX);

    let angleDiff = Math.abs(currentAimAngle - angleToPlayer);
    while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

    const toleranceRad = (bot.currentWeapon === WEAPONS.SNIPER ? 12 : 18) * (Math.PI / 180);
    const isAimedAtPlayer = angleDiff <= toleranceRad;

    if (isAimedAtPlayer) {
      bot.shootPoseTimer = Math.max(bot.shootPoseTimer || 0, 25);
      if (bot.currentWeapon === WEAPONS.AK47) {
        if (bot.burstShotsRemaining > 0) {
          if (bot.shootCooldown <= 0) {
            shootWeapon(bot, bot.currentWeapon);
            bot.burstShotsRemaining--;
            if (bot.burstShotsRemaining <= 0) {
              bot.burstPauseTimer = 25;
            }
          }
        } else if (bot.burstPauseTimer <= 0 && bot.shootCooldown <= 0) {
          bot.burstShotsRemaining = Math.floor(Math.random() * 2) + 3;
          shootWeapon(bot, bot.currentWeapon);
          bot.burstShotsRemaining--;
        }
      } else if (bot.currentWeapon === WEAPONS.SHOTGUN) {
        if (distToPlayer < 180 && bot.shootCooldown <= 0) {
          shootWeapon(bot, bot.currentWeapon);
        }
      } else if (bot.currentWeapon === WEAPONS.SNIPER) {
        if (bot.shootCooldown <= 0) {
          shootWeapon(bot, bot.currentWeapon);
        }
      }
    }
  }

  // =========================================================================
  // 6. KOPANIE PIŁKI I SPARTAN MELEE KICK
  // =========================================================================
  if (ball && ball.active) {
    if (ballDistFromHip <= hitReach + 10) {
      if (!bot.isCharging && bot.kickState === 'IDLE' && bot.kickCooldown <= 0) {
        bot.isCharging = true;
        bot.chargePower = 0;
        bot.chargeTarget = Math.random() * 0.55 + 0.30;
      } else if (bot.isCharging) {
        if (bot.chargePower >= bot.chargeTarget) {
          executeReleaseKick(ball, bot);
        }
      }
    } else if (bot.isCharging) {
      if (bot.chargePower >= bot.chargeTarget || ballDistFromHip > hitReach + 40) {
        executeReleaseKick(ball, bot, 0, [humanPlayer]);
      }
    }
  } else if (humanPlayer && !humanPlayer.isDead) {
    // Tryb Deathmatch: Spartan Kick wręcz w gracza
    const distToEnemyFromHip = Math.hypot((humanPlayer.x + humanPlayer.w / 2) - hipX, (humanPlayer.y + humanPlayer.h / 2) - hipY);
    if (distToEnemyFromHip <= hitReach + 20) {
      if (!bot.isCharging && bot.kickState === 'IDLE' && bot.kickCooldown <= 0) {
        bot.isCharging = true;
        bot.chargePower = 0;
        bot.chargeTarget = Math.random() * 0.40 + 0.45;
      } else if (bot.isCharging) {
        if (bot.chargePower >= bot.chargeTarget) {
          executeReleaseKick(null, bot, 0, [humanPlayer]);
        }
      }
    } else if (bot.isCharging) {
      executeReleaseKick(null, bot, 0, [humanPlayer]);
    }
  }

  // =========================================================================
  // 7. WYWOŁANIE FIZYKI POSTACI
  // =========================================================================
  updatePlayer(botKeys, null, groundY, ball, spawnGrass, bot, [humanPlayer]);
}
