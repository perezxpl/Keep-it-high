// =========================================================================
// KLASA: LIBERO (SWEEPER) – Obrona / Kontrola
// Specjalność: Natychmiastowe zatrzymanie piłki przy kontakcie pasywnym,
//              szeroki zasięg (hitReach 64 / whiffReach 94),
//              wysoka akceleracja (accel 0.35).
// =========================================================================
export const SweeperClass = {
  id: 'SWEEPER',
  name: 'Sweeper',
  role: 'Obrona / Kontrola',

  // 1. Statystyki fizyczne i ruchowe
  stats: {
    walkMax: 2.1,
    jogMax: 4.0,
    sprintMax: 6.1,
    accel: 0.35,
    decel: 0.84,
    slideDecel: 0.974,
    jumpForce: 9.6,
    slideDashSpeed: 13.0,
    chargeSpeed: 0.040,
    hitReach: 64,
    whiffReach: 94,
    baseKickSpeed: 10.0,
    kickPowerMult: 1.08,
    spinMult: 1.0,
    jetMax: 80
  },

  // 2. Kolorystyka i dane wizualne renderera
  visuals: {
    jerseyFront0: '#78350f',
    jerseyFront1: '#b45309',
    jerseyFront2: '#f59e0b',
    jerseyFront3: '#92400e',
    jerseyBack0: '#451a03',
    jerseyBack1: '#78350f',
    jerseyBack2: '#2e1002',
    jerseyStripe: '#f59e0b',
    armColorFront: '#b45309',
    armColorBack: '#78350f',
    skinLight: '#fed7aa',
    skinMid: '#f5b078',
    skinDark: '#b45309',
    skinBack: '#de935e',
    legThighFront: '#b45309',
    legShinFront: '#f59e0b',
    legThighBack: '#92400e',
    legShinBack: '#b45309',
    bootColor: '#1e293b',
    bootBack: '#0f172a',
    bootAccent: '#fbbf24',
    crestColor: '#ffffff',
    seamColor: '#78350f',
    crosshairColor: '#f59e0b',
    number: '1'
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
  onSlide(player, spawnGrass) {},
  onKick(player, ball, context) {},

  // Libero: pasywny kontakt pochłania prawie całą energię piłki (blok obrońcy)
  onBallPassiveContact(player, ball) {
    ball.vx *= 0.35;
    ball.vy *= 0.35;
  },

  onDrawUnder(ctx, player) {},
  onDrawOverlay(ctx, player) {}
};
