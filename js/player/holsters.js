// =========================================================================
// PLAYER/HOLSTERS.JS - SYSTEM KABUR, POCHEW I MOCOWAŃ BRONI PMC
// =========================================================================
// Moduł zarządza realistycznym wyposażeniem taktycznym postaci gracza i botów:
// 1. PRAWA NOGA -> Kabura udowa (Strong-Side Drop-Leg Holster) z małą bronią
//    palną (Slot 2: Glock 17 / Magnum .44 / Obrzyn 12G).
//    Broń jest głęboko i widocznie UKRYTA wewnątrz kabury (zamek i lufa
//    zakryte przez przednią ściankę Kydex, wystaje tylko chwyt pistoletowy).
// 2. LEWA NOGA  -> Pochwa udowa (Drop-Leg Tactical Sheath) z bronią białą
//    (Slot 3: Nóż M9 / Maczeta Kukri / Toporek Tomahawk).
//    Toporek Tomahawk wisi PIONOWO: trzonkiem do dołu, a ostrzem do góry!
// 3. PLECY      -> Broń Główna (Slot 1: AK-47 / SPAS-12 / Barrett .50)
//    przypięta DOKŁADNIE PIONOWO do stelaża jetpacka lub na pasie nośnym Sling.
// 4. Logika widoczności: każda broń znajduje się w danym momencie dokładnie
//    w jednym miejscu (albo w dłoniach, albo w kaburze/pochwie/na plecach,
//    albo w locie po rzucie toporkiem)!
// =========================================================================

import { getWeaponPartSprite, getWeaponSpritePivot, drawWeaponBloodOverlay } from '../weapons/renderer.js';

export const PRIMARY_WEAPON_IDS = ['AK47', 'SHOTGUN', 'SNIPER'];
export const SECONDARY_WEAPON_IDS = ['GLOCK', 'REVOLVER', 'SAWED_OFF', 'RPG7'];
export const MELEE_WEAPON_IDS = ['KNIFE', 'MACHETE', 'AXE'];

