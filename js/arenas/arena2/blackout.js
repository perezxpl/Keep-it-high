// =========================================================================
// ARENAS/ARENA2/BLACKOUT.JS - CHEMICZNA AWARIA ZASILANIA (ACID BLACKOUT)
// Zalanie skrzynek bezpiecznikowych, gasnące reflektory i walka w półmroku
// 100% symetria osiowa względem X = 2000, 0 alokacji GC w pętli renderującej
// =========================================================================

// Skrzynki bezpiecznikowe i rozdzielnice zasilania na dolnym poziomie areny
// 100% symetria osiowa względem osi X = 2000
export const ARENA_2_FUSE_BOXES = [
  // 1. Bastion dolny C (lewy dół) - skrzynka obwodu zachodniego (X: 340, Y: 1038)
  {
    id: 'fuse_C_deck',
    name: 'ROZDZIELNICA SEKTOR C',
    label: 'PWR-01A',
    x: 340,
    y: 1038,
    w: 42,
    h: 42,
    tripY: 1080,
    state: 'OK', // 'OK' | 'TRIPPING' | 'BLOWN'
    sparksTimer: 0
  },
  // 2. Bastion dolny D (prawy dół - lustrzane odbicie: 4000 - (340 + 42) = 3618)
  {
    id: 'fuse_D_deck',
    name: 'ROZDZIELNICA SEKTOR D',
    label: 'PWR-01B',
    x: 3618,
    y: 1038,
    w: 42,
    h: 42,
    tripY: 1080,
    state: 'OK',
    sparksTimer: 0
  },
  // 3. Podstacja magistrali pod rampą C (X: 1180, Y: 860)
  {
    id: 'fuse_sub_west',
    name: 'TRANSFORMATOR WEST',
    label: 'SUB-480W',
    x: 1180,
    y: 860,
    w: 44,
    h: 44,
    tripY: 890,
    state: 'OK',
    sparksTimer: 0
  },
  // 4. Podstacja magistrali pod rampą D (lustrzane odbicie: 4000 - (1180 + 44) = 2776)
  {
    id: 'fuse_sub_east',
    name: 'TRANSFORMATOR EAST',
    label: 'SUB-480E',
    x: 2776,
    y: 860,
    w: 44,
    h: 44,
    tripY: 890,
    state: 'OK',
    sparksTimer: 0
  },
  // 5. Główny węzeł rozdzielczy pod centralnym hubem (serce zasilania hali: X = 2000)
  {
    id: 'fuse_main_hub',
    name: 'GŁÓWNA ROZDZIELNICA SIECI',
    label: 'MAIN-GRID',
    x: 1978,
    y: 676,
    w: 44,
    h: 44,
    tripY: 710,
    state: 'OK',
    sparksTimer: 0
  }
];

// Pula cząstek elektrycznych iskier zwarcia (0 alokacji GC)
export const _fuseSparks = [];
const MAX_FUSE_SPARKS = 48;

export function spawnFuseSpark(x, y, isWater = false) {
  if (_fuseSparks.length >= MAX_FUSE_SPARKS) {
    _fuseSparks.shift();
  }
  const angle = Math.random() * Math.PI * 2;
  const speed = isWater ? (1.5 + Math.random() * 3.5) : (3.0 + Math.random() * 6.5);
  _fuseSparks.push({
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - (isWater ? 1.0 : 0.5),
    life: 0,
    maxLife: isWater ? (10 + Math.random() * 8) : (8 + Math.random() * 6),
    color: Math.random() < 0.6 ? '#67e8f9' : (Math.random() < 0.85 ? '#38bdf8' : '#ffffff'),
    isWater
  });
}

// Globalny stan blackoutu na Arenie 2
export const ACID_BLACKOUT_STATE = {
  // Poziom zaciemnienia: 0.0 (pełne światło) -> 0.86 (głęboki półmrok nocny)
  blackoutLevel: 0.0,
  targetBlackout: 0.0,

  // Nieregularne migotanie zasilania
  flickerIntensity: 0.0,
  currentFlicker: 0.0,
  flickerTimer: 0.0,

  // Flagi dźwiękowe
  soundTripped: false,
  soundHumActive: false,

  reset() {
    this.blackoutLevel = 0.0;
    this.targetBlackout = 0.0;
    this.flickerIntensity = 0.0;
    this.currentFlicker = 0.0;
    this.flickerTimer = 0.0;
    this.soundTripped = false;
    this.soundHumActive = false;
    _fuseSparks.length = 0;
    for (let i = 0; i < ARENA_2_FUSE_BOXES.length; i++) {
      ARENA_2_FUSE_BOXES[i].state = 'OK';
      ARENA_2_FUSE_BOXES[i].sparksTimer = 0;
    }
  }
};

