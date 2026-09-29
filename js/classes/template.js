// =========================================================================
// CLASS_TEMPLATE – Referencyjny szablon kontraktu klasy postaci (ClassContract)
// Skopiuj i uzupełnij ten plik, aby stworzyc nowa klase.
// Wszystkie hooki sa opcjonalne - silnik player.js wywoluje je przez ?.
// =========================================================================

export const CLASS_TEMPLATE = {
  id: 'CLASS_ID',
  name: 'Nazwa Klasy',
  role: 'Rola / Opis',

  stats: {
    walkMax: 2.2,
    jogMax: 4.2,
    sprintMax: 6.8,
    accel: 0.24,
    decel: 0.84,
    slideDecel: 0.978,
    jumpForce: 9.8,
    slideDashSpeed: 13.5,
    chargeSpeed: 0.035,
    hitReach: 56,
    whiffReach: 88,
    baseKickSpeed: 15.0,
    kickPowerMult: 1.0,
    spinMult: 1.0,
    jetMax: 100
  },

  visuals: {
    jerseyFront0: '#991b1b',
    jerseyFront1: '#dc2626',
    jerseyFront2: '#ef4444',
    jerseyFront3: '#b91c1c',
    jerseyBack0: '#7f1d1d',
    jerseyBack1: '#991b1b',
    jerseyBack2: '#5f1212',
    jerseyStripe: '#e53935',
    armColorFront: '#e53935',
    armColorBack: '#991b1b',
    skinLight: '#fed7aa',
    skinMid: '#f5b078',
    skinDark: '#b45309',
    skinBack: '#de935e',
    legThighFront: '#dc2626',
    legShinFront: '#e53935',
    legThighBack: '#991b1b',
    legShinBack: '#b91c1c',
    bootColor: '#18181b',
    bootBack: '#111827',
    bootAccent: '#38bdf8',
    crestColor: '#fbc02d',
    seamColor: '#7f1d1d',
    crosshairColor: '#38bdf8',
    number: '10'
  },

  onInit(player) {},
  onDestroy(player) {},
  onUpdate(player, ball, keys) {},
  onPrePhysics(player, keys) {},
  onPostPhysics(player) {},
  onJump(player, spawnGrass) {},
  onSlide(player, spawnGrass) {},
  onKick(player, ball, context) {},
  onBallPassiveContact(player, ball) {},
  onDrawUnder(ctx, player) {},
  onDrawOverlay(ctx, player) {}
};
