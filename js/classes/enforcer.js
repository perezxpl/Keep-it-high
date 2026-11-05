// =========================================================================
// KLASA CIĘŻKA: ENFORCER – Kolos / Siła / Tłoki Pneumatyczne (Kinetic Pistons)
// Specjalność: Skok odpalany przy puszczeniu kierunku w górę (W / drążek).
//              Błyskawiczne sprężenie tłoków pneumatycznych (380ms) sprawia, że Enforcer
//              schodzi w głęboki siłowy przysiad (Power Squat), a w momencie puszczenia
//              kruszy ziemię pod butami i potężnym susem wybija się wysoko (bez ognia!).
//              W powietrzu: Tąpnięcie z powietrza (Ground Slam / Meteor Drop).
//              Pasywnie: Juggernaut Poise (-18% obrażeń podczas szarży, wślizgu i tąpnięcia).
// =========================================================================
import { triggerScreenShake, spawnGroundPuff, spawnBloodSpurt } from '../world.js';
import {
  spawnHeavySmokePuff,
  spawnShockwaveRing
} from '../particles.js';
import { getActiveArena } from '../arenas/index.js';
import { isDeathmatchFFA, deathmatchState } from '../deathmatch/index.js';

export const ENFORCER_BOMB_CHARGE_MS = 380; // Błyskawiczne sprężenie tłoków pneumatycznych (380ms) do pełnego wybicia

/**
 * Sprawdza, czy aktywna jest twarda postawa Juggernaut Poise (-18% obrażeń):
 * Redukuje obrażenia podczas sprintu w natarciu, wślizgu lub tąpnięcia z powietrza (Ground Slam).
 */
export function isEnforcerPoiseActive(p) {
  if (!p || p.currentClass?.id !== 'ENFORCER') return false;
  return !!(
    p.isGroundSlamming ||
    p.isSliding ||
    p.isSprinting ||
    p.sprintDuration > 10 ||
    Math.abs(p.vx || 0) > 3.2
  );
}

export function getEnforcerFlameColor(player) {
  if (player?.customVisuals?.jetpackColor) return player.customVisuals.jetpackColor;
  return '#38bdf8';
}

export function isEnforcerFirmlyGrounded(player) {
  if (!player || player.isJumping || player.isSliding || player.isAcidDying || (player.staggerTimer > 0) || ((player.staggerRecoveryTimer || 0) > 0)) return false;
  const a5 = (typeof window !== 'undefined' && window.arena5State) ? window.arena5State : null;
  const crane = a5?.crane;
  const isOnFallingCrane = !!(crane?.phase === 'FALLING' && player.onGround && player.currentGroundY);
  const craneVy = isOnFallingCrane ? (crane.vy || 0) : 0;
  const relVy = (player.vy || 0) - craneVy;
  return (
    (player.onGround && Math.abs(relVy) < 1.8) ||
    ((player.coyoteTimer || 0) > 0 && Math.abs(relVy) < 1.8)
  );
}

