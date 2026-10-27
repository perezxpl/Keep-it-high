// =========================================================================
// OBSTACLES/MATERIALS.JS - PROCEDURALNE TEKSTURY MATERIAŁÓW PLATFORM
// Generuje i buforuje bezszwowe kafelkowane wzory materiałów:
// blacha ryflowana, zbrojony beton wojskowy, szczotkowana stal pancerna
// =========================================================================

let _diamondPlatePattern = null;
let _concretePattern = null;
let _brushedSteelPattern = null;

/**
 * Zwraca zbuforowany wzorzec blachy ryflowanej (Diamond Treadplate).
 */
export function getDiamondPlatePattern(ctx) {
  if (_diamondPlatePattern) return _diamondPlatePattern;
  if (typeof document === 'undefined') return null;

  const size = 16;
  const off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  const oc = off.getContext('2d');

  // Baza ciemnej stali przemysłowej
  oc.fillStyle = '#1c232d';
  oc.fillRect(0, 0, size, size);

  // Wytłoczenia ryfli w układzie skośnym (Diamenty / Tread lugs)
  function drawLug(lx, ly, isRot) {
    oc.save();
    oc.translate(lx, ly);
    if (isRot) oc.rotate(Math.PI / 2);

    // Cień ryfla
    oc.fillStyle = '#0b0f14';
    oc.beginPath();
    oc.ellipse(0.8, 0.8, 3.8, 1.4, 0, 0, Math.PI * 2);
    oc.fill();

    // Korpus ryfla
    oc.fillStyle = '#334155';
    oc.beginPath();
    oc.ellipse(0, 0, 3.5, 1.3, 0, 0, Math.PI * 2);
    oc.fill();

    // Metaliczny połysk krawędzi (specular highlight)
    oc.fillStyle = '#64748b';
    oc.beginPath();
    oc.ellipse(-0.5, -0.4, 2.5, 0.7, 0, 0, Math.PI * 2);
    oc.fill();

    oc.restore();
  }

  drawLug(4, 4, false);
  drawLug(12, 12, false);
  drawLug(12, 4, true);
  drawLug(4, 12, true);

  _diamondPlatePattern = ctx.createPattern(off, 'repeat');
  return _diamondPlatePattern;
}

/**
 * Zwraca zbuforowany wzorzec zbrojonego betonu wojskowego (Reinforced Concrete).
 */
export function getReinforcedConcretePattern(ctx) {
  if (_concretePattern) return _concretePattern;
  if (typeof document === 'undefined') return null;

  const size = 24;
  const off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  const oc = off.getContext('2d');

  // Baza surowego betonu
  oc.fillStyle = '#262d33';
  oc.fillRect(0, 0, size, size);

  // Drobne kruszywo i pory betonu
  const specks = [
    { x: 3, y: 5, col: '#1a1f24', r: 1.2 },
    { x: 14, y: 3, col: '#38424a', r: 1.0 },
    { x: 9, y: 11, col: '#181c20', r: 1.4 },
    { x: 19, y: 9, col: '#343e45', r: 0.9 },
    { x: 6, y: 18, col: '#3c474f', r: 1.1 },
    { x: 17, y: 17, col: '#171b1f', r: 1.3 },
    { x: 22, y: 22, col: '#333c43', r: 0.8 },
    { x: 11, y: 21, col: '#191e22', r: 1.0 }
  ];

  for (let s of specks) {
    oc.fillStyle = s.col;
    oc.beginPath();
    oc.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    oc.fill();
  }

  // Subtelna pozioma linia szalunku
  oc.strokeStyle = 'rgba(15, 20, 24, 0.45)';
  oc.lineWidth = 1;
  oc.beginPath();
  oc.moveTo(0, 12);
  oc.lineTo(size, 12);
  oc.stroke();

  _concretePattern = ctx.createPattern(off, 'repeat');
  return _concretePattern;
}

