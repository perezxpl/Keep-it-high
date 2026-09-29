// =========================================================================
// KLASA: TARAN (ENFORCER) – Czołg / Siła
// Specjalność: Ekstremalnie silne kopnięcie z efektem niskiej grawitacji,
//              wybuchowy wślizg wzbijający pyłem trawiasty ślad,
//              wolniejszy sprint ale wyższy slideDashSpeed.
// =========================================================================
export const EnforcerClass = {
  id: 'ENFORCER',
  name: 'Taran',
  role: 'Czołg / Siła',

  // 1. Statystyki fizyczne i ruchowe
  stats: {
    walkMax: 1.9,
    jogMax: 3.8,
    sprintMax: 6.2,
    accel: 0.19,
    decel: 0.84,
    slideDecel: 0.985,
    jumpForce: 9.2,
    slideDashSpeed: 16.5,
    chargeSpeed: 0.028,
    hitReach: 56,
    whiffReach: 86,
    baseKickSpeed: 13.0,
    kickPowerMult: 1.38,
    spinMult: 0.5,
    jetMax: 65
  },

  // 2. Kolorystyka i dane wizualne renderera
  visuals: {
    jerseyFront0: '#991b1b',
    jerseyFront1: '#dc2626',
    jerseyFront2: '#ef4444',
    jerseyFront3: '#b91c1c',
    jerseyBack0: '#7f1d1d',
    jerseyBack1: '#991b1b',
    jerseyBack2: '#5f1212',
    jerseyStripe: '#e53935',
    armColorFront: '#e53935',
    armColorBack: '#991b1b',
    skinLight: '#fed7aa',
    skinMid: '#f5b078',
    skinDark: '#b45309',
    skinBack: '#de935e',
    legThighFront: '#dc2626',
    legShinFront: '#e53935',
    legThighBack: '#991b1b',
    legShinBack: '#b91c1c',
    bootColor: '#18181b',
    bootBack: '#111827',
    bootAccent: '#38bdf8',
    crestColor: '#fbc02d',
    seamColor: '#7f1d1d',
    crosshairColor: '#ef4444',
    number: '9'
  },

  // 3. Cykl życia (Lifecycle Hooks)
  onInit(player) {
    player.jetFuel = this.stats.jetMax;
    player.jetMax = this.stats.jetMax;
  },
  onDestroy(player) {},

  onUpdate(player, ball, keys) {},
  onPrePhysics(player, keys) {},
  onPostPhysics(player) {},
  onJump(player, spawnGrass) {},

  // Wślizg Tarana – wybuch iskier i intensywna chmura trawy
  onSlide(player, spawnGrass) {
    if (spawnGrass && player.groundY) {
      for (let i = 0; i < 4; i++) {
        spawnGrass(
          player.x + player.w / 2 + (player.facing * 18),
          player.groundY,
          player.facing
        );
      }
    }
  },

  // Kopnięcie Tarana – ball dostaje efekt niskiej grawitacji (ciężki strzał po ziemi)
  onKick(player, ball, context) {
    ball.lowGravityFrames = Math.max(ball.lowGravityFrames || 0, 12);
  },

  onBallPassiveContact(player, ball) {},
  onDrawUnder(ctx, player) {},
  onDrawOverlay(ctx, player) {}
};
