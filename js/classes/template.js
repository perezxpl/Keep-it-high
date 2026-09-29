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
    baseKickSpeed: 15.0,
    kickPowerMult: 1.0,
    spinMult: 1.0,
    jetMax: 100
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
    
    // Spodenki (gradient tkaniny)
    shortsColor0: '#ffffff',
    shortsColor1: '#f8fafc',
    shortsColor2: '#cbd5e1',

    // Karnacja skóry (ręce, nogi, szyja, twarz)
    skinLight: '#fed7aa',
    skinMid: '#f5b078',
    skinDark: '#b45309',
    skinBack: '#de935e',

    // Koszulka – przód i tył
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

    // Getry i spodenki
    legThighFront: '#dc2626',
    legShinFront: '#e53935',
    legThighBack: '#991b1b',
    legShinBack: '#b91c1c',

    // Buty piłkarskie
    bootColor: '#18181b',
    bootBack: '#111827',
    bootAccent: '#38bdf8',

    // Herb, szwy, celownik i numer
    crestColor: '#fbc02d',
    seamColor: '#7f1d1d',
    crosshairColor: '#38bdf8',
    number: '10'
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
