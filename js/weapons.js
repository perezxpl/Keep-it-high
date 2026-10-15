// =========================================================================
// WEAPONS.JS - SYSTEM BRONI, BALISTYKI I KINEMATYKI STRZELECKIEJ (SOLDAT STYLE)
// Obsługa stref trafień, odrzutu celu oraz rozrywania kończyn (Dismemberment)
// =========================================================================

import {
  triggerScreenShake, GROUND_Y, triggerHitstop,
  spawnHeadGib, spawnBloodSpurt, spawnBloodFountain, spawnBloodDrip, spawnDroppedWeapon,
  spawnKnockedHelmet, spawnVestShreds,
  bodyGibs
} from './world.js';
import { checkRayObstacleCollision, obstacles, registerHitSparkCallback } from './obstacles.js';
import { WEAPON_CONFIG } from './config.js';
import { getActiveArena } from './arenas/index.js';
import {
  spawnBulletCasing,
  spawnDroppedMagazine,
  updateBulletCasings,
  drawBulletCasings,
  clearBulletCasings,
  bulletCasings
} from './particles.js';

export {
  spawnBulletCasing,
  spawnDroppedMagazine,
  updateBulletCasings,
  drawBulletCasings,
  clearBulletCasings,
  bulletCasings
};

import {
  WEAPONS,
  bullets,
  bulletParticles,
  spawnBulletSparks,
  spawnHitSparks,
  getShooterShoulderPos,
  getWeaponHoldTransform,
  getMuzzlePosition,
  getWeaponAmmo,
  reloadWeapon,
  cancelReload
} from './weapons/transform.js';
import {
  drawBullets,
  drawSniperLaserSight,
  drawHeldWeapon
} from './weapons/renderer.js';
import { networkState, sendDamageEvent, remotePlayer } from './network.js';
import { getActiveBots } from './bot.js';

export {
  WEAPONS,
  bullets,
  bulletParticles,
  spawnBulletSparks,
  spawnHitSparks,
  getShooterShoulderPos,
  getWeaponHoldTransform,
  getMuzzlePosition,
  getWeaponAmmo,
  reloadWeapon,
  cancelReload,
  drawBullets,
  drawSniperLaserSight,
  drawHeldWeapon
};

