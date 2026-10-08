// =========================================================================
// CLASS_TEMPLATE – Referencyjny szablon kontraktu klasy postaci (ClassContract)
// Skopiuj i uzupełnij ten plik, aby stworzyć nową klasę.
// Wszystkie sekcje i pojedyncze pola są opcjonalne – silnik w player.js 
// automatycznie uzupełnia brakujące wartości schematem domyślnym.
// =========================================================================

export const CLASS_TEMPLATE = {
  id: 'CLASS_ID',
  name: 'Nazwa Klasy',
  role: 'Rola / Opis archetypu',

  // 1. Wymiary i anatomia szkieletu IK (opcjonalne)
  body: {
    w: 24,            // Szerokość hitboksa
    h: 70,            // Wysokość postaci
    thighLen: 25,     // Długość kości uda
    shinLen: 24,      // Długość kości goleni
    upperArmLen: 14,  // Długość kości ramienia (biceps)
    forearmLen: 13    // Długość przedramienia
  },

  // 2. Statystyki fizyczne i ruchowe (opcjonalne)
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
    baseKickSpeed: 30.0,
    kickPowerMult: 1.0,
    spinMult: 1.0,
    jetMax: 100,
    spartanKnockback: 11.0,
    spartanStagger: 16,
    spartanDamage: 10,
    kickForce: 1.0,
    kickForceMultiplier: 1.0,
    knockback: 1.0,
    knockbackMultiplier: 1.0,
    kickCooldown: 0.50
  },

  // 3. Pełna konfiguracja wizualna i fason stroju (opcjonalne)
  visuals: {
    // Proporcje i fason ciała
    sculptedMuscles: false,   // false = standardowy model, true = wyrzeźbione brzuśce mięśniowe
    muscleMult: 1.0,          // Mnożnik grubości mięśni (np. 1.40 dla osiłka, 0.85 dla lotnika)
    sleeveless: false,        // true = odkryte ramiona (tank-top / brak rękawków)
    sleeveLengthMult: 1.0,    // Mnożnik długości rękawków (gdy sleeveless: false)
    
    // Dodatki i akcesoria
    hasWristband: true,       // Frotka / bandaż na przedramieniu
    wristbandColor: '#ffffff',
    hasHeadband: true,        // Opaska sportowa na czole
    headbandColor: '#ffffff',
    
    // Włosy
    hairColor0: '#1c0d06',
    hairColor1: '#2e160a',
    hairColor2: '#452210',
    
    // Spodenki / Bojówki Cargo (gradient tkaniny)
    shortsColor0: '#27272a',
    shortsColor1: '#3f3f46',
    shortsColor2: '#18181b',

    // Karnacja skóry (ręce, nogi, szyja, twarz)
    skinLight: '#fed7aa',
    skinMid: '#f5b078',
    skinDark: '#b45309',
    skinBack: '#de935e',

    // Kamizelka taktyczna / Plate Carrier – przód i tył
    jerseyFront0: '#18181b',
    jerseyFront1: '#27272a',
    jerseyFront2: '#3f3f46',
    jerseyFront3: '#18181b',
    jerseyBack0: '#09090b',
    jerseyBack1: '#18181b',
    jerseyBack2: '#09090b',
    jerseyStripe: '#52525b',
    armColorFront: '#27272a',
    armColorBack: '#18181b',

    // Bojówki Cargo i nakolanniki
    legThighFront: '#27272a',
    legShinFront: '#3f3f46',
    legThighBack: '#18181b',
    legShinBack: '#27272a',

    // Buty bojowe / Mag-Boots
    bootColor: '#18181b',
    bootBack: '#09090b',
    bootAccent: '#52525b',

    // Elementy taktyczne, szwy, celownik i numer
    crestColor: '#71717a',
    seamColor: '#09090b',
    crosshairColor: '#ef4444',
    number: '00'
  },

  // 4. Cykl życia i haki silnika (opcjonalne)
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
