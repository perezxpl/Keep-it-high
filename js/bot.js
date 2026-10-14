// =========================================================================
// BOT.JS - SZTUCZNA INTELIGENCJA PRZECIWNIKA (AI CASUAL / INTERMEDIATE)
// =========================================================================

import { createPlayerInstance, updatePlayer, executeReleaseKick, playerSlide } from './player.js';
import { CLASSES } from './classes/index.js';
import { START_X, CONFIG } from './config.js';
import { WEAPONS, shootWeapon } from './weapons.js';

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

export const BOT_PROFILES = [
  { name: 'SGT. STRIKER', classKey: 'STRIKER', weapon: WEAPONS.AK47, facing: -1 },
  { name: 'CPL. RAPTOR', classKey: 'RAPTOR', weapon: WEAPONS.SNIPER, facing: -1 },
  { name: 'LT. ENFORCER', classKey: 'ENFORCER', weapon: WEAPONS.SHOTGUN, facing: 1 },
  { name: 'PVT. VIPER', classKey: 'STRIKER', weapon: WEAPONS.AK47, facing: -1 },
  { name: 'MAJ. TITAN', classKey: 'ENFORCER', weapon: WEAPONS.SHOTGUN, facing: 1 }
];

export function createBotInstance(index = 0) {
  const profile = BOT_PROFILES[index % BOT_PROFILES.length];
  const botClass = (CLASSES && CLASSES[profile.classKey]) ? CLASSES[profile.classKey] : (CLASSES?.STRIKER || CLASSES?.RAPTOR);
  const instanceKeys = (index === 0) ? botKeys : { left: false, right: false, up: false, down: false, space: false, slide: false };

  const instance = createPlayerInstance({
    isBot: true,
    active: (index === 0),
    frozen: false,
    facing: profile.facing || -1,
    x: START_X + 600 + (index * 80),
    y: 0,
    w: 24,
    h: 70,
    dropThroughTimer: 0,
    currentClass: botClass,
    name: profile.name,
    id: `bot_${index + 1}`,

    hp: botClass?.stats?.hp || 100,
    maxHp: botClass?.stats?.hp || 100,
    currentWeapon: profile.weapon || WEAPONS.AK47,
    shootCooldown: 0,
    isDead: false,
    respawnTimer: 0,
    deathTilt: 0,
    deathRotVel: 0,
    isSettled: false,
    pelvisY: 0,
    burstShotsRemaining: 0,
    burstPauseTimer: 0,

    difficulty: 'recruit',
    decisionTimer: 0,
    aimErrorAngle: 0,
    strafeTimer: 0,
    strafeDir: 0,
    chargeTarget: 0.55,
    idleDecisionTimer: 0,
    crouchTimer: 0,
    botKeys: instanceKeys
  });
  return instance;
}

/**
 * Główna instancja bota (Bot 1) dla 100% kompatybilności wstecznej
 */
export const bot = createBotInstance(0);

/**
 * Tablica wszystkich instancji botów
 */
export const bots = [bot];

export let botCount = 1;

export function setBotCount(count) {
  const num = Math.max(1, Math.min(5, parseInt(count, 10) || 1));
  botCount = num;
  while (bots.length < num) {
    bots.push(createBotInstance(bots.length));
  }
  for (let i = 0; i < bots.length; i++) {
    bots[i].active = (i < num);
  }
  try {
    localStorage.setItem('kih_bot_count_v1', String(num));
  } catch (_) {}
  return botCount;
}

export function getBotCount() {
  try {
    const stored = localStorage.getItem('kih_bot_count_v1');
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (parsed >= 1 && parsed <= 5) {
        botCount = parsed;
        return parsed;
      }
    }
  } catch (_) {}
  return botCount;
}

export function getActiveBots() {
  while (bots.length < botCount) {
    bots.push(createBotInstance(bots.length));
  }
  return bots.slice(0, botCount).filter(b => b.active);
}

export function setBotDifficulty(diff) {
  const d = (diff === 'veteran') ? 'veteran' : 'recruit';
  bots.forEach(b => { b.difficulty = d; });
}

/**
 * Główna pętla sztucznej inteligencji bota (reakcje, taktyka, celowanie, fizyka)
 */
