// =========================================================================
// KLASA CIĘŻKA: ENFORCER – Kolos / Siła / Pas Ładunków Wybuchowych (Blast Belt)
// Specjalność: Skok odpalany przy puszczeniu kierunku w górę (W / drążek).
//              Przytrzymanie w górę przez min. 1000ms podpala ładunki na pasie,
//              które w momencie puszczenia uderzają w ziemię pod butami i
//              wystrzeliwują Enforcera wysoko na platformy!
// =========================================================================
import { triggerScreenShake, spawnJetpackSparks } from '../world.js';
import { getJetpackFlamePalette } from '../player/jetpack.js';

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
          // Przekroczono 1000ms: bomby na pasie są w pełni podpalone i gotowe do zrzutu pod buty!
          triggerScreenShake(2.2);
          emitBeltFuseSparks(player, 1.0, true, 12);
        } else {
          // Iskry i płomyki z podpalonych lontów na pasie
          emitBeltFuseSparks(player, belt.chargeRatio, belt.isArmed, belt.isArmed ? 3 : 2);
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
 * Emituje iskry i płomienie z podpalonych ładunków na pasie Enforcera podczas trzymania kierunku w górę
 */
function emitBeltFuseSparks(player, chargeRatio = 0.5, isArmed = false, count = 2) {
  if (typeof spawnJetpackSparks !== 'function') return;
  const customFlame = getEnforcerFlameColor(player);
  const colors = getJetpackFlamePalette(customFlame).particles;
  const facing = player.facing || 1;
  const centerX = player.x + (player.w || 30) / 2;
  const beltY = player.y + (player.h || 74) * 0.52;

  // Iskry sypiące się z kaset wybuchowych na pasie w dół ku butom
  const spreadX = (Math.random() - 0.5) * 18;
  const vx = (Math.random() - 0.5) * (isArmed ? 4.5 : 2.5);
  const vy = isArmed ? (2.5 + Math.random() * 3.5) : (1.0 + chargeRatio * 2.2);

  spawnJetpackSparks(
    centerX + spreadX,
    beltY,
    facing,
    count,
    colors,
    vx,
    vy,
    Math.PI * 0.5
  );
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

  // Potężny impuls pionowy (wystrzeliwuje Enforcera wysoko na każdą platformę)
  player.vy = -16.2;
  player.onGround = false;
  player.isJumping = true;
  player.coyoteTimer = 0;
  player.jumpSquatTimer = 0;
  player.jumpLaunchFloorY = currentFloor;
  player.jumpTakeoffTimer = 12;

  // Silny pęd poziomy w kierunku wychylenia (umożliwia dalekie wskakiwanie na platformy)
  const sprintMax = player.currentClass?.stats?.sprintMax || 5.6;
  if (Math.abs(dirX) > 0.12) {
    const launchVx = dirX * (sprintMax * 1.48);
    if (Math.sign(launchVx) === Math.sign(player.vx)) {
      player.vx = Math.sign(launchVx) * Math.max(Math.abs(player.vx) * 1.15, Math.abs(launchVx));
    } else {
      player.vx = launchVx;
    }
    player.facing = Math.sign(dirX) || player.facing;
    player.isSprintJump = true;
    player.sprintJumpTimer = 65;
  } else if (Math.abs(player.vx) > 0.4) {
    player.vx *= 1.18;
    player.isSprintJump = true;
    player.sprintJumpTimer = 55;
  }
  player.airVx = player.vx;
  player.jumpLaunchSpeed = Math.abs(player.vx);

  // Rejestracja wizualnej detonacji ładunków uderzających z pasa w ziemię pod butami
  const flameColor = getEnforcerFlameColor(player);
  belt.blastJumpTimer = 28;
  belt.pendingBallImpulse = true;
  belt.lastBlastX = centerX;
  belt.lastBlastY = currentFloor;
  belt.activeBlasts.push({
    x: centerX,
    y: currentFloor,
    beltY: beltY,
    frame: 0,
    maxFrames: 26,
    color: flameColor
  });

  // Mocny wstrząs kamery i snop ognia/odłamków pod stopami
  triggerScreenShake(9.5);
  const pal = getJetpackFlamePalette(flameColor);
  const colors = pal.particles;

  if (typeof spawnJetpackSparks === 'function') {
    // 1. Fala wybuchu rozchodząca się w lewo i w prawo po ziemi
    spawnJetpackSparks(centerX - 8, currentFloor - 2, -1, 14, colors, -9.2, -1.5, Math.PI, currentFloor);
    spawnJetpackSparks(centerX + 8, currentFloor - 2, 1, 14, colors, 9.2, -1.5, 0, currentFloor);
    // 2. Słup ognia wybuchający pionowo w górę pod butami
    spawnJetpackSparks(centerX, currentFloor - 4, player.facing || 1, 16, colors, 0, -8.0, -Math.PI * 0.5);
  }

  const grassFn = spawnGrass || player._spawnGrass;
  if (typeof grassFn === 'function' && currentFloor) {
    for (let i = 0; i < 8; i++) {
      grassFn(centerX + (i - 3.5) * 7, currentFloor, (i % 2 === 0) ? 1 : -1);
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
      if (dist < 120) {
        const power = 1.0 - (dist / 120);
        const pushDirX = Math.abs(dx) > 4 ? Math.sign(dx) : (player.facing || 1);
        ball.vx += pushDirX * (8.0 + 12.0 * power);
        ball.vy = Math.min(ball.vy, -(10.0 + 10.0 * power));
      }
    }
  }

  // Smuga dymu i iskier ciągnąca się za butami Enforcera po wystrzeleniu wybuchem
  if (belt.blastJumpTimer > 0) {
    belt.blastJumpTimer--;
    if (player.vy < 0 && typeof spawnJetpackSparks === 'function' && (belt.blastJumpTimer % 2 === 0)) {
      const customFlame = getEnforcerFlameColor(player);
      const colors = getJetpackFlamePalette(customFlame).particles;
      const footX = player.x + (player.w || 30) / 2;
      const footY = player.y + (player.h || 74) - 2;
      spawnJetpackSparks(footX, footY, player.facing || 1, 2, colors, -player.vx * 0.3, 3.5, Math.PI * 0.5);
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
 * Rysuje Pas Ładunków Wybuchowych (3 pancerne kasety C4/termitowe z zapalnikami) na pasie taktycznym Enforcera
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
    const jitterX = isArmed ? Math.sin(now * 0.06 + idx * 2.1) * 0.45 : 0;
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
      ctx.shadowBlur = isArmed ? 8 : (3 + chargeRatio * 4);
    }
    ctx.fillStyle = isArmed ? '#ffffff' : (isCharging ? flamePal.light : flamePal.base);
    ctx.fillRect(x + 0.4, canTopY + 1.4, canW - 0.8, 1.5);
    ctx.restore();

    // Dolna dysza wyrzutnika skierowana pionowo w dół ku butom
    ctx.fillStyle = '#09090b';
    ctx.fillRect(x + 0.5, canTopY + canH, canW - 1.0, 0.9);

    // 3. Płonący lont / iskrownik pod kasetą podczas przytrzymania kierunku w górę
    if (isCharging) {
      const nozzleX = cx + jitterX;
      const nozzleY = canTopY + canH + 0.9;
      const flameLen = (1.8 + chargeRatio * 3.8) * (0.85 + 0.3 * Math.sin(now * 0.04 + idx));

      ctx.save();
      ctx.shadowColor = flamePal.glow;
      ctx.shadowBlur = isArmed ? 10 : 5;

      // Język ognia pod ładunkiem na pasie
      ctx.fillStyle = isArmed ? '#ffffff' : flamePal.light;
      ctx.beginPath();
      ctx.moveTo(nozzleX - 1.1, nozzleY);
      ctx.lineTo(nozzleX, nozzleY + flameLen);
      ctx.lineTo(nozzleX + 1.1, nozzleY);
      ctx.closePath();
      ctx.fill();

      // Iskry odpryskujące z podpalonego ładunku
      ctx.fillStyle = flamePal.base;
      ctx.beginPath();
      ctx.arc(nozzleX + Math.sin(now * 0.03 + idx) * 1.6, nozzleY + flameLen * 0.7, 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });

  ctx.restore();
}

/**
 * Rysuje uderzające z pasa w ziemię ładunki oraz eksplozję pod butami Enforcera
 */
function drawEnforcerActiveBlasts(ctx, player) {
  const belt = player?.blastBelt;
  if (!belt || !belt.activeBlasts || belt.activeBlasts.length === 0) return;

  for (const b of belt.activeBlasts) {
    const t = b.frame / b.maxFrames;
    const pal = getJetpackFlamePalette(b.color || '#ef4444');

    ctx.save();

    // FAZA 1 (klatki 0..4): 3 uzbrojone bomby wystrzeliwują z pasa pionowo w ziemię pod butami
    if (b.frame <= 4) {
      const dropT = Math.min(1.0, b.frame / 3.0);
      const offsets = [-11, 0, 11];
      for (const ox of offsets) {
        const startX = b.x + ox * 0.65;
        const endX = b.x + ox;
        const curX = startX + (endX - startX) * dropT;
        const curY = b.beltY + (b.y - 3 - b.beltY) * dropT;

        // Smuga uderzeniowa z pasa do ziemi
        const trailGrad = ctx.createLinearGradient(startX, b.beltY, curX, curY);
        trailGrad.addColorStop(0.0, pal.alphaZero);
        trailGrad.addColorStop(0.5, pal.base);
        trailGrad.addColorStop(1.0, '#ffffff');

        ctx.strokeStyle = trailGrad;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(startX, b.beltY);
        ctx.lineTo(curX, curY);
        ctx.stroke();

        // Rozżarzony ładunek uderzający w podłoże
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = pal.glow;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(curX, curY, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // FAZA 2 (klatki 1..16): Potężna eksplozja ładunków na ziemi pod stopami
    if (b.frame >= 1 && b.frame <= 16) {
      const expT = (b.frame - 1) / 15.0;
      const alpha = Math.max(0, 1.0 - expT);

      // 1. Pierścień fali uderzeniowej rozchodzący się po ziemi
      const ringRx = 12 + expT * 52;
      const ringRy = 3.5 + expT * 7.5;
      ctx.save();
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = expT < 0.35 ? '#ffffff' : pal.light;
      ctx.lineWidth = Math.max(1.0, 3.8 * (1.0 - expT));
      ctx.shadowColor = pal.glow;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(b.x, b.y - 1, ringRx, ringRy, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Kula ognia pod butami (potrójna kopuła wybuchu)
      if (expT < 0.75) {
        const domeT = expT / 0.75;
        const domeAlpha = 1.0 - domeT;
        const domeR = 14 + domeT * 26;

        const fireGrad = ctx.createRadialGradient(b.x, b.y - 4, 2, b.x, b.y - 6, domeR);
        fireGrad.addColorStop(0.0, `rgba(255, 255, 255, ${domeAlpha})`);
        fireGrad.addColorStop(0.35, pal.light);
        fireGrad.addColorStop(0.70, pal.base);
        fireGrad.addColorStop(1.0, pal.alphaZero);

        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(b.x, b.y - 2, domeR, Math.PI, 0, false);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // FAZA 3 (klatki 4..26): Gęste kłęby dymu prochowego po wybuchu
    if (b.frame >= 4) {
      const smokeT = (b.frame - 4) / (b.maxFrames - 4);
      const smokeAlpha = Math.max(0, (1.0 - smokeT) * 0.55);
      const puffs = [-24, -10, 0, 12, 26];

      ctx.save();
      ctx.fillStyle = `rgba(24, 24, 27, ${smokeAlpha.toFixed(3)})`;
      puffs.forEach((px, idx) => {
        const puffX = b.x + px * (0.5 + smokeT * 0.9);
        const puffY = b.y - 4 - smokeT * (14 + (idx % 2) * 8);
        const puffR = 7 + smokeT * (12 + (idx % 3) * 4);
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
 * Rysuje wskaźnik podpalania bomb (0..1000ms) oraz wiązki celownicze pod buty podczas trzymania W / drążka w górę
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

  // 1. Gdy ładunki są uzbrojone (>= 1000ms), rysuj gorące linie zrzutu z pasa prosto pod buty
  if (isArmed || ratio > 0.65) {
    const lineAlpha = isArmed ? (0.55 + 0.35 * Math.sin(now * 0.025)) : ((ratio - 0.65) / 0.35) * 0.4;
    ctx.strokeStyle = isArmed ? pal.light : pal.base;
    ctx.globalAlpha = lineAlpha;
    ctx.lineWidth = isArmed ? 1.6 : 1.0;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(centerX - 7, beltY);
    ctx.lineTo(centerX - 10, floorY - 2);
    ctx.moveTo(centerX + 7, beltY);
    ctx.lineTo(centerX + 10, floorY - 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pulsujący krąg detonacji pod stopami
    ctx.beginPath();
    ctx.ellipse(centerX, floorY - 1, 14 + (isArmed ? Math.sin(now * 0.03) * 2 : 0), 3.2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 2. Kompaktowy pasek zapłonu lontu nad głową / obok pasa
  const barW = 34;
  const barH = 4.5;
  const barX = centerX - barW / 2;
  const barY = player.y - 14;

  ctx.globalAlpha = 0.92;
  ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
  ctx.strokeStyle = isArmed ? '#facc15' : 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(barX, barY, barW, barH, 2);
  else ctx.rect(barX, barY, barW, barH);
  ctx.fill();
  ctx.stroke();

  // Wypełnienie paska lontu
  const fillW = Math.max(2, barW * ratio);
  ctx.fillStyle = isArmed ? (Math.floor(now / 90) % 2 === 0 ? '#facc15' : pal.light) : pal.base;
  if (isArmed) {
    ctx.shadowColor = pal.glow;
    ctx.shadowBlur = 8;
  }
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(barX, barY, fillW, barH, 2);
  else ctx.rect(barX, barY, fillW, barH);
  ctx.fill();

  // Iskra na końcu palącego się lontu
  const sparkX = barX + fillW;
  const sparkY = barY + barH / 2;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(sparkX, sparkY, isArmed ? 2.6 : 2.0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