/**
 * Zwraca zbuforowany wzorzec szczotkowanej stali pancernej (Brushed Armor Steel).
 */
export function getBrushedSteelPattern(ctx) {
  if (_brushedSteelPattern) return _brushedSteelPattern;
  if (typeof document === 'undefined') return null;

  const size = 16;
  const off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  const oc = off.getContext('2d');

  // Baza stali
  oc.fillStyle = '#1e242b';
  oc.fillRect(0, 0, size, size);

  // Wzdłużne linie szczotkowania metalu
  oc.strokeStyle = 'rgba(51, 65, 85, 0.45)';
  oc.lineWidth = 1;
  for (let y = 1; y < size; y += 3) {
    oc.beginPath();
    oc.moveTo(0, y);
    oc.lineTo(size, y);
    oc.stroke();
  }

  oc.strokeStyle = 'rgba(11, 15, 20, 0.55)';
  for (let y = 2; y < size; y += 4) {
    oc.beginPath();
    oc.moveTo(0, y);
    oc.lineTo(size, y);
    oc.stroke();
  }

  _brushedSteelPattern = ctx.createPattern(off, 'repeat');
  return _brushedSteelPattern;
}

/**
 * Uniwersalna procedura rysowania platformy z kafelkowaną teksturą materiału,
 * fazowaną krawędzią 3D, narożnymi okuciami i nitami.
 */
export function drawTexturedPlatformBox(ctx, x, y, w, h, materialType = 'metal', options = {}) {
  ctx.save();

  // 1. Cień rzucany pod platformą
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.fillRect(x + 2, y + h, w - 4, 4);

  // 2. Wypełnienie kafelkowanym wzorcem materiału
  let pattern = null;
  if (materialType === 'diamond' || materialType === 'metal') {
    pattern = getDiamondPlatePattern(ctx);
  } else if (materialType === 'concrete' || materialType === 'stone') {
    pattern = getReinforcedConcretePattern(ctx);
  } else if (materialType === 'steel' || materialType === 'armor') {
    pattern = getBrushedSteelPattern(ctx);
  }

  if (pattern) {
    ctx.fillStyle = pattern;
  } else {
    ctx.fillStyle = '#222933';
  }
  ctx.fillRect(x, y, w, h);

  // 3. Pionowy gradient cieniowania bryły (ambient occlusion / głębia 3D)
  const aoGrad = ctx.createLinearGradient(x, y, x, y + h);
  aoGrad.addColorStop(0.00, 'rgba(255, 255, 255, 0.14)'); // Górna krawędź odbija światło
  aoGrad.addColorStop(0.40, 'rgba(0, 0, 0, 0.00)');
  aoGrad.addColorStop(1.00, 'rgba(0, 0, 0, 0.48)');       // Spód w głębokim cieniu
  ctx.fillStyle = aoGrad;
  ctx.fillRect(x, y, w, h);

  // 4. Kute stalowe narożniki i nity
  if (options.hasBrackets !== false && w > 24 && h > 10) {
    const bW = Math.min(8, w * 0.25);
    const bH = Math.min(8, h * 0.45);

    ctx.fillStyle = '#334155';
    // Lewy górny i prawy górny
    ctx.fillRect(x, y, bW, bH);
    ctx.fillRect(x + w - bW, y, bW, bH);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, bW, bH);
    ctx.strokeRect(x + w - bW, y, bW, bH);

    // Nity
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 2, y + 2, 2.5, 2.5);
    ctx.fillRect(x + w - bW + 2, y + 2, 2.5, 2.5);
  }

  // 5. Ostra krawędź górna z połyskiem (Bevel highlight)
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.55)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + 1, y + 0.7);
  ctx.lineTo(x + w - 1, y + 0.7);
  ctx.stroke();

  // 6. Ciemny obrys konstrukcyjny
  ctx.strokeStyle = '#0b0f14';
  ctx.lineWidth = 2.0;
  ctx.strokeRect(x, y, w, h);

  ctx.restore();
}
