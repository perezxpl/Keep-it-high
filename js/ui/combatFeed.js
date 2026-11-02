// =========================================================================
// UI/COMBATFEED.JS - DOLNY BANER ELIMINACJI I ZGONÓW (KILLFEED)
// Taktyczny informator bojowy, styl Soldat/Call of Duty, ZERO EMOJIS
// =========================================================================

export const combatFeedState = {
  active: false,
  type: 'PLAYER_KILL', // 'PLAYER_KILL' | 'PLAYER_DEATH' | 'COMBAT_KILL' | 'COMBAT_HAZARD' | 'SYSTEM'
  killerName: '',
  killerTeam: null, // 'CYAN' | 'ORANGE' | null
  victimName: '',
  victimTeam: null, // 'CYAN' | 'ORANGE' | null
  cause: '',
  rawText: '',
  subtext: '',
  timer: 0,
  maxTimer: 160
};

export function getTeamColor(team) {
  if (!team) return '#cbd5e1';
  const t = String(team).toUpperCase();
  if (t === 'CYAN' || t === 'NIEBIESCY') return '#00e5ff';
  if (t === 'ORANGE' || t === 'CZERWONI') return '#fb923c';
  return '#cbd5e1';
}

export function isHazardName(str) {
  if (!str) return false;
  const s = String(str).toUpperCase();
  return s.includes('KWAS') || s.includes('ŚRODOWISKO') || s.includes('PRZEPAŚĆ') ||
         s.includes('UTONIĘCIE') || s.includes('SAMOBÓJ') || s.includes('WŁASNY') ||
         s.includes('RYKOSZET') || s.includes('ZAWALENIE') || s.includes('MINA') ||
         s.includes('OCEAN') || s.includes('SZTORM') || s.includes('ROPA') ||
         s.includes('ROZLEW') || s.includes('KONTENER') || s.includes('UTYLIZATOR') ||
         s.includes('PRÓŻNIA') || s.includes('KOSMICZN') || s.includes('HAZARD') ||
         s.includes('STREFA');
}

function resolveEntity(entity, fallbackName = '', fallbackTeam = null) {
  if (!entity) {
    if (!fallbackName) {
      return { name: '', team: null, isPlayer: false, isHazard: false, cause: '' };
    }
    const clean = String(fallbackName).trim().toUpperCase();
    const isHaz = isHazardName(clean);
    return {
      name: clean,
      team: fallbackTeam,
      isPlayer: (clean === 'GRACZ' || clean === 'TY'),
      isHazard: isHaz,
      cause: isHaz ? clean : ''
    };
  }

  if (typeof entity === 'string') {
    const clean = entity.trim().toUpperCase();
    const isHaz = isHazardName(clean);
    return {
      name: clean,
      team: fallbackTeam,
      isPlayer: (clean === 'GRACZ' || clean === 'TY'),
      isHazard: isHaz,
      cause: isHaz ? clean : ''
    };
  }

  const isLocalPl = !!(entity.isPlayer === true || entity.id === 'player' || entity.isLocalPlayer === true || (entity.name === 'GRACZ' && !entity.isBot));
  const rawName = entity.name || fallbackName || (isLocalPl ? 'GRACZ' : 'OPERATOR');
  const cleanName = String(rawName).trim().toUpperCase();
  const team = entity.team || fallbackTeam || null;
  const isHaz = !!(entity.isHazard || entity.isSelf || isHazardName(cleanName));
  const cause = entity.cause || (isHaz ? cleanName : '');

  return {
    name: cleanName,
    team,
    isPlayer: isLocalPl,
    isHazard: isHaz,
    cause
  };
}

