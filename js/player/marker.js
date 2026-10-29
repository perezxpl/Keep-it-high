// =========================================================================
// JS/PLAYER/MARKER.JS - WYRAŹNY ZNACZNIK NAD GŁOWĄ GRACZA
// Taktyczny neonowy szewron i plakietka [TY] w stylu Modern Military
// Zero emojis, organiczna animacja lewitacji, natychmiastowa identyfikacja
// =========================================================================

/**
 * Renderuje taktyczny znacznik nad głową lokalnego gracza w przestrzeni świata gry
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} player - instancja gracza lokalnego
 */
export function drawPlayerMarker(ctx, player) {
  if (!player || player.isDead || player._isCreatorPreview) return;
  if (player.isGibbed || (player.acidDeath && player.acidDeath.dissolved)) return;

  const headX = (player.head && typeof player.head.x === 'number')
    ? player.head.x
    : (player.x + (player.w || 26) * 0.5);

  const headY = (player.head && typeof player.head.y === 'number')
    ? player.head.y
    : player.y;

  if (!Number.isFinite(headX) || !Number.isFinite(headY)) return;

  // Organiczna, płynna lewitacja (pływanie góra-dół w zakresie 2.5px)
  const now = performance.now();
  const bob = Math.sin(now * 0.007) * 2.5;
  const pulse = 0.85 + 0.15 * Math.sin(now * 0.012);

  // Kolorystyka w zależności od drużyny (domyślnie neonowy Cyan gracza)
  const isOrangeTeam = (player.team === 'ORANGE');
  const accentColor = isOrangeTeam ? '#fb923c' : '#00f0ff';
  const deepColor = isOrangeTeam ? '#c2410c' : '#0284c7';

  // 1. Dół szewronu (czubek strzałki wskazujący bezpośrednio na hełm/głowę)
  const tipX = headX;
  const tipY = headY - 26 + bob;
  if (!Number.isFinite(tipX) || !Number.isFinite(tipY)) return;

  ctx.save();
  try {
    // A. Szewron taktyczny (Inverted Tactical Chevron ▼)
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 6 * pulse;

    const grad = ctx.createLinearGradient(tipX, tipY - 8, tipX, tipY);
    grad.addColorStop(0.0, accentColor);
    grad.addColorStop(1.0, deepColor);

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - 6, tipY - 7.5);
    ctx.lineTo(tipX - 3.2, tipY - 7.5);
    ctx.lineTo(tipX, tipY - 3.2);
    ctx.lineTo(tipX + 3.2, tipY - 7.5);
    ctx.lineTo(tipX + 6, tipY - 7.5);
    ctx.closePath();

    ctx.fillStyle = grad;
    ctx.fill();

    // Wyrazisty czarny obrys zapewniający czytelność na każdym tle areny
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#050810';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // B. Miniaturowa plakietka [TY] tuż nad szewronem
    const tagW = 20;
    const tagH = 10.5;
    const tagX = tipX - tagW / 2;
    const tagY = tipY - 18.5;

    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(tagX, tagY, tagW, tagH, 2.5);
    else ctx.rect(tagX, tagY, tagW, tagH);

    ctx.fillStyle = 'rgba(6, 14, 26, 0.90)';
    ctx.fill();

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // C. Napis "TY"
    ctx.font = '900 8px Rajdhani, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('TY', tipX, tagY + tagH / 2 + 0.5);
  } catch (_) {
    // Bezpieczne wygaszenie błędu bez przerywania pętli renderowania
  } finally {
    ctx.restore();
  }
}
