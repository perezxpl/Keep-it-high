export const PlaymakerClass = {
  id: 'PLAYMAKER',
  name: 'Wirtuoz',
  role: 'Technik / Snajper',

  stats: {
    walkMax: 2.2,
    jogMax: 4.2,
    sprintMax: 6.6,
    accel: 0.25,
    slideDashSpeed: 12.0,
    slideDecel: 0.972,
    jumpForce: 9.8,
    chargeSpeed: 0.048,
    jetMax: 90,
    hitReach: 60,
    whiffReach: 90,
    kickPowerMult: 1.15,
    spinMult: 1.65,
    baseKickSpeed: 10.7
  },

  visuals: {
    number: '10',
    crestColor: '#38bdf8',
    jerseyFront0: '#075985',
    jerseyFront1: '#0284c7',
    jerseyFront2: '#38bdf8',
    jerseyFront3: '#0369a1',
    jerseyBack0: '#0c4a6e',
    jerseyBack1: '#075985',
    jerseyBack2: '#082f49',
    seamColor: '#0369a1',
    armColorFront: '#0284c7',
    armColorBack: '#075985',
    legThighFront: '#0284c7',
    legShinFront: '#38bdf8',
    legThighBack: '#0369a1',
    legShinBack: '#0284c7',
    bootColor: '#0f172a',
    bootBack: '#020617',
    bootAccent: '#38bdf8',
    crosshairColor: '#38bdf8'
  },

  onUpdate(player, ball) {},
  onKick(player, ball) {
    ball.spin *= 1.4;
  },
  onDrawOverlay(ctx, player) {}
};