/**
 * Odczyt i autorytatywna normalizacja stanu uzbrojenia dla dowolnej postaci (gracz / bot).
 * Precyzyjnie ustala, która broń znajduje się w dłoniach, a które spoczywają
 * w swoich mocowaniach (plecy / prawa noga / lewa noga).
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

  // 1. Domyślny zestaw bojowy wg klasy postaci (dla botów lub gracza bez konfiguracji)
  let primaryId = 'AK47';
  let secondaryId = 'GLOCK';
  let meleeId = 'KNIFE';

  const classId = p.currentClass?.id;
  if (classId === 'RAPTOR') {
    primaryId = 'SNIPER';
    secondaryId = 'GLOCK';
    meleeId = 'KNIFE';
  } else if (classId === 'ENFORCER') {
    primaryId = 'SHOTGUN';
    secondaryId = 'REVOLVER';
    meleeId = 'AXE';
  } else if (classId === 'STRIKER') {
    primaryId = 'AK47';
    secondaryId = 'GLOCK';
    meleeId = 'MACHETE';
  }

  // 2. Jeśli postać posiada zapisany loadout w kieszeni 1
  const rawSlots = p.loadout?.pocket1?.slots;
  if (Array.isArray(rawSlots)) {
    if (rawSlots[0] && PRIMARY_WEAPON_IDS.includes(rawSlots[0])) primaryId = rawSlots[0];
    if (rawSlots[1] && SECONDARY_WEAPON_IDS.includes(rawSlots[1])) secondaryId = rawSlots[1];
    if (rawSlots[2] && MELEE_WEAPON_IDS.includes(rawSlots[2])) meleeId = rawSlots[2];
  }

  // 3. Sprawdzenie, czy broń jest aktualnie trzymana w dłoniach operatora
  const isDead = !!p.isDead;
  const isStaggered = (p.staggerTimer > 0);
  const isThrowingGrenade = !!((p.throwAnim && p.throwAnim.active) || p.throwMode);
  const hWeight = (typeof p.holsterWeight === 'number') ? p.holsterWeight : (p.isHolstered ? 1.0 : 0.0);
  const isHolstered = hWeight >= 0.90;

  // Czy jakakolwiek broń palna/biała jest aktualnie w rękach?
  const hasWeaponInHands = !isDead && !isStaggered && !isThrowingGrenade && !isHolstered && !!p.currentWeapon;

  let isPrimaryDrawn = false;
  let isSecondaryDrawn = false;
  let isMeleeDrawn = false;

  if (hasWeaponInHands) {
    const curWepId = p.currentWeapon.id;

    if (PRIMARY_WEAPON_IDS.includes(curWepId)) {
      // Postać trzyma w rękach broń główną (karabin / strzelba / snajperka)
      primaryId = curWepId;
      isPrimaryDrawn = true;
      isSecondaryDrawn = false;
      isMeleeDrawn = false;
    } else if (SECONDARY_WEAPON_IDS.includes(curWepId)) {
      // Postać trzyma w rękach broń boczną (Glock / Magnum / Obrzyn)
      secondaryId = curWepId;
      isPrimaryDrawn = false;
      isSecondaryDrawn = true;
      isMeleeDrawn = false;
    } else if (MELEE_WEAPON_IDS.includes(curWepId)) {
      // Postać trzyma w rękach broń białą (Nóż / Maczeta / Toporek)
      meleeId = curWepId;
      isPrimaryDrawn = false;
      isSecondaryDrawn = false;
      isMeleeDrawn = true;
    }
  }

  // Wyjątek: jeśli toporek został rzucony (axeThrown), nie ma go ani w rękach,
  // ani w pochwie na lewej nodze (leci w powietrzu lub leży wbity w cel)
  if (p.axeThrown) {
    isMeleeDrawn = true; // Pochwa na lewej nodze pozostaje pusta
  }

  const activeSlot = (typeof p.loadout?.pocket1?.activeSlotIndex === 'number')
    ? p.loadout.pocket1.activeSlotIndex
    : (isSecondaryDrawn ? 1 : (isMeleeDrawn ? 2 : 0));

  return {
    primaryId,
    secondaryId,
    meleeId,
    activeSlot,
    isHolstered: !hasWeaponInHands,
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
    // MONTAŻ PIONOWY NA STELAŻU JETPACKA (RAPTOR)
    // Karabin przypięty DOKŁADNIE PIONOWO do bocznej ramy jetpacka:
    // Lufa wznosi się idealnie pionowo w górę ku niebu (-Math.PI * 0.5),
    // kolba opada pionowo w dół wzdłuż stelaża.
    // -------------------------------------------------------------
    const bracketX = -fDir * (shoulderHalfW + 2.6);
    const bracketY = -18.0;

    // Podwójne tytanowe klamry montażowe (górna i dolna) mocujące korpus do ramy
    ctx.fillStyle = '#18181b';
    ctx.fillRect(bracketX - 2.0, bracketY - 8.0, 4.0, 3.2);
    ctx.fillRect(bracketX - 2.0, bracketY + 5.0, 4.0, 3.2);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(bracketX - 2.0, bracketY - 8.0, 4.0, 3.2);
    ctx.strokeRect(bracketX - 2.0, bracketY + 5.0, 4.0, 3.2);

    // Dźwignie zatrzaskowe Quick-Release
    ctx.fillStyle = '#71717a';
    ctx.fillRect(bracketX - 1.2, bracketY - 7.0, 2.4, 1.4);
    ctx.fillRect(bracketX - 1.2, bracketY + 6.0, 2.4, 1.4);

    // Jeśli broń główna nie jest trzymana w dłoniach, rysujemy ją przypiętą pionowo
    if (!loadout.isPrimaryDrawn) {
      ctx.save();
      ctx.translate(bracketX, bracketY);
      // Dokładny kąt pionowy: lufa skierowana prosto w górę (-Math.PI * 0.5)
      ctx.rotate(-Math.PI * 0.5);
      // fDir zapewnia, że magazynek i chwyt przylegają do stelaża jetpacka
      ctx.scale(1, fDir);
      drawPrimaryWeaponSprite(ctx, primaryId, 0.86);
      ctx.restore();
    }
  } else {
    // -------------------------------------------------------------
    // TAKTYCZNY PAS NOŚNY (SLING) PRZEZ PLECY I RAMIĘ (STRIKER / ENFORCER)
    // Lufa wznosi się w górę i w tył za tylnym ramieniem.
    // -------------------------------------------------------------
    const buttX = -fDir * (waistHalfW * 0.70);
    const buttY = -6.0;
    const muzzleX = -fDir * (shoulderHalfW + 2.0);
    const muzzleY = -31.0;

    // Pas nośny Sling
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
      const dx = muzzleX - buttX;
      const dy = muzzleY - buttY;
      const slingAng = Math.atan2(dy, dx);

      const mountX = buttX + dx * 0.45;
      const mountY = buttY + dy * 0.45;

      ctx.save();
      ctx.translate(mountX, mountY);
      ctx.rotate(slingAng);
      ctx.scale(1, fDir);
      drawPrimaryWeaponSprite(ctx, primaryId, 0.88);
      ctx.restore();
    }
  }

  // Wyrzutnia rakiet RPG-7 na pasie nośnym na plecach (gdy jest w slocie dodatkowym i nie w dłoniach)
  if (loadout.secondaryId === 'RPG7' && !loadout.isSecondaryDrawn) {
    const rpgButtX = -fDir * (waistHalfW * 0.55);
    const rpgButtY = -1.0;
    const rpgMuzzleX = -fDir * (shoulderHalfW + 4.5);
    const rpgMuzzleY = -37.0;

    const rdx = rpgMuzzleX - rpgButtX;
    const rdy = rpgMuzzleY - rpgButtY;
    const rAng = Math.atan2(rdy, rdx);
    const rMountX = rpgButtX + rdx * 0.48;
    const rMountY = rpgButtY + rdy * 0.48;

    ctx.save();
    ctx.translate(rMountX, rMountY);
    ctx.rotate(rAng);
    ctx.scale(1, fDir);
    drawRpg7BackSprite(ctx, 0.88);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Procedura renderowania wyrzutni RPG-7 na plecach operatora
 */