export function triggerCombatFeedEvent({
  type = null,
  killer = null,
  victim = null,
  killerName = '',
  victimName = '',
  killerTeam = null,
  victimTeam = null,
  cause = '',
  text = '',
  subtext = ''
} = {}) {
  const kInfo = resolveEntity(killer, killerName, killerTeam);
  const vInfo = resolveEntity(victim, victimName, victimTeam);

  let resolvedType = type;
  if (!resolvedType) {
    if (text && text.startsWith('[')) {
      resolvedType = 'SYSTEM';
    } else if (vInfo.isPlayer) {
      resolvedType = 'PLAYER_DEATH';
    } else if (kInfo.isPlayer) {
      resolvedType = 'PLAYER_KILL';
    } else if (kInfo.name && kInfo.name !== vInfo.name && !kInfo.isHazard) {
      resolvedType = 'COMBAT_KILL';
    } else {
      resolvedType = 'COMBAT_HAZARD';
    }
  } else if (resolvedType === 'COMBAT_KILL' && (kInfo.isHazard || !kInfo.name)) {
    resolvedType = 'COMBAT_HAZARD';
    cause = cause || kInfo.cause || kInfo.name;
  }

  // Priorytetyzacja: nie nadpisuj aktywnego powiadomienia gracza przez powiadomienie bota
  const isHighPri = (resolvedType === 'PLAYER_KILL' || resolvedType === 'PLAYER_DEATH' || resolvedType === 'SYSTEM');
  const currentIsHighPri = (combatFeedState.type === 'PLAYER_KILL' || combatFeedState.type === 'PLAYER_DEATH');
  if (combatFeedState.active && currentIsHighPri && !isHighPri && combatFeedState.timer > 35) {
    return;
  }

  combatFeedState.active = true;
  combatFeedState.type = resolvedType;
  combatFeedState.killerName = kInfo.name;
  combatFeedState.killerTeam = kInfo.team;
  combatFeedState.victimName = vInfo.name;
  combatFeedState.victimTeam = vInfo.team;
  combatFeedState.cause = cause || kInfo.cause || vInfo.cause || '';
  combatFeedState.rawText = text;

  const duration = isHighPri ? 160 : 125;
  combatFeedState.maxTimer = duration;
  combatFeedState.timer = duration;

  if (resolvedType === 'PLAYER_KILL') {
    combatFeedState.subtext = subtext || 'ELIMINACJA // FRAG +1';
  } else if (resolvedType === 'PLAYER_DEATH') {
    combatFeedState.subtext = subtext || (combatFeedState.cause ? 'ZAGROŻENIE ARENY // POLEGŁEŚ' : 'STRATA OPERATORA // POLEGŁEŚ');
  } else if (resolvedType === 'COMBAT_KILL') {
    combatFeedState.subtext = subtext || 'STATUS BITWY // RAPORT BOJOWY';
  } else if (resolvedType === 'COMBAT_HAZARD') {
    combatFeedState.subtext = subtext || 'ZAGROŻENIE ARENY // STRATA JEDNOSTKI';
  } else {
    combatFeedState.subtext = subtext || 'STATUS BITWY // KOMUNIKAT';
  }
}

export function triggerCombatFeedBanner(type, name) {
  const clean = String(name || '').trim().toUpperCase();
  if (clean.startsWith('[')) {
    triggerCombatFeedEvent({
      type: 'SYSTEM',
      text: clean,
      subtext: (type === 'DEATH') ? 'STATUS BITWY // OSTRZEŻENIE' : 'STATUS BITWY // KOMUNIKAT'
    });
  } else if (type === 'DEATH') {
    triggerCombatFeedEvent({
      type: 'PLAYER_DEATH',
      killerName: clean,
      cause: isHazardName(clean) ? clean : ''
    });
  } else {
    triggerCombatFeedEvent({
      type: 'PLAYER_KILL',
      victimName: clean || 'PRZECIWNIK'
    });
  }
}

export function updateCombatFeed(dt) {
  if (!combatFeedState.active) return;
  if (combatFeedState.timer > 0) {
    combatFeedState.timer--;
    if (combatFeedState.timer <= 0) {
      combatFeedState.active = false;
    }
  }
}