export const EnforcerClass = {
  id: 'ENFORCER',
  name: 'Enforcer',
  tier: 'HEAVY',
  role: 'Czołg / Siła',

  // 1. ANATOMIA SZKIELETU IK – Wyraźnie większa, masywna postura
  body: {
    w: 30,            // Szerszy hitbox korpusu (domyślnie 24)
    h: 74,            // Wyższy model kolosa (domyślnie 70)
    thighLen: 28,     // Długie, potężne kości udowe (domyślnie 25)
    shinLen: 26,      // Masywne podudzie (domyślnie 24)
    upperArmLen: 17,  // Długie, muskularne ramiona (domyślnie 14)
    forearmLen: 15    // Gruby, twardy szkielet przedramienia (domyślnie 13)
  },

  // 2. FIZYKA I KINETYKA CIĘŻKIEJ MASY (Klasa Ciężka: potężne HP 140, tytaniczna siła ciosu)
  stats: {
    hp: 140,                // Najtwardszy pancerz biologiczny i masa: 140 HP
    maxHp: 140,
    walkMax: 1.8,
    jogMax: 3.4,
    sprintMax: 5.6,
    accel: 0.15,            // Duża bezwładność przy ruszaniu
    decel: 0.88,            // Trudno go wyhamować
    slideDecel: 0.958,      // Ciężki wślizg taranujący z mocnym tarciem o grunt (zwarty, taranujący zasięg)
    jumpForce: 9.3,         // Podwyższony zwykły skok (umożliwia wskakiwanie na klocki 100px Areny 5)
    slideDashSpeed: 12.8,   // Zwarte, dynamiczne wbicie korków w darń zamiast nadmiernego wystrzału
    chargeSpeed: 0.024,
    hitReach: 64,           // Duży zasięg dzięki długości kończyn
    whiffReach: 94,
    baseKickSpeed: 30.0,
    kickPowerMult: 1.65,    // Najpotężniejsze uderzenie w grze
    spinMult: 0.30,         // Prawie czysta trajektoria balistyczna
    jetMax: 0,              // Brak plecaka odrzutowego (posiada Tłoki Pneumatyczne na łydkach)
    spartanKnockback: 19.0, // Potężny odrzut kinetyczny i twardy knockback
    spartanStagger: 28,     // Długi czas oszołomienia przeciwnika (~460ms)
    spartanDamage: 24,      // Druzgocący cios kolosa (24 pkt obrażeń)
    kickForce: 1.70,        // Najwyższa siła uderzenia wręcz i piłki
    kickForceMultiplier: 1.70,
    knockback: 1.65,
    knockbackMultiplier: 1.65,
    kickCooldown: 0.70
  },

  // 3. WŁAŚCIWOŚCI WIZUALNE: RZEŹBIONA ANATOMIA KOLOSA
  visuals: {
    sculptedMuscles: true,           // Aktywuje asymetryczne krzywe brzuśców mięśniowych
    muscleMult: 1.40,                // +40% do obwodów ramion, barków i nóg
    torsoStyle: 'sleeveless',        // Domyślny styl ubioru: bezrękawnik bojowy (tank-top)
    headgearStyle: 'marcus_bandana', // Domyślna chusta bojowa COG w stylu Marcusa Fenixa
    hasKineticPistons: true,         // Przemysłowe siłowniki pneumatyczne ze sprężyną na łydkach

    hasWristband: true,              // Jasny bandaż bokserski na dłoniach
    wristbandColor: '#f8fafc',       // Jasny bandaż bokserski kontrastujący z koszulką
    hasHeadband: false,

    hairColor0: '#09090b',
    hairColor1: '#18181b',
    hairColor2: '#27272a',

    shortsColor0: '#18181b',
    shortsColor1: '#27272a',
    shortsColor2: '#09090b',

    // Opalona, twarda karnacja z mocnym cieniowaniem
    skinLight: '#e0a96d',
    skinMid: '#c38143',
    skinDark: '#8c4e1a',
    skinBack: '#a7652c',

    // Surowa, taktyczna czerń bojowa PMC
    jerseyFront0: '#09090b',
    jerseyFront1: '#18181b',
    jerseyFront2: '#27272a',
    jerseyFront3: '#18181b',
    jerseyBack0: '#030712',
    jerseyBack1: '#09090b',
    jerseyBack2: '#030712',
    jerseyStripe: '#3f3f46',
    armColorFront: '#18181b',
    armColorBack: '#09090b',

    legThighFront: '#18181b',
    legShinFront: '#27272a',
    legThighBack: '#09090b',
    legShinBack: '#18181b',
    bootColor: '#18181b',
    bootBack: '#09090b',
    bootAccent: '#52525b',
    crestColor: '#71717a',
    seamColor: '#09090b',
    crosshairColor: '#ef4444',
    number: '99'
  },

  // 4. CYKL ŻYCIA I KINETYKA
  onInit(player) {
    player.jetFuel = 0;
    player.jetMax = 0;
    initBlastBeltState(player);
  },

  onDestroy(player) {
    if (player.blastBelt) {
      player.blastBelt.isCharging = false;
      player.blastBelt.isArmed = false;
    }
    player.isJumpCharging = false;
    player.jumpChargePower = 0;
  },

  onUpdate(player, ball, keys) {
    if (player.isGroundSlamming) {
      if (player.onGround) {
        executeEnforcerGroundSlamImpact(player);
        return;
      }
      player.vy = Math.max(player.vy, 24.0);
      player.vx *= 0.88;
      const cx = player.x + (player.w || 30) / 2;
      const cy = player.y + (player.h || 74);
      if (Math.random() < 0.45) {
        spawnHeavySmokePuff(cx, cy - 8, 4);
      }
    }
    const isFirmlyGrounded = isEnforcerFirmlyGrounded(player);
    if (!isFirmlyGrounded && player.blastBelt) {
      if (player.blastBelt.isCharging || player.isJumpCharging) {
        player.blastBelt.isCharging = false;
        player.blastBelt.chargeMs = 0;
        player.blastBelt.chargeRatio = 0;
        player.blastBelt.isArmed = false;
        player.isJumpCharging = false;
        player.jumpChargePower = 0;
      }
    }
    updateEnforcerBeltPhysics(player, ball);
  },

  onPrePhysics(player, keys) {},

  // Ciężkie tąpnięcie przy lądowaniu
  onPostPhysics(player) {
    if (player.isGroundSlamming) {
      executeEnforcerGroundSlamImpact(player);
    } else if (player.vy === 0 && player.isJumping) {
      triggerScreenShake(3.5);
    }
  },

  onJump(player, spawnGrass) {},

  // Taranujący wślizg wzbijający pył
  onSlide(player, spawnGrass) {
    triggerScreenShake(5.0);
    if (spawnGrass && player.groundY) {
      for (let i = 0; i < 7; i++) {
        spawnGrass(
          player.x + player.w / 2 + (player.facing * 22),
          player.groundY,
          player.facing
        );
      }
    }
  },

  // Potężne uderzenie piłki (pocisk balistyczny z niską grawitacją)
  onKick(player, ball, context) {
    triggerScreenShake(8.0);
    ball.lowGravityFrames = Math.max(ball.lowGravityFrames || 0, 20);
    ball.vx *= 1.18;
  },

  // Efekt taranu: uderzenie korpusem odpycha piłkę w biegu
  onBallPassiveContact(player, ball) {
    if (player.vx * player.facing > 0.5) {
      ball.vx = player.facing * (Math.abs(player.vx) * 1.6 + 4.8);
      ball.vy = -3.2;
      triggerScreenShake(3.5);
    }
  },

  // Rysowanie standardowych wojskowych ładownic taktycznych na pasie (bez bomb i ognia)
  onDrawBelt(ctx, player, v, fDir, waistHalfW, beltTopY, beltBotY) {
    drawEnforcerBeltCanisters(ctx, player, v, fDir, waistHalfW, beltTopY, beltBotY);
  },

  onDrawUnder(ctx, player) {
    drawEnforcerActiveBlasts(ctx, player);
  },

  onDrawOverlay(ctx, player) {
    drawEnforcerBeltChargeHUD(ctx, player);
  }
};

