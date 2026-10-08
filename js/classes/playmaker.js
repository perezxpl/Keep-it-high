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
    sprintMax: 6.8,
    accel: 0.25,
    decel: 0.84,
    slideDecel: 0.972,
    jumpForce: 9.8,
    slideDashSpeed: 12.0,
    chargeSpeed: 0.048,
    hitReach: 60,
    whiffReach: 90,
    baseKickSpeed: 21.4,
    kickPowerMult: 1.15,
    spinMult: 1.65,
    jetMax: 90,
    spartanKnockback: 10.0,
    spartanStagger: 15,
    spartanDamage: 9,
    kickForce: 1.30,
    kickForceMultiplier: 1.30,
    knockback: 1.00,
    knockbackMultiplier: 1.00,
    kickCooldown: 0.50
  },

  // 2. Kolorystyka i dane wizualne renderera – Grafit / Urban Slate PMC
  visuals: {
    jerseyFront0: '#18181b',
    jerseyFront1: '#334155',
    jerseyFront2: '#475569',
    jerseyFront3: '#1e293b',
    jerseyBack0: '#0f172a',
    jerseyBack1: '#1e293b',
    jerseyBack2: '#09090b',
    jerseyStripe: '#475569',
    armColorFront: '#334155',
    armColorBack: '#1e293b',
    skinLight: '#fed7aa',
    skinMid: '#f5b078',
    skinDark: '#b45309',
    skinBack: '#de935e',
    shortsColor0: '#1e293b',
    shortsColor1: '#334155',
    shortsColor2: '#0f172a',
    legThighFront: '#334155',
    legShinFront: '#475569',
    legThighBack: '#1e293b',
    legShinBack: '#0f172a',
    bootColor: '#18181b',
    bootBack: '#09090b',
    bootAccent: '#64748b',
    crestColor: '#94a3b8',
    seamColor: '#0f172a',
    crosshairColor: '#ef4444',
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
