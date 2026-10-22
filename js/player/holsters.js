// =========================================================================
// PLAYER/HOLSTERS.JS - SYSTEM KABUR, POCHEW I MOCOWAŃ BRONI PMC
// =========================================================================
// Moduł zarządza realistycznym wyposażeniem taktycznym postaci gracza i botów:
// 1. Broń Główna (Slot 1: AK-47 / SPAS-12 / Barrett .50) – pas nośny (Sling)
//    na plecach lub montaż boczny stelaża jetpacka dla Raptora.
// 2. Broń Dodatkowa (Slot 2: Glock 17 / Magnum .44 / Obrzyn 12G) – kabura
//    udowa (Strong-Side Drop-Leg Holster) z pasami mocującymi Fastex.
// 3. Broń Biała (Slot 3: Nóż M9 / Maczeta Kukri / Toporek Tomahawk) – pochwa
//    taktyczna na pasie biodrowym z ergonomicznym chwytem Cross-Draw.
// 4. Gdy broń jest trzymana w dłoniach, kabura/pochwa/uchwyt pozostaje pusta!
// =========================================================================

import { getWeaponPartSprite } from '../weapons/renderer.js';

/**
 * Odczyt i normalizacja stanu zestawu uzbrojenia dla dowolnej postaci (gracz / bot)
 */
export function getCharacterLoadout(p) {
  if (!p) {
    return {
      primaryId: 'AK47',
      secondaryId: 'GLOCK',
      meleeId: 'KNIFE',
      activeSlot: 0,
      isHolstered: false,
      isPrimaryDrawn: false,
      isSecondaryDrawn: false,
      isMeleeDrawn: false
    };
  }

  const rawSlots = p.loadout?.pocket1?.slots;
  const activeSlot = (typeof p.loadout?.pocket1?.activeSlotIndex === 'number')
    ? p.loadout.pocket1.activeSlotIndex
    : 0;

  let primaryId = 'AK47';
  let secondaryId = 'GLOCK';
  let meleeId = 'KNIFE';

  if (Array.isArray(rawSlots) && rawSlots.length >= 3) {
    primaryId = rawSlots[0] || 'AK47';
    secondaryId = rawSlots[1] || 'GLOCK';
    meleeId = rawSlots[2] || 'KNIFE';
  } else if (p.currentWeapon?.id) {
    const curId = p.currentWeapon.id;
    if (curId === 'AK47' || curId === 'SHOTGUN' || curId === 'SNIPER') {
      primaryId = curId;
    } else if (curId === 'GLOCK' || curId === 'REVOLVER' || curId === 'SAWED_OFF') {
      secondaryId = curId;
    } else if (curId === 'KNIFE' || curId === 'MACHETE' || curId === 'AXE') {
      meleeId = curId;
    }
  }

  const hWeight = (typeof p.holsterWeight === 'number') ? p.holsterWeight : (p.isHolstered ? 1.0 : 0.0);
  const isFullyHolstered = hWeight >= 0.95;

  const isPrimaryDrawn = !isFullyHolstered && (activeSlot === 0);
  const isSecondaryDrawn = !isFullyHolstered && (activeSlot === 1);
  const isMeleeDrawn = !isFullyHolstered && (activeSlot === 2);

  return {
    primaryId,
    secondaryId,
    meleeId,
    activeSlot,
    isHolstered: isFullyHolstered,
    isPrimaryDrawn,
    isSecondaryDrawn,
    isMeleeDrawn
  };
}

/**
 * Renderowanie broni głównej na plecach postaci (lub na bocznym stelażu jetpacka)
 * Wywoływane wewnątrz układu współrzędnych torsu (hipX, hipY, torsoTilt).
 */
