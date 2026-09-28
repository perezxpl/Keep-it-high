// =========================================================================
// WEAPONS.JS - SYSTEM BRONI, BALISTYKI I POCISKÓW W STYLU SOLDAT
// =========================================================================

import { triggerScreenShake, GROUND_Y } from './world.js';
import { checkRayObstacleCollision, obstacles } from './obstacles.js';

export const WEAPONS = {
  AK47: {
    id: 'AK47',
    name: 'AK-47',
    auto: true,           // Ciągły ogień przy trzymaniu LPM
    fireRate: 6,          // Strzał co 6 klatek (~10 strzałów/sek przy 60 FPS)
    damage: 13,
    bulletSpeed: 25,
    spread: 0.04,         // Rozrzut w radianach
    recoil: 0.65,         // Odrzut strzelca
    ballPush: 0.18,       // Mnożnik energii kinetycznej przekazywanej piłce
    pellets: 1,           // 1 pocisk na wystrzał
    bulletColor: '#facc15'
  },
  SHOTGUN: {
    id: 'SHOTGUN',
    name: 'SHOTGUN',
    auto: false,          // Tylko pojedyncze strzały (semi-auto: wymaga puszczenia LPM)
    fireRate: 35,         // Minimalny odstęp między strzałami
    damage: 9,            // Obrażenia na pojedynczy śrut
    bulletSpeed: 21,
    spread: 0.16,         // Szeroki kąt stożka śrutu
    recoil: 2.4,          // Potężny odrzut cofający postać
    ballPush: 0.38,       // Silne pchnięcie piłki
    pellets: 6,           // 6 śrutów na jeden wystrzał
    bulletColor: '#fb923c'
  }
};

export const bullets = [];
export const bulletParticles = [];

export function spawnBulletSparks(x, y, color = '#facc15', count = 4) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = Math.random() * 3.5 + 1.0;
    bulletParticles.push({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 1.0,
      size: Math.random() * 2 + 1.2,
      color,
      life: 1.0
    });
  }
}

export function spawnHitSparks(x, y, nx = 0, ny = -1, count = 4) {
  const baseAngle = Math.atan2(ny, nx);
  for (let i = 0; i < count; i++) {
    const spread = (Math.random() - 0.5) * (Math.PI * 0.7);
    const angle = baseAngle + spread;
    const speed = Math.random() * 4.0 + 1.5;
    bulletParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 2.2 + 1.2,
      color: Math.random() < 0.6 ? '#facc15' : '#fb923c',
      life: 0.8 + Math.random() * 0.4
    });
  }
}

/**
 * Obliczenie pozycji barku strzelca
 */
export function getShooterShoulderPos(shooter) {
  const charFacing = shooter.facing || 1;
  const hipX = shooter.x + shooter.w / 2;
  const hipY = shooter.y + shooter.h - 40 + (shooter.pelvisY || 0);
  const torsoTilt = shooter.pose?.torsoTilt || shooter.torsoTilt || 0;
  const shoulderX = hipX + (20 * Math.sin(torsoTilt));
  const shoulderY = hipY - (20 * Math.cos(torsoTilt));
  return { shoulderX, shoulderY, hipX, hipY, charFacing };
}

function lerpAngle(a, b, t) {
  let diff = (b - a) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return a + diff * t;
}

/**
 * Obliczenie transformacji trzymania broni:
 * - STAN 1: Luźne celowanie (Low-Ready / Idle Aiming)
 *   Płynnie śledzi celownik myszy, obrót niżej u biodra/klatki: hipX + 8 * facing, hipY - 14 + headBob * 0.4
 * - STAN 2: Prowadzenie ognia (Shoulder-Braced / Combat Stance)
 *   Dociśnięcie do barku (shoulderX, shoulderY)
 * - Płynne przejście z lerp 0.25 i odrzut (kickback)
 */