// =========================================================================
// SYSTEM SIŁOWEGO PRZYSIADU I TŁOKÓW PNEUMATYCZNYCH DLA KLASY ENFORCER
// =========================================================================

export function initBlastBeltState(p) {
  if (!p) return;
  p.blastBelt = {
    isCharging: false,
    chargeStartTime: 0,
    chargeMs: 0,
    chargeRatio: 0,
    isArmed: false,
    lastDirX: 0,
    lastGroundedTime: 0,
    lastGroundedFloorY: 500,
    blastJumpTimer: 0,
    pendingBallImpulse: false,
    lastBlastX: 0,
    lastBlastY: 0,
    activeBlasts: []
  };
}

/**
 * Sprawdza, czy gracz Enforcera znajduje się w oknie do max 300ms po kucnięciu,
 * umożliwiającym natychmiastowe odpalenie tłoków pneumatycznych bez ładowania.
 */
export function canTriggerEnforcerCrouchPiston(player) {
  if (!player || player.currentClass?.id !== 'ENFORCER') return false;
  const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
  const enterDelta = player._crouchEnterTime ? (now - player._crouchEnterTime) : Infinity;
  const exitDelta = player._crouchExitTime ? (now - player._crouchExitTime) : Infinity;
  return (enterDelta <= 300 || exitDelta <= 300);
}

/**
 * Natychmiastowe odpalenie tłoków pneumatycznych Enforcera z kucnięcia (okno <= 300ms).
 */
export function triggerEnforcerCrouchPistonJump(player, dirX = 0, spawnGrass = null) {
  if (!player || player.isDead) return false;
  player._crouchEnterTime = 0;
  player._crouchExitTime = 0;
  player.isCrouching = false;
  player.isProne = false;
  player.crouchToggled = false;
  player.state = 'STAND';
  player.hitboxHeight = player.h || 74;

  if (player.blastBelt) {
    player.blastBelt.isCharging = false;
    player.blastBelt.chargeMs = 0;
    player.blastBelt.chargeRatio = 0;
    player.blastBelt.isArmed = false;
    player.blastBelt.lastDirX = 0;
  }
  player.isJumpCharging = false;
  player.jumpChargePower = 0;

  triggerEnforcerBlastJump(player, dirX, spawnGrass);
  return true;
}

/**
 * Obsługa wejścia gracza (klawisz W / Strzałka w górę / Lewy drążek / Pad) dla Enforcera.
 * Skok odpala się po PUSZCZENIU kierunku w górę:
 * - Przytrzymanie < 380ms -> zwykły skok po puszczeniu.
 * - Przytrzymanie >= 380ms -> Enforcer schodzi w głęboki siłowy przysiad, spręża tłoki
 *   pneumatyczne na łydkach, a w momencie puszczenia kruszy ziemię pod butami i wybija się wysoko!
 * - Skok tuż po kucnięciu (do max 300ms) -> natychmiastowy skok tłokowy bez żadnego ładowania!
 * W locie: naciśnięcie DÓŁ + KICK/JUMP/AKCJA odpala potężne tąpnięcie z powietrza (Ground Slam).
 */