export function drawCombatFeedBanner(ctx, W, H, isMobile) {
  if (!combatFeedState.active || combatFeedState.timer <= 0) return;

  const timer = combatFeedState.timer;
  const maxTimer = combatFeedState.maxTimer;
  const enterProgress = Math.min(1.0, (maxTimer - timer) / 12);
  const exitProgress = Math.min(1.0, timer / 24);
  const alpha = enterProgress * exitProgress;
  if (alpha <= 0.01) return;

  ctx.save();
  try {
    ctx.globalAlpha = alpha;

  const type = combatFeedState.type;
  const kTeam = combatFeedState.killerTeam;
  const vTeam = combatFeedState.victimTeam;
  const kColor = getTeamColor(kTeam);
  const vColor = getTeamColor(vTeam);
  const kName = combatFeedState.killerName;
  const vName = combatFeedState.victimName;
  const cause = combatFeedState.cause;
  const rawText = combatFeedState.rawText;
  const subtext = combatFeedState.subtext;

  if (isMobile) {
    // -------------------------------------------------------------------------
    // WARIANT MOBILNY: Modern Tactical Ghost Ticker przy dolnej krawędzi (H - 24)
    // Bezpieczna martwa strefa między lewym drążkiem a prawymi przyciskami.
    // -------------------------------------------------------------------------
    const floatY = (1 - enterProgress) * 4;
    const tickerY = Math.round(H - 24) - floatY;
    const tickerH = 19;
    const radius = 4;

    ctx.font = '900 11px Rajdhani, monospace';
    ctx.textBaseline = 'middle';

    if (type === 'PLAYER_KILL') {
      const label = `+100 ELIMINACJA // ${vName || 'PRZECIWNIK'}`;
      const textW = ctx.measureText(label).width;
      const tickerW = textW + 18;
      const tickerX = Math.round((W - tickerW) / 2);

      ctx.fillStyle = 'rgba(6, 20, 36, 0.78)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(tickerX, tickerY - tickerH / 2, tickerW, tickerH, radius);
      else ctx.rect(tickerX, tickerY - tickerH / 2, tickerW, tickerH);
      ctx.fill();

      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(label, W / 2, tickerY + 0.5);
    } else if (type === 'PLAYER_DEATH') {
      const killerLabel = cause || kName || 'ŚRODOWISKO';
      const label = `POLEGŁEŚ // ${killerLabel}`;
      const textW = ctx.measureText(label).width;
      const tickerW = textW + 18;
      const tickerX = Math.round((W - tickerW) / 2);

      ctx.fillStyle = 'rgba(36, 8, 8, 0.78)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(tickerX, tickerY - tickerH / 2, tickerW, tickerH, radius);
      else ctx.rect(tickerX, tickerY - tickerH / 2, tickerW, tickerH);
      ctx.fill();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(label, W / 2, tickerY + 0.5);
    } else if (type === 'COMBAT_KILL') {
      const name1 = kName || 'OPERATOR';
      const arrow = ' >> ';
      const name2 = vName || 'PRZECIWNIK';

      const w1 = ctx.measureText(name1).width;
      const wA = ctx.measureText(arrow).width;
      const w2 = ctx.measureText(name2).width;
      const totalW = w1 + wA + w2;
      const tickerW = totalW + 18;
      const tickerX = Math.round((W - tickerW) / 2);

      ctx.fillStyle = 'rgba(10, 15, 24, 0.78)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(tickerX, tickerY - tickerH / 2, tickerW, tickerH, radius);
      else ctx.rect(tickerX, tickerY - tickerH / 2, tickerW, tickerH);
      ctx.fill();

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      let curX = tickerX + 9;
      ctx.textAlign = 'left';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;

      ctx.fillStyle = kColor;
      ctx.fillText(name1, curX, tickerY + 0.5);
      curX += w1;

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(arrow, curX, tickerY + 0.5);
      curX += wA;

      ctx.fillStyle = vColor;
      ctx.fillText(name2, curX, tickerY + 0.5);
    } else if (type === 'COMBAT_HAZARD') {
      const name1 = vName || 'OPERATOR';
      const arrow = ' >> ';
      const haz = cause || 'ŚRODOWISKO';

      const w1 = ctx.measureText(name1).width;
      const wA = ctx.measureText(arrow).width;
      const w2 = ctx.measureText(haz).width;
      const totalW = w1 + wA + w2;
      const tickerW = totalW + 18;
      const tickerX = Math.round((W - tickerW) / 2);

      ctx.fillStyle = 'rgba(20, 16, 10, 0.78)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(tickerX, tickerY - tickerH / 2, tickerW, tickerH, radius);
      else ctx.rect(tickerX, tickerY - tickerH / 2, tickerW, tickerH);
      ctx.fill();

      ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      let curX = tickerX + 9;
      ctx.textAlign = 'left';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;

      ctx.fillStyle = vColor;
      ctx.fillText(name1, curX, tickerY + 0.5);
      curX += w1;

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(arrow, curX, tickerY + 0.5);
      curX += wA;

      ctx.fillStyle = '#fbbf24';
      ctx.fillText(haz, curX, tickerY + 0.5);
    } else {
      // SYSTEM
      const label = rawText || kName || 'KOMUNIKAT TAKTYCZNY';
      const textW = ctx.measureText(label).width;
      const tickerW = textW + 18;
      const tickerX = Math.round((W - tickerW) / 2);

      ctx.fillStyle = 'rgba(26, 18, 6, 0.82)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(tickerX, tickerY - tickerH / 2, tickerW, tickerH, radius);
      else ctx.rect(tickerX, tickerY - tickerH / 2, tickerW, tickerH);
      ctx.fill();

      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(label, W / 2, tickerY + 0.5);
    }
  } else {
    // -------------------------------------------------------------------------
    // WARIANT DESKTOP (PC): Dyskretny, nowoczesny baner militarny tuż nad dolną krawędzią
    // -------------------------------------------------------------------------
    const slideY = (1 - enterProgress) * 10;
    const bannerH = 34;
    const bannerY = (H - 42) + slideY;

    if (type === 'PLAYER_KILL') {
      const bannerW = 380;
      const bannerX = (W - bannerW) / 2;

      ctx.fillStyle = 'rgba(6, 26, 44, 0.94)';
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.2;

      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 5);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
        ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);
      }

      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(bannerX, bannerY + 4, 3.5, bannerH - 8);
      ctx.fillRect(bannerX + bannerW - 3.5, bannerY + 4, 3.5, bannerH - 8);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = "900 8.5px 'Rajdhani', monospace";
      ctx.fillStyle = 'rgba(0, 229, 255, 0.85)';
      ctx.fillText(subtext, W / 2, bannerY + 4);

      const prefix = 'ZABIŁEŚ: ';
      const name = vName || 'PRZECIWNIK';
      ctx.font = "900 14px 'Orbitron', 'Rajdhani', monospace";
      ctx.textBaseline = 'middle';
      const midY = bannerY + 21;
      const prefixW = ctx.measureText(prefix).width;
      const nameW = ctx.measureText(name).width;
      const startX = (W - (prefixW + nameW)) / 2;

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(prefix, startX, midY);

      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 6;
      ctx.fillText(name, startX + prefixW, midY);
      ctx.shadowBlur = 0;
    } else if (type === 'PLAYER_DEATH') {
      const bannerW = 380;
      const bannerX = (W - bannerW) / 2;

      ctx.fillStyle = 'rgba(44, 10, 10, 0.94)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.2;

      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 5);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
        ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);
      }

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(bannerX, bannerY + 4, 3.5, bannerH - 8);
      ctx.fillRect(bannerX + bannerW - 3.5, bannerY + 4, 3.5, bannerH - 8);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = "900 8.5px 'Rajdhani', monospace";
      ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.fillText(subtext, W / 2, bannerY + 4);

      const isHaz = !!cause;
      const prefix = isHaz ? 'PRZYCZYNA: ' : 'ZABITY PRZEZ: ';
      const name = cause || kName || 'ŚRODOWISKO';
      ctx.font = "900 14px 'Orbitron', 'Rajdhani', monospace";
      ctx.textBaseline = 'middle';
      const midY = bannerY + 21;
      const prefixW = ctx.measureText(prefix).width;
      const nameW = ctx.measureText(name).width;
      const startX = (W - (prefixW + nameW)) / 2;

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(prefix, startX, midY);

      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 6;
      ctx.fillText(name, startX + prefixW, midY);
      ctx.shadowBlur = 0;
    } else if (type === 'COMBAT_KILL') {
      const name1 = kName || 'OPERATOR';
      const arrow = ' >> ';
      const name2 = vName || 'PRZECIWNIK';

      ctx.font = "900 13px 'Orbitron', 'Rajdhani', monospace";
      const w1 = ctx.measureText(name1).width;
      const wA = ctx.measureText(arrow).width;
      const w2 = ctx.measureText(name2).width;
      const bannerW = Math.max(340, w1 + wA + w2 + 60);
      const bannerX = (W - bannerW) / 2;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
      ctx.lineWidth = 1.1;

      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 5);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
        ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);
      }

      ctx.fillStyle = kColor;
      ctx.fillRect(bannerX, bannerY + 4, 3.5, bannerH - 8);
      ctx.fillStyle = vColor;
      ctx.fillRect(bannerX + bannerW - 3.5, bannerY + 4, 3.5, bannerH - 8);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = "900 8.5px 'Rajdhani', monospace";
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(subtext, W / 2, bannerY + 4);

      ctx.font = "900 13px 'Orbitron', 'Rajdhani', monospace";
      ctx.textBaseline = 'middle';
      const midY = bannerY + 21;
      const startX = (W - (w1 + wA + w2)) / 2;

      ctx.textAlign = 'left';
      ctx.fillStyle = kColor;
      ctx.fillText(name1, startX, midY);

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(arrow, startX + w1, midY);

      ctx.fillStyle = vColor;
      ctx.fillText(name2, startX + w1 + wA, midY);
    } else if (type === 'COMBAT_HAZARD') {
      const name1 = vName || 'OPERATOR';
      const arrow = ' >> ';
      const haz = cause || 'ŚRODOWISKO';

      ctx.font = "900 13px 'Orbitron', 'Rajdhani', monospace";
      const w1 = ctx.measureText(name1).width;
      const wA = ctx.measureText(arrow).width;
      const w2 = ctx.measureText(haz).width;
      const bannerW = Math.max(340, w1 + wA + w2 + 60);
      const bannerX = (W - bannerW) / 2;

      ctx.fillStyle = 'rgba(26, 18, 10, 0.94)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
      ctx.lineWidth = 1.1;

      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 5);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
        ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);
      }

      ctx.fillStyle = vColor;
      ctx.fillRect(bannerX, bannerY + 4, 3.5, bannerH - 8);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(bannerX + bannerW - 3.5, bannerY + 4, 3.5, bannerH - 8);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = "900 8.5px 'Rajdhani', monospace";
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(subtext, W / 2, bannerY + 4);

      ctx.font = "900 13px 'Orbitron', 'Rajdhani', monospace";
      ctx.textBaseline = 'middle';
      const midY = bannerY + 21;
      const startX = (W - (w1 + wA + w2)) / 2;

      ctx.textAlign = 'left';
      ctx.fillStyle = vColor;
      ctx.fillText(name1, startX, midY);

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(arrow, startX + w1, midY);

      ctx.fillStyle = '#fbbf24';
      ctx.fillText(haz, startX + w1 + wA, midY);
    } else {
      // SYSTEM
      const bannerW = 420;
      const bannerX = (W - bannerW) / 2;

      ctx.fillStyle = 'rgba(26, 18, 6, 0.94)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = 1.2;

      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 5);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
        ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);
      }

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(bannerX, bannerY + 4, 3.5, bannerH - 8);
      ctx.fillRect(bannerX + bannerW - 3.5, bannerY + 4, 3.5, bannerH - 8);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = "900 8.5px 'Rajdhani', monospace";
      ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
      ctx.fillText(subtext, W / 2, bannerY + 4);

      ctx.font = "900 13px 'Orbitron', 'Rajdhani', monospace";
      ctx.textBaseline = 'middle';
      const midY = bannerY + 21;
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(rawText || kName || 'KOMUNIKAT TAKTYCZNY', W / 2, midY);
    }
  }
  } catch (err) {
    console.error('[COMBAT FEED RENDER ERROR]', err);
  } finally {
    ctx.restore();
  }
}