let _blackoutAudioCtx = null;

/**
 * Dźwięk wyładowania elektrycznego / zwarcia bezpiecznika (Web Audio API)
 */
export function playFuseShortCircuitSFX() {
  if (typeof window === 'undefined') return;
  if (window.ACID_SIREN_ENABLED === false) return;
  if (window.uiManager?.settings?.muteAll) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!_blackoutAudioCtx) _blackoutAudioCtx = new AudioCtx();
    if (_blackoutAudioCtx.state === 'suspended') _blackoutAudioCtx.resume();

    const now = _blackoutAudioCtx.currentTime;
    const osc = _blackoutAudioCtx.createOscillator();
    const gain = _blackoutAudioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

    const masterVol = (window.uiManager?.settings?.masterVolume ?? 80) / 100;
    gain.gain.setValueAtTime(0.22 * masterVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(_blackoutAudioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  } catch (_) {}
}

/**
 * Ciężki, niski ton wyłączającego się transformatora przemysłowego (Blackout Hum)
 */
export function playTransformerPowerDownSFX() {
  if (typeof window === 'undefined') return;
  if (window.ACID_SIREN_ENABLED === false) return;
  if (window.uiManager?.settings?.muteAll) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!_blackoutAudioCtx) _blackoutAudioCtx = new AudioCtx();
    if (_blackoutAudioCtx.state === 'suspended') _blackoutAudioCtx.resume();

    const now = _blackoutAudioCtx.currentTime;
    const osc = _blackoutAudioCtx.createOscillator();
    const gain = _blackoutAudioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 1.8);

    const masterVol = (window.uiManager?.settings?.masterVolume ?? 80) / 100;
    gain.gain.setValueAtTime(0.20 * masterVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    osc.connect(gain);
    gain.connect(_blackoutAudioCtx.destination);
    osc.start(now);
    osc.stop(now + 1.8);
  } catch (_) {}
}

/**
 * Logika aktualizacji awarii zasilania w klatce update (dt)
 */