export function updateEnforcerBeltInput(player, keys, leftStick, gamepadState, spawnGrass, jumpFn) {
  if (!player || player.isDead || player.isIntro || (player.staggerTimer > 0) || ((player.staggerRecoveryTimer || 0) > 0)) return;
  if (!player.blastBelt) initBlastBeltState(player);
  const belt = player.blastBelt;

  // 1. ŚCISŁA WERYFIKACJA KONTAKTU Z PODŁOŻEM:
  // Enforcer może używać tłoków i wykonywać siłowy przysiad WYŁĄCZNIE stojąc stabilnie na ziemi lub platformie!
  // W powietrzu tłoki pneumatyczne są zablokowane, ale odblokowane jest Tąpnięcie z Powietrza (Ground Slam).
  const isFirmlyGrounded = isEnforcerFirmlyGrounded(player);

  if (!isFirmlyGrounded) {
    // W POWIETRZU: natychmiastowe zerowanie ładowania tłoków i siłowego przysiadu!
    if (belt.isCharging || player.isJumpCharging) {
      belt.isCharging = false;
      belt.chargeMs = 0;
      belt.chargeRatio = 0;
      belt.isArmed = false;
      player.isJumpCharging = false;
      player.jumpChargePower = 0;
    }

    // TĄPNIĘCIE Z POWIETRZA (Ground Slam / Meteor Drop):
    // W locie naciśnięcie DÓŁ + KICK / SPACJA / AKCJA powoduje gwałtowny pionowy spadek i falę uderzeniową po lądowaniu!
    if (!player.isGroundSlamming) {
      const isDownKey = !!(keys && (keys.down || keys.KeyS || keys.ArrowDown));
      const isActionKey = !!(keys && (keys.space || keys.Space || keys.kick || keys.KeyE || keys.KeyF || keys.KeyX));

      let stickY = 0;
      if (leftStick && leftStick.active) stickY = leftStick.axisY;
      else if (gamepadState && gamepadState.connected && gamepadState.leftStick) stickY = gamepadState.leftStick.y;

      const isStickDown = stickY > 0.45;
      const isPadDown = !!(gamepadState && gamepadState.connected && gamepadState.buttons?.dpadDown);
      const isDownHeld = isDownKey || isStickDown || isPadDown;

      const isStickAction = !!(leftStick?.jumpTriggered);
      const isPadAction = !!(gamepadState && gamepadState.connected && (gamepadState.buttons?.south || gamepadState.buttons?.west || gamepadState.buttons?.east || gamepadState.buttons?.north || gamepadState.r1 || gamepadState.r2));
      const isMobileAction = !!(typeof window !== 'undefined' && (window.pockets?.action?.active || window.btnCluster?.action?.active));

      if (isDownHeld && (isActionKey || isStickAction || isPadAction || isMobileAction)) {
        triggerEnforcerGroundSlam(player);
      }
    }
    return;
  }

  const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
  const currentFloor = player.currentGroundY || player.groundY || player.lastGroundedFloorY || (player.y + (player.h || 74));

  // W wersji mobilnej (lewy drążek dotykowy) Enforcer nie ładuje umiejętności przytrzymaniem góry –
  // zdolność odpala natychmiast szybką kombinacją dół-góra bez żadnego ładowania!
  const isTouchActive = !!(leftStick && leftStick.active);
  if (isTouchActive) {
    if (belt.isCharging || player.isJumpCharging) {
      belt.isCharging = false;
      belt.chargeMs = 0;
      belt.chargeRatio = 0;
      belt.isArmed = false;
      player.isJumpCharging = false;
      player.jumpChargePower = 0;
    }
  }

  // Sprawdzenie czy gracz trzyma kierunek w górę (W / Up / Pad PC)
  const keyUpHeld = !isTouchActive && !!(keys && (keys.up || keys.KeyW || keys.ArrowUp));
  const padUpHeld = !isTouchActive && !!(gamepadState && gamepadState.connected && (gamepadState.buttons?.south || (gamepadState.leftStick && gamepadState.leftStick.y < -0.50) || gamepadState.buttons?.dpadUp));
  const isHoldingUp = keyUpHeld || padUpHeld;

  // Bieżący kierunek poziomy (do skoku kierunkowego na platformę)
  let curDirX = 0;
  if (keys) {
    if (keys.left || keys.KeyA || keys.ArrowLeft) curDirX -= 1;
    if (keys.right || keys.KeyD || keys.ArrowRight) curDirX += 1;
  }
  if (leftStick && leftStick.active && Math.abs(leftStick.axisX) > 0.12) {
    curDirX = leftStick.axisX;
  } else if (gamepadState && gamepadState.connected && Math.abs(gamepadState.leftStick?.x || 0) > 0.15) {
    curDirX = gamepadState.leftStick.x;
  }

  if (isHoldingUp) {
    // 1. ZDOLNOŚĆ SPECJALNA: TŁOKI PNEUMATYCZNE PO KUCNIĘCIU DO MAX 300MS (NATYCHMIAST BEZ ŁADOWANIA)
    if (canTriggerEnforcerCrouchPiston(player)) {
      triggerEnforcerCrouchPistonJump(player, curDirX, spawnGrass);
      if (keys) {
        keys.up = false;
        keys.KeyW = false;
        keys.ArrowUp = false;
      }
      return;
    }

    if (!belt.isCharging) {
      if (belt.blastJumpTimer <= 0) {
        belt.isCharging = true;
        belt.chargeStartTime = now;
        belt.chargeMs = 0;
        belt.chargeRatio = 0;
        belt.isArmed = false;
        belt.lastDirX = curDirX;

        // Aktywacja fizycznego przysiadu skokowego (Power Squat)
        player.isProne = false;
        player.isCrouching = false;
        player.crouchToggled = false;
        player.isJumpCharging = true;
        player.jumpChargePower = 0;
      }
    } else {
      belt.chargeMs = Math.max(0, now - belt.chargeStartTime);
      belt.chargeRatio = Math.min(1.0, belt.chargeMs / ENFORCER_BOMB_CHARGE_MS);
      const wasArmed = belt.isArmed;
      belt.isArmed = (belt.chargeMs >= ENFORCER_BOMB_CHARGE_MS);

      // Przekazanie głębokości przysiadu do szkieletu IK i tłoków na łydkach
      player.isJumpCharging = true;
      player.jumpChargePower = belt.chargeRatio;

      if (Math.abs(curDirX) > 0.10) {
        belt.lastDirX = curDirX;
      } else {
        belt.lastDirX *= 0.92;
      }

      const centerX = player.x + (player.w || 30) / 2;
      if (belt.isArmed && !wasArmed) {
        // Przekroczono 1000ms: pełne sprężenie tłoków pneumatycznych i tąpnięcie butów w ziemię!
        triggerScreenShake(2.2);
        if (typeof spawnGroundPuff === 'function') {
          spawnGroundPuff(centerX - 10, currentFloor);
          spawnGroundPuff(centerX + 10, currentFloor);
        }
      } else if (belt.chargeRatio > 0.35 && Math.random() < 0.22) {
        // Kurz spod ciężkich butów podczas wciskania nóg w podłoże
        if (typeof spawnGroundPuff === 'function') {
          spawnGroundPuff(centerX + (Math.random() - 0.5) * 18, currentFloor);
        }
      }
    }
  } else if (belt.isCharging) {
    // MOMENT PUSZCZENIA DRĄŻKA LUB KLAWISZA W NA ZIEMI!
    const heldMs = Math.max(belt.chargeMs, now - belt.chargeStartTime);
    const wasArmed = (heldMs >= ENFORCER_BOMB_CHARGE_MS) || belt.isArmed;
    const releaseDirX = Math.abs(curDirX) > 0.10 ? curDirX : (Math.abs(belt.lastDirX) > 0.12 ? belt.lastDirX : 0);

    belt.isCharging = false;
    belt.chargeMs = 0;
    belt.chargeRatio = 0;
    belt.isArmed = false;
    belt.lastDirX = 0;
    player.isJumpCharging = false;
    player.jumpChargePower = 0;

    if (wasArmed) {
      // Przytrzymano >= 380ms na ziemi -> potężne tłokowe wybicie z nóg (kruszy ziemię i wzbija pył)!
      triggerEnforcerBlastJump(player, releaseDirX, spawnGrass);
    } else {
      // Przytrzymano < 380ms na ziemi -> zwykły skok z nóg po puszczeniu!
      const jumpCallback = jumpFn || (typeof window !== 'undefined' ? window.initiatePlayerJump : null);
      if (typeof jumpCallback === 'function') {
        jumpCallback(player, spawnGrass);
      }
    }
  }
}