export function shootWeapon(shooter, weapon, overrideX, overrideY, overrideAngle) {
  if (!shooter || !weapon || shooter.isDead || shooter.staggerTimer > 0) return false;
  if (shooter.shootCooldown > 0 && !shooter.isRemote) return false;

  // Weryfikacja amunicji dla gracza lokalnego
  if (!shooter.isRemote && !shooter.isBot) {
    const ammo = getWeaponAmmo(shooter, weapon);
    if (ammo) {
      // Zablokuj strzał w trakcie przeładowania
      if (ammo.isReloading) {
        return false;
      }
      // Zablokuj strzał, gdy magazynek jest pusty
      if (ammo.currentAmmo <= 0) {
        if (ammo.reserveAmmo > 0) {
          // Automatyczne przeładowanie przy próbie strzału z pustego magazynka
          reloadWeapon(shooter, weapon);
        } else {
          // Brak amunicji w ogóle - "pusty klik"
          shooter.shootCooldown = 12;
          shooter.emptyAmmoAlert = 35;
        }
        return false;
      }
      // Zmniejszaj currentAmmo o 1 przy każdym wystrzale
      ammo.currentAmmo--;
    }
  }

  const isCrouch = !!(shooter.isCrouching || shooter.isProne);

  if (weapon.id === 'SHOTGUN') {
    shooter.shootPoseTimer = Math.max(shooter.shootPoseTimer || 0, 30);
    shooter.weaponKickback = weapon.kickbackDistance;
    shooter.muzzleRise = (shooter.muzzleRise || 0) + weapon.muzzleRise;
    shooter.pumpTimer = 18;
  } else if (weapon.id === 'SNIPER') {
    shooter.shootPoseTimer = Math.max(shooter.shootPoseTimer || 0, 34);
    shooter.weaponKickback = weapon.kickbackDistance;
    shooter.muzzleRise = Math.min(0.35, (shooter.muzzleRise || 0) + weapon.muzzleRise);
  } else {
    shooter.shootPoseTimer = Math.max(shooter.shootPoseTimer || 0, 26);
    shooter.weaponKickback = weapon.kickbackDistance;
    shooter.muzzleRise = Math.min(0.24, (shooter.muzzleRise || 0) + weapon.muzzleRise);
  }
  shooter.shootPoseWeight = 1.0;

  let muzzleX, muzzleY, theta;
  if (overrideX !== undefined && overrideY !== undefined && overrideAngle !== undefined) {
    muzzleX = overrideX;
    muzzleY = overrideY;
    theta = overrideAngle;
  } else {
    const muzzle = getMuzzlePosition(shooter, weapon);
    muzzleX = muzzle.muzzleX;
    muzzleY = muzzle.muzzleY;

    const effectiveGroundY = (typeof shooter.groundY === 'number' && shooter.groundY > 0)
      ? shooter.groundY
      : (typeof GROUND_Y === 'number' && GROUND_Y > 0 ? GROUND_Y : 500);

    const wallHit = checkRayObstacleCollision(muzzle.shoulderX, muzzle.shoulderY, muzzleX, muzzleY, effectiveGroundY, obstacles);
    if (wallHit) {
      spawnHitSparks(wallHit.x, wallHit.y, wallHit.nx, wallHit.ny, weapon.id === 'SNIPER' ? 10 : 5);
      if (!shooter.isRemote) shooter.shootCooldown = weapon.fireRate;
      shooter.muzzleFlashTimer = weapon.id === 'SNIPER' ? 3 : 2;
      if (weapon.id === 'SNIPER') {
        const wallAngle = theta || Math.atan2(muzzle.aimY - muzzleY, muzzle.aimX - muzzleX);
        shooter.vx -= Math.cos(wallAngle) * 4.8;
        shooter.vy -= Math.sin(wallAngle) * 1.8;
        if (!shooter.isRemote) triggerScreenShake(12);
      } else if (weapon.recoil > 1.2 && !shooter.isRemote) {
        triggerScreenShake(2.5);
      }

      // Wyrzut łuski z zamka broni przy strzale
      const hold = getWeaponHoldTransform(shooter);
      const breechDist = (weapon.id === 'SHOTGUN' ? 8 : (weapon.id === 'SNIPER' ? 6 : 10));
      const charFacing = (shooter && typeof shooter.facing === 'number') ? shooter.facing : (hold.charFacing || 1);
      const bX = hold.pivotX + Math.cos(hold.angle) * breechDist * charFacing;
      const bY = hold.pivotY + Math.sin(hold.angle) * breechDist - 1.5;
      spawnBulletCasing(bX, bY, hold.angle, weapon.id, charFacing, shooter.vx || 0, shooter.vy || 0);

      return true;
    }

    theta = Math.atan2(muzzle.aimY - muzzleY, muzzle.aimX - muzzleX);

    if (shooter.isBot && !shooter.isRemote && typeof window !== 'undefined' && window.networkState?.isHost && window.networkState?.isConnected) {
      if (typeof window.sendBotShootEvent === 'function') {
        const bIdx = (typeof shooter.botIndex === 'number') ? shooter.botIndex : (parseInt(String(shooter.id).replace('bot_', ''), 10) - 1 || 0);
        window.sendBotShootEvent(bIdx, weapon.id, muzzleX, muzzleY, theta);
      }
    }
  }

  const activeSpread = weapon.spread * (isCrouch ? weapon.crouchSpreadMult : 1.0);

  for (let i = 0; i < weapon.pellets; i++) {
    const dev = (Math.random() * 2 - 1) * activeSpread;
    const angle = theta + dev;
    const speed = weapon.bulletSpeed * (0.96 + Math.random() * 0.08);

    bullets.push({
      x: muzzleX,
      y: muzzleY,
      prevX: muzzleX,
      prevY: muzzleY,
      originX: muzzleX,
      originY: muzzleY,
      weaponId: weapon.id,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: weapon.damage,
      ballPush: weapon.ballPush,
      bodyPush: weapon.bodyPush || (weapon.id === 'SNIPER' ? 0.22 : 0.03),
      ragdollPushMult: weapon.ragdollPushMult || (weapon.id === 'SNIPER' ? 3.5 : 1.0),
      color: weapon.bulletColor,
      shooter: shooter,
      life: weapon.id === 'SNIPER' ? 95 : 75,
      isSniper: (weapon.id === 'SNIPER')
    });
  }

  shooter.muzzleFlashTimer = weapon.id === 'SNIPER' ? 3 : 2;

  // Fizyczny odrzut gracza w tył po strzale ze snajperki
  if (weapon.id === 'SNIPER') {
    shooter.vx -= Math.cos(theta) * 4.8;
    shooter.vy -= Math.sin(theta) * 1.8;
  }

  if (!shooter.isRemote) {
    shooter.shootCooldown = weapon.fireRate;
    if (weapon.id === 'SNIPER') {
      triggerScreenShake(12);
    } else if (weapon.recoil > 1.5) {
      triggerScreenShake(isCrouch ? 2.4 : 3.8);
    } else {
      triggerScreenShake(1.2);
    }
  }

  if (weapon.id === 'SNIPER') {
    spawnBulletSparks(muzzleX + Math.cos(theta) * 8, muzzleY + Math.sin(theta) * 8, '#38bdf8', 6);
    spawnBulletSparks(muzzleX + Math.cos(theta) * 8, muzzleY + Math.sin(theta) * 8, '#facc15', 3);
  } else {
    spawnBulletSparks(muzzleX + Math.cos(theta) * 6, muzzleY + Math.sin(theta) * 6, weapon.bulletColor, 3);
  }

  // Wyrzut łuski z zamka broni (Ejection Mechanics: punkt startowy na zamku, lekko cofnięty w stronę broni/gracza)
  let breechX, breechY;
  const charFacing = (shooter && typeof shooter.facing === 'number') ? shooter.facing : (Math.cos(theta) >= 0 ? 1 : -1);

  if (shooter && overrideX === undefined) {
    const hold = getWeaponHoldTransform(shooter);
    const breechDist = (weapon.id === 'SHOTGUN' ? 8 : (weapon.id === 'SNIPER' ? 6 : 10));
    breechX = hold.pivotX + Math.cos(hold.angle) * breechDist * charFacing;
    breechY = hold.pivotY + Math.sin(hold.angle) * breechDist - 1.5;
  } else {
    const backDist = (weapon.id === 'SHOTGUN' ? 18 : (weapon.id === 'SNIPER' ? 26 : 22));
    breechX = muzzleX - Math.cos(theta) * backDist;
    breechY = muzzleY - Math.sin(theta) * backDist - 1.5;
  }

  const inheritVx = shooter ? (shooter.vx || 0) : 0;
  const inheritVy = shooter ? (shooter.vy || 0) : 0;
  spawnBulletCasing(breechX, breechY, theta, weapon.id, charFacing, inheritVx, inheritVy);

  return true;
}