export function updateAcidBlackout(dt, curAcidY, surgeState) {
  const state = ACID_BLACKOUT_STATE;
  let blownCount = 0;
  let trippingCount = 0;

  // 1. Sprawdzenie kontaktu kwasu ze skrzynkami bezpiecznikowymi
  for (let i = 0; i < ARENA_2_FUSE_BOXES.length; i++) {
    const box = ARENA_2_FUSE_BOXES[i];
    const boxCenterY = box.y + box.h * 0.5;

    if (curAcidY <= box.y) {
      // Całkowite zalanie kwasem
      if (box.state !== 'BLOWN') {
        box.state = 'BLOWN';
        spawnFuseSpark(box.x + box.w * 0.5, box.y, true);
      }
      blownCount++;
    } else if (curAcidY <= box.tripY) {
      // Fala dotyka skrzynki - zwarcie i wybijanie bezpiecznika!
      if (box.state === 'OK') {
        box.state = 'TRIPPING';
        playFuseShortCircuitSFX();
      }
      trippingCount++;

      // Spawnowanie iskier zwarcia
      box.sparksTimer -= dt;
      if (box.sparksTimer <= 0) {
        box.sparksTimer = 0.05 + Math.random() * 0.12;
        const sparkX = box.x + 6 + Math.random() * (box.w - 12);
        const sparkY = box.y + 10 + Math.random() * (box.h - 14);
        spawnFuseSpark(sparkX, sparkY, curAcidY <= sparkY);
      }
    } else {
      // Poziom kwasu poniżej skrzynki - bezpiecznik sprawny lub chłodzony
      if (surgeState === 'CALM') {
        box.state = 'OK';
      }
    }
  }

  // 2. Wyznaczenie docelowego poziomu zaciemnienia
  const totalImpaired = blownCount + trippingCount * 0.5;

  if (curAcidY <= 720 || surgeState === 'FLOODED') {
    // SZCZYTOWY POZIOM ZALANIA (Y = 600 - 720): PEŁNY ACID BLACKOUT!
    state.targetBlackout = 0.86;
    state.flickerIntensity = 0.08; // Reflektory padły całkowicie, tylko rzadkie konające rozbłyski

    if (!state.soundHumActive) {
      state.soundHumActive = true;
      playTransformerPowerDownSFX();
    }
  } else if (totalImpaired >= 3) {
    // Zalana większość podstacji - głęboki półmrok i gwałtowne migotanie
    state.targetBlackout = 0.68;
    state.flickerIntensity = 0.75;
  } else if (totalImpaired >= 1) {
    // Zalane dolne bastiony C i D - początek awarii zasilania
    state.targetBlackout = 0.38;
    state.flickerIntensity = 0.85;

    if (!state.soundTripped) {
      state.soundTripped = true;
      playFuseShortCircuitSFX();
    }
  } else {
    // Stan normalny - pełne zasilanie hali
    state.targetBlackout = 0.0;
    state.flickerIntensity = 0.0;
    state.soundTripped = false;
    state.soundHumActive = false;
  }

  // Płynna interpolacja poziomu blackoutu
  const blendSpeed = (state.targetBlackout > state.blackoutLevel) ? 2.5 : 1.2;
  state.blackoutLevel += (state.targetBlackout - state.blackoutLevel) * Math.min(1.0, dt * blendSpeed);

  // 3. Nieregularne stroboskopowe migotanie zasilania
  state.flickerTimer -= dt;
  if (state.flickerTimer <= 0) {
    state.flickerTimer = 0.04 + Math.random() * 0.14;
    if (state.flickerIntensity > 0.05) {
      // Nieregularny skok jasności: 0 lub 1 z losowymi załamaniami napięcia
      state.currentFlicker = (Math.random() < 0.45) ? (0.4 + Math.random() * 0.6) : 0.0;
    } else {
      state.currentFlicker = 0.0;
    }
  }

  // 4. Aktualizacja cząstek iskier
  for (let i = _fuseSparks.length - 1; i >= 0; i--) {
    const sp = _fuseSparks[i];
    sp.x += sp.vx;
    sp.y += sp.vy;
    sp.vy += sp.isWater ? 0.08 : 0.25;
    sp.life++;
    if (sp.life >= sp.maxLife) {
      _fuseSparks.splice(i, 1);
    }
  }
}

/**
 * Rysuje przemysłowe skrzynki bezpiecznikowe na ścianach dolnego poziomu
 */
