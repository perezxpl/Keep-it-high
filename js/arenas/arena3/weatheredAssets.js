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

/**
 * Oblicza fizyczną wysokość Y potężnego konara baldachimu dżungli dla dowolnej współrzędnej X.
 * Liny nośne pomostów wiszących są zakotwiczone dokładnie w tym punkcie.
 */
export function getCanopyBranchAnchorY(x) {
  if (x <= 2200) {
    // Lewy konar od 1200 do 2150
    const t = Math.max(0, Math.min(1, (x - 1200) / 950));
    return 225 + t * 55 + Math.sin(t * Math.PI) * 12;
  } else {
    // Prawy konar od 3200 do 2250
    const t = Math.max(0, Math.min(1, (3200 - x) / 950));
    return 225 + t * 55 + Math.sin(t * Math.PI) * 12;
  }
}

/**
 * Rysuje potężne prastare pnie i konary drzew deszczowych (baldachim dżungli / canopy),
 * do których fizycznie przymocowane są wiszące pomosty taktyczne.
 */
export function drawAncientCanopyBranches(ctx, camL, camR, animTime = 0) {
  // Pomiń jeśli obszar konarów (X: 1100 do 3300) jest całkowicie poza krawędzią kamery
  if (3350 < camL || 1050 > camR) return;

  ctx.save();

  // Punkty mocowań lin wiszących pomostów na konarach
  const harnessPoints = [
    { x: 1420, isLeft: true },
    { x: 1680, isLeft: true },
    { x: 1900, isLeft: true },
    { x: 2120, isLeft: true },
    { x: 2280, isLeft: false },
    { x: 2500, isLeft: false },
    { x: 2720, isLeft: false },
    { x: 2980, isLeft: false }
  ];

  // 1. LEWE GIGANTYCZNE DRZEWO DŻUNGLI (X: 1100-1250, pień wznoszący się z klifu)
  if (2250 >= camL && 1050 <= camR) {
    // A. Pień drzewa w tle wznoszący się z klifu Y: 1200 w górę poza kadr
    const trunkX = 1170;
    const trunkW = 75;
    const tGrad = ctx.createLinearGradient(trunkX - trunkW * 0.5, 0, trunkX + trunkW * 0.5, 0);
    tGrad.addColorStop(0.0, '#4d3016');
    tGrad.addColorStop(0.35, '#351f0b');
    tGrad.addColorStop(0.75, '#201105');
    tGrad.addColorStop(1.0, '#0f0702');

    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.moveTo(trunkX - 42, 1200);
    ctx.lineTo(trunkX - 34, 400);
    ctx.quadraticCurveTo(trunkX - 30, 250, trunkX - 38, 0);
    ctx.lineTo(trunkX + 38, 0);
    ctx.quadraticCurveTo(trunkX + 34, 250, trunkX + 38, 400);
    ctx.lineTo(trunkX + 46, 1200);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#120803';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Wzdłużne bruzdy kory pnia
    ctx.strokeStyle = 'rgba(14, 6, 2, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(trunkX - 12, 1150);
    ctx.lineTo(trunkX - 10, 200);
    ctx.moveTo(trunkX + 14, 1180);
    ctx.lineTo(trunkX + 12, 160);
    ctx.stroke();

    // B. Główny poziomy sękaty konar rozciągający się nad kładkami (od X: 1190 do 2160)
    const bGradL = ctx.createLinearGradient(1190, 220, 1190, 265);
    bGradL.addColorStop(0.0, '#5a3818');
    bGradL.addColorStop(0.35, '#3e240e');
    bGradL.addColorStop(0.75, '#261507');
    bGradL.addColorStop(1.0, '#120803');

    // Korpus konara
    ctx.fillStyle = bGradL;
    ctx.beginPath();
    // Górna krawędź konara z sękami
    ctx.moveTo(trunkX + 30, 215);
    ctx.quadraticCurveTo(1400, 225, 1600, 245);
    ctx.quadraticCurveTo(1850, 260, 2160, 275);
    // Końcówka konara
    ctx.lineTo(2160, 292);
    // Dolna krawędź konara
    ctx.quadraticCurveTo(1850, 288, 1600, 275);
    ctx.quadraticCurveTo(1400, 262, trunkX + 32, 255);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#140802';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Złocisty rim-light na górnej krawędzi konara (światło księżyca)
    ctx.strokeStyle = 'rgba(230, 195, 115, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(trunkX + 32, 216);
    ctx.quadraticCurveTo(1400, 226, 1600, 246);
    ctx.quadraticCurveTo(1850, 261, 2158, 276);
    ctx.stroke();

    // Poduszki mchu na grzbiecie konara
    ctx.fillStyle = '#3a6620';
    for (let mx = trunkX + 45; mx < 2140; mx += 26) {
      const my = getCanopyBranchAnchorY(mx) - 13;
      ctx.beginPath();
      ctx.ellipse(mx, my, 12, 3.5, 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#65a832';
    for (let mx = trunkX + 50; mx < 2130; mx += 38) {
      const my = getCanopyBranchAnchorY(mx) - 14;
      ctx.beginPath();
      ctx.ellipse(mx, my, 7, 2.2, 0.05, 0, Math.PI * 2);
      ctx.fill();
    }

    // Odgałęzienie górne (boczny konar wznoszący się ku górze)
    ctx.fillStyle = bGradL;
    ctx.beginPath();
    ctx.moveTo(1480, 235);
    ctx.quadraticCurveTo(1580, 210, 1720, 160);
    ctx.lineTo(1720, 178);
    ctx.quadraticCurveTo(1590, 225, 1515, 245);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#140802';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  // 2. PRAWE GIGANTYCZNE DRZEWO DŻUNGLI (X: 3170-3320, pień wznoszący się z prawego klifu)
  if (3350 >= camL && 2200 <= camR) {
    const trunkRX = 3230;
    const trunkW = 75;
    const tGradR = ctx.createLinearGradient(trunkRX - trunkW * 0.5, 0, trunkRX + trunkW * 0.5, 0);
    tGradR.addColorStop(0.0, '#0f0702');
    tGradR.addColorStop(0.25, '#201105');
    tGradR.addColorStop(0.65, '#351f0b');
    tGradR.addColorStop(1.0, '#4d3016');

    ctx.fillStyle = tGradR;
    ctx.beginPath();
    ctx.moveTo(trunkRX - 46, 1200);
    ctx.lineTo(trunkRX - 38, 400);
    ctx.quadraticCurveTo(trunkRX - 34, 250, trunkRX - 38, 0);
    ctx.lineTo(trunkRX + 38, 0);
    ctx.quadraticCurveTo(trunkRX + 30, 250, trunkRX + 34, 400);
    ctx.lineTo(trunkRX + 42, 1200);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#120803';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Wzdłużne bruzdy kory pnia prawego
    ctx.strokeStyle = 'rgba(14, 6, 2, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(trunkRX - 14, 1180);
    ctx.lineTo(trunkRX - 12, 160);
    ctx.moveTo(trunkRX + 12, 1150);
    ctx.lineTo(trunkRX + 10, 200);
    ctx.stroke();

    // Prawy poziomy sękaty konar (od X: 3210 schodzący w lewo do 2240)
    const bGradR = ctx.createLinearGradient(3210, 220, 3210, 265);
    bGradR.addColorStop(0.0, '#5a3818');
    bGradR.addColorStop(0.35, '#3e240e');
    bGradR.addColorStop(0.75, '#261507');
    bGradR.addColorStop(1.0, '#120803');

    ctx.fillStyle = bGradR;
    ctx.beginPath();
    ctx.moveTo(trunkRX - 30, 215);
    ctx.quadraticCurveTo(3000, 225, 2800, 245);
    ctx.quadraticCurveTo(2550, 260, 2240, 275);
    ctx.lineTo(2240, 292);
    ctx.quadraticCurveTo(2550, 288, 2800, 275);
    ctx.quadraticCurveTo(3000, 262, trunkRX - 32, 255);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#140802';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Rim-light na prawym konarze
    ctx.strokeStyle = 'rgba(230, 195, 115, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(trunkRX - 32, 216);
    ctx.quadraticCurveTo(3000, 226, 2800, 246);
    ctx.quadraticCurveTo(2550, 261, 2242, 276);
    ctx.stroke();

    // Poduszki mchu na prawym konarze
    ctx.fillStyle = '#3a6620';
    for (let mx = trunkRX - 45; mx > 2260; mx -= 26) {
      const my = getCanopyBranchAnchorY(mx) - 13;
      ctx.beginPath();
      ctx.ellipse(mx, my, 12, 3.5, -0.05, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#65a832';
    for (let mx = trunkRX - 50; mx > 2270; mx -= 38) {
      const my = getCanopyBranchAnchorY(mx) - 14;
      ctx.beginPath();
      ctx.ellipse(mx, my, 7, 2.2, -0.05, 0, Math.PI * 2);
      ctx.fill();
    }

    // Odgałęzienie górne prawe
    ctx.fillStyle = bGradR;
    ctx.beginPath();
    ctx.moveTo(2920, 235);
    ctx.quadraticCurveTo(2820, 210, 2680, 160);
    ctx.lineTo(2680, 178);
    ctx.quadraticCurveTo(2810, 225, 2885, 245);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#140802';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  // 3. KUTE OKUCIA I ZWOJE LIN NA KONARACH W PUNKTACH MOCOWANIA POMOSTÓW
  for (let i = 0; i < harnessPoints.length; i++) {
    const hp = harnessPoints[i];
    if (hp.x + 30 < camL || hp.x - 30 > camR) continue;

    const by = getCanopyBranchAnchorY(hp.x);

    // Kuty stalowy kołnierz obejmujący konar (iron collar bracket)
    ctx.fillStyle = '#222d3d';
    ctx.fillRect(hp.x - 6, by - 16, 12, 26);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(hp.x - 6, by - 16, 12, 26);

    // Nity i śruba ryglowa
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(hp.x - 4, by - 14, 3, 3);
    ctx.fillRect(hp.x + 1, by - 14, 3, 3);
    ctx.fillRect(hp.x - 1.5, by + 6, 3, 3);

    // Zwoje liny konopnej oplatającej gałąź (rope coils)
    ctx.strokeStyle = '#784d20';
    ctx.lineWidth = 2.2;
    for (let rOff = -8; rOff <= 8; rOff += 4) {
      ctx.beginPath();
      ctx.moveTo(hp.x + rOff, by - 15);
      ctx.lineTo(hp.x + rOff, by + 9);
      ctx.stroke();
    }

    // Kuta szekla nośna pod konarem, z której schodzi lina
    ctx.fillStyle = '#334155';
    ctx.fillRect(hp.x - 4, by + 9, 8, 8);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(hp.x - 4, by + 9, 8, 8);

    // Otwór szekli
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(hp.x, by + 13, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Swobodnie zwisający strzęp liany / pnącza przy mocowaniu
    const vineLen = 22 + (Math.abs(hp.x * 7) % 20);
    const sway = Math.sin(animTime * 2.2 + hp.x * 0.05) * 4;
    ctx.strokeStyle = '#2d4b18';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(hp.x + 8, by + 4);
    ctx.quadraticCurveTo(hp.x + 8 + sway * 0.5, by + 4 + vineLen * 0.5, hp.x + 8 + sway, by + 4 + vineLen);
    ctx.stroke();

    ctx.fillStyle = '#4e8528';
    ctx.beginPath();
    ctx.arc(hp.x + 8 + sway, by + 4 + vineLen, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. MALOWNICZE LIANY I ROŚLINY W TLE BALDACHIMU
  const lianaPositions = [1350, 1550, 1780, 2020, 2380, 2620, 2850, 3050];
  for (let li = 0; li < lianaPositions.length; li++) {
    const lx = lianaPositions[li];
    if (lx + 20 < camL || lx - 20 > camR) continue;

    const ly = getCanopyBranchAnchorY(lx);
    const lLen = 45 + ((li * 23) % 40);
    const lSway = Math.sin(animTime * 1.8 + lx * 0.04) * 6;

    ctx.strokeStyle = 'rgba(38, 64, 22, 0.75)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(lx, ly + 6);
    ctx.quadraticCurveTo(lx + lSway * 0.6, ly + 6 + lLen * 0.5, lx + lSway, ly + 6 + lLen);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Rysuje potężny ostaniec skalny / filar bazaltowy pod półkami snajperskimi (X: 600-1000 oraz X: 3400-3800).
 * Likwiduje efekt lewitowania kamiennych płyt w powietrzu, stabilnie zakotwiczając je w gruncie (Y: 1200).
 */
export function drawSniperRockSpire(ctx, isLeft, camL, camR, slabs = []) {
  const startX = isLeft ? 600 : 3400;
  const spireW = 400;
  const topY = 830; // Poziom bezpośrednio pod płytą snajperską (Y: 800 + grubość 34 - zakładka 4px)
  const bottomY = 1200; // Poziom litego gruntu / klifu
  const bedrockY = 1400; // Głęboki spąg fundamentowy

  if (startX + spireW + 60 < camL || startX - 60 > camR) return;

  ctx.save();

  // Wierzchołki naturalnego ostańca bazaltowego (rozszerzający się ku dołowi megalityczny filar)
  const topX1 = startX + 10;
  const topX2 = startX + spireW - 10;
  const botX1 = startX - 25;
  const botX2 = startX + spireW + 25;

  // 1. Zarys bryły ostańca z uskokami erozyjnymi i naturalnymi krawędziami
  ctx.beginPath();
  ctx.moveTo(topX1, topY);
  ctx.lineTo(topX2, topY);

  // Prawa krawędź skalna z 4 naturalnymi uskokami
  ctx.lineTo(topX2 + 8, topY + 60);
  ctx.lineTo(topX2 + 4, topY + 110);
  ctx.lineTo(topX2 + 16, topY + 180);
  ctx.lineTo(topX2 + 12, topY + 260);
  ctx.lineTo(botX2, bottomY);
  ctx.lineTo(botX2, bedrockY);

  // Podstawa w głębi spągu
  ctx.lineTo(botX1, bedrockY);
  ctx.lineTo(botX1, bottomY);

  // Lewa krawędź skalna z uskokami
  ctx.lineTo(topX1 - 14, topY + 260);
  ctx.lineTo(topX1 - 18, topY + 180);
  ctx.lineTo(topX1 - 6, topY + 110);
  ctx.lineTo(topX1 - 10, topY + 60);
  ctx.closePath();

  // 2. Wielowarstwowy gradient litej skały bazaltowej
  const spGrad = ctx.createLinearGradient(startX, topY, startX + spireW, bottomY);
  spGrad.addColorStop(0.00, '#3a453a');
  spGrad.addColorStop(0.30, '#283328');
  spGrad.addColorStop(0.70, '#161e16');
  spGrad.addColorStop(1.00, '#0a0f0a');
  ctx.fillStyle = spGrad;
  ctx.fill();

  // 3. Poziome warstwy geologiczne (strata) i spękania ciosowe
  ctx.save();
  ctx.clip(); // Ścisły clip do sylwetki filara

  ctx.strokeStyle = '#0c120c';
  ctx.lineWidth = 2.2;
  for (let sy = topY + 35; sy < bottomY; sy += 38) {
    ctx.beginPath();
    ctx.moveTo(startX - 40, sy);
    for (let sx = startX - 30; sx <= startX + spireW + 30; sx += 50) {
      const wave = Math.sin(sx * 0.02 + sy * 0.05) * 4;
      ctx.lineTo(sx, sy + wave);
    }
    ctx.stroke();

    // Fasetowy refleks światła na górnej krawędzi warstwy
    ctx.strokeStyle = 'rgba(125, 155, 125, 0.20)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(startX - 40, sy + 1.2);
    ctx.lineTo(startX + spireW + 40, sy + 1.2);
    ctx.stroke();
  }

  // Pionowe spękania tektoniczne
  ctx.strokeStyle = 'rgba(8, 12, 8, 0.75)';
  ctx.lineWidth = 1.8;
  const fissureXs = [startX + 80, startX + 175, startX + 270, startX + 335];
  for (let fx of fissureXs) {
    ctx.beginPath();
    ctx.moveTo(fx, topY + 10);
    ctx.lineTo(fx + 6, topY + 140);
    ctx.lineTo(fx - 4, topY + 280);
    ctx.lineTo(fx + 2, bottomY);
    ctx.stroke();
  }

  // 4. Prastare korzenie figowców dusicieli (Strangler Fig Roots) oplatające filar skalny
  const rootPaths = [
    [startX + 40, topY, startX + 48, topY + 120, startX + 35, topY + 250, startX + 20, bottomY],
    [startX + 120, topY, startX + 115, topY + 80, startX + 130, topY + 200, startX + 145, bottomY],
    [startX + 230, topY, startX + 245, topY + 110, startX + 235, topY + 230, startX + 250, bottomY],
    [startX + 350, topY, startX + 342, topY + 100, startX + 355, topY + 220, startX + 370, bottomY]
  ];

  for (let r = 0; r < rootPaths.length; r++) {
    const pts = rootPaths[r];
    ctx.strokeStyle = '#382210';
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    ctx.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]);
    ctx.stroke();

    // Jasny grzbiet korzenia
    ctx.strokeStyle = 'rgba(180, 125, 65, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(pts[0] - 0.8, pts[1]);
    ctx.bezierCurveTo(pts[2] - 0.8, pts[3], pts[4] - 0.8, pts[5], pts[6] - 0.8, pts[7]);
    ctx.stroke();
  }

  // 5. Mech naskalny i porosty
  ctx.fillStyle = '#223d12';
  for (let mx = startX + 20; mx < startX + spireW - 20; mx += 35) {
    const my = topY + 20 + ((mx * 3) % 240);
    ctx.beginPath();
    ctx.ellipse(mx, my, 16, 6, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#447822';
  for (let mx = startX + 25; mx < startX + spireW - 25; mx += 42) {
    const my = topY + 20 + ((mx * 3) % 240);
    ctx.beginPath();
    ctx.ellipse(mx, my, 10, 3.8, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore(); // Koniec clipa

  // 6. Ciemny kontur zewnętrzny ostańca
  ctx.strokeStyle = '#090e09';
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // 7. ZWĘGLONE / POSZARPANE PRZEŁOMY SKALNE DLA ZNISZCZONYCH PŁYT
  // Jeśli gracz lub wybuch rozwalił segment płyty snajperskiej, szczyt ostańca pod nim jest poszarpany
  for (let i = 0; i < slabs.length; i++) {
    const s = slabs[i];
    if (s && !s.intact && s.side === (isLeft ? 'left' : 'right')) {
      const segX = s.origX;
      const segW = s.w;

      ctx.save();
      // Poszarpana korona przełomu skały
      ctx.fillStyle = '#1c241c';
      ctx.beginPath();
      ctx.moveTo(segX, topY + 6);
      ctx.lineTo(segX + segW * 0.25, topY - 8);
      ctx.lineTo(segX + segW * 0.5, topY + 2);
      ctx.lineTo(segX + segW * 0.75, topY - 12);
      ctx.lineTo(segX + segW, topY + 4);
      ctx.lineTo(segX + segW, topY + 18);
      ctx.lineTo(segX, topY + 18);
      ctx.closePath();
      ctx.fill();

      // Zwęglenie po eksplozji
      ctx.fillStyle = 'rgba(6, 4, 2, 0.85)';
      ctx.fillRect(segX, topY, segW, 14);

      ctx.strokeStyle = '#080c08';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore();
}
