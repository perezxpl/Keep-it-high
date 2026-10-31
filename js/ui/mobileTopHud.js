// =========================================================================
// UI/MOBILETOPHUD.JS - 1-LINIOWY ULTRA-KOMPAKTOWY STATUS BAR DLA URZĄDZEŃ MOBILNYCH
// Uwalnia ponad 100px pionowego pola widzenia w lewym górnym rogu ekranu!
// Zero emojis, czysta typografia militarna, side-by-side HP i broń
// =========================================================================

import { drawRankHUD } from './rankHud.js';

const MOBILE_WEAPON_NAMES = {
  MACHETE: 'MACZETA',
  KNIFE: 'NÓŻ',
  AXE: 'TOPOREK',
  AK47: 'AK-47',
  SHOTGUN: 'SPAS',
  SNIPER: 'BARRETT',
  GLOCK: 'GLOCK',
  REVOLVER: 'MAGNUM',
  SAWED_OFF: 'OBRZYN',
  GRENADE: 'GRANAT'
};

/**
 * Rysuje ultra-kompaktowy horyzontalny pasek statusu dla ekranów mobilnych (Side-by-Side: HP + Broń)
 * Wysokość: zaledwie 14px na y = 6px.
 */
export function drawMobileTopLeftHUD(ctx, player, hudX, hudY, options = {}) {
  if (!ctx || !player) return;

  const maxHp = player.maxHp || 100;
  const curHp = Math.max(0, player.hp ?? 100);
  const hpRatio = Math.max(0, Math.min(1, curHp / maxHp));
  const trailRatio = options.trailRatio !== undefined ? options.trailRatio : hpRatio;
  const hpBorderCol = options.hpBorderCol || '#22c55e';

  const hasVest = !!(player.hasVest && (player.vestHp || 0) > 0);
  const vestHp = Math.max(0, player.vestHp || 0);
  const vestMaxHp = player.vestMaxHp || 60;
  const vestRatio = Math.max(0, Math.min(1.0, vestHp / vestMaxHp));
  const hasHelmet = !!(player.hasHelmet || player.visuals?.hasHelmet);

  const curWep = player.currentWeapon || { id: 'AK47', name: 'AK-47' };
  const curWepId = curWep.id || 'AK47';
  const curAmmoObj = player.ammo?.[curWepId];
  const defM = curWepId === 'SHOTGUN' ? 8 : (curWepId === 'SNIPER' ? 5 : (curWepId === 'GRENADE' ? 1 : 30));
  const defR = curWepId === 'SHOTGUN' ? 64 : (curWepId === 'SNIPER' ? 25 : (curWepId === 'GRENADE' ? 0 : 90));
  const cAmmo = curAmmoObj ? curAmmoObj.currentAmmo : defM;
  const rAmmo = curAmmoObj ? curAmmoObj.reserveAmmo : defR;
  const isRel = curAmmoObj ? curAmmoObj.isReloading : !!player.isReloading;
  const isNoAmmo = (cAmmo === 0 && rAmmo === 0);
  const isLow = (!isNoAmmo && cAmmo <= Math.ceil(defM * 0.25));

  const wepAccent = curWepId === 'SHOTGUN'
    ? '#fb923c'
    : (curWepId === 'SNIPER' ? '#38bdf8' : (curWepId === 'GRENADE' ? '#4ade80' : '#f59e0b'));

  let cardBorderCol = wepAccent;
  if (isNoAmmo) cardBorderCol = '#ef4444';
  else if (isLow) cardBorderCol = '#f97316';
  else if (isRel) cardBorderCol = '#facc15';

  const hpBoxX = hudX;
  const hpBoxW = 68;
  const hpBoxH = 14;

  const wepBoxX = hpBoxX + hpBoxW + 4;
  const wepBoxW = 70;
  const wepBoxH = 14;

  // 1. TŁO I WYPEŁNIENIE MODUŁU HP
  ctx.beginPath();
  ctx.fillStyle = 'rgba(6, 12, 22, 0.65)';
  if (ctx.roundRect) ctx.roundRect(hpBoxX, hudY, hpBoxW, hpBoxH, 3);
  else ctx.rect(hpBoxX, hudY, hpBoxW, hpBoxH);
  ctx.fill();

  // Ślad obrażeń
  if (trailRatio > hpRatio + 0.005) {
    const trailW = Math.max(2, (hpBoxW - 2) * trailRatio);
    ctx.fillStyle = '#fb7185';
    ctx.fillRect(hpBoxX + 1, hudY + 1, trailW, hpBoxH - 2);
  }

  // Właściwe wypełnienie aktualnego HP
  if (hpRatio > 0) {
    const fillW = Math.max(2, (hpBoxW - 2) * hpRatio);
    let hpColor = '#22c55e';
    if (hpRatio <= 0.25) hpColor = '#ef4444';
    else if (hpRatio <= 0.55) hpColor = '#f59e0b';

    ctx.fillStyle = hpColor;
    ctx.fillRect(hpBoxX + 1, hudY + 1, fillW, hpBoxH - 2);
  }

  // Pancerz kamizelki: zintegrowany błękitny pasek (2px) na samej górze HP
  if (hasVest && vestRatio > 0) {
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(hpBoxX + 1, hudY + 1, (hpBoxW - 2) * vestRatio, 2);
  }

  // Obramowanie modułu HP
  ctx.strokeStyle = hasVest ? '#0284c7' : (hasHelmet ? '#06b6d4' : hpBorderCol);
  ctx.lineWidth = 1.0;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(hpBoxX, hudY, hpBoxW, hpBoxH, 3);
    ctx.stroke();
  } else {
    ctx.strokeRect(hpBoxX, hudY, hpBoxW, hpBoxH);
  }

  // Tekst HP wewnątrz
  ctx.save();
  ctx.font = '900 8.5px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 3;
  const vestIcon = hasVest ? '+' : (hasHelmet ? '^' : '');
  ctx.fillText(`HP ${Math.round(curHp)}${vestIcon}`, hpBoxX + 4, hudY + hpBoxH / 2 + 0.5);
  ctx.restore();

  // 2. MODUŁ BRONI I AMUNICJI (OBOK PO PRAWEJ)
  ctx.beginPath();
  ctx.fillStyle = 'rgba(6, 12, 22, 0.65)';
  if (ctx.roundRect) ctx.roundRect(wepBoxX, hudY, wepBoxW, wepBoxH, 3);
  else ctx.rect(wepBoxX, hudY, wepBoxW, wepBoxH);
  ctx.fill();

  // Pasek postępu przeładowania na dole kafelka broni
  if (isRel) {
    const dur = curAmmoObj?.reloadDuration || player.reloadDuration || 120;
    const tmr = curAmmoObj?.reloadTimer ?? player.reloadTimer ?? 0;
    const prog = Math.max(0, Math.min(1, 1 - (tmr / dur)));
    ctx.fillStyle = '#facc15';
    ctx.fillRect(wepBoxX + 1, hudY + wepBoxH - 2.5, (wepBoxW - 2) * prog, 1.5);
  }

  // Obramowanie modułu broni
  ctx.strokeStyle = cardBorderCol;
  ctx.lineWidth = 1.0;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(wepBoxX, hudY, wepBoxW, wepBoxH, 3);
    ctx.stroke();
  } else {
    ctx.strokeRect(wepBoxX, hudY, wepBoxW, wepBoxH);
  }

  // Tekst broni i amunicji
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 3;

  // Nazwa broni po lewej
  ctx.font = '900 7.5px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  const mobileShortName = MOBILE_WEAPON_NAMES[curWepId] || (curWepId.length > 7 ? curWepId.substring(0, 6) : curWepId);
  ctx.fillText(mobileShortName, wepBoxX + 3.5, hudY + wepBoxH / 2 + 0.5);

  // Amunicja po prawej
  ctx.textAlign = 'right';
  if (curWep?.isMelee) {
    if (curWepId === 'AXE' && player.axeThrown) {
      ctx.font = 'bold 7px monospace';
      ctx.fillStyle = '#f97316';
      ctx.fillText('RZUCONY', wepBoxX + wepBoxW - 3, hudY + wepBoxH / 2 + 0.5);
    }
  } else if (curWepId === 'GRENADE') {
    const cd = (player.grenadeCooldownTimer || 0) / 60;
    ctx.font = 'bold 7.5px monospace';
    ctx.fillStyle = (cd <= 0) ? '#4ade80' : '#facc15';
    ctx.fillText((cd <= 0) ? 'READY' : `${cd.toFixed(1)}s`, wepBoxX + wepBoxW - 3, hudY + wepBoxH / 2 + 0.5);
  } else if (isRel) {
    ctx.font = 'bold 7.5px monospace';
    ctx.fillStyle = '#facc15';
    ctx.fillText('REL...', wepBoxX + wepBoxW - 3, hudY + wepBoxH / 2 + 0.5);
  } else if (isNoAmmo) {
    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('PUSTY', wepBoxX + wepBoxW - 3, hudY + wepBoxH / 2 + 0.5);
  } else {
    ctx.font = '900 8px monospace';
    ctx.fillStyle = isLow ? '#f97316' : '#cbd5e1';
    ctx.fillText(`${cAmmo}`, wepBoxX + wepBoxW - 3, hudY + wepBoxH / 2 + 0.5);
  }
  ctx.restore();

  // 3. Mikro-pasek XP tuż pod pigułką
  drawRankHUD(ctx, hudX, hudY + hpBoxH + 1.5, hpBoxW + 4 + wepBoxW, true);
}