export function drawFuseBoxes(ctx, time, curAcidY, viewLeft, viewRight) {
  if (!ctx) return;
  ctx.save();
  ctx.shadowBlur = 0;

  for (let i = 0; i < ARENA_2_FUSE_BOXES.length; i++) {
    const box = ARENA_2_FUSE_BOXES[i];
    if (viewLeft !== undefined && (box.x + box.w < viewLeft || box.x > viewRight)) {
      continue;
    }

    const bx = box.x;
    const by = box.y;
    const bw = box.w;
    const bh = box.h;

    // A. Stalowe rury osłonowe kabli biegnące do skrzynki ze stropu i podestu
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(bx + 8, by);
    ctx.lineTo(bx + 8, by - 24);
    ctx.moveTo(bx + bw - 8, by + bh);
    ctx.lineTo(bx + bw - 8, by + bh + 16);
    ctx.stroke();

    // B. Korpus pancernej skrzynki rozdzielczej (Heavy Hazmat Enclosure)
    ctx.fillStyle = '#111827';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);

    // Krawędź obudowy
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(bx, by, bw, bh);

    // C. Pasy ostrzegawcze na drzwiach rozdzielnicy (żółto-czarne)
    ctx.fillStyle = '#facc15';
    ctx.fillRect(bx + 4, by + 4, bw - 8, 4);
    ctx.fillStyle = '#111827';
    for (let s = bx + 6; s < bx + bw - 6; s += 8) {
      ctx.fillRect(s, by + 4, 3, 4);
    }

    // D. Symbol wysokiego napięcia (żółty piorun)
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.5 + 2, by + 14);
    ctx.lineTo(bx + bw * 0.5 - 4, by + 23);
    ctx.lineTo(bx + bw * 0.5, by + 23);
    ctx.lineTo(bx + bw * 0.5 - 2, by + 31);
    ctx.lineTo(bx + bw * 0.5 + 5, by + 21);
    ctx.lineTo(bx + bw * 0.5 + 1, by + 21);
    ctx.closePath();
    ctx.fill();

    // E. Wskaźniki LED stanu obwodu
    const ledY = by + bh - 8;
    if (box.state === 'OK') {
      // Normalny stan: stabilne zielone diody
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(bx + 8, ledY, 2.2, 0, Math.PI * 2);
      ctx.arc(bx + 16, ledY, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (box.state === 'TRIPPING') {
      // Zwarcie: agresywne czerwone stroboskopy
      const flash = (Math.sin(time * 24.0) > 0);
      ctx.fillStyle = flash ? '#ef4444' : '#7f1d1d';
      ctx.beginPath();
      ctx.arc(bx + 8, ledY, 2.4, 0, Math.PI * 2);
      ctx.arc(bx + 16, ledY, 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Przepalony / zatopiony bezpiecznik
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.arc(bx + 8, ledY, 2.0, 0, Math.PI * 2);
      ctx.arc(bx + 16, ledY, 2.0, 0, Math.PI * 2);
      ctx.fill();
    }

    // F. Oznaczenie tekstowe
    ctx.font = '900 7px monospace';
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'right';
    ctx.fillText(box.label, bx + bw - 4, ledY + 2);
  }

  ctx.restore();
}

/**
 * Rysuje iskry zwarć elektrycznych ze skrzynek bezpiecznikowych
 */
export function drawFuseSparks(ctx) {
  if (!_fuseSparks || _fuseSparks.length === 0) return;
  ctx.save();
  ctx.shadowBlur = 0;

  for (let i = 0; i < _fuseSparks.length; i++) {
    const sp = _fuseSparks[i];
    const alpha = Math.max(0, 1.0 - sp.life / sp.maxLife);
    ctx.fillStyle = sp.color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(sp.x - 1, sp.y - 1, sp.isWater ? 2.8 : 2.0, sp.isWater ? 2.8 : 2.0);
  }

  ctx.restore();
}

let _cachedDarknessGrad = null;
let _cachedDarknessCurY = -1;

function getCachedDarknessGrad(ctx, curY) {
  if (!_cachedDarknessGrad || Math.abs(_cachedDarknessCurY - curY) > 2) {
    _cachedDarknessGrad = ctx.createLinearGradient(0, curY, 0, curY - 380);
    _cachedDarknessGrad.addColorStop(0.00, 'rgba(74, 222, 128, 0.52)');  // Jaskrawa radioaktywna zieleń
    _cachedDarknessGrad.addColorStop(0.28, 'rgba(34, 197, 94, 0.32)');   // Szmaragdowy blask
    _cachedDarknessGrad.addColorStop(0.65, 'rgba(16, 185, 129, 0.12)');  // Mgławica kwasowa
    _cachedDarknessGrad.addColorStop(1.00, 'rgba(0, 0, 0, 0)');           // Półmrok
    _cachedDarknessCurY = curY;
  }
  return _cachedDarknessGrad;
}

/**
 * GŁÓWNA WARSTWA PÓŁMROKU I KLIMATU WALKI W CIEMNOŚCI (ACID BLACKOUT OVERLAY)
 * Renderowana na pierwszym planie (drawArena2Foreground):
 * - Pogrąża arenę w przemysłowym półmroku
 * - Reflektory gasną lub nieregularnie migają
 * - Fosforyzujący neonowy kwas na dole staje się głównym źródłem oświetlenia od spodu
 * - Czerwone celowniki laserowe broni graczy jaskrawo rozcinają ciemność
 */
export function drawAcidBlackoutOverlay(ctx, time, camera, curAcidY, players) {
  const state = ACID_BLACKOUT_STATE;
  if (!ctx || state.blackoutLevel <= 0.01) return;

  // Efektywny poziom półmroku z uwzględnieniem stroboskopowego migotania reflektorów
  const flickerCut = state.currentFlicker * state.flickerIntensity;
  const effectiveDarkness = Math.max(0, state.blackoutLevel * (1.0 - flickerCut * 0.85));
  if (effectiveDarkness <= 0.01) return;

  const camZoom = (camera && camera.zoom) ? camera.zoom : 1;
  const camX = (camera && typeof camera.x === 'number') ? camera.x : 0;
  const camY = (camera && typeof camera.y === 'number') ? camera.y : 0;
  const canvasW = (ctx.canvas && ctx.canvas.width) ? ctx.canvas.width : 1920;
  const canvasH = (ctx.canvas && ctx.canvas.height) ? ctx.canvas.height : 1080;

  const viewLeft = camX - 100;
  const viewRight = camX + (canvasW / camZoom) + 100;
  const viewTop = camY - 100;
  const viewBottom = camY + (canvasH / camZoom) + 100;
  const viewWidth = viewRight - viewLeft;
  const viewHeight = viewBottom - viewTop;

  ctx.save();
  ctx.shadowBlur = 0;

  // -------------------------------------------------------------------------
  // 1. ZASŁONA PÓŁMROKU (DEEP INDUSTRIAL SHROUD)
  // Przycina światło całej areny, zostawiając surowy klimat nocnego starcia
  // -------------------------------------------------------------------------
  ctx.fillStyle = `rgba(2, 5, 11, ${effectiveDarkness * 0.82})`;
  ctx.fillRect(viewLeft, viewTop, viewWidth, viewHeight);

  // -------------------------------------------------------------------------
  // 2. FOSFORYZUJĄCY NEONOWY BLASK FALUJĄCEGO KWASU NA DOLE
  // Potężne źródło światła od spodu rzucające zieloną łunę na konstrukcje i graczy
  // -------------------------------------------------------------------------
  const acidGlowGrad = getCachedDarknessGrad(ctx, curAcidY);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = acidGlowGrad;
  ctx.fillRect(viewLeft, curAcidY - 380, viewWidth, 380);
  ctx.restore();

  // -------------------------------------------------------------------------
  // 3. JASKRAWE CZERWONE LASERY BRONI GRACZY W PÓŁMROKU (TACTICAL SNIPER LASERS)
  // Wybijają się z ciemności z podwójną intensywnością i neonową poświatą
  // -------------------------------------------------------------------------
  const charList = Array.isArray(players) ? players : (window.player ? [window.player] : []);
  for (let c = 0; c < charList.length; c++) {
    const p = charList[c];
    if (!p || p.isDead) continue;

    // Sprawdzenie celowania laserem snajperskim
    const hasLaser = (p.currentWeapon?.name?.includes('Barrett') || p.currentWeapon?.name?.includes('Sniper') || p.isSniperAiming || (typeof p.aimX === 'number' && typeof p.aimY === 'number'));
    if (!hasLaser) continue;

    const startX = p.x + (p.w || 24) * 0.5;
    const startY = p.y + (p.h || 70) * 0.38;
    const targetX = p.aimX;
    const targetY = p.aimY;

    const angle = Math.atan2(targetY - startY, targetX - startX);
    const laserLength = 1800;
    const endX = startX + Math.cos(angle) * laserLength;
    const endY = startY + Math.sin(angle) * laserLength;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // A. Zewnętrzna czerwona aura lasera w ciemności
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.lineWidth = 4.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // B. Czysty jaskrawy laser bojowy
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // C. Biały rdzeń fotonowy
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // D. Punkt celowniczy kropki lasera
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(targetX, targetY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(targetX, targetY, 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // 4. NIEREGULARNY BŁYSK AWARII ZASILANIA (REFLEKTORY PRÓBUJĄCE SIĘ ZAPALIĆ)
  // Gdy dochodzi do skoku napięcia, zimny biały błysk rozświetla halę
  // -------------------------------------------------------------------------
  if (flickerCut > 0.15) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(186, 230, 253, ${flickerCut * 0.40})`;
    ctx.fillRect(viewLeft, viewTop, viewWidth, viewHeight);
    ctx.restore();
  }

  ctx.restore();
}
