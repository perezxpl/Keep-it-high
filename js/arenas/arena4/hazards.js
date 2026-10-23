// =========================================================================
// ARENAS/ARENA4/HAZARDS.JS - ZAGROŻENIA ŚRODOWISKOWE PĘDZĄCEGO POCIĄGU
// Moduł Areny 4: Niski Most, Odłączanie Wagonu, Iskry i Pył (Object Pool)
// =========================================================================

import { arena4State, ARENA_4_CONFIG, WAGON_TYPES, spawnSpark, spawnDustPuff } from './state.js';
import { triggerScreenShake } from '../../camera.js';
import { spawnBloodSpurt, spawnLimbGib } from '../../world/gore.js';
import { spawnGroundPuff } from '../../world/state.js';

// -------------------------------------------------------------------------
// FUNKCJA ZGONU OD ZAGROŻEŃ PODTORZA: killByHazard(entity, hazardName)
// -------------------------------------------------------------------------
export function killByHazard(entity, hazardName = "PODTORZE KOLEJOWE") {
  if (!entity || entity.isDead) return;
  entity.hp = 0;
  entity.isDead = true;
  entity.killer = { name: hazardName, isSelf: true, cause: 'TRAIN_CRUSH' };
  entity.respawnTimer = 180;
  entity.vx = -22;
  entity.vy = 4;
  entity.onGround = false;
  entity.currentPlatform = null;
  entity.dropThroughPlatform = null;

  triggerScreenShake(6.0);
  spawnGroundPuff(entity.x, ARENA_4_CONFIG.floorY + 80, 22);
  spawnBloodSpurt(entity.x, ARENA_4_CONFIG.floorY + 60, -1, -0.25, 28, 2.2);
  spawnLimbGib('leg', entity.x, ARENA_4_CONFIG.floorY + 50, -15, -4, entity.facing || 1);
  spawnSpark(entity.x, ARENA_4_CONFIG.floorY + 50, -900, -150, 4, '#facc15');
}

/**
 * Sprawdza czy postać wpadła w śmiertelną szparę między wagonami poniżej poziomu roofY + 20
 */
export function isEntityInTrainGap(entity) {
  if (!entity || entity.isDead) return false;
  const pw = entity.w || 24;
  const centerX = (entity.x || 0) + pw * 0.5;
  const feetY = (entity.y || 0) + (entity.h || 70);

  // Wymóg zadania: kolizja poniżej poziomu roofY + 20 (410 + 20 = 430)
  if (feetY <= ARENA_4_CONFIG.roofY + 20) return false;

  let w3Left = 1780;
  let w3Right = 2540;
  if (arena4State.decouple.phase === 'DECOUPLING') {
    w3Left += arena4State.decouple.offsetX;
    w3Right += arena4State.decouple.offsetX;
  } else if (arena4State.decouple.phase === 'INCOMING') {
    w3Left = arena4State.decouple.incomingX;
    w3Right = w3Left + 760;
  }

  // Szpary między wagonami
  const inGap1 = (centerX > 920 && centerX < 960);
  const inGap2 = (centerX > 1720 && centerX < w3Left);
  const inGap3 = (centerX > w3Right && centerX < 2600);
  const inGap4 = (centerX > 3360 && centerX < 3420);
  const fellBehind = (centerX < 200);
  const hitPlow = (centerX > 3960);

  // Sprawdzenie krawędzi postaci (bounding box w szparze)
  const boxInGap1 = (entity.x + pw > 920 && entity.x < 960 && !(entity.x >= 200 && entity.x + pw <= 920) && !(entity.x >= 960 && entity.x + pw <= 1720));
  const boxInGap2 = (entity.x + pw > 1720 && entity.x < w3Left);
  const boxInGap3 = (entity.x + pw > w3Right && entity.x < 2600);
  const boxInGap4 = (entity.x + pw > 3360 && entity.x < 3420);

  return inGap1 || inGap2 || inGap3 || inGap4 || fellBehind || hitPlow || boxInGap1 || boxInGap2 || boxInGap3 || boxInGap4;
}

