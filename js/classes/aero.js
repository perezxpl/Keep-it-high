// =========================================================================
// KLASA LEKKA: RAPTOR – Zwiadowca / Lotnik
// Specjalność: Plecak odrzutowy (Jetpack), powietrzna manewrowość (airVx),
//              wysoka prędkość i zwinność, najwyższy jetMax.
// =========================================================================
export const RaptorClass = {
  id: 'RAPTOR',
  name: 'Raptor',
  tier: 'LIGHT',
  role: 'Zwiadowca / Lotnik',

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
    crosshairColor: '#ef4444',
    number: '07',
    // Domyślne modyfikacje wizualne klasy lekkiej (Raptor)
    topStyle: 'combat_shirt',
    pantsStyle: 'cargo',
    neckAccessory: 'dogtags',
    hairStyle: 'spiky',
    hairColor: '#18181b',
    bandanaColor: '#ef4444',
    jetpackStyle: 'wingpack',
    jetpackColor: '#334155',
    jetpackFlameColor: ''
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

// Gotowe kostiumy dla klasy RAPTOR (zwykłe i specjalne / premium)
export const RAPTOR_OUTFITS = {
  ranger_recon: {
    id: 'ranger_recon',
    name: 'Ranger Recon',
    tier: 'STANDARD',
    price: 0,
    visuals: {
      topStyle: 'combat_shirt',
      pantsStyle: 'cargo',
      neckAccessory: 'dogtags',
      hairStyle: 'spiky',
      hairColor: '#18181b',
      jetpackStyle: 'wingpack',
      jetpackColor: '#334155',
      jetpackFlameColor: '',
      jerseyFront0: '#283618',
      jerseyFront1: '#3a5a40',
      jerseyFront2: '#588157',
      jerseyBack0: '#1b2a1a',
      jerseyBack1: '#283618',
      jerseyBack2: '#131e13',
      jerseyStripe: '#588157',
      armColorFront: '#3a5a40',
      armColorBack: '#283618',
      shortsColor0: '#283618',
      shortsColor1: '#344e41',
      shortsColor2: '#1b2a1a',
      legThighFront: '#3a5a40',
      legShinFront: '#344e41',
      legThighBack: '#283618',
      legShinBack: '#1b2a1a',
      bootAccent: '#588157'
    }
  },
  jungle_commando: {
    id: 'jungle_commando',
    name: 'Soldat Commando',
    tier: 'STANDARD',
    price: 0,
    visuals: {
      topStyle: 'sleeveless',
      pantsStyle: 'cargo',
      neckAccessory: 'dogtags',
      hairStyle: 'bandana',
      hairColor: '#292524',
      bandanaColor: '#dc2626',
      jetpackStyle: 'standard',
      jetpackColor: '#3f3f46',
      jetpackFlameColor: '#f97316',
      jerseyFront0: '#1c1917',
      jerseyFront1: '#292524',
      jerseyFront2: '#44403c',
      jerseyBack0: '#1c1917',
      jerseyBack1: '#292524',
      jerseyBack2: '#0c0a09',
      jerseyStripe: '#dc2626',
      armColorFront: '#292524',
      armColorBack: '#1c1917',
      shortsColor0: '#14532d',
      shortsColor1: '#166534',
      shortsColor2: '#052e16',
      legThighFront: '#166534',
      legShinFront: '#14532d',
      legThighBack: '#14532d',
      legShinBack: '#052e16',
      bootAccent: '#dc2626'
    }
  },
  street_merc: {
    id: 'street_merc',
    name: 'Uliczny Najemnik',
    tier: 'STANDARD',
    price: 0,
    visuals: {
      topStyle: 'tshirt',
      pantsStyle: 'shorts',
      neckAccessory: 'silver_chain',
      hairStyle: 'mohawk',
      hairColor: '#eab308',
      jetpackStyle: 'twin_turbo',
      jetpackColor: '#27272a',
      jetpackFlameColor: '#38bdf8',
      jerseyFront0: '#18181b',
      jerseyFront1: '#27272a',
      jerseyFront2: '#3f3f46',
      jerseyBack0: '#18181b',
      jerseyBack1: '#27272a',
      jerseyBack2: '#09090b',
      jerseyStripe: '#eab308',
      armColorFront: '#27272a',
      armColorBack: '#18181b',
      shortsColor0: '#1e3a8a',
      shortsColor1: '#1d4ed8',
      shortsColor2: '#172554',
      legThighFront: '#1d4ed8',
      legShinFront: '#1e3a8a',
      legThighBack: '#1e3a8a',
      legShinBack: '#172554',
      bootAccent: '#eab308'
    }
  },
  cyber_valkyrie: {
    id: 'cyber_valkyrie',
    name: '★ Cyber Raptor [SPECJALNY]',
    tier: 'SPECIAL',
    price: 1500,
    visuals: {
      topStyle: 'jacket',
      pantsStyle: 'cargo',
      neckAccessory: 'gold_chain',
      hairStyle: 'spiky',
      hairColor: '#00e5ff',
      jetpackStyle: 'cyber',
      jetpackColor: '#0f172a',
      jetpackFlameColor: '#00e5ff',
      jerseyFront0: '#090d16',
      jerseyFront1: '#0f172a',
      jerseyFront2: '#1e293b',
      jerseyBack0: '#0f172a',
      jerseyBack1: '#090d16',
      jerseyBack2: '#020617',
      jerseyStripe: '#00e5ff',
      armColorFront: '#0f172a',
      armColorBack: '#090d16',
      shortsColor0: '#090d16',
      shortsColor1: '#1e293b',
      shortsColor2: '#020617',
      legThighFront: '#1e293b',
      legShinFront: '#0f172a',
      legThighBack: '#0f172a',
      legShinBack: '#090d16',
      bootAccent: '#00e5ff'
    }
  },
  crimson_ace: {
    id: 'crimson_ace',
    name: '★ Karmazynowy As [SPECJALNY]',
    tier: 'SPECIAL',
    price: 2000,
    visuals: {
      topStyle: 'jacket',
      pantsStyle: 'cargo',
      neckAccessory: 'gold_chain',
      hairStyle: 'slick',
      hairColor: '#f8fafc',
      jetpackStyle: 'wingpack',
      jetpackColor: '#7f1d1d',
      jetpackFlameColor: '#f43f5e',
      jerseyFront0: '#450a0a',
      jerseyFront1: '#7f1d1d',
      jerseyFront2: '#991b1b',
      jerseyBack0: '#450a0a',
      jerseyBack1: '#7f1d1d',
      jerseyBack2: '#2a0404',
      jerseyStripe: '#facc15',
      armColorFront: '#7f1d1d',
      armColorBack: '#450a0a',
      shortsColor0: '#18181b',
      shortsColor1: '#27272a',
      shortsColor2: '#09090b',
      legThighFront: '#27272a',
      legShinFront: '#18181b',
      legThighBack: '#18181b',
      legShinBack: '#09090b',
      bootAccent: '#facc15'
    }
  }
};

export const AeroClass = RaptorClass;
