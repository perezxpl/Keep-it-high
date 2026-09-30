// =========================================================================
// KLASA: AKROBATA (AERO) – Lotnik / Freestyler
// Specjalność: Powietrzna manewrowość (airVx), wzmocnione kopnięcia
//              w powietrzu i spin volley, najwyższy jetMax.
// =========================================================================
export const AeroClass = {
  id: 'AERO',
  name: 'Aero',
  role: 'Lotnik / Freestyler',

  // 1. Statystyki fizyczne i ruchowe
  stats: {
    walkMax: 2.3,
    jogMax: 4.4,
    sprintMax: 7.2,
    accel: 0.28,
    decel: 0.84,
    slideDecel: 0.968,
    jumpForce: 11.4,
    slideDashSpeed: 11.5,
    chargeSpeed: 0.038,
    hitReach: 58,
    whiffReach: 92,
    baseKickSpeed: 10.3,
    kickPowerMult: 1.12,
    spinMult: 1.2,
    jetMax: 150
  },

  // 2. Kolorystyka i dane wizualne renderera
  visuals: {
    jerseyFront0: '#064e3b',
    jerseyFront1: '#059669',
    jerseyFront2: '#10b981',
    jerseyFront3: '#047857',
    jerseyBack0: '#022c22',
    jerseyBack1: '#064e3b',
    jerseyBack2: '#011c15',
    jerseyStripe: '#10b981',
    armColorFront: '#059669',
    armColorBack: '#064e3b',
    skinLight: '#fed7aa',
    skinMid: '#f5b078',
    skinDark: '#b45309',
    skinBack: '#de935e',
    legThighFront: '#059669',
    legShinFront: '#10b981',
    legThighBack: '#047857',
    legShinBack: '#059669',
    bootColor: '#022c22',
    bootBack: '#011c15',
    bootAccent: '#10b981',
    crestColor: '#facc15',
    seamColor: '#064e3b',
    crosshairColor: '#10b981',
    number: '7'
  },

  // 3. Cykl życia (Lifecycle Hooks)
  onInit(player) {
    player.jetFuel = this.stats.jetMax;
    player.jetMax = this.stats.jetMax;
  },
  onDestroy(player) {},

  // Akrobata: zwiększona manewrowość w powietrzu (airVx śledzi intendedVx)
  onUpdate(player, ball, keys) {
    if (player.isJumping && typeof player.airVx === 'number') {
      if (player.intendedVx !== undefined && Math.abs(player.intendedVx) > 0.05) {
        player.airVx += (player.intendedVx - player.airVx) * 0.08;
      }
    }
  },

  onPrePhysics(player, keys) {},
  onPostPhysics(player) {},
  onJump(player, spawnGrass) {},
  onSlide(player, spawnGrass) {},

  // Kopnięcie Akrobaty: wzmocnienie wektora piłki w powietrzu / spin volley
  onKick(player, ball, context) {
    if (player.isJumping || context?.isSpinVolley) {
      ball.vx *= 1.22;
      ball.vy *= 1.22;
      ball.lowGravityFrames = Math.max(ball.lowGravityFrames || 0, 16);
    }
  },

  onBallPassiveContact(player, ball) {},
  onDrawUnder(ctx, player) {},
  onDrawOverlay(ctx, player) {}
};