/**
 * Odpala Siłowy Skok Tłokowy Enforcera (Kinetic Piston Leap):
 * Kolos prostuje potężne nogi wspomagane tłokami pneumatycznymi, krusząc podłoże pod butami
 * i wzbijając chmurę pyłu oraz gruzu bez żadnego ognia!
 */
export function triggerEnforcerBlastJump(player, dirX = 0, spawnGrass = null) {
  if (!player || player.isDead) return;
  const isFirmlyGrounded = isEnforcerFirmlyGrounded(player);
  if (!isFirmlyGrounded) return;
  if (!player.blastBelt) initBlastBeltState(player);
  const belt = player.blastBelt;

  player.isProne = false;
  player.isCrouching = false;
  player.crouchToggled = false;
  player.isSliding = false;
  player.slideTimer = 0;
  player.isJumpCharging = false;
  player.jumpChargePower = 0;
  player.state = 'STAND';
  player.hitboxHeight = player.h || 74;

  const currentFloor = player.currentGroundY || player.groundY || belt.lastGroundedFloorY || (player.y + (player.h || 74));
  const centerX = player.x + (player.w || 30) / 2;

  // Potężny impuls pionowy z wybicia tłokowego (vy = -20.2)
  player.vy = -20.2;
  player.onGround = false;
  player.isJumping = true;
  player.coyoteTimer = 0;
  player.jumpSquatTimer = 0;
  player.jumpLaunchFloorY = currentFloor;
  player.jumpTakeoffTimer = 14;
  player._craneBounceCooldown = 18;

  // Silny pęd poziomy w kierunku wychylenia (umożliwia dalekie wskakiwanie na platformy)
  const sprintMax = player.currentClass?.stats?.sprintMax || 5.6;
  if (Math.abs(dirX) > 0.12) {
    const launchVx = dirX * (sprintMax * 1.55);
    if (Math.sign(launchVx) === Math.sign(player.vx)) {
      player.vx = Math.sign(launchVx) * Math.max(Math.abs(player.vx) * 1.18, Math.abs(launchVx));
    } else {
      player.vx = launchVx;
    }
    player.facing = Math.sign(dirX) || player.facing;
    player.isSprintJump = true;
    player.sprintJumpTimer = 75;
  } else if (Math.abs(player.vx) > 0.4) {
    player.vx *= 1.22;
    player.isSprintJump = true;
    player.sprintJumpTimer = 65;
  }
  player.airVx = player.vx;
  player.jumpLaunchSpeed = Math.abs(player.vx);

  // Rejestracja fali uderzeniowej pyłu, pęknięcia ziemi i wyrzutu kamieni pod stopami
  belt.blastJumpTimer = 20;
  belt.pendingBallImpulse = true;
  belt.lastBlastX = centerX;
  belt.lastBlastY = currentFloor;

  // Wygeneruj losowe bryłki gruzu/kamieni odskakujące spod butów przy wybiciu
  const pebbles = [];
  for (let i = 0; i < 12; i++) {
    const side = (i % 2 === 0 ? -1 : 1);
    pebbles.push({
      dx: side * (4 + Math.random() * 16),
      vx: side * (1.8 + Math.random() * 4.5),
      vy: -(2.5 + Math.random() * 5.0),
      r: 1.5 + Math.random() * 2.2,
      col: (i % 3 === 0) ? '#71717a' : ((i % 3 === 1) ? '#52525b' : '#3f3f46')
    });
  }

  belt.activeBlasts.push({
    x: centerX,
    y: currentFloor,
    frame: 0,
    maxFrames: 34,
    pebbles
  });

  // Mocne tąpnięcie ziemi oraz wyrzut pyłu i sprężonego powietrza (ZERO OGNIA!)
  triggerScreenShake(8.5);

  if (typeof spawnShockwaveRing === 'function') {
    spawnShockwaveRing(centerX, currentFloor - 3);
  }
  if (typeof spawnHeavySmokePuff === 'function') {
    spawnHeavySmokePuff(centerX, currentFloor - 5, 12);
    spawnHeavySmokePuff(centerX - 18, currentFloor - 4, 6);
    spawnHeavySmokePuff(centerX + 18, currentFloor - 4, 6);
  }
  if (typeof spawnGroundPuff === 'function') {
    spawnGroundPuff(centerX - 22, currentFloor);
    spawnGroundPuff(centerX - 10, currentFloor);
    spawnGroundPuff(centerX, currentFloor);
    spawnGroundPuff(centerX + 10, currentFloor);
    spawnGroundPuff(centerX + 22, currentFloor);
  }

  const grassFn = spawnGrass || player._spawnGrass;
  if (typeof grassFn === 'function' && currentFloor) {
    for (let i = 0; i < 12; i++) {
      grassFn(centerX + (i - 5.5) * 7, currentFloor, (i % 2 === 0) ? 1 : -1);
    }
  }
}

