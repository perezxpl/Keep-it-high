// =============================================================================
// JS/KILLSTREAKS/DRONEMODEL.JS - WSPÓLNY MODEL DRONA TAKTYCZNEGO ORAZ SPRITE'ÓW
// Współdzielony przez drony bojowe, transport zrzutów i dostawę wieżyczki.
// =============================================================================

export const SENTRY_SHEET_URL = './assets/sentry_turret_sheet.png?v=v543_sentry_minigun_and_ship_drones';

export const SENTRY_SHEET_RECTS = {
  tripod: { x: 8, y: 22, w: 368, h: 482 },
  body: { x: 392, y: 54, w: 368, h: 276 },
  barrels: [
    { x: 776, y: 28, w: 368, h: 104 },
    { x: 776, y: 188, w: 368, h: 103 },
    { x: 776, y: 348, w: 368, h: 104 }
  ]
};

let _sentrySheetImg = null;
let _sentrySheetLoaded = false;

export function getSentryTurretSheet() {
  if (_sentrySheetImg) return _sentrySheetLoaded ? _sentrySheetImg : null;
  if (typeof Image === 'undefined') return null;

  _sentrySheetImg = new Image();
  _sentrySheetImg.onload = () => {
    _sentrySheetLoaded = true;
  };
  _sentrySheetImg.src = SENTRY_SHEET_URL;
  return _sentrySheetLoaded ? _sentrySheetImg : null;
}

/**
 * Rysuje wojskową skrzynię zrzutową (wspólna geometria dla Care Package i drona transportowego)
 */
export function drawDroneCargoCrate(ctx, x, y, w = 38, h = 28) {
  ctx.save();

  ctx.fillStyle = '#1e281e';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2.0;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#475569';
  const cornerSize = Math.max(3, w * 0.13);
  ctx.fillRect(x - 1, y - 1, cornerSize, cornerSize);
  ctx.fillRect(x + w - cornerSize + 1, y - 1, cornerSize, cornerSize);
  ctx.fillRect(x - 1, y + h - cornerSize + 1, cornerSize, cornerSize);
  ctx.fillRect(x + w - cornerSize + 1, y + h - cornerSize + 1, cornerSize, cornerSize);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.28, y + 1); ctx.lineTo(x + w * 0.28, y + h - 1);
  ctx.moveTo(x + w * 0.72, y + 1); ctx.lineTo(x + w * 0.72, y + h - 1);
  ctx.stroke();

  const cx = x + w * 0.5;
  const cy = y + h * 0.5;
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(2.2, h * 0.14), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(x + w * 0.34, y + 3, w * 0.32, Math.max(1.5, h * 0.1));

  ctx.restore();
}

/**
 * Rysuje podwieszoną wieżyczkę auto-miniguna pod dronem transportowym
 */
function drawSlungSentryCargo(ctx, facing) {
  const sheet = getSentryTurretSheet();
  const dir = facing >= 0 ? 1 : -1;

  ctx.save();
  ctx.translate(0, 17);
  ctx.scale(dir, 1);

  if (sheet) {
    const rBody = SENTRY_SHEET_RECTS.body;
    const rBarrel = SENTRY_SHEET_RECTS.barrels[0];
    ctx.drawImage(sheet, rBody.x, rBody.y, rBody.w, rBody.h, -14, -9, 24, 18);
    ctx.drawImage(sheet, rBarrel.x, rBarrel.y, rBarrel.w, rBarrel.h, 6, -4.5, 16, 6);
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.1;
    ctx.fillRect(-10, -7, 20, 14);
    ctx.strokeRect(-10, -7, 20, 14);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(8, -2, 10, 4);
  }

  ctx.restore();
}

/**
 * Rysuje kadłub dwuwirnikowego drona UAV-9 w dowolnej skali (od odległego piksela 0.08 po 1.0)
 */