export function getWeaponHoldTransform(p) {
  const charFacing = p.facing || 1;
  const hipX = p.x + p.w / 2;
  const hipY = p.y + p.h - 40 + (p.pelvisY || 0);
  const torsoTilt = p.pose?.torsoTilt || p.torsoTilt || 0;

  // Bark strzelca
  const shoulderX = hipX + (20 * Math.sin(torsoTilt));
  const shoulderY = hipY - (20 * Math.cos(torsoTilt));

  // Punkt celowania
  const aimX = (typeof p.aimX === 'number' && !isNaN(p.aimX)) ? p.aimX : (shoulderX + charFacing * 100);
  const aimY = (typeof p.aimY === 'number' && !isNaN(p.aimY)) ? p.aimY : shoulderY;

  // STAN 1: Luźne celowanie (Low-Ready / Idle Aiming)
  const headBobOffset = (p.headBob || 0) * 0.4;
  const loosePivotX = hipX + 8 * charFacing;
  const loosePivotY = hipY - 14 + headBobOffset;
  const looseAimAngle = Math.atan2(aimY - loosePivotY, (aimX - loosePivotX) * charFacing);

  // STAN 2: Prowadzenie ognia (Shoulder-Braced / Combat Stance)
  const shoulderAimAngle = Math.atan2(aimY - shoulderY, (aimX - shoulderX) * charFacing);

  // Płynna interpolacja pozycji i kąta montażu broni (Pose Blending)
  const w = (typeof p.shootPoseWeight === 'number') ? p.shootPoseWeight : 0.0;
  const gunPivotX = loosePivotX + (shoulderX - loosePivotX) * w;
  const gunPivotY = loosePivotY + (shoulderY - loosePivotY) * w;
  const currentAimAngle = lerpAngle(looseAimAngle, shoulderAimAngle, w);

  // Odrzut (Kickback): przesunięcie modelu broni o 2.5–4.5 px wzdłuż osi strzału w tył (ku barkowi)
  const kickback = p.weaponKickback || 0;
  const effectivePivotX = gunPivotX - Math.cos(currentAimAngle) * kickback * charFacing;
  const effectivePivotY = gunPivotY - Math.sin(currentAimAngle) * kickback;

  return {
    pivotX: effectivePivotX,
    pivotY: effectivePivotY,
    gunPivotX,
    gunPivotY,
    angle: currentAimAngle,
    shoulderX,
    shoulderY,
    aimAngle: currentAimAngle,
    charFacing,
    loosePivotX,
    loosePivotY,
    looseAngle: looseAimAngle,
    aimX,
    aimY,
    weight: w,
    kickback
  };
}

/**
 * Obliczenie precyzyjnego punktu wylotu lufy (Muzzle) na bazie aktualnej pozycji i kąta
 */
export function getMuzzlePosition(shooter, weapon) {
  const hold = getWeaponHoldTransform(shooter);
  const barrelLen = weapon && weapon.id === 'SHOTGUN' ? 28 : 34;
  const muzzleX = hold.pivotX + Math.cos(hold.angle) * barrelLen * hold.charFacing;
  const muzzleY = hold.pivotY + Math.sin(hold.angle) * barrelLen;

  return {
    muzzleX,
    muzzleY,
    shoulderX: hold.shoulderX,
    shoulderY: hold.shoulderY,
    aimAngle: hold.angle,
    charFacing: hold.charFacing,
    barrelLen,
    aimX: hold.aimX,
    aimY: hold.aimY,
    gunPivotX: hold.pivotX,
    gunPivotY: hold.pivotY
  };
}

/**
 * Wystrzał z broni przez strzelca (gracza lub bota) z punktu wylotu lufy
 */