/**
 * Odpala Tąpnięcie z Powietrza (Meteor Drop / Ground Slam) Enforcera:
 * Kolos pikuje z potężną prędkością pionową prosto w dół, rozcinając powietrze,
 * a po kontakcie z ziemią lub platformą wyzwala niszczycielską falę uderzeniową.
 */
export function triggerEnforcerGroundSlam(player) {
  if (!player || player.isDead || player.isGroundSlamming || player.onGround) return;
  player.isGroundSlamming = true;
  player.vy = 26.0;
  player.vx *= 0.15;
  player.airVx = player.vx;
  player.isProne = false;
  player.isCrouching = false;
  player.crouchToggled = false;
  player.isSliding = false;
  player.isJumping = true;

  triggerScreenShake(4.0);
  const cx = player.x + (player.w || 30) / 2;
  const cy = player.y + (player.h || 74) / 2;
  if (typeof spawnHeavySmokePuff === 'function') {
    spawnHeavySmokePuff(cx, cy, 8);
  }
  if (typeof spawnShockwaveRing === 'function') {
    spawnShockwaveRing(cx, cy, '#cbd5e1');
  }
}

/**
 * Wykonuje niszczycielskie uderzenie o grunt / platformę po Ground Slamie Enforcera.
 * Generuje falę uderzeniową AoE (125px), stagger, obrażenia (48 direct / 18-28 AoE), niszczy klocki areny i odrzuca piłkę/wrogów.
 */
export function executeEnforcerGroundSlamImpact(player, impactY = null) {
  if (!player || !player.isGroundSlamming) return;
  player.isGroundSlamming = false;
  player.vy = 0;
  player.vx = 0;
  player.airVx = 0;
  player.isJumping = false;
  player.isSprintJump = false;
  player.sprintJumpTimer = 0;

  const floorY = (typeof impactY === 'number') ? impactY : (player.currentGroundY || player.groundY || (player.y + (player.h || 74)));
  const centerX = player.x + (player.w || 30) / 2;

  // 1. Wstrząs kamery (pełny impuls dla lokalnego gracza, wytłumiony dla botów)
  const isLocalHuman = (typeof window !== 'undefined' && window.player === player);
  triggerScreenShake(isLocalHuman ? 9.0 : 2.5);

  // 2. Efekty wizualne tąpnięcia: fala uderzeniowa, pył, wyrzut gruzu, zwarty dym
  if (typeof spawnShockwaveRing === 'function') {
    spawnShockwaveRing(centerX, floorY - 3);
    spawnShockwaveRing(centerX, floorY - 3, '#94a3b8');
  }
  if (typeof spawnHeavySmokePuff === 'function') {
    spawnHeavySmokePuff(centerX, floorY - 6, 8);
  }
  if (typeof spawnGroundPuff === 'function') {
    spawnGroundPuff(centerX - 35, floorY);
    spawnGroundPuff(centerX - 18, floorY);
    spawnGroundPuff(centerX, floorY);
    spawnGroundPuff(centerX + 18, floorY);
    spawnGroundPuff(centerX + 35, floorY);
  }

  // 3. Bryły gruzu / kamieni
  const belt = player.blastBelt;
  if (belt) {
    const pebbles = [];
    for (let i = 0; i < 16; i++) {
      const side = (i % 2 === 0 ? -1 : 1);
      pebbles.push({
        dx: side * (6 + Math.random() * 26),
        vx: side * (2.2 + Math.random() * 6.5),
        vy: -(3.5 + Math.random() * 7.0),
        r: 1.8 + Math.random() * 2.8,
        col: (i % 3 === 0) ? '#71717a' : ((i % 3 === 1) ? '#52525b' : '#3f3f46')
      });
    }
    belt.activeBlasts.push({
      x: centerX,
      y: floorY,
      frame: 0,
      maxFrames: 38,
      pebbles
    });
  }

  // 4. Obrażenia i oszołomienie AoE wokół miejsca uderzenia (promień 125px)
  const combatants = (typeof window !== 'undefined' && Array.isArray(window.combatants))
    ? window.combatants
    : (typeof window !== 'undefined' && window.allCombatants ? window.allCombatants : []);
  const activeBots = (typeof getActiveBots === 'function')
    ? getActiveBots()
    : ((typeof window !== 'undefined' && typeof window.getActiveBots === 'function') ? window.getActiveBots() : []);
  const remoteP = (typeof window !== 'undefined' && window.remotePlayer?.active) ? window.remotePlayer : null;
  const humanP = (typeof window !== 'undefined' && window.player) ? window.player : null;

  const targets = new Set([...combatants, ...activeBots, remoteP, humanP].filter(Boolean));

  const isFFA = (typeof isDeathmatchFFA === 'function' ? isDeathmatchFFA() : false) ||
    (deathmatchState && deathmatchState.mode === 'FFA') ||
    (typeof window !== 'undefined' && window.deathmatchState?.mode === 'FFA');
  const sendDmg = (typeof window !== 'undefined' && window.sendDamageEvent) ? window.sendDamageEvent : null;
  const netState = (typeof window !== 'undefined' && window.networkState) ? window.networkState : null;

  for (const t of targets) {
    if (!t || t === player || t.isDead) continue;
    if (!isFFA && player.team && t.team && player.team === t.team) continue;
    if (t.spawnProtectionTimer && t.spawnProtectionTimer > 0) continue;

    const tCenterX = t.x + (t.w || 24) / 2;
    const tCenterY = t.y + (t.h || 70) / 2;
    const dist = Math.hypot(tCenterX - centerX, (t.y + (t.h || 70)) - floorY);

    if (dist <= 125) {
      const isDirect = (dist <= 38);
      const factor = isDirect ? 1.0 : Math.max(0, 1.0 - ((dist - 38) / (125 - 38)));
      const dmg = isDirect ? 48 : Math.round(18 + 10 * factor);
      const stagger = isDirect ? 34 : Math.round(16 + 8 * factor);
      const knockDir = Math.sign(tCenterX - centerX) || player.facing || 1;
      const knockVx = knockDir * (isDirect ? 14.0 : (8.0 + 5.0 * factor));
      const knockVy = isDirect ? -8.5 : -5.2;

      t.hp = Math.max(0, (t.hp !== undefined ? t.hp : 100) - dmg);
      t.lastAttacker = player;
      t.lastAttackerTimer = 240;
      t.vx = knockVx;
      t.vy = knockVy;
      t.isJumping = true;
      t.onGround = false;

      const isImmune = !!(t.staggerImmunityTimer && t.staggerImmunityTimer > 0);
      if (!isImmune) {
        t.staggerTimer = stagger;
        t.staggerLanded = false;
        t.staggerRecoveryTimer = 0;
      }

      if (typeof spawnBloodSpurt === 'function') {
        spawnBloodSpurt(tCenterX, tCenterY, knockDir * 3.5, -2.5, isDirect ? 16 : 8, 1.2);
      }

      if (sendDmg && netState && netState.isConnected && !player.isRemote) {
        if (t.isRemote) {
          sendDmg({
            target: 'player',
            damage: dmg,
            isTorsoShot: true,
            hitX: tCenterX,
            hitY: tCenterY,
            relHitY: 0,
            weaponId: 'GROUND_SLAM',
            vx: knockVx,
            vy: knockVy,
            stagger
          });
        } else if (t.isBot && !netState.isHost) {
          const bIdx = activeBots.indexOf(t);
          if (bIdx !== -1) {
            sendDmg({
              target: 'bot',
              botIdx: bIdx,
              damage: dmg,
              isTorsoShot: true,
              hitX: tCenterX,
              hitY: tCenterY,
              relHitY: 0,
              weaponId: 'GROUND_SLAM',
              vx: knockVx,
              vy: knockVy,
              stagger
            });
          }
        }
      }

      if (t.hp <= 0 && !t.isDead) {
        t.isDead = true;
        t.killer = player;
        t.respawnTimer = 180;
        t.bleedTimer = 90;
        t.corpseFloorY = floorY;
        if (typeof window !== 'undefined') {
          if (typeof window.recordKill === 'function' && player === window.player) {
            window.recordKill();
          }
          if (typeof window.registerKillstreakKill === 'function' && player === window.player) {
            window.registerKillstreakKill();
          }
        }
      }
    }
  }

  // 5. Interakcja z piłką
  const curBall = (typeof window !== 'undefined' && window.ball) ? window.ball : null;
  if (curBall && !curBall.isPocketed) {
    const dBall = Math.hypot(curBall.x - centerX, curBall.y - floorY);
    if (dBall <= 140) {
      const bSign = Math.sign(curBall.x - centerX) || 1;
      curBall.vx += bSign * 16.0;
      curBall.vy = -18.0;
      curBall.lowGravityFrames = 25;
    }
  }

  // 6. Interakcja z niszczalnymi klockami i przeszkodami areny
  const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
  if (curArena && typeof curArena.onKickHit === 'function') {
    curArena.onKickHit(player, {
      isSpartan: true,
      footX: centerX,
      footY: floorY,
      kickReach: 75
    });
  }
}