export function drawBackWeapon(ctx, p, fDir, waistHalfW, shoulderHalfW, v = {}, hasJetpack = false) {
  if (!ctx || !p || p.isDead) return;

  const loadout = getCharacterLoadout(p);
  const primaryId = loadout.primaryId;

  // Punkt odniesienia na plecach (strona przeciwna do zwrotu fDir)
  const backMountX = -fDir * (shoulderHalfW * 0.72);
  const backMountY = -16.5;

  ctx.save();

  if (hasJetpack) {
    // -------------------------------------------------------------
    // MONTAŻ NA STELAŻU JETPACKA (RAPTOR)
    // Karabin przymocowany sztywno do bocznej szyny stelaża odrzutowego,
    // odsunięty od osi dysz wylotowych silnika.
    // -------------------------------------------------------------
    const bracketX = -fDir * (shoulderHalfW + 3.2);
    const bracketY = -17.0;
    const bracketAng = -fDir * 0.42;

    // Solidny taktyczny uchwyt z tytanu / polimeru łączący stelaż z bronią
    ctx.fillStyle = '#18181b';
    ctx.fillRect(bracketX - 2.0, bracketY - 3.0, 4.0, 6.0);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(bracketX - 2.0, bracketY - 3.0, 4.0, 6.0);

    // Klamra zatrzaskowa Quick-Release
    ctx.fillStyle = '#71717a';
    ctx.fillRect(bracketX - 1.2, bracketY - 1.5, 2.4, 3.0);

    if (!loadout.isPrimaryDrawn) {
      ctx.save();
      ctx.translate(bracketX, bracketY);
      ctx.rotate(bracketAng);
      ctx.scale(fDir, 1);
      drawPrimaryWeaponSprite(ctx, primaryId, 0.86);
      ctx.restore();
    }
  } else {
    // -------------------------------------------------------------
    // TAKTYCZNY PAS NOŚNY (SLING) PRZEZ PLECY I RAMIĘ (STRIKER / ENFORCER)
    // -------------------------------------------------------------
    const slingAng = -fDir * 0.68;

    // Taśma pasa nośnego Sling biegnąca po przekątnej pleców
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-fDir * (shoulderHalfW * 0.85), -27.0);
    ctx.quadraticCurveTo(-fDir * (waistHalfW * 0.95), -14.0, -fDir * (waistHalfW * 0.40), -1.8);
    ctx.stroke();

    // Szew środkowy taśmy z nylonu
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-fDir * (shoulderHalfW * 0.85), -27.0);
    ctx.quadraticCurveTo(-fDir * (waistHalfW * 0.95), -14.0, -fDir * (waistHalfW * 0.40), -1.8);
    ctx.stroke();

    // Metalowa klamra QD (Quick Detach) na pasie nośnym
    const qdX = -fDir * (shoulderHalfW * 0.65);
    const qdY = -23.0;
    ctx.fillStyle = '#52525b';
    ctx.fillRect(qdX - 1.2, qdY - 1.2, 2.4, 2.4);

    if (!loadout.isPrimaryDrawn) {
      ctx.save();
      ctx.translate(backMountX, backMountY);
      ctx.rotate(slingAng);
      ctx.scale(fDir, 1);
      drawPrimaryWeaponSprite(ctx, primaryId, 0.88);
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Wewnętrzna procedura renderowania sprite'a broni głównej na plecach
 */
function drawPrimaryWeaponSprite(ctx, weaponId, scaleMult = 1.0) {
  if (weaponId === 'AK47') {
    const imgBody = getWeaponPartSprite('AK47_BODY');
    const imgMag = getWeaponPartSprite('AK47_MAG');
    const imgBolt = getWeaponPartSprite('AK47_BOLT');

    if (imgBody && imgBody.complete && imgBody.naturalWidth > 0 &&
        imgMag && imgMag.complete && imgMag.naturalWidth > 0) {
      const s = (44.8 / 1272) * scaleMult;
      const pivotSpriteX = 540.0;
      const pivotSpriteY = 110.0;

      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-pivotSpriteX, -pivotSpriteY);

      // Magazynek wpięty w gniazdo
      ctx.drawImage(imgMag, 546, 120);
      // Korpus
      ctx.drawImage(imgBody, 0, 0);
      // Suwadło
      if (imgBolt && imgBolt.complete && imgBolt.naturalWidth > 0) {
        ctx.drawImage(imgBolt, 556, 50);
      }
      ctx.restore();
    } else {
      // Proceduralny fallback
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-12.0, -1.8, 10.0, 3.6);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-2.0, -2.2, 14.0, 4.4);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(12.0, -1.2, 12.0, 2.4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(2.0, 2.0, 4.5, 6.5);
    }
  } else if (weaponId === 'SHOTGUN') {
    const imgBody = getWeaponPartSprite('SHOTGUN_BODY');
    const imgPump = getWeaponPartSprite('SHOTGUN_PUMP');

    if (imgBody && imgBody.complete && imgBody.naturalWidth > 0) {
      const s = (39.0 / 1334) * scaleMult;
      const pivotSpriteX = 560.0;
      const pivotSpriteY = 85.0;

      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-pivotSpriteX, -pivotSpriteY);

      ctx.drawImage(imgBody, 0, 0);
      if (imgPump && imgPump.complete && imgPump.naturalWidth > 0) {
        ctx.drawImage(imgPump, 780, 65);
      }
      ctx.restore();
    } else {
      // Proceduralny fallback
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-10.0, -1.8, 8.0, 3.6);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-2.0, -2.4, 11.0, 4.8);
      ctx.fillStyle = '#334155';
      ctx.fillRect(9.0, -2.0, 16.0, 2.8);
      ctx.fillStyle = '#3f2712';
      ctx.fillRect(12.0, -0.2, 6.5, 3.4);
    }
  } else if (weaponId === 'SNIPER') {
    const imgBody = getWeaponPartSprite('SNIPER_BODY');
    const imgMag = getWeaponPartSprite('SNIPER_MAG');
    const imgBolt = getWeaponPartSprite('SNIPER_BOLT');

    if (imgBody && imgBody.complete && imgBody.naturalWidth > 0) {
      const s = (58.5 / 1353) * scaleMult;
      const pivotSpriteX = 520.0;
      const pivotSpriteY = 160.0;

      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-pivotSpriteX, -pivotSpriteY);

      if (imgMag && imgMag.complete && imgMag.naturalWidth > 0) {
        ctx.drawImage(imgMag, 470, 160);
      }
      ctx.drawImage(imgBody, 0, 0);
      if (imgBolt && imgBolt.complete && imgBolt.naturalWidth > 0) {
        ctx.drawImage(imgBolt, 480, 70);
      }
      ctx.restore();
    } else {
      // Proceduralny fallback
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-14.0, -1.8, 12.0, 4.0);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-2.0, -2.8, 16.0, 5.2);
      ctx.fillStyle = '#334155';
      ctx.fillRect(14.0, -2.0, 20.0, 2.6);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-2.0, -6.5, 14.0, 2.4);
    }
  }
}