export function updateArena4Hazards(dt, combatants) {
  const safeDt = Math.min(dt || (1 / 60), 0.1);
  arena4State.animTime += safeDt;

  // -----------------------------------------------------------------------
  // 0. AKTUALIZACJA OFFSETÓW PRĘDKOŚCI PODTORZA I PARALAKSY
  // -----------------------------------------------------------------------
  // Ruchome podkłady i szyny (przesuwanie o 24px na takt 60Hz)
  arena4State.trackOffset = (arena4State.trackOffset + safeDt * 1440) % 60;
  // Paralaksa L1 (dalekie wydmy: 0.05x pędu)
  arena4State.skyOffset = (arena4State.skyOffset + safeDt * 110) % 2400;
  // Paralaksa L2 (skały i słupy telegraficzne: 0.40x pędu)
  arena4State.midOffset = (arena4State.midOffset + safeDt * 880) % 2400;

  // -----------------------------------------------------------------------
  // 1. ZAGROŻENIE: NISKI MOST PANCERNY (LOW OVERHEAD BRIDGE)
  // -----------------------------------------------------------------------
  const b = arena4State.bridge;
  b.timer -= safeDt;

  if (b.timer <= ARENA_4_CONFIG.bridgeWarningDuration && b.timer > 0) {
    b.warning = true;
    b.warningTimer += safeDt;
  } else if (b.timer <= 0 && !b.active) {
    b.active = true;
    b.warning = false;
    b.x = ARENA_4_CONFIG.mapWidth + 200;
  }

  if (b.active) {
    // Szybki przelot mostu od prawej do lewej strony ekranu
    const bridgeSpeed = 3200; // px/s
    b.x -= bridgeSpeed * safeDt;

    // Kolizja belki z postaciami na dachach wagonów
    if (Array.isArray(combatants)) {
      for (const p of combatants) {
        if (!p || p.isDead) continue;
        const pCenterX = (p.x || 0) + (p.w || 24) * 0.5;
        const pFeetY = (p.y || 0) + (p.h || 70);
        const pHeadY = p.y || 0;

        // Sprawdzamy czy postać jest w osi X mostu
        if (Math.abs(pCenterX - b.x) < 140) {
          // Gracz znajduje się na poziomie dachu lub w locie powyżej (Y <= 425)
          const isOnRoofLevel = (pHeadY <= 425 && pFeetY <= 470);
          const isProneOrSliding = !!(p.isSliding || p.isCrouching || p.gaitMode === 'SLIDE' || (p.h && p.h <= 36));

          if (isOnRoofLevel && !isProneOrSliding) {
            // Natychmiastowe zmiażdżenie i dekapitacja!
            p.hp = 0;
            p.isDead = true;
            p.killer = { name: 'NISKI MOST PANCERNY', isSelf: true, cause: 'BRIDGE_CRUSH' };
            p.respawnTimer = 180;
            p.vx = -18;
            p.vy = -6;

            triggerScreenShake(7.5);
            spawnBloodSpurt(pCenterX, pHeadY + 10, -1, -0.4, 30, 2.0);
            spawnLimbGib('head', pCenterX, pHeadY, -12, -5, p.facing || 1);
            spawnSpark(pCenterX, pHeadY, -800, -100, 4, '#facc15');
          }
        }
      }
    }

    // Zakończenie przelotu mostu
    if (b.x < -600) {
      b.active = false;
      b.timer = ARENA_4_CONFIG.bridgeInterval;
    }
  }

  // -----------------------------------------------------------------------
  // 2. ZAGROŻENIE: ODŁĄCZANIE CENTRALNEGO WAGONU (DECOUPLING CAR)
  // -----------------------------------------------------------------------
  const d = arena4State.decouple;
  d.timer -= safeDt;

  if (d.timer <= ARENA_4_CONFIG.decoupleWarningDuration && d.timer > 0) {
    d.warning = true;
    d.warningTimer += safeDt;
    d.phase = 'WARNING';
  } else if (d.timer <= 0 && d.phase === 'WARNING') {
    d.phase = 'DECOUPLING';
    d.warning = false;
    d.offsetX = 0;
    triggerScreenShake(3.0);
  }

  if (d.phase === 'DECOUPLING') {
    d.offsetX -= 360 * safeDt; // Wagon zwalnia względem pędzącego składu

    // Sprawdzenie graczy znajdujących się na odłączonym wagonie (X: 1780..2540)
    if (Array.isArray(combatants)) {
      for (const p of combatants) {
        if (!p || p.isDead) continue;
        const relativeX = (p.x || 0) + d.offsetX;
        const inDecoupledZone = (p.x >= 1780 && p.x <= 2540 && p.y >= 380 && p.y <= 850);
        if (inDecoupledZone && relativeX < 120) {
          p.hp = 0;
          p.isDead = true;
          p.killer = { name: 'ODŁĄCZONY WAGON', isSelf: true, cause: 'TRAIN_DROP' };
          p.respawnTimer = 180;
          triggerScreenShake(6.0);
          spawnGroundPuff(p.x, 850, 16);
        }
      }
    }

    if (d.offsetX < -1200) {
      d.phase = 'INCOMING';
      d.incomingX = ARENA_4_CONFIG.mapWidth + 400;
      // Wylosowanie nowego typu wagonu
      const keys = Object.keys(WAGON_TYPES);
      arena4State.centralWagonType = keys[Math.floor(Math.random() * keys.length)];
    }
  } else if (d.phase === 'INCOMING') {
    d.incomingX -= 2400 * safeDt;
    if (d.incomingX <= 1780) {
      // Sprzęgnięcie nowego wagonu z impetem
      d.phase = 'IDLE';
      d.offsetX = 0;
      d.timer = ARENA_4_CONFIG.decoupleInterval;
      triggerScreenShake(4.5);

      // Knockback dla postaci stojących blisko sprzęgu
      if (Array.isArray(combatants)) {
        for (const p of combatants) {
          if (!p || p.isDead) continue;
          if (Math.abs(p.x - 1780) < 120 || Math.abs(p.x - 2540) < 120) {
            p.vx = (p.x < 2160 ? -8 : 8);
            p.vy = -3;
          }
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // 3. STREFA ŚMIERCI: ŚMIERTELNE SZPARY MIĘDZY WAGONAMI I PODTORZE
  // -----------------------------------------------------------------------
  if (Array.isArray(combatants)) {
    for (const p of combatants) {
      if (!p || p.isDead) continue;
      const feetY = (p.y || 0) + (p.h || 70);

      // A. Wpadnięcie w szparę między wagonami poniżej poziomu roofY + 20
      const fellInGap = isEntityInTrainGap(p);

      // B. Wpadnięcie bezpośrednio pod koła pociągu (Y >= killzoneY)
      const hitTracks = (feetY >= ARENA_4_CONFIG.killzoneY);

      if (fellInGap || hitTracks) {
        killByHazard(p, "PODTORZE KOLEJOWE");
      }
    }
  }

  // -----------------------------------------------------------------------
  // 4. GENEROWANIE I FIZYKA CZĄSTECZEK (OBJECT POOL: ISKRY I PYŁ)
  // -----------------------------------------------------------------------
  // A. Emisja widocznych iskier tryskających w górę ze śmiertelnych szpar między wagonami
  const trainGaps = [
    { x1: 920, x2: 960 },
    { x1: 1720, x2: 1780 },
    { x1: 2540, x2: 2600 },
    { x1: 3360, x2: 3420 }
  ];
  for (const g of trainGaps) {
    if (Math.random() < 0.50) {
      const gx = g.x1 + Math.random() * (g.x2 - g.x1);
      const gy = 818 + Math.random() * 25;
      const svx = -(700 + Math.random() * 850);
      const svy = -(140 + Math.random() * 240); // wyrzut iskier w górę przez szparę w podtorzu!
      const sparkColor = Math.random() < 0.30 ? '#ffffff' : (Math.random() < 0.70 ? '#facc15' : '#f97316');
      spawnSpark(gx, gy, svx, svy, 2.5 + Math.random() * 1.8, sparkColor);
    }
  }
  const wheelXList = [
    330, 430, 710, 810,
    1090, 1190, 1490, 1590,
    1910, 2010, 2310, 2410,
    2730, 2830, 3130, 3230,
    3550, 3650
  ];

  // A. Emisja drobnych żółtych iskier spod kół pędzących po szynach
  const sparkSpawnCount = Math.floor(Math.random() * 3) + 1; // 1-3 iskry na klatkę
  for (let s = 0; s < sparkSpawnCount; s++) {
    const wx = wheelXList[Math.floor(Math.random() * wheelXList.length)];
    const sparkX = wx + (Math.random() - 0.5) * 16;
    const sparkY = 872 + Math.random() * 4;
    const svx = -(1300 + Math.random() * 950);
    const svy = 50 + Math.random() * 140;
    const sparkColor = Math.random() < 0.25 ? '#ffffff' : (Math.random() < 0.65 ? '#fde047' : '#f59e0b');
    spawnSpark(sparkX, sparkY, svx, svy, 2.0 + Math.random() * 1.5, sparkColor);
  }

  // B. Emisja obłoków kurzu / pyłu spod podłogi składu pociągu
  if (Math.random() < 0.65) {
    const dustX = 300 + Math.random() * 3500;
    const dustY = 824 + Math.random() * 18;
    const dvx = -(750 + Math.random() * 550);
    const dvy = -(15 + Math.random() * 35);
    spawnDustPuff(dustX, dustY, dvx, dvy, 24 + Math.random() * 16);
  }

  // C. Aktualizacja fizyki iskier w Object Pool
  const sparks = arena4State.sparksPool;
  for (let i = 0; i < sparks.length; i++) {
    const sp = sparks[i];
    if (!sp.active) continue;

    sp.x += sp.vx * safeDt;
    sp.y += sp.vy * safeDt;
    sp.vy += 620 * safeDt; // Grawitacja
    sp.life -= safeDt;

    // Odbicie od stalowych szyn i podtorza
    if (sp.y >= 878 && sp.vy > 0) {
      sp.y = 878;
      sp.vy = -sp.vy * 0.45;
      sp.vx *= 0.75;
    }

    if (sp.life <= 0 || sp.x < -300) {
      sp.active = false;
    }
  }

  // D. Aktualizacja fizyki pyłu w Object Pool
  const dust = arena4State.dustPool;
  for (let i = 0; i < dust.length; i++) {
    const dp = dust[i];
    if (!dp.active) continue;

    dp.x += dp.vx * safeDt;
    dp.y += dp.vy * safeDt;
    dp.life -= safeDt;

    const progress = 1.0 - (dp.life / dp.maxLife);
    dp.radius = 6 + (dp.maxRadius - 6) * progress;
    dp.alpha = (1.0 - progress) * 0.32;

    if (dp.life <= 0 || dp.x < -300) {
      dp.active = false;
    }
  }
}
