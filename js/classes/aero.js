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
    walkMax: 2.4,
    jogMax: 4.6,
    sprintMax: 7.4,
    accel: 0.28,
    decel: 0.84,
    slideDecel: 0.968,
    jumpForce: 11.4,
    slideDashSpeed: 11.5,
    chargeSpeed: 0.038,
    hitReach: 58,
    whiffReach: 92,
    baseKickSpeed: 20.6,
    kickPowerMult: 1.12,
    spinMult: 1.2,
    jetMax: 150,
    spartanKnockback: 9.5,
    spartanStagger: 14,
    spartanDamage: 8,
    kickForce: 0.85,
    kickForceMultiplier: 0.85,
    knockback: 0.70,
    knockbackMultiplier: 0.70,
    kickCooldown: 0.35
  },

  // 2. Kolorystyka i dane wizualne renderera – Oliwka / Ranger Green PMC
  visuals: {
    jerseyFront0: '#283618',
    jerseyFront1: '#3a5a40',
    jerseyFront2: '#588157',
    jerseyFront3: '#344e41',
    jerseyBack0: '#1b2a1a',
    jerseyBack1: '#283618',
    jerseyBack2: '#131e13',
    jerseyStripe: '#588157',
    armColorFront: '#3a5a40',
    armColorBack: '#283618',
    skinLight: '#fed7aa',
    skinMid: '#f5b078',
    skinDark: '#b45309',
    skinBack: '#de935e',
    shortsColor0: '#283618',
    shortsColor1: '#344e41',
    shortsColor2: '#1b2a1a',
    legThighFront: '#3a5a40',
    legShinFront: '#344e41',
    legThighBack: '#283618',
    legShinBack: '#1b2a1a',
    bootColor: '#18181b',
    bootBack: '#09090b',
    bootAccent: '#588157',
    crestColor: '#a3b18a',
    seamColor: '#1b2a1a',
    crosshairColor: '#a3b18a',
    number: '07'
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
