// =========================================================================
// ARENAS/ARENA3/WEATHEREDASSETS.JS - PRZESTARZAŁE I ZNISZCZONE TEKSTURY ARENY 3
// Spójna estetyka prastarych, spękanych, pokrytych mchem i zwęglonych elementów:
// drewniane deski, belki nośne, słupy tekowego drewna, ciosane bloki kamienne,
// kute żelazne okucia ze śladami rdzy, nity, listwy oraz organiczny mech dżungli.
// =========================================================================

// Mapy buforowanych sprajtów nienaruszonych elementów (Offscreen Canvas Caching)
// Eliminuje setki powtarzających się wywołań stroke/fill na deski, słupy i bloki kamienne
const _deckCanvasCache = new Map();
const _postCanvasCache = new Map();
const _stoneCanvasCache = new Map();

export function resetWeatheredAssetsCache() {
  _deckCanvasCache.clear();
  _postCanvasCache.clear();
  _stoneCanvasCache.clear();
}

/**
 * Rysuje modułową belkę / deskę pomostu w estetyce postarzanego, zniszczonego drewna tekowego.
 * W wersji nienaruszonej (damageRatio === 0) rysowana błyskawicznie z bufora Offscreen Canvas!
 */
export function drawWeatheredTimberDeck(ctx, x, y, w, h, options = {}) {
  if (typeof document !== 'undefined') {
    const rawDmg = options.damageRatio || 0;
    const dmgTier = rawDmg <= 0.05 ? 0 : (rawDmg < 0.55 ? 1 : 2);
    const seed = options.seed !== undefined ? options.seed : Math.floor(Math.abs(x * 11 + y * 17) % 100);
    const isWet = options.isWet !== undefined ? options.isWet : (y + h >= 1290);
    const plankCount = options.plankCount || (w > 32 ? 2 : 1);
    const hasMetal = options.hasMetal !== false;
    const hasMoss = options.hasMoss !== false;
    const hangingVines = !!options.hangingVines;

    const cacheKey = `${Math.round(w)}_${Math.round(h)}_${seed % 8}_${isWet ? 1 : 0}_${plankCount}_${hasMetal ? 1 : 0}_${hasMoss ? 1 : 0}_${hangingVines ? 1 : 0}_${dmgTier}`;
    let cached = _deckCanvasCache.get(cacheKey);
    if (!cached) {
      cached = document.createElement('canvas');
      const padY = hangingVines ? 20 : 4;
      cached.width = Math.ceil(w) + 6;
      cached.height = Math.ceil(h) + padY;
      const cCtx = cached.getContext('2d');
      if (cCtx) {
        cCtx.save();
        cCtx.translate(2, 2);
        const optWithTier = { ...options, damageRatio: dmgTier === 0 ? 0 : (dmgTier === 1 ? 0.35 : 0.75) };
        renderWeatheredTimberDeckVectors(cCtx, 0, 0, w, h, optWithTier);
        cCtx.restore();
      }
      _deckCanvasCache.set(cacheKey, cached);
    }
    if (cached) {
      ctx.drawImage(cached, x - 2, y - 2);
      return;
    }
  }

  renderWeatheredTimberDeckVectors(ctx, x, y, w, h, options);
}

