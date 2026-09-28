export const SweeperClass = {
  id: 'SWEEPER',
  name: 'Libero',
  role: 'Obrona / Kontrola',

  stats: {
    walkMax: 2.1,
    jogMax: 4.0,
    sprintMax: 6.1,
    accel: 0.35,
    slideDashSpeed: 13.0,
    slideDecel: 0.974,
    jumpForce: 9.6,
    chargeSpeed: 0.040,
    jetMax: 80,
    hitReach: 64,
    whiffReach: 94,
    kickPowerMult: 1.08,
    spinMult: 1.0,
    baseKickSpeed: 10.0
  },

  visuals: {
    number: '1',
    crestColor: '#ffffff',
    jerseyFront0: '#78350f',
    jerseyFront1: '#b45309',
    jerseyFront2: '#f59e0b',
    jerseyFront3: '#92400e',
    jerseyBack0: '#451a03',
    jerseyBack1: '#78350f',
    jerseyBack2: '#2e1002',
    seamColor: '#78350f',
    armColorFront: '#b45309',
    armColorBack: '#78350f',
    legThighFront: '#b45309',
    legShinFront: '#f59e0b',
    legThighBack: '#92400e',
    legShinBack: '#b45309',
    bootColor: '#1e293b',
    bootBack: '#0f172a',
    bootAccent: '#fbbf24',
    crosshairColor: '#f59e0b'
  },

  onUpdate(player, ball) {},
  onBallPassiveContact(player, ball) {
    ball.vx *= 0.35;
    ball.vy *= 0.35;
  },
  onKick(player, ball) {},
  onDrawOverlay(ctx, player) {}
};
