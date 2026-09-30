// =========================================================================
// KLASA: WIRTUOZ (PLAYMAKER) – Technik / Snajper
// Specjalność: Precyzyjny spin na piłce, szybkie ładowanie kopnięcia,
//              zwiększony zasięg uderzenia i efekt poświaty snajperskiej.
// =========================================================================
export const PlaymakerClass = {
  id: 'PLAYMAKER',
  name: 'Playmaker',
  role: 'Technik / Snajper',

  // 1. Statystyki fizyczne i ruchowe
  stats: {
    walkMax: 2.2,
    jogMax: 4.2,
    sprintMax: 6.6,
    accel: 0.25,
    decel: 0.84,
    slideDecel: 0.972,
    jumpForce: 9.8,
    slideDashSpeed: 12.0,
    chargeSpeed: 0.048,
    hitReach: 60,
    whiffReach: 90,
    baseKickSpeed: 10.7,
    kickPowerMult: 1.15,
    spinMult: 1.65,
    jetMax: 90
  },

  // 2. Kolorystyka i dane wizualne renderera
  visuals: {
    jerseyFront0: '#075985',
    jerseyFront1: '#0284c7',
    jerseyFront2: '#38bdf8',
    jerseyFront3: '#0369a1',
    jerseyBack0: '#0c4a6e',
    jerseyBack1: '#075985',
    jerseyBack2: '#082f49',
    jerseyStripe: '#0ea5e9',
    armColorFront: '#0284c7',
    armColorBack: '#075985',
    // Kolory skóry wbudowanej w renderArm / renderIKLeg
    skinLight: '#fed7aa',
    skinMid: '#f5b078',
    skinDark: '#b45309',
    skinBack: '#de935e',
    legThighFront: '#0284c7',
    legShinFront: '#38bdf8',
    legThighBack: '#0369a1',
    legShinBack: '#0284c7',
    bootColor: '#0f172a',
    bootBack: '#020617',
    bootAccent: '#38bdf8',
    crestColor: '#38bdf8',
    seamColor: '#0369a1',
    crosshairColor: '#38bdf8',
    number: '10'
  },

  // 3. Cykl życia (Lifecycle Hooks)
  onInit(player) {
    player.jetFuel = this.stats.jetMax;
    player.jetMax = this.stats.jetMax;
  },
  onDestroy(player) {},

  // Wywoływane co klatkę – pasywki i cooldowny
  onUpdate(player, ball, keys) {},

  // Modyfikacje wektorów PRZED przeliczeniem fizyki ruchu
  onPrePhysics(player, keys) {},

  // Reakcje PO przeliczeniu kolizji z podłożem i ścianami
  onPostPhysics(player) {},

  // Efekt / modyfikator skoku
  onJump(player, spawnGrass) {},

  // Efekt / modyfikator wślizgu
  onSlide(player, spawnGrass) {},

  // Wykop (nx, ny, baseSpeed, isSpinVolley, chargePower)
  onKick(player, ball, context) {
    // Wirtuoz nakłada wyjątkowo silny efekt rotacyjny
    ball.spin *= 1.4;
  },

  // Pasywny kontakt ciała z piłką (bez aktywnego kopnięcia)
  onBallPassiveContact(player, ball) {},

  // Rysowanie efektów POD postacią (przed torsem)
  onDrawUnder(ctx, player) {},

  // Rysowanie nakładek / aury NAD postacią (po torsie)
  onDrawOverlay(ctx, player) {}
};
