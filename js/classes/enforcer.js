// =========================================================================
// KLASA: TARAN (ENFORCER) – Kolos / Siła / Rzeźbiona muskulatura
// =========================================================================
import { triggerScreenShake } from '../world.js?v=v64_jetpack_flight_hover';

export const EnforcerClass = {
  id: 'ENFORCER',
  name: 'Enforcer',
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
    jumpForce: 8.5,         // Cięższy skok
    slideDashSpeed: 18.5,   // Wybuchowy dash z darni
    chargeSpeed: 0.024,
    hitReach: 64,           // Duży zasięg dzięki długości kończyn
    whiffReach: 94,
    baseKickSpeed: 30.0,
    kickPowerMult: 1.52,    // Najpotężniejsze uderzenie w grze
    spinMult: 0.30,         // Prawie czysta trajektoria balistyczna
    jetMax: 55,             // Paliwo jetpacka szybko się zużywa
    spartanKnockback: 18.0, // Potężny odrzut kinetyczny i twardy knockback
    spartanStagger: 28,     // Długi czas oszołomienia przeciwnika (~460ms)
    spartanDamage: 18,
    kickForce: 1.15,
    kickForceMultiplier: 1.15,
    knockback: 1.50,
    knockbackMultiplier: 1.50,
    kickCooldown: 0.70
  },

  // 3. WŁAŚCIWOŚCI WIZUALNE: RZEŹBIONA ANATOMIA I BRAK RĘKAWKÓW
  visuals: {
    sculptedMuscles: true,     // Aktywuje asymetryczne krzywe brzuśców mięśniowych
    muscleMult: 1.40,          // +40% do obwodów ramion, barków i nóg
    sleeveless: true,          // Odsłonięte ramiona (tank-top bez rękawków)
    sleeveLengthMult: 0.0,

    hasWristband: true,        // Jasny bandaż bokserski na dłoniach
    wristbandColor: '#f8fafc', // Jasny bandaż bokserski kontrastujący z ciemnoczerwoną koszulką
    hasHeadband: false,        // Brak opaski (krótko ścięte ciemne włosy)

    hairColor0: '#09090b',
    hairColor1: '#18181b',
    hairColor2: '#27272a',

    // Ciemne spodenki bojowe zamiast bieli
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
    player.jetFuel = this.stats.jetMax;
    player.jetMax = this.stats.jetMax;
  },

  onDestroy(player) {},

  onUpdate(player, ball, keys) {},
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

  onDrawUnder(ctx, player) {},
  onDrawOverlay(ctx, player) {}
};