function drawRpg7BackSprite(ctx, scaleMult = 1.0) {
  const imgRpg = getWeaponPartSprite('RPG7');
  if (imgRpg && imgRpg.complete && imgRpg.naturalWidth > 0) {
    const s = (57.0 / 1302) * scaleMult;
    const pvt = (typeof getWeaponSpritePivot === 'function') ? getWeaponSpritePivot('RPG7', 1.0) : { x: 575.0, y: 115.0 };
    const pivotSpriteX = pvt?.x ?? 575.0;
    const pivotSpriteY = pvt?.y ?? 115.0;

    ctx.save();
    ctx.scale(s, s);
    ctx.translate(-pivotSpriteX, -pivotSpriteY);
    ctx.drawImage(imgRpg, 0, 0);
    ctx.restore();
  }
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
 * Broń jest GŁĘBOKO I REALISTYCZNIE UKRYTA W ŚRODKU KABURY:
 * Zamek i lufa są zakryte przez zewnętrzną ściankę Kydex,
 * na zewnątrz wystaje tylko ergonomiczny chwyt pistoletowy z magazynkiem.
 */
export function drawRightThighPistolHolster(ctx, p, l1, thighHalfH, facing, v = {}, isFrontLeg = true) {
  if (!ctx || !p || p.isDead) return;

  const loadout = getCharacterLoadout(p);
  const secondaryId = loadout.secondaryId;
  // Wyrzutnia rakiet RPG-7 jest noszona na plecach na pasie nośnym, nie w kaburze udowej
  if (secondaryId === 'RPG7') return;

  // Pozycja wzdłuż osi uda (od biodra ku kolanu):
  const holsterStartX = l1 * 0.22;
  const holsterEndX = l1 * 0.62;
  const holsterLen = holsterEndX - holsterStartX; // Długość kabury (~16px)
  const holsterW = 5.8 * (v.muscleMult || 1.0);  // Szerokość w poprzek uda
  const holsterCenterY = 0.0;                    // Na osi bocznej uda

  ctx.save();
  if (!isFrontLeg) {
    ctx.globalAlpha = 0.88;
  }

  // 1. Pasek wieszakowy w górę do pasa biodrowego
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(holsterStartX, holsterCenterY);
  ctx.lineTo(0, -thighHalfH * 0.55);
  ctx.stroke();

  // 2. Elastyczny pas udowy (Thigh Strap) obejmujący udo w poprzek
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

  // 3. PŁYTA TYLNA MONTAŻOWA (Kydex Backplate) pod pistoletem
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

  // Śruby montażowe
  ctx.fillStyle = '#52525b';
  ctx.beginPath();
  ctx.arc(holsterStartX + 3.0, holsterCenterY - 1.5, 0.6, 0, Math.PI * 2);
  ctx.arc(holsterStartX + 3.0, holsterCenterY + 1.5, 0.6, 0, Math.PI * 2);
  ctx.fill();

  // 4. PISTOLET (WSUNIĘTY GŁĘBOKO W KABURĘ)
  // Rysowany PRZED przednią ścianką kabury, dzięki czemu lufa i zamek
  // są schowane WEWNĄTRZ kabury, a na zewnątrz wystaje tylko rękojeść!
  if (!loadout.isSecondaryDrawn) {
    if (secondaryId === 'GLOCK') {
      const imgFrame = getWeaponPartSprite('GLOCK_FRAME');
      const imgSlide = getWeaponPartSprite('GLOCK_SLIDE');

      if (imgFrame && imgFrame.complete && imgFrame.naturalWidth > 0 &&
          imgSlide && imgSlide.complete && imgSlide.naturalWidth > 0) {
        ctx.save();
        const s = (15.7 / 835) * 0.85;
        // Wlot kabury: lufa celuje w dół uda (+X ku kolanu)
        // Odsunięcie: zamek i lufa chowają się głęboko pod ściankę kabury
        ctx.translate(holsterStartX + 3.0, holsterCenterY);
        ctx.rotate(-0.10);
        ctx.scale(s, s);
        ctx.translate(-240, -90);
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
    } else if (secondaryId === 'REVOLVER') {
      const imgBody = getWeaponPartSprite('REVOLVER_BODY');
      const imgCyl = getWeaponPartSprite('REVOLVER_CYLINDER');

      if (imgBody && imgBody.complete && imgBody.naturalWidth > 0) {
        ctx.save();
        const s = (20.2 / 1040) * 0.82;
        ctx.translate(holsterStartX + 3.5, holsterCenterY);
        ctx.rotate(-0.10);
        ctx.scale(s, s);
        ctx.translate(-400, -105);
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
    } else if (secondaryId === 'SAWED_OFF') {
      const imgBody = getWeaponPartSprite('SAWED_OFF_BODY');
      const imgBarrels = getWeaponPartSprite('SAWED_OFF_BARRELS');

      if (imgBody && imgBody.complete && imgBody.naturalWidth > 0) {
        ctx.save();
        const s = (23.0 / 1160) * 0.82;
        ctx.translate(holsterStartX + 3.5, holsterCenterY);
        ctx.rotate(-0.10);
        ctx.scale(s, s);
        ctx.translate(-420, -60);
        ctx.drawImage(imgBody, 2, 2);
        if (imgBarrels && imgBarrels.complete && imgBarrels.naturalWidth > 0) {
          ctx.drawImage(imgBarrels, 500, 10);
        }
        ctx.restore();
      } else {
        // Fallback obrzyna
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
  }

  // 5. PRZEDNIA ŚCIANKA KABURY (FRONT SHELL KYDEX) ZAKRYWAJĄCA BROŃ!
  // Rysowana NA WIERZCHU pistoletu – dzięki wycięciu bojowemu (Combat Cut)
  // lufa i zamek są całkowicie ukryte w kaburze, a na zewnątrz wystaje
  // tylko rękojeść/chwyt pistoletowy!
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  // Wlot z wycięciem pod chwyt pistoletowy
  ctx.moveTo(holsterStartX + 1.8, holsterCenterY - holsterW * 0.48);
  ctx.lineTo(holsterEndX, holsterCenterY - holsterW * 0.35);
  ctx.lineTo(holsterEndX, holsterCenterY + holsterW * 0.35);
  ctx.lineTo(holsterStartX, holsterCenterY + holsterW * 0.48);
  ctx.quadraticCurveTo(holsterStartX + 2.8, holsterCenterY, holsterStartX + 1.8, holsterCenterY - holsterW * 0.48);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 0.85;
  ctx.stroke();

  // Wytłoczenie formowanego Kydexu na przedniej ściance
  ctx.fillStyle = '#18181b';
  ctx.fillRect(holsterStartX + 3.0, holsterCenterY - holsterW * 0.22, holsterLen - 4.5, holsterW * 0.44);

  // 6. Blokada SLS / pasek zabezpieczający
  if (!loadout.isSecondaryDrawn) {
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(holsterStartX - 0.6, holsterCenterY - holsterW * 0.45, 1.6, holsterW * 0.9);
  } else {
    // Pusta komora kabury z odchyloną blokadą
    ctx.fillStyle = '#050505';
    ctx.fillRect(holsterStartX, holsterCenterY - holsterW * 0.30, 2.0, holsterW * 0.6);
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
 * TOPOREK TOMAHAWK: wisi PIONOWO — trzonkiem do dołu, a ostrzem do góry!
 * NÓŻ M9 / MACZETA: ostrze głęboko ukryte w pochwie, wystaje tylko chwyt.
 */
export function drawLeftThighMeleeSheath(ctx, p, l1, thighHalfH, facing, v = {}, isFrontLeg = true) {
  if (!ctx || !p || p.isDead) return;

  const loadout = getCharacterLoadout(p);
  const meleeId = loadout.meleeId;

  // Pozycja wzdłuż osi lewego uda:
  const sheathStartX = l1 * 0.20;
  const sheathEndX = l1 * 0.62;
  const sheathLen = sheathEndX - sheathStartX; // Długość pochwy (~16px)
  const sheathW = 5.2 * (v.muscleMult || 1.0);  // Szerokość pochwy
  const sheathCenterY = 0.0;

  ctx.save();
  if (!isFrontLeg) {
    ctx.globalAlpha = 0.88;
  }

  // 1. Pasek wieszakowy w górę do pasa biodrowego
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(sheathStartX, sheathCenterY);
  ctx.lineTo(0, -thighHalfH * 0.55);
  ctx.stroke();

  // 2. Elastyczny pas udowy obejmujący lewe udo
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

  if (meleeId === 'AXE') {
    // -------------------------------------------------------------
    // TOPOREK TOMAHAWK: WISI PIONOWO — TRZONKIEM DO DOŁU, OSTRZEM DO GÓRY!
    // Trzonek biegnie pionowo w dół uda (+X ku kolanu).
    // Stalowa głowica z szerokim ostrzem tnącym znajduje się u góry
    // przy biodrze (sheathStartX) i jest skierowana do góry pionowo!
    // -------------------------------------------------------------
    // Taktyczna klamra pierścieniowa (Axe Frog Ring) na udzie
    ctx.fillStyle = '#18181b';
    ctx.fillRect(sheathStartX - 2.0, sheathCenterY - 3.2, 4.0, 6.4);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(sheathStartX - 2.0, sheathCenterY - 3.2, 4.0, 6.4);

    if (!loadout.isMeleeDrawn) {
      const imgAxe = getWeaponPartSprite('AXE');

      if (imgAxe && imgAxe.complete && imgAxe.naturalWidth > 0) {
        // WŁAŚCIWY SPRITE TOPORKA Z ASSETÓW GRY (assets/weapons/axe.png)
        ctx.save();
        const s = 17.5 / 1115;
        // Punkt montażu głowicy przy biodrze:
        ctx.translate(sheathStartX + 1.2, sheathCenterY);
        // Obrót o 180° sprawia, że trzonek biegnie pionowo w dół ku kolanu (+X),
        // a głowica z ostrzem znajduje się u góry przy biodrze skierowana pionowo:
        ctx.rotate(Math.PI);
        ctx.scale(s, s);
        // Przesunięcie środka głowicy tomahawka (X = 1020, Y = 206) do punktu montażu (0, 0):
        ctx.translate(-1020.0, -206.0);
        ctx.drawImage(imgAxe, 2, 2);
        if (p.meleeBloodTimer > 0) {
          ctx.save();
          ctx.translate(1020.0 - 228.7, 0);
          ctx.scale(1 / s, 1 / s);
          drawWeaponBloodOverlay(ctx, 'AXE', p.meleeBloodTimer);
          ctx.restore();
        }
        ctx.restore();
      } else {
        // Proceduralny fallback w trakcie ładowania assetu
        ctx.fillStyle = '#18181b';
        ctx.fillRect(sheathStartX, sheathCenterY - 1.2, sheathLen + 2.0, 2.4);
        ctx.fillStyle = '#27272a';
        for (let tx = sheathStartX + 4.0; tx < sheathStartX + sheathLen; tx += 2.2) {
          ctx.fillRect(tx, sheathCenterY - 1.2, 1.0, 2.4);
        }
        ctx.save();
        ctx.translate(sheathStartX, sheathCenterY);
        ctx.fillStyle = '#334155';
        ctx.fillRect(-2.5, -2.5, 5.0, 5.0);
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(-2.5, -2.0);
        ctx.lineTo(-8.5, -6.5);
        ctx.lineTo(-8.5, 4.5);
        ctx.lineTo(-2.5, 2.0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(-6.5, -5.0);
        ctx.lineTo(-8.5, -6.5);
        ctx.lineTo(-8.5, 4.5);
        ctx.lineTo(-6.5, 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Pasek zatrzaskowy zabezpieczający trzonek w pierścieniu
      ctx.fillStyle = '#27272a';
      ctx.fillRect(sheathStartX - 1.2, sheathCenterY - 3.4, 2.4, 6.8);
      ctx.fillStyle = '#a1a1aa';
      ctx.beginPath();
      ctx.arc(sheathStartX, sheathCenterY, 0.65, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Pusta klamra z luźną pętlą
      ctx.fillStyle = '#09090b';
      ctx.fillRect(sheathStartX - 1.2, sheathCenterY - 2.0, 2.4, 4.0);
    }
  } else {
    // -------------------------------------------------------------
    // NÓŻ M9 LUB MACZETA KUKRI W POCHWIE KYDEX
    // Ostrze jest GŁĘBOKO SCHOWANE W POCHWIE (zakryte przednią ścianką),
    // a na zewnątrz wystaje tylko ergonomiczny chwyt z jelcem!
    // -------------------------------------------------------------
    // 1. Podkład / płyta tylna pochwy
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(sheathStartX, sheathCenterY - sheathW * 0.45);
    ctx.lineTo(sheathEndX, sheathCenterY - sheathW * 0.28);
    ctx.lineTo(sheathEndX + 1.5, sheathCenterY);
    ctx.lineTo(sheathEndX, sheathCenterY + 0.28 * sheathW);
    ctx.lineTo(sheathStartX, sheathCenterY + sheathW * 0.45);
    ctx.closePath();
    ctx.fill();

    // 2. Nóż / Maczeta (ostrze wsuwa się w dół, rękojeść wystaje ku biodru)
    if (!loadout.isMeleeDrawn) {
      if (meleeId === 'KNIFE') {
        const imgKnife = getWeaponPartSprite('KNIFE');
        if (imgKnife && imgKnife.complete && imgKnife.naturalWidth > 0) {
          ctx.save();
          const s = (24.7 / 1275) * 0.85;
          ctx.translate(sheathStartX + 3.0, sheathCenterY);
          ctx.scale(s, s);
          ctx.translate(-268.4, -188.5);
          ctx.drawImage(imgKnife, 2, 2);
          ctx.restore();
        } else {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(sheathStartX - 1.2, sheathCenterY - 2.8, 1.4, 5.6);
          ctx.fillStyle = '#09090b';
          ctx.fillRect(sheathStartX - 8.0, sheathCenterY - 1.6, 7.0, 3.2);
        }
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
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.moveTo(sheathStartX, sheathCenterY - 1.2);
          ctx.lineTo(sheathStartX - 8.5, sheathCenterY - 2.2);
          ctx.lineTo(sheathStartX - 8.2, sheathCenterY + 1.8);
          ctx.lineTo(sheathStartX, sheathCenterY + 1.2);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // 3. PRZEDNIA ŚCIANKA POCHWY (FRONT SHELL) ZAKRYWAJĄCA OSTRZE!
    // Klinga jest całkowicie schowana pod skorupą pochwy,
    // wystaje tylko rękojeść z jelcem!
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(sheathStartX + 1.5, sheathCenterY - sheathW * 0.42);
    ctx.lineTo(sheathEndX, sheathCenterY - sheathW * 0.28);
    ctx.lineTo(sheathEndX + 1.5, sheathCenterY);
    ctx.lineTo(sheathEndX, sheathCenterY + 0.28 * sheathW);
    ctx.lineTo(sheathStartX + 1.5, sheathCenterY + sheathW * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 0.85;
    ctx.stroke();

    // Nity montażowe wzdłuż krawędzi pochwy
    ctx.fillStyle = '#52525b';
    ctx.fillRect(sheathStartX + 3.0, sheathCenterY - sheathW * 0.35, 0.9, 0.9);
    ctx.fillRect(sheathStartX + 7.5, sheathCenterY - sheathW * 0.30, 0.9, 0.9);
    ctx.fillRect(sheathStartX + 12.0, sheathCenterY - sheathW * 0.25, 0.9, 0.9);

    if (!loadout.isMeleeDrawn) {
      // Pasek zatrzaskowy zabezpieczający rękojeść
      ctx.fillStyle = '#27272a';
      ctx.fillRect(sheathStartX - 1.0, sheathCenterY - sheathW * 0.45, 1.5, sheathW * 0.9);
      ctx.fillStyle = '#a1a1aa';
      ctx.beginPath();
      ctx.arc(sheathStartX - 0.2, sheathCenterY, 0.65, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Puste gardło pochwy
      ctx.fillStyle = '#050505';
      ctx.fillRect(sheathStartX, sheathCenterY - sheathW * 0.30, 2.0, sheathW * 0.6);
    }
  }

  ctx.restore();
}