function renderWeatheredTimberDeckVectors(ctx, x, y, w, h, options = {}) {
  const seed = options.seed !== undefined ? options.seed : Math.floor(Math.abs(x * 11 + y * 17) % 100);
  const isWet = options.isWet !== undefined ? options.isWet : (y + h >= 1290);
  const plankCount = options.plankCount || (w > 32 ? 2 : 1);
  const hasMetal = options.hasMetal !== false;
  const hasMoss = options.hasMoss !== false;
  const mossAmount = options.mossAmount !== undefined ? options.mossAmount : 1.0;
  const hasGouges = options.hasGouges !== false;
  const hasRimLight = options.hasRimLight !== false;
  const damageRatio = options.damageRatio || 0;
  const animTime = options.animTime || 0;
  const hangingVines = options.hangingVines || false;

  ctx.save();

  // 1. Wielowarstwowe wypełnienie zestarzałego drewna (teak / palisander)
  ctx.fillStyle = isWet ? '#2b1708' : '#4a2c10';

  // 2. Wyszczerbiony, organiczny profil deski (subtelne mikro-skosy i ubytki)
  ctx.beginPath();
  ctx.moveTo(x + 2, y);
  ctx.lineTo(x + w - 2, y);
  ctx.lineTo(x + w, y + 2);
  ctx.lineTo(x + w, y + h - 1);
  ctx.lineTo(x + w - 1, y + h);
  ctx.lineTo(x + 1, y + h);
  ctx.lineTo(x, y + h - 1);
  ctx.lineTo(x, y + 2);
  ctx.closePath();
  ctx.fill();

  // Cień dolny deski
  ctx.fillStyle = 'rgba(15, 6, 2, 0.45)';
  ctx.fillRect(x + 1, y + h * 0.65, w - 2, h * 0.35);

  // 3. Wytarcie środka od kroków / ślad stóp (desaturated foot-traffic patina)
  if (w > 20) {
    ctx.fillStyle = 'rgba(195, 150, 95, 0.12)';
    ctx.fillRect(x + w * 0.2, y + 2, w * 0.6, h * 0.4);
  }

  // 4. Podział na poszczególne deski (szczeliny dylatacyjne z cieniem)
  if (plankCount > 1) {
    const plankW = w / plankCount;
    ctx.strokeStyle = '#0e0501';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let p = 1; p < plankCount; p++) {
      const px = x + p * plankW;
      ctx.moveTo(px, y);
      ctx.lineTo(px, y + h);
    }
    ctx.stroke();
  }

  // 5. Wzdłużne słoje drewna i rozwarstwienia włókien (wood grain fissures)
  ctx.strokeStyle = 'rgba(14, 6, 2, 0.70)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  // Słój 1 (górny)
  const gY1 = y + h * 0.28 + ((seed % 3) - 1);
  ctx.moveTo(x + 3, gY1);
  ctx.lineTo(x + w - 4, gY1 - 1);
  // Słój 2 (dolny)
  const gY2 = y + h * 0.68 + (((seed + 2) % 3) - 1);
  ctx.moveTo(x + 4, gY2);
  ctx.lineTo(x + w - 3, gY2 + 1);
  ctx.stroke();

  // Sęk w drewnie na niektórych deskach (knot eye)
  if (seed % 3 === 0 && w > 24) {
    const knotX = x + ((seed * 7) % Math.max(12, Math.floor(w - 16))) + 8;
    const knotY = y + h * 0.5 + ((seed % 5) - 2);
    ctx.fillStyle = '#120501';
    ctx.beginPath();
    ctx.ellipse(knotX, knotY, 3.2, 2.0, 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(95, 55, 20, 0.55)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.ellipse(knotX, knotY, 5.5, 3.2, 0.15, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 6. Ślady walki, rykoszetów i wyszczerbień (battle gouges / shrapnel nicks)
  if (hasGouges && seed % 2 === 0) {
    const gougeX = x + ((seed * 13) % Math.max(8, Math.floor(w - 12))) + 6;
    const gougeY = y + ((seed % 3) + 2);
    ctx.fillStyle = '#0a0301';
    ctx.beginPath();
    ctx.moveTo(gougeX - 3, gougeY);
    ctx.lineTo(gougeX + 3, gougeY - 1);
    ctx.lineTo(gougeX + 1, gougeY + 3);
    ctx.closePath();
    ctx.fill();

    // Jasna odłupana drzazga
    ctx.strokeStyle = 'rgba(215, 175, 95, 0.65)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // 7. Dynamiczne pęknięcia naprężeniowe przy uszkodzeniu (stress fractures)
  if (damageRatio > 0.1) {
    ctx.strokeStyle = '#080201';
    ctx.lineWidth = 1.8 + damageRatio * 1.2;
    ctx.beginPath();
    const splitX = x + w * (0.35 + (seed % 30) * 0.01);
    ctx.moveTo(splitX, y);
    ctx.lineTo(splitX + (seed % 2 === 0 ? 3 : -3), y + h * 0.5);
    ctx.lineTo(splitX + (seed % 2 === 0 ? -2 : 4), y + h);
    if (damageRatio > 0.5) {
      const splitX2 = x + w * (0.7 + (seed % 20) * 0.01);
      ctx.moveTo(splitX2, y + 2);
      ctx.lineTo(splitX2 - 4, y + h * 0.6);
      ctx.lineTo(splitX2 + 1, y + h);
    }
    ctx.stroke();
  }

  // 8. Kute żelazne okucia / płaskowniki i kwadratowe nity ze strugami rdzy
  if (hasMetal) {
    const strapPositions = [];
    if (w >= 30) {
      strapPositions.push(x + 5);
      strapPositions.push(x + w - 8);
    } else {
      strapPositions.push(x + w * 0.5 - 2);
    }

    for (let i = 0; i < strapPositions.length; i++) {
      const sx = strapPositions[i];
      // Stalowa taśma / obejma
      ctx.fillStyle = '#222d3d';
      ctx.fillRect(sx - 1.5, y + 2, 4.5, h - 4);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.0;
      ctx.strokeRect(sx - 1.5, y + 2, 4.5, h - 4);

      // Kwadratowe kute nity (górny i dolny)
      ctx.fillStyle = '#64748b';
      ctx.fillRect(sx - 0.5, y + 3.5, 2.5, 2.5);
      if (h > 14) {
        ctx.fillRect(sx - 0.5, y + h - 6.5, 2.5, 2.5);
      }
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sx + 0.5, y + 4.5, 1.5, 1.5);

      // Zacieki rdzy wnikające w pory drewna pod gwoździem
      ctx.fillStyle = 'rgba(146, 64, 14, 0.48)';
      ctx.fillRect(sx, y + 6.5, 1.5, 3.5);
      if (h > 14) {
        ctx.fillRect(sx, y + h - 3.5, 1.5, 2.5);
      }
    }
  }

  // 9. Organiczny mech dżungli w szczelinach i na wilgotnej krawędzi (zoptymalizowany)
  if (hasMoss && mossAmount > 0) {
    ctx.fillStyle = '#223d12';
    ctx.fillRect(x + 2, y, w - 4, 2.4);
    ctx.fillStyle = '#447822';
    for (let mx = x + 4; mx < x + w - 4; mx += 10) {
      ctx.fillRect(mx, y, 4, 1.8);
    }
  }

  // 10. Ciepły złocisty rim-light na górnej krawędzi (kontrastujący z cieniem)
  if (hasRimLight) {
    ctx.strokeStyle = 'rgba(230, 190, 105, 0.85)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 0.6);
    ctx.lineTo(x + w - 2, y + 0.6);
    ctx.stroke();
  }

  // 11. Główny, ciemny obrys zniszczalnej belki
  ctx.strokeStyle = '#140802';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // 12. Wiszące pnącza / strzępki mchu pod kładką (dla pomostów w koronach drzew)
  if (hangingVines) {
    const vineCount = 2 + (seed % 3);
    for (let v = 0; v < vineCount; v++) {
      const vx = x + ((v + 1) * w) / (vineCount + 1);
      const vineLen = 6 + ((seed * (v + 1)) % 8);
      const sway = Math.sin(vx * 0.17 + v * 1.3) * 2.2;

      ctx.strokeStyle = '#2b4416';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(vx, y + h);
      ctx.lineTo(vx + sway, y + h + vineLen);
      ctx.stroke();

      // Listek pnącza
      ctx.fillStyle = '#4d7826';
      ctx.beginPath();
      ctx.arc(vx + sway, y + h + vineLen, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Rysuje masywny pionowy słup z ciosanych pni tekowych lub hebanowych (np. pylon, wieża, podpora).
 * W wersji nienaruszonej (damageRatio === 0) pobierany błyskawicznie ze zbuforowanego canvasa!
 */
export function drawWeatheredTimberPost(ctx, x, y, w, h, options = {}) {
  const damageRatio = options.damageRatio || 0;
  if (damageRatio === 0 && typeof document !== 'undefined') {
    const seed = options.seed !== undefined ? options.seed : Math.floor(Math.abs(x * 7 + y * 13) % 100);
    const bandInterval = options.bandInterval || 85;
    const isWet = options.isWet || false;

    const cacheKey = `${Math.round(w)}_${Math.round(h)}_${seed % 8}_${isWet ? 1 : 0}_${bandInterval}`;
    let cached = _postCanvasCache.get(cacheKey);
    if (!cached) {
      cached = document.createElement('canvas');
      cached.width = Math.ceil(w) + 6;
      cached.height = Math.ceil(h) + 6;
      const cCtx = cached.getContext('2d');
      if (cCtx) {
        cCtx.save();
        cCtx.translate(2, 2);
        renderWeatheredTimberPostVectors(cCtx, 0, 0, w, h, options);
        cCtx.restore();
      }
      _postCanvasCache.set(cacheKey, cached);
    }
    if (cached) {
      ctx.drawImage(cached, x - 2, y - 2);
      return;
    }
  }

  renderWeatheredTimberPostVectors(ctx, x, y, w, h, options);
}

function renderWeatheredTimberPostVectors(ctx, x, y, w, h, options = {}) {
  const seed = options.seed !== undefined ? options.seed : Math.floor(Math.abs(x * 7 + y * 13) % 100);
  const bandInterval = options.bandInterval || 85;
  const damageRatio = options.damageRatio || 0;
  const isWet = options.isWet || false;

  ctx.save();

  // 1. Drewno słupa z cieniowaniem cylindrycznym (bez alokacji gradientu)
  ctx.fillStyle = isWet ? '#261407' : '#42270f';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(10, 4, 1, 0.45)';
  ctx.fillRect(x + w * 0.6, y, w * 0.4, h);

  // 2. Faza krawędzi słupa (chamfer highlights)
  ctx.strokeStyle = 'rgba(215, 175, 95, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 1.5, y);
  ctx.lineTo(x + 1.5, y + h);
  ctx.stroke();

  // 3. Pionowe szczeliny i spękania wzdłużne w słojach drewna
  ctx.strokeStyle = '#0e0501';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const g1X = x + w * 0.3;
  ctx.moveTo(g1X, y);
  ctx.lineTo(g1X + ((seed % 3) - 1), y + h * 0.4);
  ctx.lineTo(g1X, y + h);

  const g2X = x + w * 0.72;
  ctx.moveTo(g2X, y + 10);
  ctx.lineTo(g2X - ((seed % 3) - 1), y + h * 0.7);
  ctx.lineTo(g2X, y + h);
  ctx.stroke();

  // Sęki na pniu
  const knotY = y + (h * 0.35) + ((seed * 11) % Math.max(20, Math.floor(h * 0.3)));
  if (knotY < y + h - 20) {
    ctx.fillStyle = '#0a0301';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.45, knotY, 3.5, 5.0, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(85, 50, 20, 0.55)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.45, knotY, 6.0, 8.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 4. Kute stalowe obejmy wzmacniające z kwadratowymi nitami i zaciekami rdzy
  const startBandY = y + (bandInterval * 0.6);
  for (let by = startBandY; by < y + h - 25; by += bandInterval) {
    // Stalowy pas
    ctx.fillStyle = '#273444';
    ctx.fillRect(x - 3, by, w + 6, 12);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(x - 3, by, w + 6, 12);

    // Kute nity z połyskiem
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x - 1, by + 3.5, 3, 5);
    ctx.fillRect(x + w - 2, by + 3.5, 3, 5);
    if (w > 26) {
      ctx.fillRect(x + w * 0.5 - 1.5, by + 3.5, 3, 5);
    }

    // Cienie nitów
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, by + 5.5, 2, 3);
    ctx.fillRect(x + w - 1, by + 5.5, 2, 3);

    // Zacieki rdzy
    ctx.fillStyle = 'rgba(146, 64, 14, 0.50)';
    ctx.fillRect(x - 1, by + 12, 2.5, 9);
    ctx.fillRect(x + w - 2, by + 12, 2.5, 8);
  }

  // 5. Pęknięcia w drewnie przy uszkodzeniu
  if (damageRatio > 0.1) {
    ctx.strokeStyle = '#0a0301';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.4, y + h * 0.2);
    ctx.lineTo(x + w * 0.6, y + h * 0.35);
    ctx.lineTo(x + w * 0.35, y + h * 0.55);
    if (damageRatio > 0.5) {
      ctx.moveTo(x + w * 0.7, y + h * 0.45);
      ctx.lineTo(x + w * 0.3, y + h * 0.7);
      ctx.lineTo(x + w * 0.55, y + h * 0.85);
    }
    ctx.stroke();
  }

  // Obrys pnia
  ctx.strokeStyle = '#120702';
  ctx.lineWidth = 2.0;
  ctx.strokeRect(x, y, w, h);

  ctx.restore();
}

/**
 * Rysuje ciosany blok z kamienia bazaltowego / dolomitowego (fundamenty, kesony, półki snajperskie).
 * W wersji nienaruszonej (damageRatio === 0) pobierany błyskawicznie ze zbuforowanego canvasa!
 */
export function drawWeatheredStoneMasonry(ctx, x, y, w, h, options = {}) {
  const damageRatio = options.damageRatio || 0;
  if (damageRatio === 0 && typeof document !== 'undefined') {
    const seed = options.seed !== undefined ? options.seed : Math.floor(Math.abs(x * 5 + y * 9) % 100);
    const courseHeight = options.courseHeight || 28;
    const hasChamfer = options.hasChamfer !== false;
    const hasCramps = options.hasCramps !== false;
    const mossTop = options.mossTop !== false;
    const waterLineY = options.waterLineY || 1300;
    const isNearWater = (y + h >= waterLineY);

    const cacheKey = `${Math.round(w)}_${Math.round(h)}_${seed % 8}_${courseHeight}_${hasChamfer ? 1 : 0}_${hasCramps ? 1 : 0}_${mossTop ? 1 : 0}_${isNearWater ? 1 : 0}`;
    let cached = _stoneCanvasCache.get(cacheKey);
    if (!cached) {
      cached = document.createElement('canvas');
      cached.width = Math.ceil(w) + 6;
      cached.height = Math.ceil(h) + 6;
      const cCtx = cached.getContext('2d');
      if (cCtx) {
        cCtx.save();
        cCtx.translate(2, 2);
        renderWeatheredStoneMasonryVectors(cCtx, 0, 0, w, h, options);
        cCtx.restore();
      }
      _stoneCanvasCache.set(cacheKey, cached);
    }
    if (cached) {
      ctx.drawImage(cached, x - 2, y - 2);
      return;
    }
  }

  renderWeatheredStoneMasonryVectors(ctx, x, y, w, h, options);
}

function renderWeatheredStoneMasonryVectors(ctx, x, y, w, h, options = {}) {
  const seed = options.seed !== undefined ? options.seed : Math.floor(Math.abs(x * 5 + y * 9) % 100);
  const courseHeight = options.courseHeight || 28;
  const hasChamfer = options.hasChamfer !== false;
  const hasCramps = options.hasCramps !== false;
  const waterLineY = options.waterLineY || 1300;
  const isNearWater = (y + h >= waterLineY);
  const damageRatio = options.damageRatio || 0;
  const mossTop = options.mossTop !== false;

  ctx.save();

  // 1. Główna baza skały dolomitowo-bazaltowej (bez alokacji gradientu)
  ctx.fillStyle = isNearWater ? '#202820' : '#343f34';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(16, 22, 16, 0.55)';
  ctx.fillRect(x, y + h * 0.65, w, h * 0.35);

  // 2. Faza korony bloku (chamfer) z fasetowanym cieniowaniem
  if (hasChamfer) {
    ctx.fillStyle = 'rgba(125, 155, 125, 0.28)';
    ctx.beginPath();
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x + 5, y);
    ctx.lineTo(x + w - 5, y);
    ctx.lineTo(x + w, y + 4);
    ctx.lineTo(x + w - 2, y + 6);
    ctx.lineTo(x + 2, y + 6);
    ctx.closePath();
    ctx.fill();
  }

  // 3. Poziome ciosy kamienne i spoiny murarskie (zgrupowane w 1 stroke)
  ctx.strokeStyle = '#0c120c';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  let courseIdx = 0;
  for (let by = y + courseHeight; by < y + h - 6; by += courseHeight) {
    ctx.moveTo(x, by);
    ctx.lineTo(x + w, by);

    // Pionowe spoiny z przesunięciem cegieł (staggered joints)
    const blockW = Math.max(22, w * 0.45);
    const startOffset = (courseIdx % 2 === 0) ? blockW * 0.5 : blockW;
    for (let jx = x + startOffset; jx < x + w - 6; jx += blockW) {
      ctx.moveTo(jx, by - courseHeight);
      ctx.lineTo(jx, by);
    }
    courseIdx++;
  }
  ctx.stroke();

  // Kute żelazne klamry kotwiące (iron cramp clamps) spinające sąsiednie bloki
  if (hasCramps) {
    courseIdx = 0;
    for (let by = y + courseHeight; by < y + h - 6; by += courseHeight) {
      const blockW = Math.max(22, w * 0.45);
      const startOffset = (courseIdx % 2 === 0) ? blockW * 0.5 : blockW;
      for (let jx = x + startOffset; jx < x + w - 6; jx += blockW) {
        if ((courseIdx + seed) % 2 === 0 && jx > x + 6 && jx < x + w - 10) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(jx - 4, by - courseHeight + 6, 8, 3.5);
          ctx.fillRect(jx - 4, by - courseHeight + 4, 2.5, 6);
          ctx.fillRect(jx + 2, by - courseHeight + 4, 2.5, 6);

          // Rdza wokół klamry wnikająca w spoinę kamienia
          ctx.fillStyle = 'rgba(146, 64, 14, 0.45)';
          ctx.fillRect(jx - 1, by - courseHeight + 9, 2, 5);
        }
      }
      courseIdx++;
    }
  }

  // Fasetowy refleks na górnej krawędzi każdego ciosu (zgrupowany w 1 stroke)
  ctx.strokeStyle = 'rgba(135, 175, 135, 0.22)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  for (let by = y + courseHeight; by < y + h - 6; by += courseHeight) {
    ctx.moveTo(x + 2, by + 1.2);
    ctx.lineTo(x + w - 2, by + 1.2);
  }
  ctx.stroke();

  // 4. Strefa zanurzenia w rzece: ciemny muł, glony i wilgotny połysk (waterline slime)
  if (isNearWater && waterLineY > y) {
    const slimeTopY = Math.max(y, waterLineY - 18);
    ctx.fillStyle = 'rgba(8, 20, 8, 0.75)';
    ctx.fillRect(x, slimeTopY, w, (y + h) - slimeTopY);

    // Linia kożucha glonów
    ctx.strokeStyle = 'rgba(65, 130, 45, 0.65)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x, waterLineY);
    ctx.lineTo(x + w, waterLineY);
    ctx.stroke();
  }

  // 5. Spękania przy uszkodzeniu
  if (damageRatio > 0.1) {
    ctx.strokeStyle = '#080d08';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.35, y);
    ctx.lineTo(x + w * 0.42, y + h * 0.4);
    ctx.lineTo(x + w * 0.30, y + h * 0.8);
    if (damageRatio > 0.5) {
      ctx.moveTo(x + w * 0.7, y + 4);
      ctx.lineTo(x + w * 0.6, y + h * 0.5);
      ctx.lineTo(x + w * 0.75, y + h);
    }
    ctx.stroke();
  }

  // 6. Mech dżungli na szczycie i w zakamarkach cokołu
  if (mossTop) {
    ctx.fillStyle = '#2d541c';
    ctx.fillRect(x, y, w, 5);
    ctx.fillStyle = '#4e8d2e';
    ctx.fillRect(x + 4, y, w - 8, 3.2);
    ctx.fillStyle = '#76c444';
    for (let mx = x + 6; mx < x + w - 6; mx += 16) {
      ctx.fillRect(mx + (seed % 4), y, 3, 1.6);
    }
  }

  // Obrys bloku
  ctx.strokeStyle = '#0e150e';
  ctx.lineWidth = 2.2;
  ctx.strokeRect(x, y, w, h);

  ctx.restore();
}