/**
 * Aktualizacja fizyki siłowego skoku tłokowego w każdej klatce
 */
export function updateEnforcerBeltPhysics(player, ball) {
  if (!player || !player.blastBelt) return;
  const belt = player.blastBelt;

  // Fala uderzeniowa tąpnięcia przy wybiciu podbija pobliską piłkę
  if (belt.pendingBallImpulse) {
    belt.pendingBallImpulse = false;
    if (ball && typeof ball.x === 'number' && typeof ball.y === 'number') {
      const dx = ball.x - belt.lastBlastX;
      const dy = ball.y - (belt.lastBlastY - 15);
      const dist = Math.hypot(dx, dy);
      if (dist < 125) {
        const power = 1.0 - (dist / 125);
        const pushDirX = Math.abs(dx) > 4 ? Math.sign(dx) : (player.facing || 1);
        ball.vx += pushDirX * (8.0 + 11.0 * power);
        ball.vy = Math.min(ball.vy, -(9.5 + 9.5 * power));
      }
    }
  }

  if (belt.blastJumpTimer > 0) {
    belt.blastJumpTimer--;
  }

  // Aktualizacja klatek animacji fali pyłu i odłamków podłoża
  if (belt.activeBlasts && belt.activeBlasts.length > 0) {
    for (let i = belt.activeBlasts.length - 1; i >= 0; i--) {
      belt.activeBlasts[i].frame++;
      if (belt.activeBlasts[i].frame > belt.activeBlasts[i].maxFrames) {
        belt.activeBlasts.splice(i, 1);
      }
    }
  }
}

/**
 * Rysuje realistyczne wojskowe ładownice taktyczne na pasie Enforcera (bez bomb i bez ognia!)
 */