export function updateBotBrain(ball, humanPlayer, groundY, spawnGrass, botTarget = bot, allCombatants = null) {
  if (!botTarget || !botTarget.active) return;
  const bKeys = botTarget.botKeys || botKeys;

  // Wyszukanie wrogiego celu do ataku (najbliższy przeciwnik)
  let targetEnemy = (humanPlayer && !humanPlayer.isDead) ? humanPlayer : null;
  if (Array.isArray(allCombatants) && allCombatants.length > 0) {
    let closestDist = Infinity;
    let closestCand = null;
    const botMidX = botTarget.x + botTarget.w / 2;
    const botMidY = botTarget.y + botTarget.h / 2;

    for (const c of allCombatants) {
      if (!c || c === botTarget || c.isDead || (c.isBot && !c.active)) continue;
      // W trybie drużynowym (TDM) sojusznicy z tej samej drużyny nie są celem
      if (botTarget.team && c.team && botTarget.team === c.team) continue;
      const d = Math.hypot((c.x + c.w / 2) - botMidX, (c.y + c.h / 2) - botMidY);
      if (d < closestDist) {
        closestDist = d;
        closestCand = c;
      }
    }
    if (closestCand) {
      targetEnemy = closestCand;
    }
  }

  const meleeTargets = targetEnemy ? [targetEnemy] : (humanPlayer ? [humanPlayer] : []);

  // Obsługa stanu śmierci oraz rozpuszczania w kwasie
  if (botTarget.isDead || botTarget.isAcidDying || (botTarget.acidDeath && botTarget.acidDeath.active)) {
    bKeys.left = false;
    bKeys.right = false;
    bKeys.up = false;
    bKeys.down = false;
    bKeys.space = false;
    bKeys.slide = false;
    botTarget.isShooting = false;
    botTarget.isCharging = false;
    botTarget.isJumpCharging = false;
    updatePlayer(bKeys, null, groundY, ball, spawnGrass, botTarget, meleeTargets);
    return;
  }

  // Obsługa oszołomienia po Spartan Kick
  if (botTarget.staggerTimer > 0) {
    bKeys.left = false;
    bKeys.right = false;
    bKeys.up = false;
    bKeys.down = false;
    bKeys.space = false;
    bKeys.slide = false;
    botTarget.isShooting = false;
    botTarget.isCharging = false;
    botTarget.decisionTimer = 0;
    botTarget.shootPoseTimer = 0;
    updatePlayer(bKeys, null, groundY, ball, spawnGrass, botTarget, meleeTargets);
    return;
  }

  // =========================================================================
  // TRYB ZATRZYMANIA W MIEJSCU (BOT FROZEN / STANDSTILL)
  // =========================================================================
  if (botTarget.frozen) {
    bKeys.left = false;
    bKeys.right = false;
    bKeys.up = false;
    bKeys.down = false;
    bKeys.space = false;
    bKeys.slide = false;
    botTarget.vx = 0;
    botTarget.airVx = 0;
    botTarget.isShooting = false;
    botTarget.isCharging = false;
    botTarget.shootPoseTimer = 0;
    updatePlayer(bKeys, null, groundY, ball, spawnGrass, botTarget, meleeTargets);
    return;
  }

  const botCenterX = botTarget.x + botTarget.w / 2;
  const botCenterY = botTarget.y + botTarget.h / 2;

  // Dekrementacja timerów decyzyjnych i strzeleckich
  if (botTarget.burstPauseTimer > 0) botTarget.burstPauseTimer--;
  if (botTarget.decisionTimer > 0) botTarget.decisionTimer--;
  if (botTarget.strafeTimer > 0) botTarget.strafeTimer--;
  if (botTarget.idleDecisionTimer > 0) botTarget.idleDecisionTimer--;
  if (botTarget.crouchTimer > 0) {
    botTarget.crouchTimer--;
    if (botTarget.crouchTimer <= 0) bKeys.down = false;
  }

  // =========================================================================
  // 1. WYBÓR BRONI NA BAZIE DYSTANSU DO WROGA
  // =========================================================================
  const distToEnemy = targetEnemy ? Math.hypot((targetEnemy.x + targetEnemy.w / 2) - botCenterX, (targetEnemy.y + targetEnemy.h / 2) - botCenterY) : Infinity;

  if (distToEnemy < 180) {
    botTarget.currentWeapon = WEAPONS.SHOTGUN;
  } else if (distToEnemy > 480) {
    botTarget.currentWeapon = WEAPONS.SNIPER;
  } else {
    botTarget.currentWeapon = WEAPONS.AK47;
  }

  // =========================================================================
  // 2. CZAS REAKCJI I TAKTYCZNA MASZYNA STANÓW (Human Flaws: 6-10 klatek ~ 100-160ms)
  // =========================================================================
  if (botTarget.decisionTimer <= 0) {
    const isVeteran = (botTarget.difficulty === 'veteran');
    botTarget.decisionTimer = isVeteran ? Math.floor(Math.random() * 3 + 2) : Math.floor(Math.random() * 5 + 6);

    // Dynamiczny błąd kąta celowania (losowy szum: Rekrut ±6° do ±14°, Weteran ±2° do ±5°)
    const errorDeg = isVeteran ? ((2 + Math.random() * 3) * (Math.random() < 0.5 ? -1 : 1)) : ((6 + Math.random() * 8) * (Math.random() < 0.5 ? -1 : 1));
    botTarget.aimErrorAngle = errorDeg * (Math.PI / 180);

    // Przewidywany punkt celu (piłka w trybie meczowym, wróg w trybie bojowym)
    const hasBall = (ball && ball.active);
    let targetX;
    if (hasBall) {
      const predOffset = Math.sin(performance.now() * 0.002) * 20;
      targetX = ball.x + (ball.vx * 12) + predOffset;
    } else if (targetEnemy && !targetEnemy.isDead) {
      targetX = targetEnemy.x + targetEnemy.w / 2;
    } else {
      targetX = botCenterX;
    }

    // Martwa strefa (deadzone): nie szarp lewo-prawo, gdy cel jest blisko w poziomie
    const diffX = targetX - botCenterX;
    if (Math.abs(diffX) < 35) {
      bKeys.left = false;
      bKeys.right = false;
    } else if (diffX > 0) {
      bKeys.right = true;
      bKeys.left = false;
    } else {
      bKeys.left = true;
      bKeys.right = false;
    }

    // Nawigacja wertykalna: wspinaczka i zeskok
    const targetY = (hasBall && ball.y < groundY - 20) ? ball.y : (targetEnemy ? targetEnemy.y : groundY);

    // Cel znajduje się wyżej o > 50 px - skok na platformę lub rampę
    if (targetY < botTarget.y - 50) {
      if (!botTarget.isJumping && !botTarget.isSliding) {
        bKeys.up = true;
      }
    }

    // Cel znajduje się niżej o > 70 px - zeskok z kładki (drop-through)
    if (targetY > botTarget.y + 70) {
      if (botTarget.onGround && botTarget.currentPlatform && (botTarget.currentPlatform.oneWay || botTarget.currentPlatform.isDropThrough || botTarget.currentPlatform.type === 'catwalk' || botTarget.currentPlatform.type === 'cyber_catwalk')) {
        botTarget.dropThroughTimer = 20;
        botTarget.dropThroughPlatform = botTarget.currentPlatform;
        const platThick = botTarget.currentPlatform.thickness || botTarget.currentPlatform.h || 20;
        botTarget.y += platThick + 12;
        botTarget.currentPlatform = null;
        botTarget.onGround = false;
        botTarget.isJumping = true;
        botTarget.vy = Math.max(botTarget.vy || 0, 4.2);
      }
    }

    // Wślizg (Soldat Tackle)
    if (hasBall) {
      const ballSpeed = Math.hypot(ball.vx, ball.vy);
      const dxToBall = ball.x - botCenterX;
      const isBallMovingTowardsBot = (ball.vx * dxToBall < 0);
      const distToBallX = Math.abs(dxToBall);

      if (distToBallX >= 60 && distToBallX <= 110 && Math.abs(botTarget.vx) > 3.0 && (ballSpeed > 3.0 || isBallMovingTowardsBot)) {
        if (Math.random() < 0.40) {
          playerSlide(spawnGrass, groundY, botTarget);
        }
      }
    } else if (targetEnemy && !targetEnemy.isDead) {
      // W trybie bojowym: wślizg powalający w stronę wroga
      const dxToEnemy = (targetEnemy.x + targetEnemy.w / 2) - botCenterX;
      const distToEnemyX = Math.abs(dxToEnemy);
      if (distToEnemyX >= 50 && distToEnemyX <= 120 && Math.abs(botTarget.vx) > 3.2 && (botTarget.vx * dxToEnemy > 0)) {
        if (Math.random() < 0.35) {
          playerSlide(spawnGrass, groundY, botTarget);
        }
      }
    }
  }

  // =========================================================================
  // 3. STRAFE BOJOWY I ZACHOWANIA IDLE
  // =========================================================================
  const distToBallTotal = (ball && ball.active) ? Math.hypot(ball.x - botCenterX, ball.y - botCenterY) : Infinity;

  if (distToBallTotal > 260) {
    if (botTarget.idleDecisionTimer <= 0) {
      botTarget.idleDecisionTimer = Math.floor(Math.random() * 60 + 60);

      const roll = Math.random();
      if (roll < 0.40) {
        botTarget.strafeDir = Math.random() < 0.5 ? -1 : 1;
        botTarget.strafeTimer = Math.floor(Math.random() * 16 + 12);
      } else if (roll < 0.65) {
        if (!botTarget.isJumping && !botTarget.isSliding) {
          bKeys.up = true;
        }
      } else if (roll < 0.80) {
        bKeys.down = true;
        botTarget.crouchTimer = Math.floor(Math.random() * 20 + 10);
      }
    }

    if (botTarget.strafeTimer > 0) {
      if (botTarget.strafeDir > 0) {
        bKeys.right = true;
        bKeys.left = false;
      } else if (botTarget.strafeDir < 0) {
        bKeys.left = true;
        bKeys.right = false;
      }
    }
  }

  // =========================================================================
  // 4. CELOWANIE Z LUDZKIM BŁĘDEM (LERP + SZUM KĄTOWY)
  // =========================================================================
  const hitReach = botTarget.currentClass?.stats?.hitReach || 56;
  const hipX = botCenterX;
  const hipY = botTarget.y + botTarget.h - 40 + (botTarget.pelvisY || 0);
  const ballDistFromHip = (ball && ball.active) ? Math.hypot(ball.x - hipX, ball.y - hipY) : Infinity;

  let aimTargetX, aimTargetY;
  if (ball && ball.active) {
    aimTargetX = ball.x + (ball.vx * 3);
    aimTargetY = ball.y + (ball.vy * 3);
    if (targetEnemy && !targetEnemy.isDead && (ballDistFromHip > hitReach + 20 || distToBallTotal > 160)) {
      aimTargetX = targetEnemy.x + targetEnemy.w / 2;
      aimTargetY = targetEnemy.y + targetEnemy.h / 2;
    }
  } else if (targetEnemy && !targetEnemy.isDead) {
    aimTargetX = targetEnemy.x + targetEnemy.w / 2;
    aimTargetY = targetEnemy.y + targetEnemy.h / 2;
  } else {
    aimTargetX = botCenterX + (botTarget.facing || 1) * 160;
    aimTargetY = botCenterY;
  }

  const dxAim = aimTargetX - botCenterX;
  const dyAim = aimTargetY - botCenterY;
  const baseAngle = Math.atan2(dyAim, dxAim);
  const finalAimAngle = baseAngle + (botTarget.aimErrorAngle || 0);

  const aimDist = 160;
  const desiredAimX = botCenterX + Math.cos(finalAimAngle) * aimDist;
  const desiredAimY = botCenterY + Math.sin(finalAimAngle) * aimDist;

  if (typeof botTarget.aimX !== 'number' || isNaN(botTarget.aimX)) botTarget.aimX = desiredAimX;
  if (typeof botTarget.aimY !== 'number' || isNaN(botTarget.aimY)) botTarget.aimY = desiredAimY;

  botTarget.aimX += (desiredAimX - botTarget.aimX) * 0.15;
  botTarget.aimY += (desiredAimY - botTarget.aimY) * 0.15;

  // =========================================================================
  // 5. OSTRZAŁ BOTA
  // =========================================================================
  if (targetEnemy && !targetEnemy.isDead) {
    const enemyCenterX = targetEnemy.x + targetEnemy.w / 2;
    const enemyCenterY = targetEnemy.y + targetEnemy.h / 2;
    const shooterOriginY = botTarget.y + 20;

    const angleToEnemy = Math.atan2(enemyCenterY - shooterOriginY, enemyCenterX - botCenterX);
    const currentAimAngle = Math.atan2(botTarget.aimY - shooterOriginY, botTarget.aimX - botCenterX);

    let angleDiff = Math.abs(currentAimAngle - angleToEnemy);
    while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

    const toleranceRad = (botTarget.currentWeapon === WEAPONS.SNIPER ? 12 : 18) * (Math.PI / 180);
    const isAimedAtEnemy = angleDiff <= toleranceRad;

    if (isAimedAtEnemy) {
      botTarget.shootPoseTimer = Math.max(botTarget.shootPoseTimer || 0, 25);
      if (botTarget.currentWeapon === WEAPONS.AK47) {
        if (botTarget.burstShotsRemaining > 0) {
          if (botTarget.shootCooldown <= 0) {
            shootWeapon(botTarget, botTarget.currentWeapon);
            botTarget.burstShotsRemaining--;
            if (botTarget.burstShotsRemaining <= 0) {
              botTarget.burstPauseTimer = 25;
            }
          }
        } else if (botTarget.burstPauseTimer <= 0 && botTarget.shootCooldown <= 0) {
          botTarget.burstShotsRemaining = Math.floor(Math.random() * 2) + 3;
          shootWeapon(botTarget, botTarget.currentWeapon);
          botTarget.burstShotsRemaining--;
        }
      } else if (botTarget.currentWeapon === WEAPONS.SHOTGUN) {
        if (distToEnemy < 180 && botTarget.shootCooldown <= 0) {
          shootWeapon(botTarget, botTarget.currentWeapon);
        }
      } else if (botTarget.currentWeapon === WEAPONS.SNIPER) {
        if (botTarget.shootCooldown <= 0) {
          shootWeapon(botTarget, botTarget.currentWeapon);
        }
      }
    }
  }

  // =========================================================================
  // 6. KOPANIE PIŁKI I SPARTAN MELEE KICK
  // =========================================================================
  if (ball && ball.active) {
    if (ballDistFromHip <= hitReach + 10) {
      if (!botTarget.isCharging && botTarget.kickState === 'IDLE' && botTarget.kickCooldown <= 0) {
        botTarget.isCharging = true;
        botTarget.chargePower = 0;
        botTarget.chargeTarget = Math.random() * 0.55 + 0.30;
      } else if (botTarget.isCharging) {
        if (botTarget.chargePower >= botTarget.chargeTarget) {
          executeReleaseKick(ball, botTarget);
        }
      }
    } else if (botTarget.isCharging) {
      if (botTarget.chargePower >= botTarget.chargeTarget || ballDistFromHip > hitReach + 40) {
        executeReleaseKick(ball, botTarget, 0, meleeTargets);
      }
    }
  } else if (targetEnemy && !targetEnemy.isDead) {
    // Tryb Deathmatch: Spartan Kick wręcz we wroga
    const distToEnemyFromHip = Math.hypot((targetEnemy.x + targetEnemy.w / 2) - hipX, (targetEnemy.y + targetEnemy.h / 2) - hipY);
    if (distToEnemyFromHip <= hitReach + 20) {
      if (!botTarget.isCharging && botTarget.kickState === 'IDLE' && botTarget.kickCooldown <= 0) {
        botTarget.isCharging = true;
        botTarget.chargePower = 0;
        botTarget.chargeTarget = Math.random() * 0.40 + 0.45;
      } else if (botTarget.isCharging) {
        if (botTarget.chargePower >= botTarget.chargeTarget) {
          executeReleaseKick(null, botTarget, 0, meleeTargets);
        }
      }
    } else if (botTarget.isCharging) {
      executeReleaseKick(null, botTarget, 0, meleeTargets);
    }
  }

  // =========================================================================
  // 7. WYWOŁANIE FIZYKI POSTACI
  // =========================================================================
  updatePlayer(bKeys, null, groundY, ball, spawnGrass, botTarget, meleeTargets);
}