/**
 * Renderowanie pochwy broni białej przy pasie taktycznym (Cross-Draw na lewym biodrze)
 * Wywoływane wewnątrz układu współrzędnych torsu (hipX, hipY, torsoTilt).
 */
export function drawHipMeleeSheath(ctx, p, fDir, waistHalfW, beltTopY, beltBotY, v = {}) {
  if (!ctx || !p || p.isDead) return;

  const loadout = getCharacterLoadout(p);
  const meleeId = loadout.meleeId;

  // Pozycja mocowania do pasa taktycznego przy lewym biodrze (cross-draw dla prawej ręki)
  const sheathX = -fDir * (waistHalfW * 0.42);
  const sheathY = beltBotY - 0.4;
  const crossDrawAng = fDir * 0.38;

  ctx.save();
  ctx.translate(sheathX, sheathY);
  ctx.rotate(crossDrawAng);
  ctx.scale(fDir, 1);

  // Szlufka montażowa MOLLE łącząca pas z pochwą
  ctx.fillStyle = '#18181b';
  ctx.fillRect(-1.5, -3.2, 3.0, 3.4);
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 0.6;
  ctx.strokeRect(-1.5, -3.2, 3.0, 3.4);

  if (meleeId === 'KNIFE') {
    // -------------------------------------------------------------
    // NÓŻ BOJOWY M9 BAYONET (POCHWA KYDEX)
    // -------------------------------------------------------------
    const sheathLen = 14.0;
    const sheathW = 4.2;

    // Korpus kydexowej pochwy
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(-sheathW * 0.5, 0);
    ctx.lineTo(sheathW * 0.5, 0);
    ctx.lineTo(sheathW * 0.45, sheathLen - 2.5);
    ctx.lineTo(0, sheathLen);
    ctx.lineTo(-sheathW * 0.45, sheathLen - 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 0.75;
    ctx.stroke();

    // Nity montażowe wzdłuż krawędzi pochwy
    ctx.fillStyle = '#52525b';
    ctx.fillRect(-sheathW * 0.4, 3.0, 0.9, 0.9);
    ctx.fillRect(-sheathW * 0.4, 7.0, 0.9, 0.9);
    ctx.fillRect(-sheathW * 0.4, 11.0, 0.9, 0.9);

    if (!loadout.isMeleeDrawn) {
      // Wsunięty nóż: rękojeść i jelec wystające ku górze/przodowi
      const imgKnife = getWeaponPartSprite('KNIFE');
      if (imgKnife && imgKnife.complete && imgKnife.naturalWidth > 0) {
        ctx.save();
        const s = 24.7 / 1275 * 0.88;
        ctx.rotate(-Math.PI * 0.5);
        ctx.scale(s, s);
        ctx.translate(-268.4, -188.5);
        ctx.drawImage(imgKnife, 2, 2);
        ctx.restore();
      } else {
        // Fallback rękojeści noża
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-3.2, -1.2, 6.4, 1.4);
        ctx.fillStyle = '#09090b';
        ctx.fillRect(-1.8, -8.5, 3.6, 7.5);
        ctx.fillStyle = '#27272a';
        ctx.fillRect(-1.8, -7.0, 3.6, 0.8);
        ctx.fillRect(-1.8, -4.5, 3.6, 0.8);
      }
      // Pasek zatrzaskowy z napem zabezpieczający rękojeść
      ctx.fillStyle = '#27272a';
      ctx.fillRect(-2.0, -2.4, 4.0, 1.2);
      ctx.fillStyle = '#a1a1aa';
      ctx.beginPath();
      ctx.arc(0, -1.8, 0.65, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Pusta pochwa z otwartym gardłem i odpiętym paskiem
      ctx.fillStyle = '#09090b';
      ctx.fillRect(-sheathW * 0.4, 0, sheathW * 0.8, 1.2);
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-sheathW * 0.45, -0.6);
      ctx.lineTo(-sheathW * 0.9, -2.5);
      ctx.stroke();
    }
  } else if (meleeId === 'MACHETE') {
    // -------------------------------------------------------------
    // MACZETA KUKRI (WYDŁUŻONA POCHWA PROFILOWANA)
    // -------------------------------------------------------------
    const sheathLen = 19.0;
    const sheathW = 5.2;

    // Profilowana pochwa dopasowana do łuku ostrza kukri
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(-sheathW * 0.45, 0);
    ctx.lineTo(sheathW * 0.45, 0);
    ctx.quadraticCurveTo(sheathW * 0.65, sheathLen * 0.55, sheathW * 0.35, sheathLen - 1.5);
    ctx.lineTo(0, sheathLen);
    ctx.quadraticCurveTo(-sheathW * 0.25, sheathLen * 0.55, -sheathW * 0.45, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Paski wzmacniające z taśmy cordura
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-sheathW * 0.4, 5.0); ctx.lineTo(sheathW * 0.48, 5.0);
    ctx.moveTo(-sheathW * 0.3, 11.0); ctx.lineTo(sheathW * 0.55, 11.0);
    ctx.stroke();

    if (!loadout.isMeleeDrawn) {
      // Wsunięta maczeta: zakrzywiona rękojeść kukri wystająca ku przodowi
      const imgMachete = getWeaponPartSprite('MACHETE');
      if (imgMachete && imgMachete.complete && imgMachete.naturalWidth > 0) {
        ctx.save();
        const s = 28.0 / 1242 * 0.86;
        ctx.rotate(-Math.PI * 0.5);
        ctx.scale(s, s);
        ctx.translate(-200.0, -84.0);
        ctx.drawImage(imgMachete, 2, 2);
        ctx.restore();
      } else {
        // Fallback rękojeści kukri
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.moveTo(-1.6, 0);
        ctx.lineTo(2.0, 0);
        ctx.quadraticCurveTo(3.2, -5.0, 1.8, -9.5);
        ctx.lineTo(-2.2, -8.8);
        ctx.quadraticCurveTo(-0.4, -4.5, -1.6, 0);
        ctx.closePath();
        ctx.fill();
      }
      // Pasek z zatrzaskiem zabezpieczający chwyt
      ctx.fillStyle = '#27272a';
      ctx.fillRect(-2.2, -2.6, 4.4, 1.3);
      ctx.fillStyle = '#e4e4e7';
      ctx.beginPath();
      ctx.arc(0, -2.0, 0.7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Puste rozcięcie pochwy
      ctx.fillStyle = '#09090b';
      ctx.fillRect(-sheathW * 0.38, 0, sheathW * 0.76, 1.4);
    }
  } else if (meleeId === 'AXE') {
    // -------------------------------------------------------------
    // TOPOREK TOMAHAWK (UCHWYT PIERŚCIENIOWY AXE RING / FROG)
    // -------------------------------------------------------------
    // Stalowy pierścień montażowy przy pasie
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 1.1;
    ctx.strokeRect(-2.8, -0.5, 5.6, 3.2);

    const isAxeThrown = !!(p.axeThrown);
    if (!loadout.isMeleeDrawn && !isAxeThrown) {
      // Wsunięty tomahawk: stylisko opadające w dół, głowica na pasie
      const imgAxe = getWeaponPartSprite('AXE');
      if (imgAxe && imgAxe.complete && imgAxe.naturalWidth > 0) {
        ctx.save();
        const s = 19.5 / 1115 * 0.88;
        ctx.rotate(-Math.PI * 0.5);
        ctx.scale(s, s);
        ctx.translate(-228.7, -206.0);
        ctx.drawImage(imgAxe, 2, 2);
        ctx.restore();
      } else {
        // Fallback tomahawka
        ctx.fillStyle = '#27272a';
        ctx.fillRect(-1.4, 0, 2.8, 16.0);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-4.5, -3.5, 9.0, 3.6);
      }
    } else {
      // Pusty uchwyt z luźną pętlą
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-2.2, 0, 4.4, 1.8);
    }
  }

  ctx.restore();
}

