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
          // Przekroczono 1000ms: ładunki na pasie wybuchają pełnym płomieniem (bez paska HUD - czysty ogień i dym!)
          triggerScreenShake(3.2);
          const centerX = player.x + (player.w || 30) / 2;
          const beltY = player.y + (player.h || 74) * 0.52;
          emitBeltFuseSparks(player, 1.0, true, 20);
          if (typeof spawnExplosionFirePuff === 'function') {
            spawnExplosionFirePuff(centerX, beltY + 2, 7);
          }
          if (typeof spawnHeavySmokePuff === 'function') {
            spawnHeavySmokePuff(centerX, beltY - 4, 6);
          }
        } else {
          // Narastający ogień, iskry i dym z podpalonych ładunków na pasie
          const sparkCount = belt.isArmed ? 6 : (1 + Math.floor(belt.chargeRatio * 4));
          emitBeltFuseSparks(player, belt.chargeRatio, belt.isArmed, sparkCount);
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
        // Przytrzymano >= 1000ms -> ładunki z pasa uderzają w ziemię pod butami i wysadzają Enforcera wysoko!
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
 * Emituje narastający ogień, iskry i gęsty dym z podpalonych ładunków na pasie Enforcera podczas trzymania kierunku w górę
 */
function emitBeltFuseSparks(player, chargeRatio = 0.5, isArmed = false, count = 2) {
  const customFlame = getEnforcerFlameColor(player);
  const colors = getJetpackFlamePalette(customFlame).particles;
  const facing = player.facing || 1;
  const centerX = player.x + (player.w || 30) / 2;
  const beltY = player.y + (player.h || 74) * 0.52;

  if (typeof spawnJetpackSparks === 'function') {
    // Iskry i języki ognia sypiące się z kaset wybuchowych na pasie w dół ku butom
    const spreadX = (Math.random() - 0.5) * (16 + chargeRatio * 10);
    const vx = (Math.random() - 0.5) * (isArmed ? 6.2 : (2.2 + chargeRatio * 2.5));
    const vy = isArmed ? (3.2 + Math.random() * 4.5) : (1.2 + chargeRatio * 2.8);

    spawnJetpackSparks(
      centerX + spreadX,
      beltY + 2,
      facing,
      count,
      colors,
      vx,
      vy,
      Math.PI * 0.5
    );
  }

  // Dodatkowe kłęby dymu i buchający ogień na pasie w miarę rozpalania ładunków
  if (isArmed) {
    if (Math.random() < 0.45 && typeof spawnExplosionFirePuff === 'function') {
      spawnExplosionFirePuff(centerX + (Math.random() - 0.5) * 14, beltY + 4, 1);
    }
    if (Math.random() < 0.55 && typeof spawnHeavySmokePuff === 'function') {
      spawnHeavySmokePuff(centerX + (Math.random() - 0.5) * 16, beltY - 2, 1);
    }
  } else if (chargeRatio > 0.35 && Math.random() < chargeRatio * 0.40) {
    if (typeof spawnHeavySmokePuff === 'function') {
      spawnHeavySmokePuff(centerX + (Math.random() - 0.5) * 12, beltY - 2, 1);
    }
  }
}

/**
 * Odpala Wybuchowy Skok Enforcera (Blast Jump):
 * Podpalone ładunki z pasa uderzają w ziemię pod butami i eksplodują, wyrzucając kolosa wysoko na platformy!
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
  const beltY = player.y + (player.h || 74) * 0.52;

  // Potężny impuls pionowy (+30% wyższy wyskok wybuchowy: vy = -20.2 zamiast -16.2)
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

  // Rejestracja wizualnej detonacji ładunków uderzających z pasa w ziemię pod butami
  const flameColor = getEnforcerFlameColor(player);
  belt.blastJumpTimer = 38;
  belt.pendingBallImpulse = true;
  belt.lastBlastX = centerX;
  belt.lastBlastY = currentFloor;
  belt.activeBlasts.push({
    x: centerX,
    y: currentFloor,
    beltY: beltY,
    frame: 0,
    maxFrames: 38,
    color: flameColor
  });

  // Potężny wstrząs kamery oraz masywna chmura ognia, dymu i iskier pod butami
  triggerScreenShake(12.0);
  const pal = getJetpackFlamePalette(flameColor);
  const colors = pal.particles;

  if (typeof spawnShockwaveRing === 'function') {
    spawnShockwaveRing(centerX, currentFloor - 4);
  }
  if (typeof spawnExplosionFirePuff === 'function') {
    spawnExplosionFirePuff(centerX, currentFloor - 8, 22);
    spawnExplosionFirePuff(centerX - 14, currentFloor - 4, 8);
    spawnExplosionFirePuff(centerX + 14, currentFloor - 4, 8);
  }
  if (typeof spawnHeavySmokePuff === 'function') {
    spawnHeavySmokePuff(centerX, currentFloor - 6, 20);
    spawnHeavySmokePuff(centerX - 18, currentFloor - 4, 8);
    spawnHeavySmokePuff(centerX + 18, currentFloor - 4, 8);
  }
  if (typeof spawnStretchedSparks === 'function') {
    spawnStretchedSparks(centerX, currentFloor - 6, 32);
  }
  if (typeof spawnGroundPuff === 'function') {
    spawnGroundPuff(centerX - 16, currentFloor);
    spawnGroundPuff(centerX, currentFloor);
    spawnGroundPuff(centerX + 16, currentFloor);
  }

  if (typeof spawnJetpackSparks === 'function') {
    // 1. Fala wybuchu rozchodząca się szeroko w lewo i w prawo po ziemi
    spawnJetpackSparks(centerX - 10, currentFloor - 2, -1, 22, colors, -11.0, -2.0, Math.PI, currentFloor);
    spawnJetpackSparks(centerX + 10, currentFloor - 2, 1, 22, colors, 11.0, -2.0, 0, currentFloor);
    // 2. Potężny słup ognia wybuchający pionowo w górę pod butami
    spawnJetpackSparks(centerX, currentFloor - 4, player.facing || 1, 28, colors, 0, -10.5, -Math.PI * 0.5);
  }

  const grassFn = spawnGrass || player._spawnGrass;
  if (typeof grassFn === 'function' && currentFloor) {
    for (let i = 0; i < 10; i++) {
      grassFn(centerX + (i - 4.5) * 7, currentFloor, (i % 2 === 0) ? 1 : -1);
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

  // Gęsty warkocz ognia, dymu prochowego i iskier ciągnący się za butami Enforcera podczas lotu w górę
  if (belt.blastJumpTimer > 0) {
    belt.blastJumpTimer--;
    if (player.vy < 1.5) {
      const customFlame = getEnforcerFlameColor(player);
      const colors = getJetpackFlamePalette(customFlame).particles;
      const footX = player.x + (player.w || 30) / 2;
      const footY = player.y + (player.h || 74) - 2;

      if (typeof spawnJetpackSparks === 'function') {
        spawnJetpackSparks(footX + (Math.random() - 0.5) * 10, footY, player.facing || 1, 3, colors, -player.vx * 0.35, 4.2, Math.PI * 0.5);
      }
      if (belt.blastJumpTimer % 2 === 0 && typeof spawnHeavySmokePuff === 'function') {
        spawnHeavySmokePuff(footX + (Math.random() - 0.5) * 8, footY + 2, 2);
      }
      if (belt.blastJumpTimer > 18 && belt.blastJumpTimer % 2 === 1 && typeof spawnExplosionFirePuff === 'function') {
        spawnExplosionFirePuff(footX + (Math.random() - 0.5) * 6, footY, 2);
      }
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
 * Rysuje Pas Ładunków Wybuchowych (3 pancerne kasety C4/termitowe z zapalnikami) na pasie taktycznym Enforcera.
 * Zamiast paska nad głową: płomienie na pasie narastają wizualnie wraz z trzymaniem góry i buchają żywym ogniem po uzbrojeniu!
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

  // Gorąca łuna wokół całego pasa narastająca wraz z rozpalaniem ładunków
  if (isCharging && chargeRatio > 0.15) {
    const auraR = (waistHalfW * 1.4) + (isArmed ? 8 + Math.sin(now * 0.04) * 3 : chargeRatio * 5);
    const beltMidY = (beltTopY + beltBotY) * 0.5 + 2;
    const auraGrad = ctx.createRadialGradient(0, beltMidY, 1, 0, beltMidY, auraR);
    auraGrad.addColorStop(0.0, isArmed ? 'rgba(255, 255, 255, 0.65)' : flamePal.light);
    auraGrad.addColorStop(0.45, flamePal.base);
    auraGrad.addColorStop(1.0, flamePal.alphaZero);

    ctx.save();
    ctx.globalAlpha = isArmed ? 0.75 : (0.20 + chargeRatio * 0.45);
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.ellipse(0, beltMidY, auraR, auraR * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Pozycje 3 ładunków wybuchowych zamontowanych w uchwytach wzdłuż pasa
  const canisterOffsets = [
    -fDir * (waistHalfW * 0.68),
    -fDir * (waistHalfW * 0.10),
    fDir * (waistHalfW * 0.78)
  ];

  const canW = 2.8;
  const canH = 4.8;
  const canTopY = beltTopY - 0.7;

  canisterOffsets.forEach((cx, idx) => {
    const jitterX = isArmed
      ? Math.sin(now * 0.08 + idx * 2.1) * 0.65
      : (isCharging ? Math.sin(now * 0.04 + idx) * chargeRatio * 0.3 : 0);
    const x = cx + jitterX - canW * 0.5;

    // 1. Pancerna obudowa ładunku wybuchowego
    ctx.fillStyle = '#27272a';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, canTopY, canW, canH, 0.7);
    else ctx.rect(x, canTopY, canW, canH);
    ctx.fill();
    ctx.stroke();

    // Górna stalowa głowica zawleczki
    ctx.fillStyle = '#71717a';
    ctx.fillRect(x + 0.3, canTopY - 0.5, canW - 0.6, 0.8);

    // 2. Rdzeń termiczny / wskaźnik uzbrojenia ładunku
    ctx.save();
    if (isCharging) {
      ctx.shadowColor = flamePal.glow;
      ctx.shadowBlur = isArmed ? 12 : (4 + chargeRatio * 6);
    }
    ctx.fillStyle = isArmed ? '#ffffff' : (isCharging ? flamePal.light : flamePal.base);
    ctx.fillRect(x + 0.4, canTopY + 1.4, canW - 0.8, 1.5);
    ctx.restore();

    // Dolna dysza wyrzutnika skierowana pionowo w dół ku butom
    ctx.fillStyle = '#09090b';
    ctx.fillRect(x + 0.5, canTopY + canH, canW - 1.0, 0.9);

    // 3. Narastający płomień i dym pod kasetą (pokazuje stopień naładowania zamiast paska nad głową!)
    if (isCharging) {
      const nozzleX = cx + jitterX;
      const nozzleY = canTopY + canH + 0.9;
      const flicker = 0.82 + 0.36 * Math.sin(now * 0.055 + idx * 1.7);
      const baseLen = isArmed ? 13.5 : (2.2 + Math.pow(chargeRatio, 1.35) * 9.0);
      const flameLen = baseLen * flicker;
      const halfW = isArmed ? 2.8 : (1.1 + chargeRatio * 1.4);

      ctx.save();

      // Kłęby ciemnego dymu prochowego unoszące się znad rozpalonych dysz
      const smokeCount = isArmed ? 3 : (chargeRatio > 0.35 ? 2 : 1);
      for (let s = 0; s < smokeCount; s++) {
        const sPhase = ((now * 0.004 + idx * 0.33 + s * 0.45) % 1.0);
        const smokeX = nozzleX + Math.sin(now * 0.015 + idx + s * 2) * (1.5 + sPhase * 3.5);
        const smokeY = canTopY - sPhase * (isArmed ? 10.0 : (4.0 + chargeRatio * 5.0));
        const smokeR = (1.4 + sPhase * (isArmed ? 3.2 : 2.0)) * (0.4 + chargeRatio * 0.6);
        const smokeAlpha = (1.0 - sPhase) * (isArmed ? 0.55 : (0.20 + chargeRatio * 0.30));

        ctx.fillStyle = `rgba(24, 24, 27, ${smokeAlpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(smokeX, smokeY, smokeR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Zewnętrzny płaszcz ognia (szeroki, buchający płomień)
      ctx.shadowColor = flamePal.glow;
      ctx.shadowBlur = isArmed ? 14 : (5 + chargeRatio * 6);
      ctx.fillStyle = flamePal.base;
      ctx.beginPath();
      ctx.moveTo(nozzleX - halfW, nozzleY);
      ctx.quadraticCurveTo(nozzleX - halfW * 0.6, nozzleY + flameLen * 0.6, nozzleX, nozzleY + flameLen);
      ctx.quadraticCurveTo(nozzleX + halfW * 0.6, nozzleY + flameLen * 0.6, nozzleX + halfW, nozzleY);
      ctx.closePath();
      ctx.fill();

      // Środkowy, jasny język ognia
      const midW = halfW * 0.68;
      const midLen = flameLen * 0.78;
      ctx.fillStyle = flamePal.light;
      ctx.beginPath();
      ctx.moveTo(nozzleX - midW, nozzleY);
      ctx.lineTo(nozzleX, nozzleY + midLen);
      ctx.lineTo(nozzleX + midW, nozzleY);
      ctx.closePath();
      ctx.fill();

      // Biało-żółty gorący rdzeń (szczególnie intensywny po pełnym rozpaleniu >= 1000ms)
      if (chargeRatio > 0.4 || isArmed) {
        const coreW = halfW * (isArmed ? 0.45 : 0.30);
        const coreLen = flameLen * (isArmed ? 0.58 : 0.42);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(nozzleX - coreW, nozzleY);
        ctx.lineTo(nozzleX, nozzleY + coreLen);
        ctx.lineTo(nozzleX + coreW, nozzleY);
        ctx.closePath();
        ctx.fill();
      }

      // Odpryskujące iskry termitowe pod płomieniem
      const sparkCountVis = isArmed ? 3 : 1;
      for (let sp = 0; sp < sparkCountVis; sp++) {
        const spX = nozzleX + Math.sin(now * 0.045 + idx * 2 + sp * 2.3) * (halfW * 1.3);
        const spY = nozzleY + flameLen * (0.55 + ((now * 0.01 + sp * 0.37) % 0.55));
        ctx.fillStyle = (sp % 2 === 0 && isArmed) ? '#ffffff' : flamePal.light;
        ctx.beginPath();
        ctx.arc(spX, spY, isArmed ? 1.05 : 0.75, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  });

  ctx.restore();
}

/**
 * Rysuje uderzające z pasa w ziemię ładunki oraz potężną eksplozję ognia i dymu pod butami Enforcera
 */
function drawEnforcerActiveBlasts(ctx, player) {
  const belt = player?.blastBelt;
  if (!belt || !belt.activeBlasts || belt.activeBlasts.length === 0) return;

  for (const b of belt.activeBlasts) {
    const pal = getJetpackFlamePalette(b.color || '#ef4444');

    ctx.save();

    // FAZA 1 (klatki 0..5): 3 uzbrojone bomby wystrzeliwują z pasa pionowo w ziemię pod butami
    if (b.frame <= 5) {
      const dropT = Math.min(1.0, b.frame / 3.5);
      const offsets = [-13, 0, 13];
      for (const ox of offsets) {
        const startX = b.x + ox * 0.65;
        const endX = b.x + ox;
        const curX = startX + (endX - startX) * dropT;
        const curY = b.beltY + (b.y - 3 - b.beltY) * dropT;

        // Gruba smuga ogniowa z pasa do ziemi
        const trailGrad = ctx.createLinearGradient(startX, b.beltY, curX, curY);
        trailGrad.addColorStop(0.0, pal.alphaZero);
        trailGrad.addColorStop(0.4, pal.base);
        trailGrad.addColorStop(0.8, pal.light);
        trailGrad.addColorStop(1.0, '#ffffff');

        ctx.strokeStyle = trailGrad;
        ctx.lineWidth = 3.8;
        ctx.beginPath();
        ctx.moveTo(startX, b.beltY);
        ctx.lineTo(curX, curY);
        ctx.stroke();

        // Rozżarzony ładunek uderzający w podłoże
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = pal.glow;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(curX, curY, 3.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // FAZA 2 (klatki 1..22): Potężna eksplozja ognia na ziemi pod stopami
    if (b.frame >= 1 && b.frame <= 22) {
      const expT = (b.frame - 1) / 21.0;
      const alpha = Math.max(0, 1.0 - expT);

      // 1. Podwójny pierścień fali uderzeniowej rozchodzący się szeroko po ziemi
      const ringRx = 16 + expT * 74;
      const ringRy = 4.5 + expT * 10.5;
      ctx.save();
      ctx.globalAlpha = alpha * 0.92;
      ctx.strokeStyle = expT < 0.35 ? '#ffffff' : pal.light;
      ctx.lineWidth = Math.max(1.2, 4.8 * (1.0 - expT));
      ctx.shadowColor = pal.glow;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.ellipse(b.x, b.y - 1, ringRx, ringRy, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Pionowy słup ognia wystrzeliwujący w górę za Enforcerem
      if (expT < 0.65) {
        const pillarT = expT / 0.65;
        const pillarH = 28 + pillarT * 78;
        const pillarW = (18 - pillarT * 8);
        const pillarGrad = ctx.createLinearGradient(b.x, b.y - 2, b.x, b.y - pillarH);
        pillarGrad.addColorStop(0.0, '#ffffff');
        pillarGrad.addColorStop(0.35, pal.light);
        pillarGrad.addColorStop(0.75, pal.base);
        pillarGrad.addColorStop(1.0, pal.alphaZero);

        ctx.globalAlpha = (1.0 - pillarT) * 0.85;
        ctx.fillStyle = pillarGrad;
        ctx.beginPath();
        ctx.moveTo(b.x - pillarW, b.y - 2);
        ctx.quadraticCurveTo(b.x, b.y - pillarH * 1.15, b.x + pillarW, b.y - 2);
        ctx.closePath();
        ctx.fill();
      }

      // 3. Masywna kula ognia pod butami (wielowarstwowa kopuła wybuchu)
      if (expT < 0.82) {
        const domeT = expT / 0.82;
        const domeAlpha = 1.0 - domeT;
        const domeR = 20 + domeT * 42;

        const fireGrad = ctx.createRadialGradient(b.x, b.y - 5, 3, b.x, b.y - 8, domeR);
        fireGrad.addColorStop(0.0, `rgba(255, 255, 255, ${domeAlpha})`);
        fireGrad.addColorStop(0.30, pal.light);
        fireGrad.addColorStop(0.68, pal.base);
        fireGrad.addColorStop(1.0, pal.alphaZero);

        ctx.globalAlpha = 1.0;
        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(b.x, b.y - 2, domeR, Math.PI, 0, false);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // FAZA 3 (klatki 2..38): Gęste, wielowarstwowe kłęby czarnego i szarego dymu prochowego po wybuchu
    if (b.frame >= 2) {
      const smokeT = (b.frame - 2) / (b.maxFrames - 2);
      const smokeAlpha = Math.max(0, (1.0 - smokeT) * 0.72);
      const puffs = [-38, -26, -15, -6, 0, 7, 16, 27, 39];

      ctx.save();
      puffs.forEach((px, idx) => {
        const puffX = b.x + px * (0.45 + smokeT * 1.15);
        const puffY = b.y - 5 - smokeT * (22 + (idx % 3) * 14);
        const puffR = 10 + smokeT * (18 + (idx % 4) * 5);

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
 * Zamiast paska ładowania nad głową: rysuje buchające języki ognia, żar i gęsty dym wokół pasa
 * Enforcera, które palą się coraz mocniej w miarę trzymania kierunku w górę (0..1000ms+).
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
  const beltY = player.y + (player.h || 74) * 0.52;
  const floorY = player.currentGroundY || player.groundY || (player.y + (player.h || 74));

  ctx.save();

  // 1. Kłęby dymu unoszące się wokół pasa podczas palenia się lontów
  const smokeClouds = isArmed ? 6 : Math.max(2, Math.ceil(ratio * 4));
  for (let i = 0; i < smokeClouds; i++) {
    const phase = ((now * 0.0032 + i * (1 / smokeClouds)) % 1.0);
    const side = (i % 2 === 0 ? -1 : 1);
    const sx = centerX + side * (5 + phase * 14) + Math.sin(now * 0.012 + i) * 3;
    const sy = beltY - 2 - phase * (isArmed ? 28 : (12 + ratio * 12));
    const sr = (3.5 + phase * (isArmed ? 8.5 : 5.5)) * (0.45 + ratio * 0.55);
    const sAlpha = (1.0 - phase) * (isArmed ? 0.52 : (0.18 + ratio * 0.28));

    ctx.fillStyle = `rgba(24, 24, 27, ${sAlpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Buchające z pasa języki ognia (im bliżej 1000ms, tym mocniej i niżej ku butom płoną!)
  const nozzleOffsets = [-9, 0, 9];
  nozzleOffsets.forEach((ox, idx) => {
    const nx = centerX + ox + (isArmed ? Math.sin(now * 0.07 + idx) * 1.2 : 0);
    const ny = beltY + 3;
    const pulse = 0.80 + 0.35 * Math.sin(now * 0.05 + idx * 2.1);
    const flameLen = (isArmed ? 22 : (4 + Math.pow(ratio, 1.4) * 14)) * pulse;
    const flameW = isArmed ? 5.2 : (1.8 + ratio * 2.6);

    const fGrad = ctx.createLinearGradient(nx, ny, nx, ny + flameLen);
    fGrad.addColorStop(0.0, '#ffffff');
    fGrad.addColorStop(0.35, pal.light);
    fGrad.addColorStop(0.75, pal.base);
    fGrad.addColorStop(1.0, pal.alphaZero);

    ctx.save();
    ctx.globalAlpha = isArmed ? 0.92 : (0.45 + ratio * 0.45);
    ctx.shadowColor = pal.glow;
    ctx.shadowBlur = isArmed ? 16 : (6 + ratio * 8);
    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.moveTo(nx - flameW, ny);
    ctx.quadraticCurveTo(nx - flameW * 0.5, ny + flameLen * 0.65, nx, ny + flameLen);
    ctx.quadraticCurveTo(nx + flameW * 0.5, ny + flameLen * 0.65, nx + flameW, ny);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  // 3. Gdy ładunki są w pełni rozpalone (>= 1000ms), ogień liże już ziemię pod butami Enforcera
  if (isArmed) {
    const groundFireR = 16 + Math.sin(now * 0.04) * 4;
    const gGrad = ctx.createRadialGradient(centerX, floorY - 2, 2, centerX, floorY - 2, groundFireR);
    gGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.75)');
    gGrad.addColorStop(0.45, pal.light);
    gGrad.addColorStop(0.80, pal.base);
    gGrad.addColorStop(1.0, pal.alphaZero);

    ctx.fillStyle = gGrad;
    ctx.beginPath();
    ctx.ellipse(centerX, floorY - 1, groundFireR * 1.25, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

