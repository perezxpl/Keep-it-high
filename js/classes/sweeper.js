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
    walkMax: 2.0,
    jogMax: 3.8,
    sprintMax: 6.2,
    accel: 0.35,
    decel: 0.84,
    slideDecel: 0.974,
    jumpForce: 9.6,
    slideDashSpeed: 13.0,
    chargeSpeed: 0.040,
    hitReach: 64,
    whiffReach: 94,
    baseKickSpeed: 20.0,
    kickPowerMult: 1.08,
    spinMult: 1.0,
    jetMax: 80,
    spartanKnockback: 13.0, // Średni / defensywny odrzut
    spartanStagger: 20,     // Solidne oszołomienie defensywne
    spartanDamage: 12,
    kickForce: 1.25,
    kickForceMultiplier: 1.25,
    knockback: 1.25,
    knockbackMultiplier: 1.25,
    kickCooldown: 0.55
  },

  // 2. Kolorystyka i dane wizualne renderera – Coyote Tan / Desert PMC
  visuals: {
    jerseyFront0: '#5c4028',
    jerseyFront1: '#785438',
    jerseyFront2: '#8c6747',
    jerseyFront3: '#6a4a30',
    jerseyBack0: '#382818',
    jerseyBack1: '#5c4028',
    jerseyBack2: '#2a1e12',
    jerseyStripe: '#8c6747',
    armColorFront: '#785438',
    armColorBack: '#5c4028',
    skinLight: '#fed7aa',
    skinMid: '#f5b078',
    skinDark: '#b45309',
    skinBack: '#de935e',
    shortsColor0: '#5c4028',
    shortsColor1: '#785438',
    shortsColor2: '#382818',
    legThighFront: '#785438',
    legShinFront: '#6a4a30',
    legThighBack: '#5c4028',
    legShinBack: '#382818',
    bootColor: '#18181b',
    bootBack: '#09090b',
    bootAccent: '#8c6747',
    crestColor: '#d4a373',
    seamColor: '#382818',
    crosshairColor: '#d4a373',
    number: '01'
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
