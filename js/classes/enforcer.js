export const EnforcerClass = {
  id: 'ENFORCER',
  name: 'Taran',
  role: 'Czołg / Siła',

  stats: {
    walkMax: 1.9,
    jogMax: 3.8,
    sprintMax: 6.2,
    accel: 0.19,
    slideDashSpeed: 16.5,
    slideDecel: 0.985,
    jumpForce: 9.2,
    chargeSpeed: 0.028,
    jetMax: 65,
    hitReach: 56,
    whiffReach: 86,
    kickPowerMult: 1.38,
    spinMult: 0.5,
    baseKickSpeed: 13.0
  },

  visuals: {
    number: '9',
    crestColor: '#fbc02d',
    jerseyFront0: '#991b1b',
    jerseyFront1: '#dc2626',
    jerseyFront2: '#ef4444',
    jerseyFront3: '#b91c1c',
    jerseyBack0: '#7f1d1d',
    jerseyBack1: '#991b1b',
    jerseyBack2: '#5f1212',
    seamColor: '#7f1d1d',
    armColorFront: '#e53935',
    armColorBack: '#991b1b',
    legThighFront: '#dc2626',
    legShinFront: '#e53935',
    legThighBack: '#991b1b',
    legShinBack: '#b91c1c',
    bootColor: '#18181b',
    bootBack: '#111827',
    bootAccent: '#38bdf8',
    crosshairColor: '#ef4444'
  },

  onUpdate(player, ball) {},
  onSlide(player, spawnGrass) {
    if (spawnGrass && player.groundY) {
      for (let i = 0; i < 4; i++) {
        spawnGrass(player.x + player.w / 2 + (player.facing * 18), player.groundY, player.facing);
      }
    }
  },
  onKick(player, ball) {
    ball.lowGravityFrames = Math.max(ball.lowGravityFrames || 0, 12);
  },
  onDrawOverlay(ctx, player) {}
};