/**
 * Rysuje gniazdo snajperskie i balustradę z otworami strzelniczymi w estetyce ruin wojskowych.
 */
export function drawWeatheredBalustrade(ctx, x, y, w, h, options = {}) {
  const seed = options.seed !== undefined ? options.seed : Math.floor(Math.abs(x * 9) % 100);
  const slitW = options.slitW || Math.min(22, w * 0.45);
  const slitH = options.slitH || Math.min(14, h * 0.45);

  ctx.save();

  // 1. Drewniany pancerz parapetu
  const balGrad = ctx.createLinearGradient(x, y, x, y + h);
  balGrad.addColorStop(0.0, '#4d3014');
  balGrad.addColorStop(0.5, '#351f0b');
  balGrad.addColorStop(1.0, '#1d0f04');
  ctx.fillStyle = balGrad;
  ctx.fillRect(x, y, w, h);

  // 2. Faza górna parapetu
  ctx.strokeStyle = 'rgba(215, 175, 95, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y + 0.6);
  ctx.lineTo(x + w, y + 0.6);
  ctx.stroke();

  // 3. Szczelina strzelnicza z rozglifionymi policzkami (beveled embrasure cheeks)
  const slitX = x + (w - slitW) * 0.5;
  const slitY = y + (h - slitH) * 0.5;

  // Rozglifienie policzków szczeliny
  ctx.fillStyle = '#100702';
  ctx.beginPath();
  ctx.moveTo(slitX - 3, slitY - 2);
  ctx.lineTo(slitX + slitW + 3, slitY - 2);
  ctx.lineTo(slitX + slitW, slitY + slitH + 2);
  ctx.lineTo(slitX, slitY + slitH + 2);
  ctx.closePath();
  ctx.fill();

  // Głęboki cień otworu strzeleckiego
  ctx.fillStyle = '#020100';
  ctx.fillRect(slitX, slitY, slitW, slitH);

  // Stalowe okucie krawędzi szczeliny
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(slitX, slitY, slitW, slitH);

  // Nity narożne szczeliny
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(slitX - 1.5, slitY - 1.5, 2, 2);
  ctx.fillRect(slitX + slitW - 0.5, slitY - 1.5, 2, 2);

  // 4. Ślady po kulach na osłonie (bullet impact gouges)
  if (seed % 2 === 0) {
    const bHitX = x + 6 + (seed % 8);
    const bHitY = y + 8 + (seed % 6);
    ctx.fillStyle = '#060201';
    ctx.beginPath();
    ctx.arc(bHitX, bHitY, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(215, 175, 95, 0.7)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // Obrys parapetu
  ctx.strokeStyle = '#140802';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(x, y, w, h);

  ctx.restore();
}