export function shootWeapon(shooter, weapon) {
  if (!shooter || !weapon || shooter.isDead) return;
  if (shooter.shootCooldown > 0) return;

  // Aktywacja STAN 2 (Shoulder-Braced) i odrzutu (Kickback)
  if (weapon.id === 'SHOTGUN') {
    shooter.shootPoseTimer = 8; // Przez 8 klatek po wystrzale ze strzelby
    shooter.weaponKickback = 4.5;
  } else {
    shooter.shootPoseTimer = weapon.fireRate + 2;
    shooter.weaponKickback = 2.8;
  }
  shooter.shootPoseWeight = 1.0;

  const { muzzleX, muzzleY, shoulderX, shoulderY, aimAngle, charFacing, aimX, aimY } = getMuzzlePosition(shooter, weapon);
  const effectiveGroundY = (typeof shooter.groundY === 'number' && shooter.groundY > 0)
    ? shooter.groundY
    : (typeof GROUND_Y === 'number' && GROUND_Y > 0 ? GROUND_Y : 500);

  // Zabezpieczenie przed strzelaniem przez ścianę (Wall-Clipping Check)
  const wallHit = checkRayObstacleCollision(shoulderX, shoulderY, muzzleX, muzzleY, effectiveGroundY, obstacles);
  if (wallHit) {
    spawnHitSparks(wallHit.x, wallHit.y, wallHit.nx, wallHit.ny, 5);
    shooter.shootCooldown = weapon.fireRate;
    shooter.muzzleFlashTimer = 2;
    shooter.vx -= Math.cos(aimAngle) * weapon.recoil * 0.8 * charFacing;
    if (weapon.recoil > 1.2) triggerScreenShake(2.5);
    return;
  }

  const theta = Math.atan2(aimY - muzzleY, aimX - muzzleX);

  for (let i = 0; i < weapon.pellets; i++) {
    const dev = (Math.random() * 2 - 1) * weapon.spread;
    const angle = theta + dev;
    const speed = weapon.bulletSpeed * (0.95 + Math.random() * 0.1);
    bullets.push({
      x: muzzleX,
      y: muzzleY,
      prevX: muzzleX,
      prevY: muzzleY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: weapon.damage,
      ballPush: weapon.ballPush,
      color: weapon.bulletColor,
      shooter: shooter,
      life: 75
    });
  }

  // Odrzut strzelca (recoil)
  shooter.vx -= Math.cos(theta) * weapon.recoil * 0.8;
  if (Math.abs(Math.sin(theta)) > 0.35 && shooter.isJumping) {
    shooter.vy -= Math.sin(theta) * weapon.recoil * 0.5;
  }

  // Cooldown i rozbłysk wylotowy na 2 klatki
  shooter.shootCooldown = weapon.fireRate;
  shooter.muzzleFlashTimer = 2;

  // Wstrząs kamery
  if (weapon.recoil > 1.2) {
    triggerScreenShake(3.5);
  } else {
    triggerScreenShake(1.2);
  }

  spawnBulletSparks(muzzleX + Math.cos(theta) * 6, muzzleY + Math.sin(theta) * 6, weapon.bulletColor, 3);
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
 * Aktualizacja ruchu pocisków, grawitacji, kolizji z terenem, piłką i postaciami
 */
export function updateBullets(groundY, obstaclesList, ball, characters) {
  // Aktualizacja cząsteczek iskier
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

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.prevX = b.x;
    b.prevY = b.y;
    b.x += b.vx;
    b.y += b.vy;
    b.vy += 0.04; // Subtelna grawitacja pocisku
    b.life--;

    if (b.life <= 0) {
      bullets.splice(i, 1);
      continue;
    }

    // 1. Sprawdzenie kolizji z przeszkodami mapy (teren, bunkry, skały, kładki, barykady)
    const mapHit = checkRayObstacleCollision(b.prevX, b.prevY, b.x, b.y, groundY, obs);

    // Wyznacz zasięg trajektorii do ewentualnego punktu zderzenia ze ścianą
    const endX = mapHit ? mapHit.x : b.x;
    const endY = mapHit ? mapHit.y : b.y;
    const maxT = mapHit ? mapHit.t : 1.0;

    // 2. Interakcja z piłką (jeśli wystąpiła przed ścianą)
    let hitBall = false;
    if (ball) {
      const cR = ball.colRadius || 5.2;
      const distToBall = distPointToSegment(ball.x, ball.y, b.prevX, b.prevY, endX, endY);

      if (distToBall <= cR + 5) {
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

    // 3. Kolizja z postaciami (jeśli wystąpiła przed ścianą)
    let hitChar = false;
    let closestChar = null;
    let closestCharT = Infinity;

    for (const ch of charList) {
      if (!ch || ch === b.shooter || ch.isDead) continue;
      if (ch.isBot && !ch.active) continue;

      const hitW = ch.w || 24;
      const hitH = ch.h || 70;
      const charLeft = ch.x;
      const charRight = ch.x + hitW;
      const charTop = ch.y;
      const charBottom = ch.y + hitH;

      const charT = getSegmentAABBHitT(b.prevX, b.prevY, endX, endY, charLeft, charTop, charRight, charBottom);
      if (charT !== null && charT <= maxT && charT < closestCharT) {
        closestCharT = charT;
        closestChar = ch;
      }
    }

    if (closestChar) {
      const hitPtX = b.prevX + (b.x - b.prevX) * closestCharT;
      const hitPtY = b.prevY + (b.y - b.prevY) * closestCharT;

      closestChar.hp = Math.max(0, (closestChar.hp !== undefined ? closestChar.hp : 100) - b.damage);
      closestChar.vx += b.vx * 0.08;
      closestChar.vy -= 1.0;
      closestChar.isJumping = true;

      spawnBulletSparks(hitPtX, hitPtY, '#ef4444', 6);

      if (closestChar.hp <= 0 && !closestChar.isDead) {
        closestChar.isDead = true;
        closestChar.respawnTimer = 180;
      }

      bullets.splice(i, 1);
      hitChar = true;
      continue;
    }
    if (hitChar) continue;

    // 4. Jeśli pocisk uderzył w ścianę / teren
    if (mapHit) {
      spawnHitSparks(mapHit.x, mapHit.y, mapHit.nx, mapHit.ny, 4);
      bullets.splice(i, 1);
      continue;
    }
  }
}

/**
 * Renderowanie pocisków i rozbłysków
 */
export function drawBullets(ctx) {
  // Iskry
  for (const p of bulletParticles) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }

  // Pociski jako neonowe smugi świetlne
  ctx.save();
  for (const b of bullets) {
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 2.0;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(b.x - b.vx * 0.7, b.y - b.vy * 0.7);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(b.x - 1, b.y - 1, 2, 2);
  }
  ctx.restore();
}

/**
 * Renderowanie trzymanej broni w dłoniach postaci (AK-47 / Shotgun)
 */
export function drawHeldWeapon(ctx, p) {
  if (!p || !p.currentWeapon || p.isDead) return;

  const hold = getWeaponHoldTransform(p);
  const weapon = p.currentWeapon;

  ctx.save();
  ctx.translate(hold.pivotX, hold.pivotY);
  ctx.scale(hold.charFacing, 1);
  ctx.rotate(hold.angle);

  if (weapon.id === 'AK47') {
    // 1. Drewniana kolba (wyprofilowana kolba z tyłu -12px, brąz #78350f)
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(0, -1);
    ctx.lineTo(-12, 1.5);
    ctx.lineTo(-12, 6.5);
    ctx.lineTo(-6, 4.5);
    ctx.lineTo(0, 2.5);
    ctx.closePath();
    ctx.fill();

    // Stopka kolby (czarna stal)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-12.5, 1.5, 1.5, 5);

    // Chwyt pistoletowy
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(1, 2);
    ctx.lineTo(-1, 7);
    ctx.lineTo(2.2, 7.5);
    ctx.lineTo(4, 2);
    ctx.closePath();
    ctx.fill();

    // 2. Czarna komora zamkowa (Receiver: dł. 32 px, grubość 3.5 px)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, -2.5, 14, 4.5);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, -1.8, 14, 3.5);

    // 3. Bananowy zakrzywiony magazynek w dół (kolor stalowy #334155)
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(6.5, 2.0);
    ctx.quadraticCurveTo(8.5, 8.5, 13.5, 10.5);
    ctx.lineTo(11.2, 11.5);
    ctx.quadraticCurveTo(5.5, 9.5, 4.0, 2.0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // 4. Drewniane łoże (Handguard: #78350f)
    ctx.fillStyle = '#78350f';
    ctx.fillRect(14, -2.2, 8.5, 3.8);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(14, -2.2, 8.5, 1.0);

    // 5. Lufa stalowa i podstawa muszki (Barrel & muzzle: barrelLength = 34 px)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(22.5, -1.4, 11.5, 2.4);
    ctx.fillStyle = '#334155';
    ctx.fillRect(22.5, -2.2, 4, 1.2);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(29.5, -3.2, 1.5, 2.0);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(32.5, -1.6, 1.5, 2.8);

    // Muzzle flash
    if (p.muzzleFlashTimer > 0) {
      drawMuzzleFlash(ctx, 34, -0.2, 11, false);
    }
  } else if (weapon.id === 'SHOTGUN') {
    // 1. Kolba drewniana / polimerowa
    ctx.fillStyle = '#3f2712';
    ctx.beginPath();
    ctx.moveTo(0, -1);
    ctx.lineTo(-12, 1.8);
    ctx.lineTo(-12, 7.0);
    ctx.lineTo(-5, 4.8);
    ctx.lineTo(0, 3.0);
    ctx.closePath();
    ctx.fill();

    // Stopka
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-12.5, 1.8, 1.5, 5.2);

    // Chwyt
    ctx.fillStyle = '#3f2712';
    ctx.fillRect(0, 2.5, 3.2, 5);

    // 2. Komora zamkowa (dł. 11 px, grubość ~5 px)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, -2.6, 11, 5.4);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, -3.2, 11, 1.2);

    // 3. Masywna grubsza lufa i podlufowy magazynek rurowy (dł. 26 px, gr. 5 px, #1e293b)
    ctx.fillStyle = '#334155';
    ctx.fillRect(11, -2.4, 17, 3.0);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(11, 0.6, 14, 2.4);

    // 4. Czółenko (Pump forend: #3f2712 / #0f172a)
    ctx.fillStyle = '#3f2712';
    ctx.fillRect(13, 0.0, 7.5, 3.5);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.7;
    ctx.strokeRect(13, 0.0, 7.5, 3.5);

    // Wylot lufy (muzzle = 28 px)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(26.5, -2.6, 1.5, 3.4);

    // Muzzle flash
    if (p.muzzleFlashTimer > 0) {
      drawMuzzleFlash(ctx, 28, -0.9, 15, true);
    }
  }

  ctx.restore();
}

function drawMuzzleFlash(ctx, mx, my, size, isShotgun) {
  ctx.save();
  ctx.translate(mx, my);

  ctx.fillStyle = '#f97316';
  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.35);
  ctx.lineTo(size * 0.9, -size * 0.15);
  ctx.lineTo(size * 1.3, 0);
  ctx.lineTo(size * 0.9, size * 0.15);
  ctx.lineTo(0, size * 0.35);
  ctx.lineTo(size * 0.25, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.5);
  ctx.lineTo(size * 0.7, 0);
  ctx.lineTo(0, size * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(2, 0, size * 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