export function drawDroneBody(ctx, opts) {
  const {
    x = 0,
    y = 0,
    scale = 1.0,
    facing = 1,
    tilt = 0,
    rotorAngle = 0,
    aimAngle = 0,
    gunRecoil = 0,
    muzzleFlashTimer = 0,
    lockedTarget = null,
    life = 25,
    totalLife = 25,
    leaving = false,
    cargoType = 'NONE', // 'NONE' | 'CRATE' | 'SENTRY'
    showTurret = true,
    accentColor = '#00e5ff'
  } = opts || {};

  if (scale <= 0.01) return;

  ctx.save();
  ctx.translate(x, y);

  // Daleki sygnalizator nawigacyjny, aby dron wielkości kilku pikseli był widoczny znad okrętu
  if (scale < 0.30) {
    const glowAlpha = Math.max(0.18, (0.32 - scale) * 2.2);
    const beaconR = Math.max(1.8, 3.2 * (0.4 + scale));
    ctx.fillStyle = cargoType === 'CRATE'
      ? `rgba(249, 115, 22, ${glowAlpha.toFixed(2)})`
      : `rgba(56, 189, 248, ${glowAlpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(0, 0, beaconR * 1.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1.0, beaconR * 0.55), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.scale(scale, scale);

  // 1. Ładunek podwieszony pod dronem (skrzynia zaopatrzenia lub złożona wieżyczka minigun)
  if (cargoType === 'CRATE') {
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-10, 4); ctx.lineTo(-14, 15);
    ctx.moveTo(10, 4); ctx.lineTo(14, 15);
    ctx.stroke();
    drawDroneCargoCrate(ctx, -16, 15, 32, 22);
  } else if (cargoType === 'SENTRY') {
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-9, 4); ctx.lineTo(-8, 13);
    ctx.moveTo(9, 4); ctx.lineTo(8, 13);
    ctx.stroke();
    drawSlungSentryCargo(ctx, facing);
  }

  // 2. Transformacja kadłuba z pochyleniem (tilt)
  ctx.save();
  ctx.rotate(tilt);

  // Płomienie dopalaczy przy gwałtownym starcie / odlocie
  if (leaving) {
    const plumeH = 12 + Math.sin(rotorAngle * 1.7) * 4;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(-16, 4); ctx.lineTo(-12, 4 + plumeH); ctx.lineTo(-8, 4);
    ctx.moveTo(8, 4); ctx.lineTo(12, 4 + plumeH); ctx.lineTo(16, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-14, 4); ctx.lineTo(-12, 4 + plumeH * 0.5); ctx.lineTo(-10, 4);
    ctx.moveTo(10, 4); ctx.lineTo(12, 4 + plumeH * 0.5); ctx.lineTo(14, 4);
    ctx.fill();
  }

  // A. Belka nośna wirników
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-23, -2); ctx.lineTo(23, -2);
  ctx.stroke();

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-23, -2); ctx.lineTo(23, -2);
  ctx.stroke();

  // B. Gondole wirników i łopatki
  for (const rx of [-23, 23]) {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(rx - 11, -5, 22, 6, 2);
    else ctx.rect(rx - 11, -5, 22, 6);
    ctx.fill();
    ctx.stroke();

    const blurAlpha = 0.38 + 0.18 * Math.sin(rotorAngle + rx);
    ctx.fillStyle = `rgba(56, 189, 248, ${blurAlpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(rx, -4, 9.5, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();

    const spinAngle = rotorAngle * (rx < 0 ? 1 : -1);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.0;
    const bladeSpan = 8;
    const bCos = Math.cos(spinAngle) * bladeSpan;
    const bSin = Math.sin(spinAngle) * 2.2;
    ctx.beginPath();
    ctx.moveTo(rx - bCos, -4 - bSin);
    ctx.lineTo(rx + bCos, -4 + bSin);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(rx, -4, 2.0, 0, Math.PI * 2);
    ctx.fill();
  }

  // C. Światła pozycyjne na końcach gondoli
  const strobeBlink = (Math.floor(life * 4) % 2 === 0);
  if (strobeBlink) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-33, -2, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(33, -2, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // D. Kadłub główny (Stealth Carbon Fuselage)
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  if (facing >= 0) {
    ctx.moveTo(-16, -2);
    ctx.lineTo(-12, -7);
    ctx.lineTo(8, -7);
    ctx.lineTo(17, -2);
    ctx.lineTo(14, 5);
    ctx.lineTo(-12, 5);
  } else {
    ctx.moveTo(16, -2);
    ctx.lineTo(12, -7);
    ctx.lineTo(-8, -7);
    ctx.lineTo(-17, -2);
    ctx.lineTo(-14, 5);
    ctx.lineTo(12, 5);
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-10, -6, 20, 4, 1.5);
  else ctx.rect(-10, -6, 20, 4);
  ctx.fill();

  // Pasek akcentowy
  ctx.strokeStyle = cargoType === 'CRATE' ? '#f97316' : accentColor;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(-8, -2); ctx.lineTo(8, -2);
  ctx.stroke();

  // E. 5-segmentowy wskaźnik baterii / stanu
  const totalPips = 5;
  const litPips = Math.max(1, Math.ceil((life / (totalLife || 25)) * totalPips));
  let ledColor = cargoType === 'CRATE' ? '#f97316' : '#00e5ff';
  if (life < 5 && cargoType === 'NONE') {
    ledColor = (Math.floor(life * 6) % 2 === 0) ? '#ef4444' : '#7f1d1d';
  } else if (life < 10 && cargoType === 'NONE') {
    ledColor = '#f59e0b';
  }

  for (let p = 0; p < totalPips; p++) {
    ctx.fillStyle = (p < litPips) ? ledColor : '#0f172a';
    ctx.fillRect(-7 + p * 3, -5, 2, 1.5);
  }

  ctx.font = '600 5px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(cargoType === 'NONE' ? 'UAV-9' : 'CARGO', -8, 3);

  // F. Anteny telemetryczne z tyłu
  const rearX = facing >= 0 ? -13 : 13;
  const antDir = facing >= 0 ? -1 : 1;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(rearX, -5); ctx.lineTo(rearX + antDir * 5, -12);
  ctx.moveTo(rearX + (facing >= 0 ? 3 : -3), -5); ctx.lineTo(rearX + antDir * 2, -13);
  ctx.stroke();

  // G. Sensor FLIR na nosie
  const noseX = facing >= 0 ? 15 : -15;
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(noseX, 0, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  ctx.fillStyle = lockedTarget ? '#f43f5e' : (cargoType === 'CRATE' ? '#f97316' : '#00e5ff');
  ctx.beginPath();
  ctx.arc(noseX + (facing >= 0 ? 0.8 : -0.8), 0, 1.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(noseX + (facing >= 0 ? 0.4 : -0.4), -0.6, 0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // koniec kadłuba

  // 3. Opcjonalne działko pod kadłubem (dla wariantu bojowego)
  if (showTurret && cargoType === 'NONE') {
    const cosTilt = Math.cos(tilt);
    const sinTilt = Math.sin(tilt);
    const dir = facing >= 0 ? 1 : -1;
    const turretLocalX = cosTilt * (dir * 6) - sinTilt * 5;
    const turretLocalY = sinTilt * (dir * 6) + cosTilt * 5;

    ctx.save();
    ctx.translate(turretLocalX, turretLocalY);
    ctx.rotate(aimAngle);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    const barrelLen = Math.max(5, 12 - gunRecoil);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(2, -1.8); ctx.lineTo(2 + barrelLen, -1.8);
    ctx.moveTo(2, 1.8); ctx.lineTo(2 + barrelLen, 1.8);
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.fillRect(2 + barrelLen - 2, -2.8, 2.2, 2.0);
    ctx.fillRect(2 + barrelLen - 2, 0.8, 2.2, 2.0);

    if (muzzleFlashTimer > 0) {
      const flashX = 2 + barrelLen + 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(flashX, 0);
      ctx.lineTo(flashX + 8, 0);
      ctx.lineTo(flashX + 1, -2.5);
      ctx.lineTo(flashX + 1, -6);
      ctx.lineTo(flashX + 1, -2.5);
      ctx.lineTo(flashX + 8, 0);
      ctx.lineTo(flashX + 1, 2.5);
      ctx.lineTo(flashX + 1, 6);
      ctx.lineTo(flashX + 1, 2.5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(0, 229, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(flashX + 2, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  ctx.restore();
}

if (typeof window !== 'undefined') {
  getSentryTurretSheet();
}
