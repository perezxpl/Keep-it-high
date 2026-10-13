// =========================================================================
// KLASA CIĘŻKA: ENFORCER – Kolos / Siła / Pas Ładunków Wybuchowych (Blast Belt)
// Specjalność: Skok odpalany przy puszczeniu kierunku w górę (W / drążek).
//              Przytrzymanie w górę przez min. 1000ms podpala ładunki na pasie,
//              które w momencie puszczenia uderzają w ziemię pod butami i
//              wystrzeliwują Enforcera wysoko na platformy!
// =========================================================================
import { triggerScreenShake, spawnJetpackSparks, spawnGroundPuff } from '../world.js';
import { getJetpackFlamePalette } from '../player/jetpack.js';
import {
  spawnExplosionFirePuff,
  spawnHeavySmokePuff,
  spawnStretchedSparks,
  spawnShockwaveRing
} from '../particles.js';

export const ENFORCER_BOMB_CHARGE_MS = 1000; // Min. 1000ms przytrzymania w górę uzbraja bomby na pasie

export function getEnforcerFlameColor(player) {
  if (player?.customVisuals?.jetpackColor) return player.customVisuals.jetpackColor;
  return '#ef4444';
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

  // 2. FIZYKA I KINETYKA CIĘŻKIEJ MASY
  stats: {
    walkMax: 1.8,
    jogMax: 3.4,
    sprintMax: 5.6,
    accel: 0.15,            // Duża bezwładność przy ruszaniu
    decel: 0.88,            // Trudno go wyhamować
    slideDecel: 0.989,      // Niezwykle długi wślizg taranujący
    jumpForce: 8.5,         // Cięższy zwykły skok (przy krótkim tapnięciu < 1000ms)
    slideDashSpeed: 18.5,   // Wybuchowy dash z darni
    chargeSpeed: 0.024,
    hitReach: 64,           // Duży zasięg dzięki długości kończyn
    whiffReach: 94,
    baseKickSpeed: 30.0,
    kickPowerMult: 1.52,    // Najpotężniejsze uderzenie w grze
    spinMult: 0.30,         // Prawie czysta trajektoria balistyczna
    jetMax: 0,              // Brak plecaka odrzutowego (posiada Pas Ładunków Wybuchowych)
    spartanKnockback: 18.0, // Potężny odrzut kinetyczny i twardy knockback
    spartanStagger: 28,     // Długi czas oszołomienia przeciwnika (~460ms)
    spartanDamage: 18,
    kickForce: 1.15,
    kickForceMultiplier: 1.15,
    knockback: 1.50,
    knockbackMultiplier: 1.50,
    kickCooldown: 0.70
  },

  // 3. WŁAŚCIWOŚCI WIZUALNE: RZEŹBIONA ANATOMIA KOLOSA
  visuals: {
    sculptedMuscles: true,           // Aktywuje asymetryczne krzywe brzuśców mięśniowych
    muscleMult: 1.40,                // +40% do obwodów ramion, barków i nóg
    torsoStyle: 'sleeveless',        // Domyślny styl ubioru: bezrękawnik bojowy (tank-top)
    headgearStyle: 'marcus_bandana', // Domyślna chusta bojowa COG w stylu Marcusa Fenixa

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
  },

  onUpdate(player, ball, keys) {
    updateEnforcerBeltPhysics(player, ball);
  },

  onPrePhysics(player, keys) {},

  // Tąpnięcie przy lądowaniu
  onPostPhysics(player) {
    if (player.vy === 0 && player.isJumping) {
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

  // Rysowanie Pasa Ładunków Wybuchowych bezpośrednio na pasie taktycznym postaci
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
// SYSTEM PASA ŁADUNKÓW WYBUCHOWYCH (BLAST BELT) DLA KLASY ENFORCER
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
 * Obsługa wejścia gracza (klawisz W / Strzałka w górę / Lewy drążek / Pad) dla Enforcera.
 * Skok odpala się po PUSZCZENIU kierunku w górę:
 * - Przytrzymanie < 1000ms -> zwykły skok po puszczeniu.
 * - Przytrzymanie >= 1000ms -> podpala bomby na pasie, a w momencie puszczenia
 *   ładunki uderzają w ziemię pod butami i wystrzeliwują Enforcera wysoko w powietrze!
 */
export function updateEnforcerBeltInput(player, keys, leftStick, gamepadState, spawnGrass, jumpFn) {
  if (!player || player.isDead || player.isIntro) return;
  if (!player.blastBelt) initBlastBeltState(player);
  const belt = player.blastBelt;

  if (player.isSliding || (player.staggerTimer > 0) || player.isAcidDying) {
    belt.isCharging = false;
    belt.chargeMs = 0;
    belt.chargeRatio = 0;
    belt.isArmed = false;
    return;
  }

  const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
  const currentFloor = player.currentGroundY || player.groundY || player.lastGroundedFloorY || (player.y + (player.h || 74));
  const hasCoyote = ((player.coyoteTimer || 0) > 0 && !player.isJumping && Math.abs(player.vy || 0) < 4.5);
  const isGroundedNow = (player.onGround !== undefined)
    ? (player.onGround || hasCoyote)
    : (player.y >= currentFloor - (player.h || 74) - 4 || hasCoyote);

  if (isGroundedNow && !player.isJumping) {
    belt.lastGroundedTime = now;
    belt.lastGroundedFloorY = currentFloor;
  }

  // Bufor 220ms przy zbieganiu z krawędzi platformy, aby puszczenie klawisza tuż za krawędzią nadal zadziałało
  const isGroundedWithGrace = (isGroundedNow && !player.isJumping) || ((now - (belt.lastGroundedTime || 0)) <= 220 && !player.isJumping);

  // Sprawdzenie czy gracz trzyma kierunek w górę (W / Up / Drążek w górę / Pad)
  const keyUpHeld = !!(keys && (keys.up || keys.KeyW || keys.ArrowUp));
  const stickThreshold = belt.isCharging ? -0.30 : -0.45;
  const touchUpHeld = !!(leftStick && leftStick.active && leftStick.axisY < stickThreshold);
  const padUpHeld = !!(gamepadState && gamepadState.connected && (gamepadState.jumpHeld || gamepadState.axisY < -0.50));
  const isHoldingUp = keyUpHeld || touchUpHeld || padUpHeld;

  // Bieżący kierunek poziomy (do skoku kierunkowego na platformę)
  let curDirX = 0;
  if (keys) {
    if (keys.left || keys.KeyA || keys.ArrowLeft) curDirX -= 1;
    if (keys.right || keys.KeyD || keys.ArrowRight) curDirX += 1;
  }
  if (leftStick && leftStick.active && Math.abs(leftStick.axisX) > 0.12) {
    curDirX = leftStick.axisX;
  } else if (gamepadState && gamepadState.connected && Math.abs(gamepadState.axisX) > 0.15) {
    curDirX = gamepadState.axisX;
  }

  if (isHoldingUp) {
    if (!belt.isCharging) {
      if (isGroundedWithGrace && belt.blastJumpTimer <= 0) {
        belt.isCharging = true;
        belt.chargeStartTime = now;
        belt.chargeMs = 0;
        belt.chargeRatio = 0;
        belt.isArmed = false;
        belt.lastDirX = curDirX;

        // Podrywamy postać z kucania/leżenia podczas przygotowania do skoku
        player.isProne = false;
        player.isCrouching = false;
        player.crouchToggled = false;
      }
    } else {
      if (!isGroundedWithGrace) {
        // Spadł z krawędzi bez puszczania przez dłuższy czas – anuluj ładowanie
        belt.isCharging = false;
        belt.chargeMs = 0;
        belt.chargeRatio = 0;
        belt.isArmed = false;
      } else {
        belt.chargeMs = Math.max(0, now - belt.chargeStartTime);
        belt.chargeRatio = Math.min(1.0, belt.chargeMs / ENFORCER_BOMB_CHARGE_MS);
        const wasArmed = belt.isArmed;
        belt.isArmed = (belt.chargeMs >= ENFORCER_BOMB_CHARGE_MS);

        if (Math.abs(curDirX) > 0.10) {
          belt.lastDirX = curDirX;
        } else {
          // Powolne wygaszanie pamięci kierunku bocznego (gdy gracz puszcza palec z drążka ekranowego)
          belt.lastDirX *= 0.92;
        }

        if (belt.isArmed && !wasArmed) {
          // Przekroczono 1000ms: ładunki na pasie stają w pełnym płomieniu (ogień bucha w górę wokół pasa!)
          triggerScreenShake(3.0);
          const centerX = player.x + (player.w || 30) / 2;
          const beltY = player.y + (player.h || 74) * 0.50;
          if (typeof spawnExplosionFirePuff === 'function') {
            spawnExplosionFirePuff(centerX, beltY - 4, 8);
          }
          if (typeof spawnHeavySmokePuff === 'function') {
            spawnHeavySmokePuff(centerX, beltY - 8, 7);
          }
          if (typeof spawnStretchedSparks === 'function') {
            spawnStretchedSparks(centerX, beltY - 2, 12);
          }
        } else {
          // Narastający ogień i dym unoszący się W GÓRĘ z podpalonych ładunków na pasie
          emitBeltFuseSparks(player, belt.chargeRatio, belt.isArmed);
        }
      }
    }
  } else if (belt.isCharging) {
    // MOMENT PUSZCZENIA DRĄŻKA LUB KLAWISZA W!
    const heldMs = Math.max(belt.chargeMs, now - belt.chargeStartTime);
    const wasArmed = (heldMs >= ENFORCER_BOMB_CHARGE_MS) || belt.isArmed;
    const releaseDirX = Math.abs(curDirX) > 0.10 ? curDirX : (Math.abs(belt.lastDirX) > 0.12 ? belt.lastDirX : 0);

    belt.isCharging = false;
    belt.chargeMs = 0;
    belt.chargeRatio = 0;
    belt.isArmed = false;
    belt.lastDirX = 0;

    if (isGroundedWithGrace) {
      if (wasArmed) {
        // Przytrzymano >= 1000ms -> ładunki z pasa spadają pod buty i eksplodują na ziemi!
        triggerEnforcerBlastJump(player, releaseDirX, spawnGrass);
      } else {
        // Przytrzymano < 1000ms -> zwykły skok po puszczeniu!
        const jumpCallback = jumpFn || (typeof window !== 'undefined' ? window.initiatePlayerJump : null);
        if (typeof jumpCallback === 'function') {
          jumpCallback(player, spawnGrass);
        }
      }
    }
  }
}

/**
 * Emituje naturalny ogień i gęsty dym unoszący się W GÓRĘ z podpalonych ładunków na pasie
 * (bez żadnych strumieni rakietowych skierowanych w dół ku kolanom!)
 */
function emitBeltFuseSparks(player, chargeRatio = 0.5, isArmed = false) {
  const centerX = player.x + (player.w || 30) / 2;
  const beltY = player.y + (player.h || 74) * 0.50;

  if (isArmed) {
    // Pełne rozpalenie (>= 1000ms): kłęby żywego ognia i dymu buchające w górę z pasa
    if (Math.random() < 0.55 && typeof spawnExplosionFirePuff === 'function') {
      spawnExplosionFirePuff(centerX + (Math.random() - 0.5) * 16, beltY - 3, 1);
    }
    if (Math.random() < 0.65 && typeof spawnHeavySmokePuff === 'function') {
      spawnHeavySmokePuff(centerX + (Math.random() - 0.5) * 18, beltY - 8, 1);
    }
  } else if (chargeRatio > 0.25) {
    // Narastające palenie się ładunków (250ms..1000ms)
    if (Math.random() < chargeRatio * 0.35 && typeof spawnExplosionFirePuff === 'function') {
      spawnExplosionFirePuff(centerX + (Math.random() - 0.5) * 12, beltY - 2, 1);
    }
    if (Math.random() < chargeRatio * 0.45 && typeof spawnHeavySmokePuff === 'function') {
      spawnHeavySmokePuff(centerX + (Math.random() - 0.5) * 14, beltY - 6, 1);
    }
  }
}

/**
 * Odpala Wybuchowy Skok Enforcera (Blast Jump):
 * Podpalone bomby spadają z pasa pod buty i eksplodują na ziemi, wyrzucając kolosa wysoko falą uderzeniową!
 */
export function triggerEnforcerBlastJump(player, dirX = 0, spawnGrass = null) {
  if (!player || player.isDead) return;
  if (!player.blastBelt) initBlastBeltState(player);
  const belt = player.blastBelt;

  player.isProne = false;
  player.isCrouching = false;
  player.crouchToggled = false;
  player.isSliding = false;
  player.slideTimer = 0;
  player.state = 'STAND';
  player.hitboxHeight = player.h || 74;

  const currentFloor = player.currentGroundY || player.groundY || belt.lastGroundedFloorY || (player.y + (player.h || 74));
  const centerX = player.x + (player.w || 30) / 2;
  const beltY = player.y + (player.h || 74) * 0.50;

  // Potężny impuls pionowy (+30% wyższy wyskok wybuchowy: vy = -20.2)
  player.vy = -20.2;
  player.onGround = false;
  player.isJumping = true;
  player.coyoteTimer = 0;
  player.jumpSquatTimer = 0;
  player.jumpLaunchFloorY = currentFloor;
  player.jumpTakeoffTimer = 14;

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

  // Rejestracja naziemnej eksplozji bomb pod stopami
  const flameColor = getEnforcerFlameColor(player);
  belt.blastJumpTimer = 26;
  belt.pendingBallImpulse = true;
  belt.lastBlastX = centerX;
  belt.lastBlastY = currentFloor;
  belt.activeBlasts.push({
    x: centerX,
    y: currentFloor,
    beltY: beltY,
    frame: 0,
    maxFrames: 40,
    color: flameColor
  });

  // Potężny wybuch bomb na podłożu (jak detonacja ładunków C4/granatów na ziemi, bez dysz rakietowych!)
  triggerScreenShake(12.5);

  if (typeof spawnShockwaveRing === 'function') {
    spawnShockwaveRing(centerX, currentFloor - 6);
  }
  if (typeof spawnExplosionFirePuff === 'function') {
    spawnExplosionFirePuff(centerX, currentFloor - 10, 24);
    spawnExplosionFirePuff(centerX - 18, currentFloor - 6, 10);
    spawnExplosionFirePuff(centerX + 18, currentFloor - 6, 10);
  }
  if (typeof spawnHeavySmokePuff === 'function') {
    spawnHeavySmokePuff(centerX, currentFloor - 8, 22);
    spawnHeavySmokePuff(centerX - 22, currentFloor - 5, 10);
    spawnHeavySmokePuff(centerX + 22, currentFloor - 5, 10);
  }
  if (typeof spawnStretchedSparks === 'function') {
    spawnStretchedSparks(centerX, currentFloor - 8, 36);
  }
  if (typeof spawnGroundPuff === 'function') {
    spawnGroundPuff(centerX - 20, currentFloor);
    spawnGroundPuff(centerX, currentFloor);
    spawnGroundPuff(centerX + 20, currentFloor);
  }

  const grassFn = spawnGrass || player._spawnGrass;
  if (typeof grassFn === 'function' && currentFloor) {
    for (let i = 0; i < 10; i++) {
      grassFn(centerX + (i - 4.5) * 8, currentFloor, (i % 2 === 0) ? 1 : -1);
    }
  }
}

/**
 * Aktualizacja fizyki wybuchowego skoku i efektów eksplozji w każdej klatce
 */
export function updateEnforcerBeltPhysics(player, ball) {
  if (!player || !player.blastBelt) return;
  const belt = player.blastBelt;

  // Fala uderzeniowa wybuchu pod stopami odrzuca pobliską piłkę
  if (belt.pendingBallImpulse) {
    belt.pendingBallImpulse = false;
    if (ball && typeof ball.x === 'number' && typeof ball.y === 'number') {
      const dx = ball.x - belt.lastBlastX;
      const dy = ball.y - (belt.lastBlastY - 15);
      const dist = Math.hypot(dx, dy);
      if (dist < 135) {
        const power = 1.0 - (dist / 135);
        const pushDirX = Math.abs(dx) > 4 ? Math.sign(dx) : (player.facing || 1);
        ball.vx += pushDirX * (9.0 + 13.0 * power);
        ball.vy = Math.min(ball.vy, -(11.0 + 11.0 * power));
      }
    }
  }

  // Podczas lotu po wybuchu: wyłącznie delikatny dym prochowy zaraz po wybiciu (ZERO ognia rakietowego z butów/kolan!)
  if (belt.blastJumpTimer > 0) {
    belt.blastJumpTimer--;
    if (belt.blastJumpTimer > 14 && belt.blastJumpTimer % 3 === 0 && typeof spawnHeavySmokePuff === 'function') {
      const footX = player.x + (player.w || 30) / 2;
      const footY = player.y + (player.h || 74) - 4;
      spawnHeavySmokePuff(footX + (Math.random() - 0.5) * 10, footY, 1);
    }
  }

  // Aktualizacja klatek animacji wybuchów naziemnych
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
 * Rysuje Pas Ładunków Wybuchowych (3 ładunki wybuchowe / laski dynamitu z lontami od góry) na pasie Enforcera.
 * Ogień i dym z lontów unoszą się NATURALNIE W GÓRĘ (nigdy w dół jak silnik rakietowy na kolanach!).
 */
export function drawEnforcerBeltCanisters(ctx, p, v, fDir, waistHalfW, beltTopY, beltBotY) {
  const flameColor = v?.jetpackColor || getEnforcerFlameColor(p);
  const flamePal = getJetpackFlamePalette(flameColor);
  const belt = p?.blastBelt;
  const isCharging = !!(belt && belt.isCharging);
  const chargeRatio = isCharging ? (belt.chargeRatio || 0) : 0;
  const isArmed = !!(belt && belt.isArmed);
  const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();

  ctx.save();

  // Pozycje 3 ładunków wybuchowych zamontowanych na pasie
  const canisterOffsets = [
    -fDir * (waistHalfW * 0.68),
    -fDir * (waistHalfW * 0.08),
    fDir * (waistHalfW * 0.72)
  ];

  const canW = 3.0;
  const canH = 4.6;
  const canTopY = beltTopY - 0.8;

  canisterOffsets.forEach((cx, idx) => {
    const jitterX = isArmed
      ? Math.sin(now * 0.08 + idx * 2.1) * 0.55
      : (isCharging ? Math.sin(now * 0.04 + idx) * chargeRatio * 0.25 : 0);
    const x = cx + jitterX - canW * 0.5;

    // 1. Korpus ładunku wybuchowego (granat / bomba na pasie, bez dolnych dysz!)
    ctx.fillStyle = isArmed ? '#3f3f46' : '#27272a';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, canTopY, canW, canH, 0.9);
    else ctx.rect(x, canTopY, canW, canH);
    ctx.fill();
    ctx.stroke();

    // Opaska / świecący pierścień na ładunku
    ctx.save();
    if (isCharging) {
      ctx.shadowColor = flamePal.glow;
      ctx.shadowBlur = isArmed ? 10 : (3 + chargeRatio * 5);
    }
    ctx.fillStyle = isArmed ? '#ffffff' : (isCharging ? flamePal.light : flamePal.base);
    ctx.fillRect(x + 0.3, canTopY + 1.5, canW - 0.6, 1.4);
    ctx.restore();

    // Górny lont ładunku wystający ponad pas
    const fuseBaseX = cx + jitterX;
    const fuseTopY = canTopY - 1.4;
    ctx.strokeStyle = '#a1a1aa';
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(fuseBaseX, canTopY);
    ctx.lineTo(fuseBaseX + fDir * 0.5, fuseTopY);
    ctx.stroke();

    // 2. Płonący lont i żywy ogień unoszący się W GÓRĘ z ładunku podczas ładowania
    if (isCharging) {
      const fx = fuseBaseX + fDir * 0.5;
      const fy = fuseTopY;
      const wave = Math.sin(now * 0.035 + idx * 1.9);
      const flameH = isArmed ? (7.5 + Math.sin(now * 0.05 + idx) * 2.0) : (2.2 + Math.pow(chargeRatio, 1.3) * 4.8);
      const flameR = isArmed ? 2.8 : (1.1 + chargeRatio * 1.3);

      ctx.save();
      ctx.shadowColor = flamePal.glow;
      ctx.shadowBlur = isArmed ? 12 : (4 + chargeRatio * 5);

      // Zewnętrzny płomień unoszący się W GÓRĘ (kształt kropli ognia)
      ctx.fillStyle = flamePal.base;
      ctx.beginPath();
      ctx.moveTo(fx - flameR, fy);
      ctx.quadraticCurveTo(fx - flameR * 0.8, fy - flameH * 0.55, fx + wave * 1.2, fy - flameH);
      ctx.quadraticCurveTo(fx + flameR * 0.8, fy - flameH * 0.55, fx + flameR, fy);
      ctx.arc(fx, fy, flameR, 0, Math.PI, false);
      ctx.closePath();
      ctx.fill();

      // Jasny środek płomienia
      ctx.fillStyle = isArmed ? '#ffffff' : flamePal.light;
      ctx.beginPath();
      ctx.arc(fx + wave * 0.4, fy - flameH * 0.32, flameR * 0.58, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });

  ctx.restore();
}

/**
 * Rysuje spadające bomby oraz eksplozję ładunków na ziemi pod stopami Enforcera
 * (szeroka, kulista detonacja naziemna i kłęby dymu, bez pionowych strumieni rakietowych!)
 */
function drawEnforcerActiveBlasts(ctx, player) {
  const belt = player?.blastBelt;
  if (!belt || !belt.activeBlasts || belt.activeBlasts.length === 0) return;

  for (const b of belt.activeBlasts) {
    const pal = getJetpackFlamePalette(b.color || '#ef4444');

    ctx.save();

    // FAZA 1 (klatki 0..3): 3 podpalone ładunki wybuchowe spadają z pasa na ziemię pod stopami
    if (b.frame <= 3) {
      const dropT = Math.min(1.0, b.frame / 3.0);
      const offsets = [-12, 0, 12];
      for (const ox of offsets) {
        const curX = b.x + ox * (0.5 + 0.5 * dropT);
        const curY = b.beltY + (b.y - 4 - b.beltY) * (dropT * dropT);

        // Bryła spadającej bomby z rozżarzonym lontem
        ctx.fillStyle = '#27272a';
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(curX, curY, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = pal.glow;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(curX, curY - 1.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // FAZA 2 (klatki 2..22): Szeroka, kulista eksplozja bomb na podłożu
    if (b.frame >= 2 && b.frame <= 22) {
      const expT = (b.frame - 2) / 20.0;
      const alpha = Math.max(0, 1.0 - expT);

      // 1. Pierścień fali uderzeniowej po ziemi
      const ringRx = 18 + expT * 78;
      const ringRy = 4.5 + expT * 10.0;
      ctx.save();
      ctx.globalAlpha = alpha * 0.90;
      ctx.strokeStyle = expT < 0.30 ? '#ffffff' : pal.light;
      ctx.lineWidth = Math.max(1.2, 4.5 * (1.0 - expT));
      ctx.shadowColor = pal.glow;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.ellipse(b.x, b.y - 1, ringRx, ringRy, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Kulista eksplozja ognia na ziemi (3 nakładające się kule wybuchu C4)
      if (expT < 0.80) {
        const domeT = expT / 0.80;
        const domeAlpha = 1.0 - domeT;
        const fireCenters = [
          { dx: 0, dy: -6, r: 24 + domeT * 42 },
          { dx: -18 * (0.4 + domeT * 0.6), dy: -4, r: 16 + domeT * 28 },
          { dx: 18 * (0.4 + domeT * 0.6), dy: -4, r: 16 + domeT * 28 }
        ];

        for (const fc of fireCenters) {
          const cx = b.x + fc.dx;
          const cy = b.y + fc.dy;
          const fireGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, fc.r);
          fireGrad.addColorStop(0.0, `rgba(255, 255, 255, ${domeAlpha})`);
          fireGrad.addColorStop(0.32, pal.light);
          fireGrad.addColorStop(0.68, pal.base);
          fireGrad.addColorStop(1.0, pal.alphaZero);

          ctx.fillStyle = fireGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, fc.r, Math.PI, 0, false);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // FAZA 3 (klatki 3..40): Gęste, rozrastające się kłęby dymu prochowego po wybuchu na ziemi
    if (b.frame >= 3) {
      const smokeT = (b.frame - 3) / (b.maxFrames - 3);
      const smokeAlpha = Math.max(0, (1.0 - smokeT) * 0.72);
      const puffs = [-40, -27, -15, -6, 0, 7, 16, 28, 41];

      ctx.save();
      puffs.forEach((px, idx) => {
        const puffX = b.x + px * (0.45 + smokeT * 1.15);
        const puffY = b.y - 6 - smokeT * (24 + (idx % 3) * 14);
        const puffR = 11 + smokeT * (19 + (idx % 4) * 5);

        ctx.fillStyle = (idx % 2 === 0)
          ? `rgba(24, 24, 27, ${smokeAlpha.toFixed(3)})`
          : `rgba(63, 63, 70, ${(smokeAlpha * 0.82).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(puffX, puffY, puffR, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    ctx.restore();
  }
}

/**
 * Zamiast paska ładowania nad głową i bez żadnych płomieni w dół na kolana:
 * Rysuje naturalne płomienie i dym unoszące się W GÓRĘ z podpalonych ładunków na pasie
 * oraz sypiące się z lontów iskry, które płoną coraz mocniej w miarę trzymania góry (0..1000ms+).
 */
function drawEnforcerBeltChargeHUD(ctx, player) {
  if (!player || player._isCreatorDummy || player.isDead) return;
  const belt = player.blastBelt;
  if (!belt || !belt.isCharging) return;

  const ratio = Math.max(0, Math.min(1.0, belt.chargeRatio || 0));
  const isArmed = !!belt.isArmed;
  const flameColor = getEnforcerFlameColor(player);
  const pal = getJetpackFlamePalette(flameColor);
  const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();

  const centerX = player.x + (player.w || 30) / 2;
  const beltY = player.y + (player.h || 74) * 0.48;

  ctx.save();

  // 1. Gęste kłęby dymu unoszące się W GÓRĘ znad pasa podczas palenia się lontów
  const smokeClouds = isArmed ? 7 : Math.max(2, Math.ceil(ratio * 5));
  for (let i = 0; i < smokeClouds; i++) {
    const phase = ((now * 0.003 + i * (1 / smokeClouds)) % 1.0);
    const sway = Math.sin(now * 0.01 + i * 1.7) * (4 + phase * 8);
    const sx = centerX + ((i % 3) - 1) * 7 + sway;
    const sy = beltY - 4 - phase * (isArmed ? 34 : (14 + ratio * 16));
    const sr = (3.5 + phase * (isArmed ? 9.5 : 6.0)) * (0.45 + ratio * 0.55);
    const sAlpha = (1.0 - phase) * (isArmed ? 0.55 : (0.20 + ratio * 0.30));

    ctx.fillStyle = `rgba(24, 24, 27, ${sAlpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Naturalne języki ognia buchające W GÓRĘ z pasa (jak płonące ładunki / pochodnie, zero rakiet w dół!)
  const flamePositions = [-8, 0, 8];
  flamePositions.forEach((ox, idx) => {
    const fx = centerX + ox;
    const fy = beltY;
    const sway = Math.sin(now * 0.032 + idx * 2.2) * (isArmed ? 2.5 : 1.2);
    const pulse = 0.82 + 0.32 * Math.sin(now * 0.048 + idx * 1.9);
    const flameH = (isArmed ? 18 : (4 + Math.pow(ratio, 1.35) * 11)) * pulse;
    const flameW = isArmed ? 4.8 : (1.8 + ratio * 2.2);

    // Gradient skierowany W GÓRĘ (od pasa ku klatce piersiowej)
    const fGrad = ctx.createLinearGradient(fx, fy + 2, fx, fy - flameH);
    fGrad.addColorStop(0.0, '#ffffff');
    fGrad.addColorStop(0.35, pal.light);
    fGrad.addColorStop(0.75, pal.base);
    fGrad.addColorStop(1.0, pal.alphaZero);

    ctx.save();
    ctx.globalAlpha = isArmed ? 0.90 : (0.40 + ratio * 0.45);
    ctx.shadowColor = pal.glow;
    ctx.shadowBlur = isArmed ? 14 : (5 + ratio * 7);
    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.moveTo(fx - flameW, fy);
    ctx.quadraticCurveTo(fx - flameW * 0.7, fy - flameH * 0.55, fx + sway, fy - flameH);
    ctx.quadraticCurveTo(fx + flameW * 0.7, fy - flameH * 0.55, fx + flameW, fy);
    ctx.arc(fx, fy, flameW, 0, Math.PI, false);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  // 3. Iskry prochowe odpryskujące na boki i w górę z palących się lontów na pasie
  const sparkTotal = isArmed ? 8 : Math.ceil(ratio * 5);
  for (let s = 0; s < sparkTotal; s++) {
    const sPhase = ((now * 0.006 + s * 0.19) % 1.0);
    const angle = -Math.PI * (0.15 + ((s * 0.29) % 0.70)); // kierunek w górę i na boki
    const dist = sPhase * (isArmed ? 22 : (8 + ratio * 10));
    const spX = centerX + ((s % 3) - 1) * 7 + Math.cos(angle) * dist;
    const spY = beltY - 2 + Math.sin(angle) * dist + sPhase * sPhase * 6;

    ctx.fillStyle = (s % 2 === 0) ? '#ffffff' : pal.light;
    ctx.globalAlpha = 1.0 - sPhase;
    ctx.beginPath();
    ctx.arc(spX, spY, isArmed ? 1.5 : 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}