/**
 * Renderowanie kabury pistoletowej na prawym udzie (Strong-Side Drop-Leg Holster)
 * Wywoływane wewnątrz układu współrzędnych uda w renderIKLeg (hipX, hipY, thighAng).
 * Oś X: wzdłuż kości udowej od biodra (0) do kolana (l1).
 * Oś Y: grubość uda (prostopadle).
 */
export function drawThighHolster(ctx, p, l1, thighHalfH, facing, v = {}) {
  if (!ctx || !p || p.isDead) return;

  const loadout = getCharacterLoadout(p);
  const secondaryId = loadout.secondaryId;

  // Pozycja platformy kabury na udzie (środkowo-górna strefa)
  const rigX = l1 * 0.35;
  const rigY = -thighHalfH * 0.32;
  const rigLen = l1 * 0.38;
  const rigH = thighHalfH * 1.05;

  ctx.save();
  ctx.translate(rigX, rigY);

  // 1. Pasek wieszakowy w górę ku pasowi biodrowemu
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-l1 * 0.22, -thighHalfH * 0.6);
  ctx.stroke();

  // 2. Elastyczny pas udowy (Thigh Strap) z klamrą Fastex obejmujący udo
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-1.0, -rigH * 0.4);
  ctx.lineTo(-1.0, rigH * 0.85);
  ctx.stroke();

  // Klamra Fastex na pasie udowym
  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(-2.2, rigH * 0.10, 2.4, 3.2);

  // 3. Polimerowa płyta nośna kabury (Kydex Drop-Leg Platform)
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-2.0, -rigH * 0.3, rigLen + 4.0, rigH * 0.95, 1.2);
  else ctx.rect(-2.0, -rigH * 0.3, rigLen + 4.0, rigH * 0.95);
  ctx.fill();
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Śruby montażowe regulacji kąta kabury
  ctx.fillStyle = '#52525b';
  ctx.beginPath();
  ctx.arc(2.0, -rigH * 0.1, 0.65, 0, Math.PI * 2);
  ctx.arc(2.0, rigH * 0.4, 0.65, 0, Math.PI * 2);
  ctx.fill();

  // 4. Kąt pochylenia kabury (Speed Cant ok. 10-14° w stronę kolana/dobycia)
  const cantAng = -0.18;
  ctx.save();
  ctx.translate(rigLen * 0.35, rigH * 0.15);
  ctx.rotate(cantAng);

  if (secondaryId === 'GLOCK') {
    // -------------------------------------------------------------
    // GLOCK 17 TACTICAL HOLSTER (SAFARILAND SERPA KYDEX)
    // -------------------------------------------------------------
    const holsterLen = 13.5;
    const holsterW = 5.2;

    // Skorupa kabury z formowanego kydexu
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(-holsterW * 0.5, 0);
    ctx.lineTo(holsterW * 0.5, 0);
    ctx.lineTo(holsterW * 0.42, holsterLen);
    ctx.lineTo(-holsterW * 0.42, holsterLen);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 0.85;
    ctx.stroke();

    // Wytłoczenie osłony szyny akcesoryjnej na dole kabury
    ctx.fillStyle = '#18181b';
    ctx.fillRect(-holsterW * 0.35, 3.5, holsterW * 0.7, 7.5);

    if (!loadout.isSecondaryDrawn) {
      // Glock w kaburze: zamek wsunięty, chwyt i kabłąk wystające ku górze
      const imgFrame = getWeaponPartSprite('GLOCK_FRAME');
      const imgSlide = getWeaponPartSprite('GLOCK_SLIDE');

      if (imgFrame && imgFrame.complete && imgFrame.naturalWidth > 0 &&
          imgSlide && imgSlide.complete && imgSlide.naturalWidth > 0) {
        ctx.save();
        const s = (15.7 / 835) * 0.88;
        ctx.scale(s, s);
        // Obrót pistoletu tak, aby lufa była wewnątrz kabury
        ctx.rotate(Math.PI * 0.5);
        ctx.translate(-420, -140);
        ctx.drawImage(imgFrame, 2, 140);
        ctx.drawImage(imgSlide, 44, 2);
        ctx.restore();
      } else {
        // Fallback chwytu Glocka
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.moveTo(1.2, 0);
        ctx.lineTo(-2.2, -6.5);
        ctx.lineTo(1.8, -6.8);
        ctx.lineTo(3.8, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#09090b';
        ctx.fillRect(-2.2, -7.2, 3.8, 1.2);
      }

      // Blokada kabury SLS (Self Locking System) – pałąk zabezpieczający
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(-holsterW * 0.45, -1.2, holsterW * 0.9, 1.4);
    } else {
      // Pusta kabura z odchylonym pałąkiem zabezpieczającym
      ctx.fillStyle = '#050505';
      ctx.fillRect(-holsterW * 0.38, 0, holsterW * 0.76, 1.8);
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-holsterW * 0.45, -0.4);
      ctx.lineTo(-holsterW * 0.75, -2.4);
      ctx.stroke();
    }
  } else if (secondaryId === 'REVOLVER') {
    // -------------------------------------------------------------
    // MAGNUM .44 HEAVY REVOLVER HOLSTER
    // -------------------------------------------------------------
    const holsterLen = 16.0;
    const holsterW = 5.8;

    // Wzmocniona kabura ze skóry kompozytowej
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(-holsterW * 0.5, 0);
    ctx.lineTo(holsterW * 0.5, 0);
    ctx.lineTo(holsterW * 0.35, holsterLen);
    ctx.lineTo(-holsterW * 0.35, holsterLen);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 0.85;
    ctx.stroke();

    // Wytłoczenie na bębenek .44
    ctx.fillStyle = '#18181b';
    ctx.fillRect(-holsterW * 0.45, 1.5, holsterW * 0.9, 5.0);

    if (!loadout.isSecondaryDrawn) {
      // Rewolwer w kaburze: rękojeść i kurek wystające do góry
      const imgBody = getWeaponPartSprite('REVOLVER_BODY');
      const imgCyl = getWeaponPartSprite('REVOLVER_CYLINDER');

      if (imgBody && imgBody.complete && imgBody.naturalWidth > 0) {
        ctx.save();
        const s = (20.2 / 1040) * 0.86;
        ctx.scale(s, s);
        ctx.rotate(Math.PI * 0.5);
        ctx.translate(-580, -180);
        ctx.drawImage(imgBody, 2, 2);
        if (imgCyl && imgCyl.complete && imgCyl.naturalWidth > 0) {
          ctx.drawImage(imgCyl, 380, 90);
        }
        ctx.restore();
      } else {
        // Fallback chwytu Magnum
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(1.2, 0);
        ctx.lineTo(-2.6, -7.2);
        ctx.lineTo(0.2, -7.5);
        ctx.lineTo(3.2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#475569';
        ctx.fillRect(-2.8, -2.4, 1.4, 2.0);
      }
      // Pasek zabezpieczający kurek
      ctx.fillStyle = '#27272a';
      ctx.fillRect(-holsterW * 0.45, -1.2, holsterW * 0.9, 1.4);
    } else {
      // Pusta kabura rewolwerowa
      ctx.fillStyle = '#050505';
      ctx.fillRect(-holsterW * 0.4, 0, holsterW * 0.8, 2.0);
    }
  } else if (secondaryId === 'SAWED_OFF') {
    // -------------------------------------------------------------
    // SAWED-OFF 12G SCABBARD / TACTICAL HOLSTER
    // -------------------------------------------------------------
    const holsterLen = 17.0;
    const holsterW = 6.2;

    // Futerał taktyczny scabbard
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(-holsterW * 0.5, 0);
    ctx.lineTo(holsterW * 0.5, 0);
    ctx.lineTo(holsterW * 0.42, holsterLen);
    ctx.lineTo(-holsterW * 0.42, holsterLen);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 0.85;
    ctx.stroke();

    if (!loadout.isSecondaryDrawn) {
      // Obrzyn w futerale: zaokrąglony drewniany chwyt birdshead wystający do góry
      const imgBody = getWeaponPartSprite('SAWED_OFF_BODY');
      const imgBarrels = getWeaponPartSprite('SAWED_OFF_BARRELS');

      if (imgBody && imgBody.complete && imgBody.naturalWidth > 0) {
        ctx.save();
        const s = (23.0 / 1160) * 0.86;
        ctx.scale(s, s);
        ctx.rotate(Math.PI * 0.5);
        ctx.translate(-590, -110);
        ctx.drawImage(imgBody, 2, 2);
        if (imgBarrels && imgBarrels.complete && imgBarrels.naturalWidth > 0) {
          ctx.drawImage(imgBarrels, 500, 10);
        }
        ctx.restore();
      } else {
        // Fallback chwytu birdshead
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-3.2, -6.0);
        ctx.lineTo(-0.6, -6.6);
        ctx.lineTo(2.6, 0);
        ctx.closePath();
        ctx.fill();
      }
      // Pasek elastyczny
      ctx.fillStyle = '#27272a';
      ctx.fillRect(-holsterW * 0.45, -1.2, holsterW * 0.9, 1.4);
    } else {
      // Pusty futerał
      ctx.fillStyle = '#050505';
      ctx.fillRect(-holsterW * 0.42, 0, holsterW * 0.84, 2.2);
    }
  }

  ctx.restore();
  ctx.restore();
}
