// =========================================================================
// JS/PLAYER/MARKER.JS - TAKTYCZNY ZNACZNIK NAD GŁOWĄ GRACZA
// Wyrazisty błękitny trójkąt wskazujący na postać gracza (brak napisów)
// Płynna lewitacja, czarny kontrastowy obrys i neonowy blask
// =========================================================================

/**
 * Renderuje błękitny trójkąt wskazujący na postać lokalnego gracza
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} player - instancja gracza lokalnego
 */
export function drawPlayerMarker(ctx, player) {
  if (!ctx || !player || player.isDead || player._isCreatorPreview) return;
  if (player.isGibbed || (player.acidDeath && player.acidDeath.dissolved)) return;

  const headX = (player.head && typeof player.head.x === 'number')
    ? player.head.x
    : (player.x + (player.w || 26) * 0.5);

  const headY = (player.head && typeof player.head.y === 'number')
    ? player.head.y
    : player.y;

  if (!Number.isFinite(headX) || !Number.isFinite(headY)) return;

  // Organiczna, płynna lewitacja (delikatne unoszenie góra-dół w zakresie 2px)
  const now = performance.now();
  const bob = Math.sin(now * 0.007) * 2.0;
  const pulse = 0.85 + 0.15 * Math.sin(now * 0.012);

  // Pozycja czubka trójkąta (dolny wierzchołek skierowany bezpośrednio na hełm/głowę)
  const tipX = headX;
  const tipY = headY - 14 + bob;
  if (!Number.isFinite(tipX) || !Number.isFinite(tipY)) return;

  const halfW = 6.5;
  const triH = 9.5;

  ctx.save();
  try {
    // 1. Neonowa błękitna poświata
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 6 * pulse;

    // 2. Błękitny gradient wertykalny (od jasnego cyjanu u góry do głębszego błękitu przy ostrzu)
    const grad = ctx.createLinearGradient(tipX, tipY - triH, tipX, tipY);
    grad.addColorStop(0.0, '#38bdf8');
    grad.addColorStop(0.5, '#00f0ff');
    grad.addColorStop(1.0, '#0284c7');

    // 3. Ścieżka trójkąta wskazującego w dół na gracza
    ctx.beginPath();
    ctx.moveTo(tipX, tipY); // Dolny szpic wskazujący na gracza
    ctx.lineTo(tipX - halfW, tipY - triH); // Lewy górny róg
    ctx.lineTo(tipX + halfW, tipY - triH); // Prawy górny róg
    ctx.closePath();

    ctx.fillStyle = grad;
    ctx.fill();

    // 4. Kontrastowy ciemny obrys zapewniający doskonałą czytelność na każdym tle areny
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#050810';
    ctx.lineWidth = 1.4;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 5. Wewnętrzny subtelny refleks świetlny na górnej krawędzi
    ctx.beginPath();
    ctx.moveTo(tipX - halfW + 1.2, tipY - triH + 1.0);
    ctx.lineTo(tipX + halfW - 1.2, tipY - triH + 1.0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.0;
    ctx.stroke();
  } catch (_) {
    // Bezpieczne wygaszenie ewentualnego błędu bez przerywania pętli gry
  } finally {
    ctx.restore();
  }
}