/**
 * Aktualizacja klatkowa stanów broni i cyklu przeładowania
 */
export function updateWeaponState(p) {
  if (!p) return;

  if (p.weaponKickback > 0.05) {
    p.weaponKickback *= 0.65;
  } else {
    p.weaponKickback = 0;
  }

  if (p.muzzleRise > 0.005) {
    p.muzzleRise *= 0.72;
  } else {
    p.muzzleRise = 0;
  }

  if (p.pumpTimer > 0) {
    p.pumpTimer--;
    if (p.pumpTimer > 9) {
      p.pumpOffset = -4.2 * ((18 - p.pumpTimer) / 9);
    } else {
      p.pumpOffset = -4.2 * (p.pumpTimer / 9);
    }
  } else {
    p.pumpOffset = 0;
  }

  if (p.emptyAmmoAlert > 0) {
    p.emptyAmmoAlert--;
  }

  // Obsługa amunicji i przeładowania broni gracza
  const curWep = p.currentWeapon || WEAPONS.AK47;
  const curWepId = curWep?.id || 'AK47';

  // Anulowanie trwającego przeładowania przy zmianie broni
  if (p._prevWeaponId && p._prevWeaponId !== curWepId) {
    if (p.ammo && p.ammo[p._prevWeaponId]) {
      p.ammo[p._prevWeaponId].isReloading = false;
      p.ammo[p._prevWeaponId].reloadTimer = 0;
    }
  }
  p._prevWeaponId = curWepId;

  if (p.ammo) {
    const ammo = getWeaponAmmo(p, curWep);
    if (ammo && ammo.isReloading) {
      ammo.reloadTimer--;
      p.isReloading = true;
      p.reloadTimer = ammo.reloadTimer;
      p.reloadDuration = ammo.reloadDuration;
      const u = Math.max(0, Math.min(1.0, 1.0 - (ammo.reloadTimer / (ammo.reloadDuration || 120))));
      p.reloadProgress = u;

      // Obsługa wyrzutu pustego magazynka (Fizyczna cząsteczka spadająca na ziemię)
      if (u >= 0.24 && !ammo._magEjected && (curWepId === 'AK47' || curWepId === 'SNIPER')) {
        ammo._magEjected = true;
        const hold = getWeaponHoldTransform(p);
        const charFacing = (p && typeof p.facing === 'number') ? p.facing : (hold.charFacing || 1);
        const magDist = curWepId === 'SNIPER' ? 7.0 : 6.5;
        const magYOffset = curWepId === 'SNIPER' ? 5.5 : 5.0;
        const mX = hold.pivotX + (Math.cos(hold.angle) * magDist - Math.sin(hold.angle) * magYOffset) * charFacing;
        const mY = hold.pivotY + (Math.sin(hold.angle) * magDist + Math.cos(hold.angle) * magYOffset);
        spawnDroppedMagazine(mX, mY, curWepId, charFacing, p.vx || 0, p.vy || 0);
      }

      // Shotgun: wyrzut łuski przy przeładowaniu czółenkiem pompy w tył
      if (curWepId === 'SHOTGUN' && u >= 0.82 && !ammo._pumpEjected) {
        ammo._pumpEjected = true;
        const hold = getWeaponHoldTransform(p);
        const charFacing = (p && typeof p.facing === 'number') ? p.facing : (hold.charFacing || 1);
        const breechDist = 8;
        const bX = hold.pivotX + Math.cos(hold.angle) * breechDist * charFacing;
        const bY = hold.pivotY + Math.sin(hold.angle) * breechDist - 1.5;
        spawnBulletCasing(bX, bY, hold.angle, 'SHOTGUN', charFacing, p.vx || 0, p.vy || 0);
      }

      if (ammo.reloadTimer <= 0) {
        // Zakończenie przeładowania: doładuj magazynek do pełna, odejmując zużytą liczbę z reserveAmmo
        const needed = ammo.magSize - ammo.currentAmmo;
        const toLoad = Math.min(needed, ammo.reserveAmmo);
        ammo.currentAmmo += toLoad;
        ammo.reserveAmmo -= toLoad;
        ammo.isReloading = false;
        ammo.reloadTimer = 0;
        ammo._magEjected = false;
        ammo._pumpEjected = false;
        p.isReloading = false;
        p.reloadTimer = 0;
        p.reloadProgress = 0;
      }
    } else {
      p.isReloading = false;
      p.reloadTimer = 0;
      p.reloadProgress = 0;
    }
  }
}

function distPointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

function getSegmentAABBHitT(x1, y1, x2, y2, left, top, right, bottom) {
  let t0 = 0.0, t1 = 1.0;
  const dx = x2 - x1, dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - left, right - x1, y1 - top, bottom - y1];
  for (let k = 0; k < 4; k++) {
    if (p[k] === 0) {
      if (q[k] < 0) return null;
    } else {
      const t = q[k] / p[k];
      if (p[k] < 0) {
        if (t > t1) return null;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return null;
        if (t < t1) t1 = t;
      }
    }
  }
  if (t0 <= t1) {
    const startInside = (x1 >= left && x1 <= right && y1 >= top && y1 <= bottom);
    return startInside ? 0 : t0;
  }
  return null;
}

/**
 * Aktualizacja pocisków, strefy trafień (Headshot / Torso / Legs) i rozrywanie kończyn
 */
export function updateBullets(groundY, obstaclesList, ball, characters) {
  for (let i = bulletParticles.length - 1; i >= 0; i--) {
    const p = bulletParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.22;
    p.life -= 0.055;
    if (p.life <= 0) {
      bulletParticles.splice(i, 1);
    }
  }

  const charList = characters || [];
  const obs = obstaclesList || obstacles;
  updateBulletCasings(1 / 60, groundY, obs);

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.prevX = b.x;
    b.prevY = b.y;
    b.x += b.vx;
    b.y += b.vy;
    b.vy += 0.04;
    b.life--;

    if (b.life <= 0) {
      bullets.splice(i, 1);
      continue;
    }

    const mapHit = checkRayObstacleCollision(b.prevX, b.prevY, b.x, b.y, groundY, obs, b);
    const endX = mapHit ? mapHit.x : b.x;
    const endY = mapHit ? mapHit.y : b.y;
    const maxT = mapHit ? mapHit.t : 1.0;

    let hitBall = false;
    if (ball) {
      const cR = ball.colRadius || 5.2;
      const distToBall = distPointToSegment(ball.x, ball.y, b.prevX, b.prevY, endX, endY);

      if (distToBall <= cR + 5) {
        ball.isLevitating = false;
        ball.vx += b.vx * b.ballPush;
        ball.vy += b.vy * b.ballPush;
        ball.spin += (b.vx > 0 ? 0.25 : -0.25);
        spawnBulletSparks(endX, endY, '#38bdf8', 4);
        bullets.splice(i, 1);
        hitBall = true;
        continue;
      }
    }
    if (hitBall) continue;

    // Przechwycenie trafienia pocisku w unikalne elementy mapy (Plugin Lifecycle Hook)
    const activeArena = getActiveArena();
    if (activeArena && typeof activeArena.onBulletHit === 'function') {
      if (activeArena.onBulletHit(b)) {
        b.alive = false;
        bullets.splice(i, 1);
        continue;
      }
    }

    let hitChar = false;
    let closestChar = null;
    let closestCharT = Infinity;

    for (const ch of charList) {
      if (!ch || ch === b.shooter || ch.isDead) continue;
      if (ch.isBot && !ch.active) continue;
      if (b.shooter && b.shooter.team && ch.team && b.shooter.team === ch.team) continue;
      // W trybie sieciowym kule zdalnego gracza nie zadają obrażeń bezpośrednio lokalnemu graczowi
      // (ponieważ strzelający autorytatywnie wysyła pakiet deal_dmg po trafieniu na swoim ekranie)
      if (networkState && networkState.isConnected && b.shooter && b.shooter.isRemote && !ch.isRemote) continue;

      const hitW = ch.w || 24;
      const hitH = ch.h || 70;
      let charLeft = ch.x;
      let charRight = ch.x + hitW;
      let charTop = ch.y - 25;
      let charBottom = ch.y + hitH;

      if (ch.isProne || ch.staggerTimer > 0) {
        // Obniżony profil kolizji dla pozycji leżącej na brzuchu lub na plecach po powaleniu
        charTop = ch.y + hitH - 24;
        charBottom = ch.y + hitH + 2;
        charLeft = ch.x - (ch.facing === 1 ? 14 : 38);
        charRight = ch.x + hitW + (ch.facing === 1 ? 38 : 14);
      } else if (ch.isCrouching) {
        charTop = ch.y + 12;
      }

      const charT = getSegmentAABBHitT(b.prevX, b.prevY, endX, endY, charLeft, charTop, charRight, charBottom);
      if (charT !== null && charT <= maxT && charT < closestCharT) {
        closestCharT = charT;
        closestChar = ch;
      }
    }

    if (closestChar) {
      const hitPtX = b.prevX + (b.x - b.prevX) * closestCharT;
      const hitPtY = b.prevY + (b.y - b.prevY) * closestCharT;

      let isHeadshot = false;
      let isLegshot = false;
      let isTorsoShot = false;

      if (closestChar.isProne || (closestChar.staggerTimer > 0)) {
        // Pozycja leżąca: sylwetka rozciągnięta wzdłuż osi X
        if (closestChar.facing === 1) {
          isHeadshot = (hitPtX >= closestChar.x + closestChar.w * 0.60);
          isLegshot = (hitPtX <= closestChar.x - 4);
          isTorsoShot = !isHeadshot && !isLegshot;
        } else {
          isHeadshot = (hitPtX <= closestChar.x + closestChar.w * 0.40);
          isLegshot = (hitPtX >= closestChar.x + closestChar.w + 4);
          isTorsoShot = !isHeadshot && !isLegshot;
        }
      } else if (closestChar.isCrouching) {
        isHeadshot = (hitPtY <= closestChar.y + 24);
        isLegshot = (hitPtY >= closestChar.y + 46);
        isTorsoShot = !isHeadshot && !isLegshot;
      } else {
        // Normalna sylwetka stojąca / w biegu:
        isHeadshot = (hitPtY <= closestChar.y + 8);
        isLegshot = (hitPtY >= closestChar.y + 38);
        isTorsoShot = !isHeadshot && !isLegshot;
      }

      // Ochrona odrodzenia: nietykalność celu oraz brak możliwości ranienia innych przez gracza pod osłoną
      if ((closestChar.spawnProtectionTimer && closestChar.spawnProtectionTimer > 0) || (b.shooter && b.shooter.spawnProtectionTimer && b.shooter.spawnProtectionTimer > 0)) {
        spawnBulletSparks(hitPtX, hitPtY, '#00e5ff', 8);
        b.life = 0;
        continue;
      }

      let damageMultiplier = 1.0;
      let helmetAbsorbed = false;
      let vestAbsorbed = false;

      // 1. GŁOWA (HEADSHOT) - NAJWYŻSZE OBRAŻENIA (2.25x), HEŁM CHRONI PRZED HEADSHOTEM NA KRÓTKO:
      if (isHeadshot) {
        const hasHelm = !!(closestChar.hasHelmet || closestChar.visuals?.hasHelmet);
        const hasImmunity = ((closestChar.headshotImmunityTimer || 0) > 0);

        if (hasImmunity) {
          // Krótkie okno ochronne po zestrzeleniu hełmu: wygasza kolejne kule z tej samej salwy
          damageMultiplier = 0.35;
          helmetAbsorbed = true;
          spawnBulletSparks(hitPtX, hitPtY, '#facc15', 5);
        } else if (hasHelm) {
          // Hełm chroni przed headshotem na krótko: pochłania zabójczą siłę i odlatuje z głowy
          helmetAbsorbed = true;
          damageMultiplier = 0.40; // Redukcja zabójczego one-shota

          closestChar.hasHelmet = false;
          if (closestChar.visuals) closestChar.visuals.hasHelmet = false;
          closestChar.helmetHits = 0;
          closestChar.headshotImmunityTimer = 22; // ~360ms krótkiej osłony przed serią

          spawnKnockedHelmet(hitPtX, hitPtY - 4, b.vx, b.vy, closestChar.facing, closestChar.visuals || closestChar.currentClass?.visuals);
          triggerScreenShake(3.2);
          spawnBulletSparks(hitPtX, hitPtY, '#facc15', 12);

          if (typeof window !== 'undefined' && typeof window.syncArmorDevButtons === 'function') {
            window.syncArmorDevButtons();
          }
        } else {
          // Czyste trafienie w nieosłoniętą głowę: najwięcej obrażeń (2.25x)!
          damageMultiplier = 2.25;
        }
      } else if (isTorsoShot) {
        // 2. TORS (TORSO SHOT) - DRUGIE W HIERARCHII OBRAŻEŃ (1.25x):
        damageMultiplier = 1.25;
      } else {
        // 3. NOGI / KOŃCZYNY (LEG SHOT) - NAJMNIEJ OBRAŻEŃ (0.75x):
        damageMultiplier = 0.75;
      }

      let totalDamage = Math.round(b.damage * damageMultiplier);

      // 4. PANCERZ KORPUSU (KAMIZELKA KULOODPORNA):
      // Kamizelka posiada swoje własne HP nałożone na HP posiadacza i chroni TYLKO od obrażeń na tors!
      if (isTorsoShot && (closestChar.hasVest || closestChar.visuals?.hasVest)) {
        if (closestChar.vestHp === undefined) {
          closestChar.vestHp = 60;
          closestChar.vestMaxHp = 60;
        }

        if (closestChar.vestHp > 0) {
          vestAbsorbed = true;
          spawnBulletSparks(hitPtX, hitPtY, '#94a3b8', 7);

          if (closestChar.vestHp >= totalDamage) {
            // Kamizelka przyjmuje CAŁOŚĆ obrażeń na tors – HP posiadacza nienaruszone!
            closestChar.vestHp -= totalDamage;
            totalDamage = 0;
          } else {
            // Kamizelka pochłania ile ma, reszta przechodzi na HP posiadacza
            totalDamage -= closestChar.vestHp;
            closestChar.vestHp = 0;
          }

          if (closestChar.vestHp <= 0) {
            closestChar.vestHp = 0;
            closestChar.hasVest = false;
            if (closestChar.visuals) closestChar.visuals.hasVest = false;
            spawnVestShreds(hitPtX, hitPtY, b.vx, b.vy, closestChar.visuals?.vestColor || '#18181b');
            triggerScreenShake(2.5);
            if (typeof window !== 'undefined' && typeof window.syncArmorDevButtons === 'function') {
              window.syncArmorDevButtons();
            }
          }
        }
      }

      closestChar.hp = Math.max(0, (closestChar.hp !== undefined ? closestChar.hp : 100) - totalDamage);
      if (b.shooter && b.shooter !== closestChar) {
        closestChar.lastAttacker = b.shooter;
        closestChar.lastAttackerTimer = 240; // 4 sekundy aktywnego okna walki
      }

      // Synchronizacja zadanych obrażeń w grze sieciowej
      if (networkState && networkState.isConnected) {
        if (closestChar.isRemote) {
          sendDamageEvent({
            target: 'player',
            damage: b.damage,
            isHeadshot,
            isTorsoShot,
            hitX: hitPtX,
            hitY: hitPtY,
            relHitY: (typeof GROUND_Y === 'number') ? (GROUND_Y - hitPtY) : 0,
            weaponId: b.weaponId
          });
        } else if (closestChar.isBot && !networkState.isHost) {
          const activeBots = (typeof getActiveBots === 'function') ? getActiveBots() : [];
          const bIdx = activeBots.indexOf(closestChar);
          if (bIdx !== -1) {
            sendDamageEvent({
              target: 'bot',
              botIdx: bIdx,
              damage: b.damage,
              isHeadshot,
              isTorsoShot,
              hitX: hitPtX,
              hitY: hitPtY,
              relHitY: (typeof GROUND_Y === 'number') ? (GROUND_Y - hitPtY) : 0,
              weaponId: b.weaponId
            });
          }
        }
      }

      const isShotgun = (b.weaponId === 'SHOTGUN');

      // Odrzut kinetyczny celu
      if (!closestChar.isDead && closestChar.hp > 0) {
        const pushFactor = b.bodyPush || (isShotgun ? 0.095 : 0.032);
        closestChar.vx += b.vx * pushFactor;
        if (isShotgun) {
          closestChar.vy = Math.min(closestChar.vy, closestChar.vy * 0.8 - 0.85);
          triggerScreenShake(1.6);
        }
      }

      if (isHeadshot) {
        if (!helmetAbsorbed) {
          spawnBulletSparks(hitPtX, hitPtY, '#ef4444', 8);
          spawnBloodSpurt(hitPtX, hitPtY, b.vx * 0.55, b.vy * 0.55, 12, 1.4);
        }
        triggerScreenShake(isShotgun ? 4.5 : 2.2);
      } else {
        if (!vestAbsorbed) {
          spawnBulletSparks(hitPtX, hitPtY, '#ef4444', 4);
          spawnBloodSpurt(hitPtX, hitPtY, b.vx * 0.35, b.vy * 0.35, 5, 0.8);
        }
        if (isShotgun) triggerScreenShake(2.0);
      }

      // =====================================================================
      // OBSŁUGA ZGONU: REALISTYCZNY IMPULS RAGDOLLA I ROZRYWANIE KOŃCZYN
      // =====================================================================
      if (closestChar.hp <= 0 && !closestChar.isDead && !closestChar.isAcidDying && (!closestChar.acidDeath || !closestChar.acidDeath.active)) {
        closestChar.isDead = true;
        closestChar.killer = (b.shooter && b.shooter !== closestChar) ? b.shooter : closestChar.lastAttacker;
        closestChar.respawnTimer = 180;
        closestChar.corpseAngle = 0;
        closestChar.corpseRotVel = 0;
        closestChar.torsoTiltVel = 0;
        closestChar.headBobVel = 0;
        closestChar.rotSpeed = 0;
        closestChar.spin = 0;
        closestChar.kickMode = 'GROUND';
        closestChar.kickState = 'IDLE';
        closestChar.bicycleTimer = 0;
        closestChar.spinVolleyTimer = 0;
        closestChar.scissorTimer = 0;
        closestChar.corpseFloorY = groundY;
        closestChar.isGibbed = false;

        // Inicjalizacja stanu uszkodzeń kończyn
        closestChar.dismembered = {
          armFront: false,
          armBack: false,
          legFront: false,
          legBack: false
        };

        closestChar.deathHitPoint = { x: hitPtX, y: hitPtY };
        closestChar.bleedTimer = 90;
        spawnBloodSpurt(hitPtX, hitPtY, b.vx * 0.45, -2.2, isHeadshot ? 24 : 16, 1.3);
        spawnBloodDrip(hitPtX, hitPtY, b.vx * 0.25 + (Math.random() - 0.5) * 1.5, -1.0, 6);

        // Realistyczny impuls kinetyczny trafienia – bez nienaturalnego katapultowania w górę
        const pushMult = Math.min(2.0, b.ragdollPushMult || (isShotgun ? 1.8 : 0.85));
        const clampedVx = Math.max(-13, Math.min(13, b.vx * 0.35 * pushMult));
        const liftBonus = isShotgun ? -0.8 : 0;

        if (isLegshot) {
          closestChar.deathImpulse = {
            vx: clampedVx + (Math.random() - 0.5) * 1.0,
            vy: -0.6 + liftBonus * 0.5
          };
        } else if (isHeadshot) {
          closestChar.deathImpulse = {
            vx: clampedVx * 1.05 + (Math.random() - 0.5) * 1.0,
            vy: -1.2 + liftBonus
          };
        } else {
          closestChar.deathImpulse = {
            vx: clampedVx + (Math.random() - 0.5) * 1.0,
            vy: -0.8 + liftBonus
          };
        }

        // Reset ragdolla wymusza świeżą inicjalizację z aktualnej pozycji
        closestChar.ragdoll = null;

        const shotDist = Math.hypot(hitPtX - (b.originX || hitPtX), hitPtY - (b.originY || hitPtY));
        const isCloseShotgun = (isShotgun && shotDist < 170);
        const isSniper = (b.weaponId === 'SNIPER' || b.isSniper);

        // Wyrzucenie trzymanej broni
        if (closestChar.currentWeapon) {
          const dropMult = isShotgun ? 0.35 : (isSniper ? 0.38 : 0.22);
          spawnDroppedWeapon(
            closestChar.x + closestChar.w / 2,
            closestChar.y + 28,
            b.vx * dropMult,
            -3.8 + (isShotgun ? -1.5 : (isSniper ? -2.0 : 0)),
            closestChar.currentWeapon,
            closestChar.facing
          );
        }

        if (isHeadshot && (isCloseShotgun || isSniper)) {
          // 1. Dekapitacja (bliski strzał w głowę ze strzelby LUB snajperka Barrett .50)
          closestChar.hasHead = false;
          closestChar.decapitated = true;
          closestChar.severedHead = null;
          closestChar.neckFountainTimer = 55;

          triggerHitstop(6);
          triggerScreenShake(isSniper ? 20 : 18);

          spawnHeadGib(
            closestChar.x + closestChar.w / 2,
            closestChar.y - 8,
            b.vx * 0.65,
            -6.5,
            closestChar.facing,
            closestChar.currentClass?.visuals
          );

          spawnBloodSpurt(hitPtX, hitPtY, b.vx, -2.5, 25, 1.4);
          spawnBloodFountain(closestChar.x + closestChar.w / 2, closestChar.y + 14, closestChar.facing, 6);
        } else if (isCloseShotgun) {
          // 2. ODERWANIE KOŃCZYNY ZE STRZELBY Z BLISKA!
          closestChar.hasHead = true;
          closestChar.decapitated = false;
          closestChar.severedHead = null;
          closestChar.neckFountainTimer = 0;

          triggerHitstop(5);
          triggerScreenShake(16);

          if (isLegshot) {
            // Oderwanie przedniej nogi
            closestChar.dismembered.legFront = true;
            bodyGibs.push({
              type: 'leg',
              x: hitPtX,
              y: hitPtY,
              vx: b.vx * 0.40 + (Math.random() - 0.5) * 2.0,
              vy: -4.5 - Math.random() * 2.0,
              rot: Math.random() * Math.PI * 2,
              vRot: (Math.random() - 0.5) * 0.4,
              facing: closestChar.facing,
              visuals: closestChar.currentClass?.visuals || {},
              groundBounces: 0,
              life: 360
            });
            spawnBloodFountain(closestChar.x + closestChar.w / 2, closestChar.y + 45, closestChar.facing, 5);
          } else {
            // Oderwanie przedniej ręki
            closestChar.dismembered.armFront = true;
            bodyGibs.push({
              type: 'arm',
              x: hitPtX,
              y: hitPtY,
              vx: b.vx * 0.45 + (Math.random() - 0.5) * 2.5,
              vy: -5.0 - Math.random() * 2.0,
              rot: Math.random() * Math.PI * 2,
              vRot: (Math.random() - 0.5) * 0.45,
              facing: closestChar.facing,
              visuals: closestChar.currentClass?.visuals || {},
              groundBounces: 0,
              life: 360
            });
            spawnBloodFountain(closestChar.x + closestChar.w / 2, closestChar.y + 16, closestChar.facing, 5);
          }

          spawnBloodSpurt(hitPtX, hitPtY, b.vx * 0.7, -2.0, 24, 1.4);
        } else if (isHeadshot) {
          // Headshot z AK-47 – głowa zostaje na ciele
          closestChar.hasHead = true;
          closestChar.decapitated = false;
          closestChar.severedHead = null;
          closestChar.neckFountainTimer = 0;

          triggerHitstop(4);
          triggerScreenShake(10);
          spawnBloodSpurt(hitPtX, hitPtY, b.vx * 0.65, -2.2, 18, 1.3);
        } else {
          // Trafienie z dystansu lub z AK-47 w korpus/nogi – ciało w całości
          closestChar.hasHead = true;
          closestChar.decapitated = false;
          closestChar.severedHead = null;
          closestChar.neckFountainTimer = 0;

          triggerHitstop(2);
          triggerScreenShake(isLegshot ? 4 : 6);
          spawnBloodSpurt(hitPtX, hitPtY, b.vx * 0.35, -1.0, 8, 0.8);
        }
      }

      bullets.splice(i, 1);
      hitChar = true;
      continue;
    }
    if (hitChar) continue;

    if (mapHit) {
      spawnHitSparks(mapHit.x, mapHit.y, mapHit.nx, mapHit.ny, 4);
      bullets.splice(i, 1);
      continue;
    }
  }
}

