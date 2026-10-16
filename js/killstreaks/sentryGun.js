// =============================================================================
// JS/KILLSTREAKS/SENTRYGUN.JS - WIEŻYCZKA STRAŻNICZA (SENTRY GUN)
// Moduł automatycznego działka obrotowego na statywie taktycznym (7-killstreak)
// Styl: Modern Military (ZERO EMOJIS, taktyczne lasery, balistyka, pancerz kompozytowy)
// =============================================================================

import { triggerScreenShake } from '../camera.js';
import { GROUND_Y, spawnGroundPuff, spawnJetpackSparks } from '../world/state.js';
import { ARENA_PLATFORMS, getActiveArena, activeArenaId, getPlatformSurfaceY } from '../obstacles.js';
import { detonateGrenadeExplosion } from '../projectiles.js';
import { bullets } from '../weapons/transform.js';
import { triggerCombatFeedBanner } from '../ui/combatFeed.js';
import { getCarePackageSurfaceY } from './carePackage.js';
import { killstreakState } from './state.js';

export const activeSentryGuns = [];

/**
 * Płynna interpolacja kątowa z obsługą zawijania wokół PI
 */
function lerpAngle(current, target, factor) {
  let diff = (target - current) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return current + diff * factor;
}

/**
 * Inicjalizacja / reset modułu wieżyczek
 */
export function initSentryGuns() {
  activeSentryGuns.length = 0;
}

/**
 * Rozstawia wieżyczkę strażniczą w wybranym punkcie X na podłożu lub platformie
 * @param {object} owner - podmiot rozstawiający (gracz lub bot)
 * @param {number} targetX - preferowana współrzędna X
 */
