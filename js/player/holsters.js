// =========================================================================
// PLAYER/HOLSTERS.JS - SYSTEM KABUR, POCHEW I MOCOWAŃ BRONI PMC
// =========================================================================
// Moduł zarządza realistycznym wyposażeniem taktycznym postaci gracza i botów:
// 1. PRAWA NOGA -> Kabura udowa (Strong-Side Drop-Leg Holster) z małą bronią
//    palną (Slot 2: Glock 17 / Magnum .44 / Obrzyn 12G).
// 2. LEWA NOGA  -> Pochwa udowa (Drop-Leg Tactical Sheath) z bronią białą
//    (Slot 3: Nóż M9 / Maczeta Kukri / Toporek Tomahawk).
// 3. PLECY      -> Broń Główna (Slot 1: AK-47 / SPAS-12 / Barrett .50)
//    na 2-punktowym pasie nośnym (Sling) lub na szynie jetpacka Raptora.
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

  ctx.save();

  if (hasJetpack) {
    // -------------------------------------------------------------
    // MONTAŻ NA STELAŻU JETPACKA (RAPTOR)
    // Karabin przymocowany sztywno do bocznej szyny stelaża odrzutowego,
    // odsunięty od osi dysz wylotowych silnika.
    // Lufa wznosi się w górę wzdłuż krawędzi plecaka.
    // -------------------------------------------------------------
    const bracketX = -fDir * (shoulderHalfW + 3.0);
    const bracketY = -18.0;
    const bracketAng = -fDir * 0.18; // Prawie pionowo wzdłuż boku jetpacka

    // Uchwyt montażowy z tytanu łączący ramę jetpacka z bronią
    ctx.fillStyle = '#18181b';
    ctx.fillRect(bracketX - 1.8, bracketY - 3.5, 3.6, 7.0);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(bracketX - 1.8, bracketY - 3.5, 3.6, 7.0);

    // Zatrzask Quick-Release
    ctx.fillStyle = '#71717a';
    ctx.fillRect(bracketX - 1.0, bracketY - 1.5, 2.0, 3.0);

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
    // Karabin ułożony po przekątnej pleców:
    // Kolba oparta o dół pleców przy biodrze, lufa wznosi się za tylnym ramieniem ku górze i tyłowi.
    // -------------------------------------------------------------
    const buttX = -fDir * (waistHalfW * 0.65);
    const buttY = -6.0;
    const muzzleX = -fDir * (shoulderHalfW + 2.8);
    const muzzleY = -30.0;

    // Pas nośny Sling (nylonowa taśma nośna przebiegająca przez ramię i klatkę)
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-fDir * (shoulderHalfW * 0.85), -27.0);
    ctx.quadraticCurveTo(-fDir * (waistHalfW * 0.95), -14.0, buttX, buttY + 2.0);
    ctx.stroke();

    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-fDir * (shoulderHalfW * 0.85), -27.0);
    ctx.quadraticCurveTo(-fDir * (waistHalfW * 0.95), -14.0, buttX, buttY + 2.0);
    ctx.stroke();

    // Metalowa klamra QD na pasie
    const qdX = -fDir * (shoulderHalfW * 0.68);
    const qdY = -23.0;
    ctx.fillStyle = '#52525b';
    ctx.fillRect(qdX - 1.2, qdY - 1.2, 2.4, 2.4);

    if (!loadout.isPrimaryDrawn) {
      // Wyznaczenie kąta przekątnej pleców: od kolby ku lufie
      const dx = muzzleX - buttX;
      const dy = muzzleY - buttY;
      const slingAng = Math.atan2(dy, dx);

      // Środek ciężkości broni w okolicach gniazda magazynka
      const mountX = buttX + dx * 0.45;
      const mountY = buttY + dy * 0.45;

      ctx.save();
      ctx.translate(mountX, mountY);
      ctx.rotate(slingAng);
      // W układzie przekątnej: +X to kierunek ku lufie (w górę i w tył za plecy)
      // Odbicie fDir zapewnia, że detale zamka i magazynka są skierowane do wewnątrz
      ctx.scale(1, fDir);
      drawPrimaryWeaponSprite(ctx, primaryId, 0.88);
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Wewnętrzna procedura renderowania sprite'a broni głównej na plecach.
 * Oś broni: +X wskazuje kierunek lufy, -X kierunek kolby.
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
      const pivotSpriteY = 95.0;

      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-pivotSpriteX, -pivotSpriteY);

      // Magazynek łukowy wpięty w gniazdo
      ctx.drawImage(imgMag, 546, 120);
      // Korpus (kolba, komora, lufa)
      ctx.drawImage(imgBody, 0, 0);
      // Suwadło
      if (imgBolt && imgBolt.complete && imgBolt.naturalWidth > 0) {
        ctx.drawImage(imgBolt, 556, 50);
      }
      ctx.restore();
    } else {
      // Fallback proceduralny
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
      const pivotSpriteY = 75.0;

      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-pivotSpriteX, -pivotSpriteY);

      ctx.drawImage(imgBody, 0, 0);
      if (imgPump && imgPump.complete && imgPump.naturalWidth > 0) {
        ctx.drawImage(imgPump, 780, 65);
      }
      ctx.restore();
    } else {
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
      const pivotSpriteY = 145.0;

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
 * 1. PRAWA NOGA: KABURA UDOWA NA MAŁĄ BROŃ PALNĄ (STRONG-SIDE DROP-LEG HOLSTER)
 * Wywoływane wewnątrz układu współrzędnych PRAWEGO uda w renderIKLeg.
 * Układ uda:
 * - (0, 0) to biodro
 * - +X biegnie w dół uda prosto do kolana (l1)
 * - +Y to tył uda, -Y to przód uda
 */
export function drawRightThighPistolHolster(ctx, p, l1, thighHalfH, facing, v = {}, isFrontLeg = true) {
  if (!ctx || !p || p.isDead) return;

  const loadout = getCharacterLoadout(p);
  const secondaryId = loadout.secondaryId;

  // Pozycja wzdłuż osi uda (od biodra ku kolanu):
  // Wlot kabury od góry (przy biodrze), dno w stronę kolana
  const holsterStartX = l1 * 0.22;
  const holsterEndX = l1 * 0.60;
  const holsterLen = holsterEndX - holsterStartX; // Długość wzdłuż uda (~15px)
  const holsterW = 5.6 * (v.muscleMult || 1.0);  // Szerokość w poprzek uda
  const holsterCenterY = 0.0;                    // Na osi bocznej uda

  ctx.save();
  if (!isFrontLeg) {
    ctx.globalAlpha = 0.88; // Subtelne przyciemnienie dla nogi w tle
  }

  // A. Pasek wieszakowy w górę do pasa biodrowego
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(holsterStartX, holsterCenterY);
  ctx.lineTo(0, -thighHalfH * 0.55);
  ctx.stroke();

  // B. Elastyczny pas udowy (Thigh Strap) obejmujący udo w poprzek
  const strapX = holsterStartX + holsterLen * 0.45;
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(strapX, -thighHalfH * 0.95);
  ctx.lineTo(strapX, thighHalfH * 0.95);
  ctx.stroke();

  // Klamra polimerowa Fastex na pasie udowym
  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(strapX - 1.2, -1.8, 2.4, 3.6);

  // C. Polimerowa płyta nośna Kydex pod kaburą
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(holsterStartX - 1.5, holsterCenterY - holsterW * 0.65, holsterLen + 3.0, holsterW * 1.3, 1.2);
  } else {
    ctx.rect(holsterStartX - 1.5, holsterCenterY - holsterW * 0.65, holsterLen + 3.0, holsterW * 1.3);
  }
  ctx.fill();
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 0.75;
  ctx.stroke();

  // Śruby montażowe regulacji kąta kabury
  ctx.fillStyle = '#52525b';
  ctx.beginPath();
  ctx.arc(holsterStartX + 3.0, holsterCenterY - 1.5, 0.6, 0, Math.PI * 2);
  ctx.arc(holsterStartX + 3.0, holsterCenterY + 1.5, 0.6, 0, Math.PI * 2);
  ctx.fill();

  // D. Kydexowa skorupa kabury ułożona WZDŁUŻ UDA (wlot przy biodrze, dno przy kolanie)
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.moveTo(holsterStartX, holsterCenterY - holsterW * 0.5);
  ctx.lineTo(holsterEndX, holsterCenterY - holsterW * 0.35);
  ctx.lineTo(holsterEndX, holsterCenterY + holsterW * 0.35);
  ctx.lineTo(holsterStartX, holsterCenterY + holsterW * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 0.85;
  ctx.stroke();

  // Przetłoczenie wzmacniające wzdłuż skorupy kabury
  ctx.fillStyle = '#18181b';
  ctx.fillRect(holsterStartX + 2.0, holsterCenterY - holsterW * 0.25, holsterLen - 3.5, holsterW * 0.5);

  // E. Wsunięta broń lub pusta kabura
  if (!loadout.isSecondaryDrawn) {
    if (secondaryId === 'GLOCK') {
      const imgFrame = getWeaponPartSprite('GLOCK_FRAME');
      const imgSlide = getWeaponPartSprite('GLOCK_SLIDE');

      if (imgFrame && imgFrame.complete && imgFrame.naturalWidth > 0 &&
          imgSlide && imgSlide.complete && imgSlide.naturalWidth > 0) {
        ctx.save();
        const s = (15.7 / 835) * 0.85;
        // Punkt wlotu kabury: lufa celuje w dół uda (+X ku kolanu)
        // Lekki ergonomiczny kąt -8° unoszący chwyt w stronę dłoni
        ctx.translate(holsterStartX + 3.5, holsterCenterY);
        ctx.rotate(-0.14);
        ctx.scale(s, s);
        // Odsunięcie: lufa chowa się wewnątrz kabury w prawo (+X),
        // a chwyt pistoletowy z kabłąkiem wystaje przy wlocie w lewo (-X)
        ctx.translate(-260, -95);
        ctx.drawImage(imgFrame, 2, 140);
        ctx.drawImage(imgSlide, 44, 2);
        ctx.restore();
      } else {
        // Fallback chwytu Glocka
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.moveTo(holsterStartX + 1.0, holsterCenterY - 1.0);
        ctx.lineTo(holsterStartX - 6.5, holsterCenterY + 2.5);
        ctx.lineTo(holsterStartX - 6.8, holsterCenterY - 1.5);
        ctx.lineTo(holsterStartX + 1.0, holsterCenterY - 3.5);
        ctx.closePath();
        ctx.fill();
      }

      // Blokada kabury SLS (pałąk zabezpieczający chwyt)
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(holsterStartX - 0.8, holsterCenterY - holsterW * 0.45, 1.6, holsterW * 0.9);
    } else if (secondaryId === 'REVOLVER') {
      const imgBody = getWeaponPartSprite('REVOLVER_BODY');
      const imgCyl = getWeaponPartSprite('REVOLVER_CYLINDER');

      if (imgBody && imgBody.complete && imgBody.naturalWidth > 0) {
        ctx.save();
        const s = (20.2 / 1040) * 0.82;
        ctx.translate(holsterStartX + 4.0, holsterCenterY);
        ctx.rotate(-0.14);
        ctx.scale(s, s);
        ctx.translate(-420, -110);
        ctx.drawImage(imgBody, 2, 2);
        if (imgCyl && imgCyl.complete && imgCyl.naturalWidth > 0) {
          ctx.drawImage(imgCyl, 380, 90);
        }
        ctx.restore();
      } else {
        // Fallback rewolweru
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(holsterStartX + 1.0, holsterCenterY);
        ctx.lineTo(holsterStartX - 7.0, holsterCenterY + 3.0);
        ctx.lineTo(holsterStartX - 7.2, holsterCenterY - 1.0);
        ctx.lineTo(holsterStartX + 1.0, holsterCenterY - 3.0);
        ctx.closePath();
        ctx.fill();
      }

      // Pasek zabezpieczający kurek
      ctx.fillStyle = '#27272a';
      ctx.fillRect(holsterStartX - 0.8, holsterCenterY - holsterW * 0.45, 1.6, holsterW * 0.9);
    } else if (secondaryId === 'SAWED_OFF') {
      const imgBody = getWeaponPartSprite('SAWED_OFF_BODY');
      const imgBarrels = getWeaponPartSprite('SAWED_OFF_BARRELS');

      if (imgBody && imgBody.complete && imgBody.naturalWidth > 0) {
        ctx.save();
        const s = (23.0 / 1160) * 0.82;
        ctx.translate(holsterStartX + 4.0, holsterCenterY);
        ctx.rotate(-0.14);
        ctx.scale(s, s);
        ctx.translate(-440, -65);
        ctx.drawImage(imgBody, 2, 2);
        if (imgBarrels && imgBarrels.complete && imgBarrels.naturalWidth > 0) {
          ctx.drawImage(imgBarrels, 500, 10);
        }
        ctx.restore();
      } else {
        // Fallback chwytu birdshead
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(holsterStartX + 1.0, holsterCenterY);
        ctx.lineTo(holsterStartX - 6.0, holsterCenterY + 2.5);
        ctx.lineTo(holsterStartX - 6.2, holsterCenterY - 1.5);
        ctx.lineTo(holsterStartX + 1.0, holsterCenterY - 2.5);
        ctx.closePath();
        ctx.fill();
      }
    }
  } else {
    // Pusta komora kabury z otwartym gardłem i odchyloną blokadą
    ctx.fillStyle = '#050505';
    ctx.fillRect(holsterStartX - 0.5, holsterCenterY - holsterW * 0.35, 2.4, holsterW * 0.7);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(holsterStartX, holsterCenterY - holsterW * 0.45);
    ctx.lineTo(holsterStartX - 2.5, holsterCenterY - holsterW * 0.75);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 2. LEWA NOGA: POCHWA UDOWA NA BROŃ BIAŁĄ (DROP-LEG TACTICAL SHEATH)
 * Wywoływane wewnątrz układu współrzędnych LEWEGO uda w renderIKLeg.
 * Układ uda:
 * - (0, 0) to biodro
 * - +X biegnie w dół uda prosto do kolana (l1)
 * - +Y to tył uda, -Y to przód uda
 */
export function drawLeftThighMeleeSheath(ctx, p, l1, thighHalfH, facing, v = {}, isFrontLeg = true) {
  if (!ctx || !p || p.isDead) return;

  const loadout = getCharacterLoadout(p);
  const meleeId = loadout.meleeId;

  // Pozycja wzdłuż osi lewego uda:
  const sheathStartX = l1 * 0.20;
  const sheathEndX = l1 * 0.62;
  const sheathLen = sheathEndX - sheathStartX; // Długość wzdłuż lewego uda (~16px)
  const sheathW = 5.2 * (v.muscleMult || 1.0);  // Szerokość pochwy
  const sheathCenterY = 0.0;

  ctx.save();
  if (!isFrontLeg) {
    ctx.globalAlpha = 0.88; // Subtelne przyciemnienie dla nogi w tle
  }

  // A. Pasek wieszakowy w górę do pasa biodrowego
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(sheathStartX, sheathCenterY);
  ctx.lineTo(0, -thighHalfH * 0.55);
  ctx.stroke();

  // B. Elastyczny pas udowy obejmujący lewe udo
  const strapX = sheathStartX + sheathLen * 0.45;
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(strapX, -thighHalfH * 0.95);
  ctx.lineTo(strapX, thighHalfH * 0.95);
  ctx.stroke();

  // Klamra polimerowa na lewym udzie
  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(strapX - 1.2, -1.8, 2.4, 3.6);

  // C. Taktyczna kydexowa pochwa wzdłuż lewego uda (wlot przy biodrze, dno przy kolanie)
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.moveTo(sheathStartX, sheathCenterY - sheathW * 0.45);
  ctx.lineTo(sheathEndX, sheathCenterY - sheathW * 0.28);
  ctx.lineTo(sheathEndX + 1.5, sheathCenterY);
  ctx.lineTo(sheathEndX, sheathCenterY + 0.28 * sheathW);
  ctx.lineTo(sheathStartX, sheathCenterY + sheathW * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Nity montażowe wzdłuż krawędzi pochwy
  ctx.fillStyle = '#52525b';
  ctx.fillRect(sheathStartX + 3.0, sheathCenterY - sheathW * 0.35, 0.9, 0.9);
  ctx.fillRect(sheathStartX + 7.5, sheathCenterY - sheathW * 0.30, 0.9, 0.9);
  ctx.fillRect(sheathStartX + 12.0, sheathCenterY - sheathW * 0.25, 0.9, 0.9);

  // D. Wsunięta broń biała lub pusta pochwa
  const isAxeThrown = !!(meleeId === 'AXE' && p.axeThrown);
  if (!loadout.isMeleeDrawn && !isAxeThrown) {
    if (meleeId === 'KNIFE') {
      const imgKnife = getWeaponPartSprite('KNIFE');
      if (imgKnife && imgKnife.complete && imgKnife.naturalWidth > 0) {
        ctx.save();
        const s = (24.7 / 1275) * 0.85;
        // Ostrze wsuwa się w pochwę w prawo (+X ku kolanu)
        // Rękojeść M9 z jelcem wystaje z wlotu w lewo (-X ku biodru)
        ctx.translate(sheathStartX + 3.0, sheathCenterY);
        ctx.scale(s, s);
        ctx.translate(-268.4, -188.5);
        ctx.drawImage(imgKnife, 2, 2);
        ctx.restore();
      } else {
        // Fallback rękojeści noża M9
        ctx.fillStyle = '#64748b';
        ctx.fillRect(sheathStartX - 1.2, sheathCenterY - 2.8, 1.4, 5.6);
        ctx.fillStyle = '#09090b';
        ctx.fillRect(sheathStartX - 8.0, sheathCenterY - 1.6, 7.0, 3.2);
      }

      // Pasek zatrzaskowy z napem zabezpieczający rękojeść
      ctx.fillStyle = '#27272a';
      ctx.fillRect(sheathStartX - 1.0, sheathCenterY - sheathW * 0.45, 1.5, sheathW * 0.9);
      ctx.fillStyle = '#a1a1aa';
      ctx.beginPath();
      ctx.arc(sheathStartX - 0.2, sheathCenterY, 0.65, 0, Math.PI * 2);
      ctx.fill();
    } else if (meleeId === 'MACHETE') {
      const imgMachete = getWeaponPartSprite('MACHETE');
      if (imgMachete && imgMachete.complete && imgMachete.naturalWidth > 0) {
        ctx.save();
        const s = (28.0 / 1242) * 0.82;
        ctx.translate(sheathStartX + 3.0, sheathCenterY);
        ctx.scale(s, s);
        ctx.translate(-200.0, -84.0);
        ctx.drawImage(imgMachete, 2, 2);
        ctx.restore();
      } else {
        // Fallback rękojeści kukri
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.moveTo(sheathStartX, sheathCenterY - 1.2);
        ctx.lineTo(sheathStartX - 8.5, sheathCenterY - 2.2);
        ctx.lineTo(sheathStartX - 8.2, sheathCenterY + 1.8);
        ctx.lineTo(sheathStartX, sheathCenterY + 1.2);
        ctx.closePath();
        ctx.fill();
      }

      // Pasek zabezpieczający
      ctx.fillStyle = '#27272a';
      ctx.fillRect(sheathStartX - 1.0, sheathCenterY - sheathW * 0.45, 1.5, sheathW * 0.9);
    } else if (meleeId === 'AXE') {
      const imgAxe = getWeaponPartSprite('AXE');
      if (imgAxe && imgAxe.complete && imgAxe.naturalWidth > 0) {
        ctx.save();
        const s = (19.5 / 1115) * 0.82;
        // Stylisko biegnie w dół uda (+X ku kolanu), głowica zabezpieczona przy wlocie
        ctx.translate(sheathStartX + 4.0, sheathCenterY);
        ctx.scale(s, s);
        ctx.translate(-228.7, -206.0);
        ctx.drawImage(imgAxe, 2, 2);
        ctx.restore();
      } else {
        // Fallback tomahawka
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(sheathStartX - 3.0, sheathCenterY - 3.5, 3.6, 7.0);
        ctx.fillStyle = '#27272a';
        ctx.fillRect(sheathStartX, sheathCenterY - 1.2, 14.0, 2.4);
      }
    }
  } else {
    // Pusta pochwa z otwartym gardłem
    ctx.fillStyle = '#09090b';
    ctx.fillRect(sheathStartX - 0.5, sheathCenterY - sheathW * 0.35, 2.4, sheathW * 0.7);
  }

  ctx.restore();
}
