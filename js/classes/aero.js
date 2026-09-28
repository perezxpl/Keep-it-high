export const AeroClass = {
  id: 'AERO',
  name: 'Akrobata',
  role: 'Lotnik / Freestyler',

  stats: {
    walkMax: 2.3,
    jogMax: 4.4,
    sprintMax: 7.2,
    accel: 0.28,
    slideDashSpeed: 11.5,
    slideDecel: 0.968,
    jumpForce: 11.4,
    chargeSpeed: 0.038,
    jetMax: 150,
    hitReach: 58,
    whiffReach: 92,
    kickPowerMult: 1.12,
    spinMult: 1.2,
    baseKickSpeed: 10.3
  },

  visuals: {
    number: '7',
    crestColor: '#facc15',
    jerseyFront0: '#064e3b',
    jerseyFront1: '#059669',
    jerseyFront2: '#10b981',
    jerseyFront3: '#047857',
    jerseyBack0: '#022c22',
    jerseyBack1: '#064e3b',
    jerseyBack2: '#011c15',
    seamColor: '#064e3b',
    armColorFront: '#059669',
    armColorBack: '#064e3b',
    legThighFront: '#059669',
    legShinFront: '#10b981',
    legThighBack: '#047857',
    legShinBack: '#059669',
    bootColor: '#022c22',
    bootBack: '#011c15',
    bootAccent: '#10b981',
    crosshairColor: '#10b981'
  },

  onUpdate(player, ball) {
    // Akrobata posiada zwiększoną manewrowość i kontrolę wektora pędu w powietrzu (airVx)
    if (player.isJumping && typeof player.airVx === 'number') {
      if (player.intendedVx !== undefined && Math.abs(player.intendedVx) > 0.05) {
        player.airVx += (player.intendedVx - player.airVx) * 0.08;
      }
    }
  },
  onKick(player, ball, kickInfo) {
    if (player.isJumping || kickInfo?.isSpinVolley) {
      ball.vx *= 1.22;
      ball.vy *= 1.22;
      ball.lowGravityFrames = Math.max(ball.lowGravityFrames || 0, 16);
    }
  },
  onDrawOverlay(ctx, player) {}
};
