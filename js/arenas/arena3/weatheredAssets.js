// =========================================================================
// ARENAS/ARENA3/WEATHEREDASSETS.JS - PRZESTARZAŁE I ZNISZCZONE TEKSTURY ARENY 3
// Spójna estetyka prastarych, spękanych, pokrytych mchem i zwęglonych elementów:
// drewniane deski, belki nośne, słupy tekowego drewna, ciosane bloki kamienne,
// kute żelazne okucia ze śladami rdzy, nity, listwy oraz organiczny mech dżungli.
// =========================================================================

/**
 * Rysuje modułową belkę / deskę pomostu w estetyce postarzanego, zniszczonego drewna tekowego.
 * Odpowiada wizualnie niszczonym fragmentom (drawSplinteredWoodRubble), zachowując
 * nienaruszony obrys kolizyjny z subtelnymi wyszczerbieniami krawędzi.
 */
export function drawWeatheredTimberDeck(ctx, x, y, w, h, options = {}) {
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

  // 1. Wielowarstwowy, nasycony gradient zestarzałego drewna (teak / palisander)
  // Identyczna paleta jak w drawSplinteredWoodRubble!
  const bGrad = ctx.createLinearGradient(x, y, x, y + h);
  if (isWet) {
    bGrad.addColorStop(0.0, '#3f2510');
    bGrad.addColorStop(0.35, '#2b1708');
    bGrad.addColorStop(0.75, '#1a0d04');
    bGrad.addColorStop(1.0, '#0f0602');
  } else {
    bGrad.addColorStop(0.0, '#664019');
    bGrad.addColorStop(0.35, '#4a2c10');
    bGrad.addColorStop(0.75, '#2d1807');
    bGrad.addColorStop(1.0, '#1c0d03');
  }

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

  ctx.fillStyle = bGrad;
  ctx.fill();

  // 3. Wytarcie środka od kroków / ślad stóp (desaturated foot-traffic patina)
  if (w > 20) {
    const footGrad = ctx.createRadialGradient(x + w * 0.5, y + h * 0.35, 2, x + w * 0.5, y + h * 0.35, w * 0.45);
    footGrad.addColorStop(0.0, 'rgba(195, 150, 95, 0.16)');
    footGrad.addColorStop(0.7, 'rgba(120, 85, 45, 0.08)');
    footGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = footGrad;
    ctx.fill();
  }

  // 4. Podział na poszczególne deski (szczeliny dylatacyjne z cieniem)
  if (plankCount > 1) {
    const plankW = w / plankCount;
    for (let p = 1; p < plankCount; p++) {
      const px = x + p * plankW;
      // Cień szczeliny
      ctx.strokeStyle = '#0e0501';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.lineTo(px, y + h);
      ctx.stroke();

      // Zaokrąglona faza krawędzi deski
      ctx.strokeStyle = 'rgba(180, 130, 65, 0.35)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(px + 1.2, y + 1);
      ctx.lineTo(px + 1.2, y + h - 1);
      ctx.stroke();
    }
  }

  // 5. Wzdłużne słoje drewna i rozwarstwienia włókien (wood grain fissures)
  ctx.strokeStyle = 'rgba(14, 6, 2, 0.70)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  // Słój 1 (górny)
  const gY1 = y + h * 0.28 + ((seed % 3) - 1);
  ctx.moveTo(x + 3, gY1);
  ctx.quadraticCurveTo(x + w * 0.45, gY1 + ((seed % 5) - 2), x + w - 4, gY1 - 1);
  // Słój 2 (dolny)
  const gY2 = y + h * 0.68 + (((seed + 2) % 3) - 1);
  ctx.moveTo(x + 4, gY2);
  ctx.quadraticCurveTo(x + w * 0.6, gY2 - ((seed % 4) - 1.5), x + w - 3, gY2 + 1);
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

  // 9. Organiczny mech dżungli w szczelinach i na wilgotnej krawędzi
  if (hasMoss && mossAmount > 0) {
    // Ciemna wilgotna baza mchu
    ctx.fillStyle = '#223d12';
    for (let mx = x + 2; mx < x + w - 2; mx += 6) {
      const mw = 4 + (Math.sin(mx * 0.4 + seed) * 2);
      ctx.fillRect(mx, y, mw, 3.2);
    }
    // Świeży korpus mchu
    ctx.fillStyle = '#447822';
    for (let mx = x + 3; mx < x + w - 3; mx += 8) {
      const mw = 3.5 + (Math.cos(mx * 0.5 + seed) * 1.8);
      ctx.fillRect(mx, y, mw, 2.2);
    }
    // Jasne punkty porostów (lichen specks)
    ctx.fillStyle = '#78ba34';
    for (let mx = x + 4; mx < x + w - 4; mx += 14) {
      ctx.fillRect(mx + ((seed % 3)), y, 2.2, 1.4);
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
      const sway = Math.sin(animTime * 2.5 + vx * 0.05) * 2.5;

      ctx.strokeStyle = '#2b4416';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(vx, y + h);
      ctx.quadraticCurveTo(vx + sway * 0.5, y + h + vineLen * 0.5, vx + sway, y + h + vineLen);
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
 */
export function drawWeatheredTimberPost(ctx, x, y, w, h, options = {}) {
  const seed = options.seed !== undefined ? options.seed : Math.floor(Math.abs(x * 7 + y * 13) % 100);
  const bandInterval = options.bandInterval || 85;
  const damageRatio = options.damageRatio || 0;
  const isWet = options.isWet || false;

  ctx.save();

  // 1. Pionowy gradient drewna z wyrazistym trójwymiarowym cieniowaniem cylindrycznym
  const pGrad = ctx.createLinearGradient(x, y, x + w, y);
  if (isWet) {
    pGrad.addColorStop(0.0, '#38200c');
    pGrad.addColorStop(0.35, '#261407');
    pGrad.addColorStop(0.75, '#160a03');
    pGrad.addColorStop(1.0, '#0a0401');
  } else {
    pGrad.addColorStop(0.0, '#5a3818');
    pGrad.addColorStop(0.35, '#42270f');
    pGrad.addColorStop(0.75, '#291607');
    pGrad.addColorStop(1.0, '#140a03');
  }

  ctx.fillStyle = pGrad;
  ctx.fillRect(x, y, w, h);

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
 * Identyczna kolorystyka i relief jak w drawSplinteredRockSlab!
 */
export function drawWeatheredStoneMasonry(ctx, x, y, w, h, options = {}) {
  const seed = options.seed !== undefined ? options.seed : Math.floor(Math.abs(x * 5 + y * 9) % 100);
  const courseHeight = options.courseHeight || 28;
  const hasChamfer = options.hasChamfer !== false;
  const hasCramps = options.hasCramps !== false;
  const waterLineY = options.waterLineY || 1300;
  const isNearWater = (y + h >= waterLineY);
  const damageRatio = options.damageRatio || 0;
  const mossTop = options.mossTop !== false;

  ctx.save();

  // 1. Główny wielowarstwowy gradient skały dolomitowo-bazaltowej
  const rGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  rGrad.addColorStop(0.0, '#4b574b');
  rGrad.addColorStop(0.35, '#343f34');
  rGrad.addColorStop(0.70, '#202820');
  rGrad.addColorStop(1.0, '#101610');
  ctx.fillStyle = rGrad;
  ctx.fillRect(x, y, w, h);

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

  // 3. Poziome ciosy kamienne i spoiny murarskie (ashlar masonry seams)
  ctx.strokeStyle = '#0c120c';
  ctx.lineWidth = 2.0;
  let courseIdx = 0;
  for (let by = y + courseHeight; by < y + h - 6; by += courseHeight) {
    ctx.beginPath();
    ctx.moveTo(x, by);
    ctx.lineTo(x + w, by);
    ctx.stroke();

    // Pionowe spoiny z przesunięciem cegieł (staggered joints)
    const blockW = Math.max(22, w * 0.45);
    const startOffset = (courseIdx % 2 === 0) ? blockW * 0.5 : blockW;
    for (let jx = x + startOffset; jx < x + w - 6; jx += blockW) {
      ctx.beginPath();
      ctx.moveTo(jx, by - courseHeight);
      ctx.lineTo(jx, by);
      ctx.stroke();

      // Kute żelazne klamry kotwiące (iron cramp clamps) spinające sąsiednie bloki
      if (hasCramps && (courseIdx + seed) % 2 === 0 && jx > x + 6 && jx < x + w - 10) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(jx - 4, by - courseHeight + 6, 8, 3.5);
        ctx.fillRect(jx - 4, by - courseHeight + 4, 2.5, 6);
        ctx.fillRect(jx + 2, by - courseHeight + 4, 2.5, 6);

        // Rdza wokół klamry wnikająca w spoinę kamienia
        ctx.fillStyle = 'rgba(146, 64, 14, 0.45)';
        ctx.fillRect(jx - 1, by - courseHeight + 9, 2, 5);
      }
    }

    // Fasetowy refleks na górnej krawędzi każdego ciosu
    ctx.strokeStyle = 'rgba(135, 175, 135, 0.22)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(x + 2, by + 1.2);
    ctx.lineTo(x + w - 2, by + 1.2);
    ctx.stroke();

    courseIdx++;
  }

  // 4. Strefa zanurzenia w rzece: ciemny muł, glony i wilgotny połysk (waterline slime)
  if (isNearWater && waterLineY > y) {
    const slimeTopY = Math.max(y, waterLineY - 18);
    const slimeGrad = ctx.createLinearGradient(x, slimeTopY, x, y + h);
    slimeGrad.addColorStop(0.0, 'rgba(25, 48, 20, 0.0)');
    slimeGrad.addColorStop(0.35, 'rgba(20, 42, 16, 0.70)');
    slimeGrad.addColorStop(0.70, 'rgba(8, 20, 8, 0.88)');
    slimeGrad.addColorStop(1.0, 'rgba(4, 10, 4, 0.95)');
    ctx.fillStyle = slimeGrad;
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