export function drawEnforcerBeltCanisters(ctx, p, v, fDir, waistHalfW, beltTopY, beltBotY) {
  ctx.save();

  const pouchOffsets = [
    -fDir * (waistHalfW * 0.65),
    fDir * (waistHalfW * 0.68)
  ];

  const pouchW = 2.8;
  const pouchH = 3.8;
  const pouchY = beltTopY - 0.3;

  pouchOffsets.forEach((px) => {
    const x = px - pouchW * 0.5;
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, pouchY, pouchW, pouchH, 0.6);
    else ctx.rect(x, pouchY, pouchW, pouchH);
    ctx.fill();
    ctx.stroke();

    // Klapa ładownicy z zatrzaskiem
    ctx.fillStyle = '#27272a';
    ctx.fillRect(x + 0.2, pouchY, pouchW - 0.4, 1.3);
    ctx.fillStyle = '#71717a';
    ctx.fillRect(px - 0.35, pouchY + 1.1, 0.7, 0.7);
  });

  ctx.restore();
}

/**
 * Rysuje realistyczne pęknięcie ziemi, odskakujący gruz, pierścień sprężonego powietrza
 * oraz gęstą chmurę pyłu i kurzu pod stopami Enforcera w momencie wybicia (ZERO OGNIA!)
 */
function drawEnforcerActiveBlasts(ctx, player) {
  const belt = player?.blastBelt;
  if (!belt || !belt.activeBlasts || belt.activeBlasts.length === 0) return;

  for (const b of belt.activeBlasts) {
    const t = b.frame / b.maxFrames;
    const alpha = Math.max(0, 1.0 - t);

    ctx.save();

    // 1. Pierścień sprężonego powietrza z tłoków rozchodzący się nisko nad ziemią
    if (b.frame <= 18) {
      const ringT = b.frame / 18.0;
      const ringRx = 14 + ringT * 68;
      const ringRy = 3.5 + ringT * 8.0;
      ctx.save();
      ctx.globalAlpha = (1.0 - ringT) * 0.75;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = Math.max(1.0, 3.5 * (1.0 - ringT));
      ctx.beginPath();
      ctx.ellipse(b.x, b.y - 1, ringRx, ringRy, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Odłamki betonu / kamienie wyrzucone spod ciężkich butów
    if (b.pebbles && b.frame <= 26) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1.0 - (b.frame / 26.0));
      for (const peb of b.pebbles) {
        const px = b.x + peb.dx + peb.vx * b.frame;
        const py = Math.min(b.y - 1, (b.y - 3) + peb.vy * b.frame + 0.28 * b.frame * b.frame);
        ctx.fillStyle = peb.col;
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(px, py, peb.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Gęsta chmura pyłu, kurzu i pary rozchodząca się na boki po wybiciu
    const dustPuffs = [-36, -24, -13, -4, 4, 13, 24, 36];
    ctx.save();
    dustPuffs.forEach((dx, idx) => {
      const puffX = b.x + dx * (0.35 + t * 1.15);
      const puffY = b.y - 4 - t * (14 + (idx % 3) * 8);
      const puffR = 8 + t * (16 + (idx % 3) * 5);
      const dAlpha = alpha * 0.55;

      ctx.fillStyle = (idx % 2 === 0)
        ? `rgba(161, 161, 170, ${dAlpha.toFixed(3)})`
        : `rgba(113, 113, 122, ${(dAlpha * 0.85).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(puffX, puffY, puffR, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    ctx.restore();
  }
}

/**
 * Podczas schodzenia w głęboki siłowy przysiad (0..1000ms+) rysuje syczące obłoczki
 * białej pary sprężonego powietrza z zaworów tłoków na łydkach oraz drżące kamyczki pod butami.
 */
function drawEnforcerBeltChargeHUD(ctx, player) {
  if (!player || player._isCreatorDummy || player.isDead) return;
  const belt = player.blastBelt;
  if (!belt || !belt.isCharging) return;
  const isFirmlyGrounded = isEnforcerFirmlyGrounded(player);
  if (!isFirmlyGrounded) return;

  const ratio = Math.max(0, Math.min(1.0, belt.chargeRatio || 0));
  const isArmed = !!belt.isArmed;
  const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();

  const centerX = player.x + (player.w || 30) / 2;
  const floorY = player.currentGroundY || player.groundY || (player.y + (player.h || 74));
  const calfY = floorY - 14;

  ctx.save();

  // 1. Syczące strumienie białej pary uchodzące na boki z zaworów ciśnieniowych na łydkach
  const steamCount = isArmed ? 6 : Math.max(2, Math.ceil(ratio * 4));
  for (let i = 0; i < steamCount; i++) {
    const phase = ((now * 0.0045 + i * (1 / steamCount)) % 1.0);
    const side = (i % 2 === 0 ? -1 : 1);
    const sx = centerX + side * (8 + phase * (isArmed ? 22 : (8 + ratio * 10)));
    const sy = calfY + (i % 3) * 2 - phase * (isArmed ? 10 : 5);
    const sr = (2.2 + phase * (isArmed ? 6.5 : 4.2)) * (0.45 + ratio * 0.55);
    const sAlpha = (1.0 - phase) * (isArmed ? 0.65 : (0.22 + ratio * 0.32));

    ctx.fillStyle = `rgba(226, 232, 240, ${sAlpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Gdy tłoki są maksymalnie sprężone (>= 1000ms), ziemia pod butami pęka i podskakują drobne kamyczki
  if (isArmed) {
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(centerX, floorY - 1, 16 + Math.sin(now * 0.04) * 2.5, 3.0, 0, 0, Math.PI * 2);
    ctx.stroke();

    const pebbleOffsets = [-14, -7, 7, 14];
    pebbleOffsets.forEach((ox, idx) => {
      const bounce = Math.abs(Math.sin(now * 0.025 + idx * 1.4)) * 3.5;
      ctx.fillStyle = '#71717a';
      ctx.beginPath();
      ctx.arc(centerX + ox, floorY - 1.5 - bounce, 1.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.restore();
}