export function spawnSentryGun(owner, targetX) {
  if (!owner) return null;

  const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
  const minX = (typeof curArena?.bounds?.minX === 'number') ? (curArena.bounds.minX + 60) : 100;
  const maxX = (typeof curArena?.bounds?.maxX === 'number') ? (curArena.bounds.maxX - 60) : ((typeof curArena?.width === 'number') ? (curArena.width - 60) : 2800);
  const safeX = Math.max(minX, Math.min(maxX, (typeof targetX === 'number' && !isNaN(targetX)) ? targetX : owner.x));
  const surfaceY = getCarePackageSurfaceY(safeX);

  const facing = owner.facing || 1;
  const initialYaw = facing > 0 ? 0 : Math.PI;

  const sentry = {
    id: `sentry_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    owner,
    team: owner.team || null,
    x: safeX,
    y: surfaceY,
    w: 32,
    h: 30,
    facing,
    yaw: initialYaw,
    targetYaw: initialYaw,
    hp: 120,
    maxHp: 120,
    life: 30.0,
    totalLife: 30.0,
    state: 'DEPLOYING', // 'DEPLOYING', 'ACTIVE', 'DESTROYED'
    deployTimer: 0.75,
    fireCooldown: 0.25,
    burstCount: 0,
    burstMax: 4,
    burstInterval: 0.08,
    burstCooldown: 0.58,
    lockedTarget: null,
    laserScanTimer: 0,
    muzzleFlashTimer: 0,
    gunRecoil: 0,
    shells: [],
    deathTimer: 0
  };

  activeSentryGuns.push(sentry);

  spawnGroundPuff(safeX, surfaceY);
  triggerScreenShake(1.6);

  if (!owner.isBot && !owner.isRemote) {
    triggerCombatFeedBanner('KILL', '[SENTRY] WIEŻYCZKA STRAŻNICZA ROZSTAWIONA - SEKTOR ZABEZPIECZONY');
  }

  return sentry;
}

/**
 * Aktualizacja logiki wieżyczek, celowania wielopodmiotowego, balistyki i zniszczeń
 * @param {number} dt
 * @param {Array} combatants
 */
export function updateSentryGuns(dt = (1 / 60), combatants = []) {
  const safeDt = (typeof dt === 'number' && dt > 0 && dt < 1) ? dt : (1 / 60);

  for (let i = activeSentryGuns.length - 1; i >= 0; i--) {
    const sentry = activeSentryGuns[i];

    // 1. Obsługa stanu zniszczenia i wygasania zgliszcz
    if (sentry.state === 'DESTROYED') {
      sentry.deathTimer -= safeDt;
      // Aktualizacja opadających łusek
      for (let sIdx = sentry.shells.length - 1; sIdx >= 0; sIdx--) {
        const s = sentry.shells[sIdx];
        s.x += s.vx * safeDt;
        s.y += s.vy * safeDt;
        s.vy += 450 * safeDt;
        s.rot += s.vRot * safeDt;
        s.life -= safeDt;
        if (s.life <= 0) sentry.shells.splice(sIdx, 1);
      }
      if (sentry.deathTimer <= 0 && sentry.shells.length === 0) {
        activeSentryGuns.splice(i, 1);
      }
      continue;
    }

    // 2. Faza rozstawiania statywu hydraulicznego
    if (sentry.state === 'DEPLOYING') {
      sentry.deployTimer -= safeDt;
      if (sentry.deployTimer <= 0) {
        sentry.state = 'ACTIVE';
        spawnGroundPuff(sentry.x, sentry.y);
        if (sentry.owner && !sentry.owner.isBot && !sentry.owner.isRemote) {
          triggerCombatFeedBanner('KILL', '[SENTRY] WIEŻYCZKA STRAŻNICZA ONLINE - OBRONA AKTYWNA');
        }
      }
      continue;
    }

    // 3. Faza aktywna bojowo
    sentry.life -= safeDt;
    if (sentry.life <= 0) {
      // Wygaśnięcie czasu misji (złożenie i wyłączenie)
      sentry.state = 'DESTROYED';
      sentry.deathTimer = 1.8;
      spawnJetpackSparks(sentry.x, sentry.y - 15, 1, 12, ['#94a3b8', '#64748b', '#00e5ff'], 0, -2);
      if (sentry.owner && !sentry.owner.isBot && !sentry.owner.isRemote) {
        triggerCombatFeedBanner('KILL', '[SENTRY] WIEŻYCZKA STRAŻNICZA - MISJA ZAKOŃCZONA (30S)');
      }
      continue;
    }

    if (sentry.gunRecoil > 0) sentry.gunRecoil = Math.max(0, sentry.gunRecoil - safeDt * 22);
    if (sentry.muzzleFlashTimer > 0) sentry.muzzleFlashTimer -= safeDt;

    // Aktualizacja wyrzuconych mosiężnych łusek
    for (let sIdx = sentry.shells.length - 1; sIdx >= 0; sIdx--) {
      const s = sentry.shells[sIdx];
      s.x += s.vx * safeDt;
      s.y += s.vy * safeDt;
      s.vy += 450 * safeDt;
      s.rot += s.vRot * safeDt;
      s.life -= safeDt;
      if (s.life <= 0) sentry.shells.splice(sIdx, 1);
    }

    // Kolizje pocisków wroga z pancerzem wieżyczki
    const pivotX = sentry.x;
    const pivotY = sentry.y - 18;
    const hitBox = { x: sentry.x - 14, y: sentry.y - 30, w: 28, h: 30 };

    if (Array.isArray(bullets)) {
      for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
        const b = bullets[bIdx];
        if (!b || b.life <= 0) continue;
        if (b.shooter === sentry.owner) continue;
        if (sentry.team && b.shooter?.team && b.shooter.team === sentry.team) continue;

        if (b.x >= hitBox.x && b.x <= hitBox.x + hitBox.w && b.y >= hitBox.y && b.y <= hitBox.y + hitBox.h) {
          sentry.hp -= (b.damage || 12);
          b.life = 0;
          bullets.splice(bIdx, 1);
          spawnJetpackSparks(b.x, b.y, 1, 6, ['#fbbf24', '#ffffff', '#f97316'], 0, -1.8);
          triggerScreenShake(1.2);
          if (sentry.hp <= 0) break;
        }
      }
    }

    // Detonacja zniszczonej wieżyczki
    if (sentry.hp <= 0) {
      sentry.hp = 0;
      sentry.state = 'DESTROYED';
      sentry.deathTimer = 2.4;
      triggerScreenShake(3.8);
      spawnGroundPuff(sentry.x, sentry.y);
      spawnJetpackSparks(sentry.x, sentry.y - 15, 1, 24, ['#ef4444', '#f97316', '#fbbf24', '#ffffff'], 0, -3.5);
      detonateGrenadeExplosion(
        sentry.x,
        sentry.y - 14,
        55,
        sentry.owner,
        sentry.y,
        ARENA_PLATFORMS,
        null,
        combatants,
        null
      );
      if (sentry.owner && !sentry.owner.isBot && !sentry.owner.isRemote) {
        triggerCombatFeedBanner('DEATH', '[SENTRY] WIEŻYCZKA STRAŻNICZA ZNISZCZONA PRZEZ WROGA');
      }
      continue;
    }

    // 4. Wyszukiwanie wrogów w zasięgu wzroku (560px)
    let nearestEnemy = null;
    let nearestDist = 560;
    const targets = Array.isArray(combatants) ? combatants : [];

    for (const c of targets) {
      if (!c || c === sentry.owner || c.isDead || c.active === false) continue;
      if (sentry.team && c.team && sentry.team === c.team) continue;

      const tx = c.x + c.w / 2;
      const ty = c.y + c.h * 0.45;
      const dist = Math.hypot(tx - pivotX, ty - pivotY);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = c;
      }
    }

    sentry.lockedTarget = nearestEnemy;
    sentry.laserScanTimer += safeDt;

    // 5. Celowanie i ogień zaporowy
    if (nearestEnemy) {
      const tx = nearestEnemy.x + nearestEnemy.w / 2;
      const ty = nearestEnemy.y + nearestEnemy.h * 0.45;
      const aimAngle = Math.atan2(ty - pivotY, tx - pivotX);
      sentry.targetYaw = aimAngle;
      sentry.yaw = lerpAngle(sentry.yaw, sentry.targetYaw, 0.22);

      let angleDiff = (sentry.targetYaw - sentry.yaw) % (Math.PI * 2);
      if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      const isAimed = Math.abs(angleDiff) < 0.28;

      if (sentry.fireCooldown > 0) {
        sentry.fireCooldown -= safeDt;
      } else if (isAimed) {
        sentry.burstCount++;
        sentry.muzzleFlashTimer = 0.08;
        sentry.gunRecoil = 4.8;

        const aimCos = Math.cos(sentry.yaw);
        const aimSin = Math.sin(sentry.yaw);
        const barrelLen = 17;
        const muzzleX = pivotX + aimCos * barrelLen;
        const muzzleY = pivotY + aimSin * barrelLen;
        const spd = 28;

        // Wyrzut łuski nabojowej w górę i w bok
        if (sentry.shells.length < 18) {
          sentry.shells.push({
            x: pivotX - aimCos * 4,
            y: pivotY - 2,
            vx: -aimCos * 35 + (Math.random() - 0.5) * 15,
            vy: -55 - Math.random() * 30,
            rot: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 20,
            life: 0.8,
            maxLife: 0.8
          });
        }

        // Pocisk smugowy
        if (Array.isArray(bullets)) {
          bullets.push({
            x: muzzleX,
            y: muzzleY,
            prevX: muzzleX,
            prevY: muzzleY,
            originX: muzzleX,
            originY: muzzleY,
            weaponId: 'SENTRY_MINIGUN',
            vx: aimCos * spd,
            vy: aimSin * spd,
            damage: 10,
            ballPush: 0.16,
            bodyPush: 0.05,
            ragdollPushMult: 1.15,
            color: (sentry.owner?.isBot) ? '#f43f5e' : '#00e5ff',
            shooter: sentry.owner,
            life: 60,
            isSniper: false
          });
        }

        if (sentry.burstCount >= sentry.burstMax) {
          sentry.burstCount = 0;
          sentry.fireCooldown = sentry.burstCooldown;
        } else {
          sentry.fireCooldown = sentry.burstInterval;
        }
      }
    } else {
      // Tryb patrolowy: płynne skanowanie sektora
      const baseAngle = sentry.facing > 0 ? 0 : Math.PI;
      const sweepAngle = Math.sin(sentry.laserScanTimer * 2.2) * 0.85;
      sentry.targetYaw = baseAngle + sweepAngle;
      sentry.yaw = lerpAngle(sentry.yaw, sentry.targetYaw, 0.08);
      sentry.burstCount = 0;
      if (sentry.fireCooldown > 0) sentry.fireCooldown -= safeDt;
    }
  }
}

/**
 * Renderowanie wieżyczki strażniczej, statywu, pancerza mantlet, laserów i interfejsu
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} camera
 */
export function drawSentryGuns(ctx, camera) {
  if (activeSentryGuns.length === 0) return;

  ctx.save();

  for (const sentry of activeSentryGuns) {
    const sx = sentry.x;
    const sy = sentry.y;
    const pivotX = sx;
    const pivotY = sy - 18;
    const deployProg = (sentry.state === 'DEPLOYING')
      ? Math.max(0.1, 1 - (sentry.deployTimer / 0.75))
      : 1.0;

    // 1. ŁUSKI NABOJOWE NA ZIEMI
    if (sentry.shells && sentry.shells.length > 0) {
      for (const s of sentry.shells) {
        const alpha = Math.max(0, s.life / s.maxLife);
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-2, -0.9, 4, 1.8);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-2, -0.9, 0.8, 1.8);
        ctx.restore();
      }
    }

    // 2. CELOWNIK LASEROWY I RAMKA NAMIERZANIA
    if (sentry.state === 'ACTIVE') {
      const aimCos = Math.cos(sentry.yaw);
      const aimSin = Math.sin(sentry.yaw);
      const muzzleX = pivotX + aimCos * 17;
      const muzzleY = pivotY + aimSin * 17;

      if (sentry.lockedTarget) {
        const target = sentry.lockedTarget;
        const tx = target.x + target.w / 2;
        const ty = target.y + target.h * 0.45;
        const laserColor = sentry.owner?.isBot ? 'rgba(244, 63, 94, 0.3)' : 'rgba(0, 229, 255, 0.3)';
        const coreColor = sentry.owner?.isBot ? '#f43f5e' : '#ffffff';

        // Szeroka poświata lasera
        ctx.strokeStyle = laserColor;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(muzzleX, muzzleY);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Ostra linia rdzenia
        ctx.strokeStyle = coreColor;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(muzzleX, muzzleY);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Punkt skupienia lasera
        ctx.fillStyle = sentry.owner?.isBot ? '#f43f5e' : '#00e5ff';
        ctx.beginPath();
        ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Ramka namierzania [SENTRY // ACQUIRED]
        const bx = target.x - 4;
        const by = target.y - 4;
        const bw = target.w + 8;
        const bh = target.h + 8;
        const bracketLen = 6;

        ctx.strokeStyle = sentry.owner?.isBot ? '#f43f5e' : '#00e5ff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(bx, by + bracketLen); ctx.lineTo(bx, by); ctx.lineTo(bx + bracketLen, by);
        ctx.moveTo(bx + bw - bracketLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + bracketLen);
        ctx.moveTo(bx, by + bh - bracketLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bracketLen, by + bh);
        ctx.moveTo(bx + bw - bracketLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - bracketLen);
        ctx.stroke();

        ctx.font = '700 8px monospace';
        ctx.fillStyle = sentry.owner?.isBot ? '#f43f5e' : '#00e5ff';
        ctx.fillText('[SENTRY // LOCK]', bx, by - 3);
      } else {
        // Tryb skanowania LIDAR
        const scanDist = 85;
        const scanEndX = muzzleX + aimCos * scanDist;
        const scanEndY = muzzleY + aimSin * scanDist;

        const scanGrad = ctx.createLinearGradient(muzzleX, muzzleY, scanEndX, scanEndY);
        scanGrad.addColorStop(0, sentry.owner?.isBot ? 'rgba(244, 63, 94, 0.6)' : 'rgba(0, 229, 255, 0.6)');
        scanGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');

        ctx.strokeStyle = scanGrad;
        ctx.lineWidth = 1.0;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(muzzleX, muzzleY);
        ctx.lineTo(scanEndX, scanEndY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 3. PODSTAWA STATYWU (TRIPOD BASE)
    const legSpread = 16 * deployProg;
    const legHeight = 12 * deployProg;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    // Lewa noga
    ctx.moveTo(sx, sy - legHeight); ctx.lineTo(sx - legSpread, sy);
    // Prawa noga
    ctx.moveTo(sx, sy - legHeight); ctx.lineTo(sx + legSpread, sy);
    // Środkowa noga
    ctx.moveTo(sx, sy - legHeight); ctx.lineTo(sx, sy);
    ctx.stroke();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sx, sy - legHeight); ctx.lineTo(sx - legSpread, sy);
    ctx.moveTo(sx, sy - legHeight); ctx.lineTo(sx + legSpread, sy);
    ctx.moveTo(sx, sy - legHeight); ctx.lineTo(sx, sy);
    ctx.stroke();

    // Stopki statywu zakotwiczone w podłożu
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(sx - legSpread - 3, sy - 2, 6, 2.5);
    ctx.fillRect(sx + legSpread - 3, sy - 2, 6, 2.5);
    ctx.fillRect(sx - 2, sy - 2, 4, 2.5);

    // Kolumna pionowa hydrauliczna
    ctx.fillStyle = '#334155';
    ctx.fillRect(sx - 3, sy - 18 * deployProg, 6, 12 * deployProg);

    // Magazynek bębnowy na amunicję pod wieżyczką
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(sx - 7, sy - 14 * deployProg, 14, 8, 2) : ctx.rect(sx - 7, sy - 14 * deployProg, 14, 8);
    ctx.fill();
    ctx.stroke();

    // 4. OBROTOWA GŁOWICA WIEŻYCZKI I PANCERZ MANTLET
    if (sentry.state !== 'DESTROYED') {
      ctx.save();
      ctx.translate(pivotX, pivotY);
      ctx.rotate(sentry.yaw);

      // A. Płyta pancerna mantletu (odporna na ogień z przodu)
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-6, -9);
      ctx.lineTo(8, -8);
      ctx.lineTo(6, 8);
      ctx.lineTo(-6, 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // B. Korpus mechanizmu ryglowego
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-8, -5, 12, 10);

      // C. Podwójna lufa działka z odrzutem
      const barrelLen = Math.max(6, 17 - (sentry.gunRecoil || 0));
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.0;

      // Górna lufa
      ctx.beginPath();
      ctx.moveTo(2, -2.5); ctx.lineTo(2 + barrelLen, -2.5);
      ctx.stroke();

      // Dolna lufa
      ctx.beginPath();
      ctx.moveTo(2, 2.5); ctx.lineTo(2 + barrelLen, 2.5);
      ctx.stroke();

      // Hamulce wylotowe (muzzle brakes)
      ctx.fillStyle = '#334155';
      ctx.fillRect(2 + barrelLen - 3, -3.8, 3, 2.6);
      ctx.fillRect(2 + barrelLen - 3, 1.2, 3, 2.6);

      // D. Głowica optoelektroniczna FLIR na szczycie
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, -9, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // Źrenica sensora FLIR
      ctx.fillStyle = sentry.lockedTarget ? '#f43f5e' : '#10b981';
      ctx.beginPath();
      ctx.arc(1.2, -9, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // E. Błysk wylotowy przy wystrzale
      if (sentry.muzzleFlashTimer > 0) {
        const flashX = 2 + barrelLen + 2;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(flashX, 0);
        ctx.lineTo(flashX + 10, 0);
        ctx.lineTo(flashX + 2, -3);
        ctx.lineTo(flashX + 2, -8);
        ctx.lineTo(flashX + 2, -3);
        ctx.lineTo(flashX + 10, 0);
        ctx.lineTo(flashX + 2, 3);
        ctx.lineTo(flashX + 2, 8);
        ctx.lineTo(flashX + 2, 3);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = sentry.owner?.isBot ? 'rgba(244, 63, 94, 0.45)' : 'rgba(0, 229, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(flashX + 3, 0, 6.5, 0, Math.PI * 2);
        ctx.fill();

        // Przedmuchy gazu
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(flashX - 2, -2.5); ctx.lineTo(flashX - 5, -6);
        ctx.moveTo(flashX - 2, 2.5); ctx.lineTo(flashX - 5, 6);
        ctx.stroke();
      }

      ctx.restore();
    } else {
      // Zgliszcza zniszczonej wieżyczki
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sx - 8, sy - 14, 16, 8);
      // Dym ze zgliszcz
      ctx.fillStyle = 'rgba(100, 116, 139, 0.35)';
      ctx.beginPath();
      ctx.arc(sx + Math.sin(sentry.deathTimer * 5) * 4, sy - 20 - (2.4 - sentry.deathTimer) * 8, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. PASEK HP I IDENTYFIKATOR TAKTYCZNY
    if (sentry.state === 'ACTIVE') {
      const hudY = sy - 34;
      const barW = 26;
      const barH = 3.5;
      const hpPct = Math.max(0, sentry.hp / sentry.maxHp);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(sx - barW / 2 - 1, hudY - 1, barW + 2, barH + 2);

      let hpColor = '#22c55e';
      if (hpPct < 0.3) hpColor = '#ef4444';
      else if (hpPct < 0.6) hpColor = '#f59e0b';

      ctx.fillStyle = hpColor;
      ctx.fillRect(sx - barW / 2, hudY, barW * hpPct, barH);

      // Oznaczenie i czas pozostały
      ctx.font = '700 7px monospace';
      ctx.fillStyle = sentry.owner?.isBot ? '#f43f5e' : '#00e5ff';
      ctx.fillText('[SENTRY]', sx - 13, hudY - 3);
      const lifeSec = Math.ceil(sentry.life);
      ctx.fillText(`${lifeSec}S`, sx + 7, hudY - 3);
    }
  }

  ctx.restore();
}
