// =========================================================================
// PLAYER/HAIR.JS - SYSTEM FRYZUR, PALET KOLORÓW I FIZYKI WŁOSÓW 2D
// Wydzielony moduł z js/player/renderer.js
// =========================================================================

export const DEFAULT_VISUALS = {
  sculptedMuscles: false,
  muscleMult: 1.0,
  sleeveless: false,
  sleeveLengthMult: 1.0,
  hasWristband: false,
  wristbandColor: '#18181b',
  hasTacticalGloves: true,
  gloveColor: '#18181b',
  hasHeadband: false,
  headbandColor: '#ffffff',
  hairStyle: 'buzzcut',
  hairColor: '#18181b',
  beardStyle: 'clean',
  beardColor: '#18181b',
  headgearStyle: 'none',
  headgearColor: '#18181b',
  maskStyle: 'none',
  maskColor: '#18181b',
  neckStyle: 'none',
  torsoStyle: 'short_sleeve',
  torsoColor: '#18181b',
  pantsStyle: 'cargo_long',
  pantsColor: '#18181b',
  shoesStyle: 'combat_boots',
  shoesColor: '#18181b',
  jetpackStyle: 'classic',
  jetpackColor: '#00e5ff',
  hasHelmet: false,
  helmetColor: '#27272a',
  helmetVisorGlow: '#00e5ff',
  hasVest: false,
  vestColor: '#18181b',
  hairColor0: '#0f172a',
  hairColor1: '#1e293b',
  hairColor2: '#334155',
  shortsColor0: '#27272a',
  shortsColor1: '#3f3f46',
  shortsColor2: '#18181b',
  skinLight: '#fed7aa',
  skinMid: '#f5b078',
  skinDark: '#b45309',
  skinBack: '#de935e',
  jerseyFront0: '#18181b',
  jerseyFront1: '#27272a',
  jerseyFront2: '#3f3f46',
  jerseyFront3: '#18181b',
  jerseyBack0: '#09090b',
  jerseyBack1: '#18181b',
  jerseyBack2: '#09090b',
  jerseyStripe: '#52525b',
  armColorFront: '#27272a',
  armColorBack: '#18181b',
  legThighFront: '#27272a',
  legShinFront: '#3f3f46',
  legThighBack: '#18181b',
  legShinBack: '#27272a',
  bootColor: '#18181b',
  bootBack: '#09090b',
  bootAccent: '#52525b',
  crestColor: '#71717a',
  seamColor: '#09090b',
  crosshairColor: '#ef4444',
  number: '00'
};

export const HAIR_STYLE_LIST = [
  'buzzcut',
  'crewcut',
  'mohawk',
  'slickback',
  'messy',
  'ponytail',
  'long_flowing',
  'dreadlocks',
  'topknot'
];

export const HAIR_COLOR_LIST = [
  '#18181b', // Kruczoczarny
  '#3b2314', // Ciemny brąz / Espresso
  '#6b3e26', // Kasztanowy brąz
  '#92400e', // Ciepły bursztyn / Brudny blond
  '#eab308', // Złoty blond
  '#c2410c', // Miedziany rudy
  '#64748b', // Stalowosiwy
  '#e2e8f0'  // Platynowy / Biały
];

export let localPlayerCustomVisuals = {};

export function setLocalPlayerCustomVisuals(custom) {
  if (custom && typeof custom === 'object') {
    localPlayerCustomVisuals = { ...localPlayerCustomVisuals, ...custom };
  }
}

export function getLocalPlayerCustomVisuals() {
  return { ...localPlayerCustomVisuals };
}


// =========================================================================
// SYSTEM FRYZUR I FIZYKI DŁUGICH WŁOSÓW 2D (VERLET / SPRING CHAIN)
// =========================================================================

export function getHairPalette(hexColor = '#18181b') {
  const clean = String(hexColor || '#18181b').replace('#', '');
  const num = parseInt(clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean.padEnd(6, '0'), 16) || 0x18181b;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const rgb = (rr, gg, bb) => `rgb(${clamp(rr)}, ${clamp(gg)}, ${clamp(bb)})`;
  const rgba = (rr, gg, bb, a) => `rgba(${clamp(rr)}, ${clamp(gg)}, ${clamp(bb)}, ${a})`;

  return {
    base: rgb(r, g, b),
    dark: rgb(r * 0.62, g * 0.62, b * 0.62),
    deep: rgb(r * 0.35, g * 0.35, b * 0.35),
    light: rgb(r + (255 - r) * 0.28 + 14, g + (255 - g) * 0.28 + 14, b + (255 - b) * 0.28 + 14),
    highlight: rgba(Math.min(255, r + 75), Math.min(255, g + 75), Math.min(255, b + 75), 0.32),
    fadeStart: rgba(r * 0.65, g * 0.65, b * 0.65, 0.48),
    fadeMid: rgba(r * 0.65, g * 0.65, b * 0.65, 0.18),
    fadeEnd: rgba(r * 0.65, g * 0.65, b * 0.65, 0.0)
  };
}

const HAIR_REST_PROFILES = {
  long_flowing: [1.84, 1.66, 1.56, 1.62, 1.74, 1.88],
  dreadlocks:   [1.86, 1.68, 1.58, 1.64, 1.76, 1.88],
  ponytail:     [2.28, 1.96, 1.72, 1.62, 1.72, 1.86],
  topknot:      [2.58, 2.22, 1.90, 1.72, 1.70, 1.84]
};

const PONYTAIL_ARCH_PROFILE = [2.35, 2.02, 1.76, 1.65, 1.72, 1.86];

function applyHairDeadzone(val, deadzone = 0.05) {
  const absV = Math.abs(val);
  if (absV <= deadzone) return 0;
  return Math.sign(val) * (absV - deadzone);
}

export function updateAndBuildHairChain(p, hairStyle, currentFacingDir, torsoTilt, headPitch, anchorX, anchorY, segLen, strandOpts = {}) {
  const NUM_SEGS = 6;
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const isStaticTile = !!(p && p._isStaticTile);
  const restProfile = (typeof strandOpts === 'object' && strandOpts.restProfile)
    ? strandOpts.restProfile
    : (HAIR_REST_PROFILES[hairStyle] || HAIR_REST_PROFILES.long_flowing);

  const opts = (typeof strandOpts === 'number')
    ? { id: `s_${Math.round(strandOpts * 100)}`, phase: strandOpts, restOffset: strandOpts * 0.45, archRoot: 0, liftMult: 1.0, gravMult: 1.0, stiffMult: 1.0, restProfile }
    : {
        id: strandOpts.id || 'main',
        phase: strandOpts.phase || 0,
        restOffset: strandOpts.restOffset || 0,
        archRoot: strandOpts.archRoot || 0,
        liftMult: strandOpts.liftMult ?? 1.0,
        gravMult: strandOpts.gravMult ?? 1.0,
        stiffMult: strandOpts.stiffMult ?? 1.0,
        restProfile: strandOpts.restProfile || restProfile
      };

  // Trwały, współdzielony stan dynamiki gracza (wspólny dla fryzury i elementów nakrycia głowy)
  if (!p._hairPhys || typeof p._hairPhys !== 'object' || !p._hairPhys.strands) {
    p._hairPhys = {
      strands: {},
      waveTime: 0,
      frameId: 0,
      lastFrameTime: now,
      dt: 0.016,
      lastFacing: currentFacingDir || 1,
      lastHeadBob: (p && p.headBob) || 0,
      lastVy: (p && p.vy) || 0,
      smoothVx: 0,
      smoothVy: 0,
      dBob: 0,
      dvY: 0,
      flipImpulse: 0,
      extImpulse: 0
    };
  }

  const phys = p._hairPhys;

  // Globalna aktualizacja dynamiki ruchu gracza raz na klatkę renderowania (wspólna dla wszystkich pasm)
  if (!isStaticTile) {
    const dtRaw = (now - phys.lastFrameTime) / 1000;
    if (dtRaw >= 0.0035) {
      phys.dt = Math.min(0.040, dtRaw);
      phys.lastFrameTime = now;
      phys.frameId++;

      const rawVx = ((p && p.vx) || 0) * currentFacingDir;
      const rawVy = (p && p.vy) || 0;
      const rawSpeed = Math.hypot(rawVx, rawVy);

      // Szybka, responsywna adaptacja prędkości (bez ospałego opóźnienia)
      const velBlend = Math.min(1.0, phys.dt * 18.0);
      phys.smoothVx += (rawVx - phys.smoothVx) * velBlend;
      phys.smoothVy += (rawVy - phys.smoothVy) * velBlend;

      phys.flipImpulse = 0;
      if (phys.lastFacing !== currentFacingDir) {
        phys.flipImpulse = 0.35 + Math.min(0.95, rawSpeed * 0.30);
        phys.lastFacing = currentFacingDir;
        phys.smoothVx = -phys.smoothVx * 0.35;
      }

      phys.extImpulse = p._hairImpulse || 0;
      p._hairImpulse = 0;

      const curBob = (p && p.headBob) || 0;
      const bobActivity = Math.min(1.0, rawSpeed * 0.35);
      phys.dBob = (curBob - phys.lastHeadBob) * bobActivity;
      phys.lastHeadBob = curBob;

      phys.dvY = rawVy - phys.lastVy;
      phys.lastVy = rawVy;

      const effSpeed = Math.hypot(phys.smoothVx, phys.smoothVy);
      const previewFlow = p._isCreatorPreview ? 0.90 : 0;
      const waveSpeed = 2.4 + Math.min(14.0, (effSpeed + previewFlow) * 2.4);
      phys.waveTime += phys.dt * waveSpeed;
    }
  }

  // Unikalny klucz pasma: pasma fryzury i wstęgi bandany żyją niezależnie w słowniku pasm
  const strandKey = `${hairStyle}_${opts.id}`;
  let strand = phys.strands[strandKey];
  if (!strand || !strand.thetas || strand.thetas.length !== NUM_SEGS) {
    strand = {
      thetas: restProfile.map((t, idx) => {
        const archAdd = opts.archRoot * Math.max(0, 1.0 - idx * 0.42);
        return t + archAdd + opts.restOffset * (0.45 + idx * 0.14);
      }),
      omegas: new Array(NUM_SEGS).fill(0),
      lastFrameId: -1,
      restProfile: restProfile
    };
    phys.strands[strandKey] = strand;
  }

  // Niezależna symulacja fizyki 2D dla każdego pasma w bieżącej klatce
  if (!isStaticTile && strand.lastFrameId !== phys.frameId) {
    strand.lastFrameId = phys.frameId;
    const dt = phys.dt;

    if (phys.flipImpulse > 0) {
      for (let i = 0; i < NUM_SEGS; i++) {
        strand.omegas[i] += 2.2 * phys.flipImpulse * opts.liftMult * (0.25 + i * 0.30);
      }
    }

    if (phys.extImpulse) {
      for (let i = 0; i < NUM_SEGS; i++) {
        strand.omegas[i] += phys.extImpulse * opts.liftMult * (0.45 + i * 0.45);
      }
    }

    if (Math.abs(phys.dvY) > 0.8) {
      const excessDv = phys.dvY - Math.sign(phys.dvY) * 0.8;
      const landSnap = Math.max(-4.2, Math.min(4.2, excessDv)) * 0.55 * opts.liftMult;
      for (let i = 0; i < NUM_SEGS; i++) {
        strand.omegas[i] += landSnap * (0.22 + i * 0.28);
      }
    }

    const rot = (torsoTilt * currentFacingDir) + headPitch;
    const effVx = applyHairDeadzone(phys.smoothVx, 0.05);
    const effVy = applyHairDeadzone(phys.smoothVy, 0.08);

    const breezeVx = p._isCreatorPreview
      ? (0.55 + Math.sin(now * 0.0032 + opts.phase) * 0.38)
      : 0;

    const totalVx = effVx + breezeVx;
    const isGrounded = !!(p && p.onGround && !p.isJumping);
    const isJetpacking = !!(p && p.isJetpacking);

    const fallSpeed = (!isGrounded && !isJetpacking && phys.smoothVy > 0.30)
      ? (phys.smoothVy - 0.30)
      : 0;
    const fallFactor = Math.min(1.0, fallSpeed / 3.6) * Math.min(1.5, opts.liftMult);

    const baseStiff = 22.0 * opts.stiffMult;
    const damping = 0.87;

    const curRest = strand.restProfile || restProfile;

    for (let i = 0; i < NUM_SEGS; i++) {
      const segProgress = i / (NUM_SEGS - 1); // 0.0 u nasady -> 1.0 na końcówce

      // 1. Kąt spoczynkowy wzdłuż głowy/karku skorygowany o pochylenie głowy (-rot), aby włosy wisiały pionowo w dół zgodnie z grawitacją
      const archAdd = opts.archRoot * Math.max(0, 1.0 - i * 0.42);
      let targetTheta = curRest[i] + archAdd + opts.restOffset * (0.45 + segProgress * 0.55) - rot * (0.45 + segProgress * 0.40);

      // 2. Wpływ ruchu poziomego (przód vs tył):
      if (totalVx > 0) {
        // Ruch DO PRZODU: wiatr z impetem odchyla pasma i wstęgi w tył za plecy!
        const backBend = Math.min(1.75, totalVx * 0.34 * opts.liftMult) * (0.35 + segProgress * 1.15);
        targetTheta += backBend;
      } else if (totalVx < 0) {
        // Ruch DO TYŁU: wiatr wieje zza pleców
        const forwardSweep = Math.min(0.85, Math.abs(totalVx) * 0.26 * opts.liftMult) * (0.22 + segProgress * 0.95);
        targetTheta -= forwardSweep;
      }

      // 3. Wpływ ruchu pionowego:
      if (fallFactor > 0) {
        // SWOBODNE SPADANIE W DÓŁ: pasma unoszą się i falują w górę
        const upwardBillow = fallFactor * (0.80 + segProgress * 1.95);
        targetTheta += upwardBillow;
      } else if (effVy < -0.20 || isJetpacking) {
        // WZNOSZENIE W GÓRĘ / JETPACK: pęd powietrza ściąga pasma w dół
        const verticalDownTheta = Math.PI * 0.50 - rot * 0.70 + opts.restOffset * 0.20;
        const pullDownWeight = isJetpacking
          ? Math.min(0.55, 0.20 + Math.max(0, -effVy) * 0.08)
          : Math.min(0.55, Math.max(0, -effVy) * 0.12);
        targetTheta += (verticalDownTheta - targetTheta) * pullDownWeight * (0.35 + segProgress * 0.65);
      }

      // 4. Żywa, naturalna fala S i mikro-ruch powietrza (ze zwiększoną swobodą w ruchu)
      const activeMotion = Math.hypot(totalVx, effVy) + fallSpeed;
      const waveAmp = (0.018 + Math.min(0.42, activeMotion * 0.10)) * opts.liftMult * (0.25 + segProgress * 1.15);
      const sWave = Math.sin(phys.waveTime + opts.phase * 2.4 - i * 0.95) * waveAmp
                  + Math.cos(phys.waveTime * 1.55 + opts.phase * 1.7 - i * 1.25) * (waveAmp * 0.40);

      targetTheta += sWave - phys.dBob * (0.40 + segProgress * 0.65);

      // 5. Miękkie przekazywanie krzywizny z poprzedniego segmentu
      if (i > 0) {
        const prevArch = opts.archRoot * Math.max(0, 1.0 - (i - 1) * 0.42);
        const naturalDelta = (curRest[i] + archAdd) - (curRest[i - 1] + prevArch);
        const parentFollow = strand.thetas[i - 1] + naturalDelta * (1.0 - fallFactor * 0.75);
        targetTheta = targetTheta * 0.68 + parentFollow * 0.32;
      }

      // Elastyczne limity kątowe o pełnej swobodzie ruchu 2D:
      const minTheta = (i === 0) ? (Math.PI * 0.38) : (Math.PI * (0.30 - segProgress * 0.08));
      const maxAllowed = (fallFactor > 0.01)
        ? (Math.PI * (1.20 + fallFactor * 0.40))
        : (Math.PI * 1.28);
      const maxTheta = (i === 0) ? Math.min(Math.PI * 1.35, maxAllowed) : maxAllowed;
      targetTheta = Math.max(minTheta, Math.min(maxTheta, targetTheta));

      const segStiff = baseStiff * (1.15 - segProgress * 0.25);
      strand.omegas[i] = (strand.omegas[i] + (targetTheta - strand.thetas[i]) * segStiff * dt) * damping;
      strand.thetas[i] += strand.omegas[i] * dt * 3.5;

      if (strand.thetas[i] < minTheta) {
        strand.thetas[i] = minTheta;
        strand.omegas[i] *= -0.15;
      } else if (strand.thetas[i] > maxTheta) {
        strand.thetas[i] = maxTheta;
        strand.omegas[i] *= -0.15;
      }
    }
  }

  // Budowa gładkiej 7-punktowej wstęgi (6 segmentów) dla danego pasma
  const pts = [{ x: anchorX, y: anchorY }];
  const norms = [];

  for (let i = 0; i < NUM_SEGS; i++) {
    const a = strand.thetas[i];
    const nx = pts[i].x + Math.cos(a) * segLen;
    const ny = pts[i].y + Math.sin(a) * segLen;
    pts.push({ x: nx, y: ny });
    norms.push({ x: -Math.sin(a), y: Math.cos(a) });
  }

  // Uśrednienie wektorów normalnych w węzłach dla idealnie gładkich krawędzi bez załamań
  const smoothNorms = [norms[0]];
  for (let i = 1; i < NUM_SEGS; i++) {
    const mx = norms[i - 1].x + norms[i].x;
    const my = norms[i - 1].y + norms[i].y;
    const len = Math.hypot(mx, my) || 1;
    smoothNorms.push({ x: mx / len, y: my / len });
  }
  smoothNorms.push(norms[NUM_SEGS - 1]);

  return { pts, norms: smoothNorms };
}

export function drawTaperedHairStrand(ctx, pts, norms, widths, fillStyle, strokeStyle = '#09090b', highlightStyle = null) {
  const leftPts = [];
  const rightPts = [];
  for (let i = 0; i < pts.length; i++) {
    const w = widths[i] ?? 0;
    leftPts.push({
      x: pts[i].x + norms[i].x * w,
      y: pts[i].y + norms[i].y * w
    });
    rightPts.push({
      x: pts[i].x - norms[i].x * w,
      y: pts[i].y - norms[i].y * w
    });
  }

  const lastIdx = leftPts.length - 1;

  ctx.beginPath();
  ctx.moveTo(leftPts[0].x, leftPts[0].y);
  for (let i = 1; i < lastIdx; i++) {
    const xc = (leftPts[i].x + leftPts[i + 1].x) * 0.5;
    const yc = (leftPts[i].y + leftPts[i + 1].y) * 0.5;
    ctx.quadraticCurveTo(leftPts[i].x, leftPts[i].y, xc, yc);
  }
  ctx.lineTo(pts[lastIdx].x, pts[lastIdx].y);
  for (let i = lastIdx - 1; i >= 1; i--) {
    const xc = (rightPts[i].x + rightPts[i - 1].x) * 0.5;
    const yc = (rightPts[i].y + rightPts[i - 1].y) * 0.5;
    ctx.quadraticCurveTo(rightPts[i].x, rightPts[i].y, xc, yc);
  }
  ctx.lineTo(rightPts[0].x, rightPts[0].y);
  ctx.closePath();

  ctx.fillStyle = fillStyle;
  ctx.fill();

  // Obrys tylko wzdłuż zewnętrznych krawędzi pasma (bez zamykania kreską u nasady, by pasmo płynnie wyrastało z głowy!)
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 0.82;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(leftPts[0].x, leftPts[0].y);
    for (let i = 1; i < lastIdx; i++) {
      const xc = (leftPts[i].x + leftPts[i + 1].x) * 0.5;
      const yc = (leftPts[i].y + leftPts[i + 1].y) * 0.5;
      ctx.quadraticCurveTo(leftPts[i].x, leftPts[i].y, xc, yc);
    }
    ctx.lineTo(pts[lastIdx].x, pts[lastIdx].y);
    for (let i = lastIdx - 1; i >= 1; i--) {
      const xc = (rightPts[i].x + rightPts[i - 1].x) * 0.5;
      const yc = (rightPts[i].y + rightPts[i - 1].y) * 0.5;
      ctx.quadraticCurveTo(rightPts[i].x, rightPts[i].y, xc, yc);
    }
    ctx.lineTo(rightPts[0].x, rightPts[0].y);
    ctx.stroke();
  }

  if (highlightStyle && pts.length >= 5) {
    ctx.strokeStyle = highlightStyle;
    ctx.lineWidth = 0.72;
    ctx.beginPath();
    ctx.moveTo(pts[0].x + norms[0].x * (widths[0] * 0.32), pts[0].y + norms[0].y * (widths[0] * 0.32));
    for (let i = 1; i < lastIdx - 1; i++) {
      const ox = pts[i].x + norms[i].x * ((widths[i] || 0) * 0.30);
      const oy = pts[i].y + norms[i].y * ((widths[i] || 0) * 0.30);
      const nx = pts[i + 1].x + norms[i + 1].x * ((widths[i + 1] || 0) * 0.25);
      const ny = pts[i + 1].y + norms[i + 1].y * ((widths[i + 1] || 0) * 0.25);
      ctx.quadraticCurveTo(ox, oy, (ox + nx) * 0.5, (oy + ny) * 0.5);
    }
    ctx.stroke();
  }
}

/**
 * Renderuje wstęgę tkaniny (np. końce bandany) z prostym, prostopadłym ścięciem na końcu (blunt cut)
 * zachowując pełną, swobodną 2D fizykę wieloczłonowego łańcucha segmentów.
 */
export function drawRibbonBluntStrand(ctx, pts, norms, widths, fillStyle, strokeStyle = '#09090b', highlightStyle = null) {
  const leftPts = [];
  const rightPts = [];
  for (let i = 0; i < pts.length; i++) {
    const w = widths[i] ?? 0;
    leftPts.push({
      x: pts[i].x + norms[i].x * w,
      y: pts[i].y + norms[i].y * w
    });
    rightPts.push({
      x: pts[i].x - norms[i].x * w,
      y: pts[i].y - norms[i].y * w
    });
  }

  const lastIdx = leftPts.length - 1;

  ctx.beginPath();
  ctx.moveTo(leftPts[0].x, leftPts[0].y);
  for (let i = 1; i < lastIdx; i++) {
    const xc = (leftPts[i].x + leftPts[i + 1].x) * 0.5;
    const yc = (leftPts[i].y + leftPts[i + 1].y) * 0.5;
    ctx.quadraticCurveTo(leftPts[i].x, leftPts[i].y, xc, yc);
  }
  // Proste zakończenie wstęgi (blunt cut) – z lewej do prawej krawędzi
  ctx.lineTo(leftPts[lastIdx].x, leftPts[lastIdx].y);
  ctx.lineTo(rightPts[lastIdx].x, rightPts[lastIdx].y);
  for (let i = lastIdx - 1; i >= 1; i--) {
    const xc = (rightPts[i].x + rightPts[i - 1].x) * 0.5;
    const yc = (rightPts[i].y + rightPts[i - 1].y) * 0.5;
    ctx.quadraticCurveTo(rightPts[i].x, rightPts[i].y, xc, yc);
  }
  ctx.lineTo(rightPts[0].x, rightPts[0].y);
  ctx.closePath();

  ctx.fillStyle = fillStyle;
  ctx.fill();

  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 0.85;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(leftPts[0].x, leftPts[0].y);
    for (let i = 1; i < lastIdx; i++) {
      const xc = (leftPts[i].x + leftPts[i + 1].x) * 0.5;
      const yc = (leftPts[i].y + leftPts[i + 1].y) * 0.5;
      ctx.quadraticCurveTo(leftPts[i].x, leftPts[i].y, xc, yc);
    }
    // Prosta krawędź na końcu wstęgi!
    ctx.lineTo(leftPts[lastIdx].x, leftPts[lastIdx].y);
    ctx.lineTo(rightPts[lastIdx].x, rightPts[lastIdx].y);
    for (let i = lastIdx - 1; i >= 1; i--) {
      const xc = (rightPts[i].x + rightPts[i - 1].x) * 0.5;
      const yc = (rightPts[i].y + rightPts[i - 1].y) * 0.5;
      ctx.quadraticCurveTo(rightPts[i].x, rightPts[i].y, xc, yc);
    }
    ctx.lineTo(rightPts[0].x, rightPts[0].y);
    ctx.stroke();
  }

  // Wewnętrzny szew / akcent światła wzdłuż środka wstęgi
  if (highlightStyle && pts.length >= 4) {
    ctx.strokeStyle = highlightStyle;
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo((leftPts[0].x + rightPts[0].x) * 0.5, (leftPts[0].y + rightPts[0].y) * 0.5);
    for (let i = 1; i <= lastIdx; i++) {
      const mx = (leftPts[i].x + rightPts[i].x) * 0.5;
      const my = (leftPts[i].y + rightPts[i].y) * 0.5;
      ctx.lineTo(mx, my);
    }
    ctx.stroke();
  }
}

export function drawCharacterHairProfile(ctx, p, v, currentFacingDir, torsoTilt, headPitch, hasHelmet) {
  const rawStyle = String(v.hairStyle || 'buzzcut').toLowerCase();
  const style = (rawStyle === 'shaved' || rawStyle === 'none') ? 'buzzcut' : rawStyle;
  const pal = getHairPalette(v.hairColor || v.hairColor0 || '#18181b');

  const rawHeadgear = String((v && v.headgearStyle) || 'none').toLowerCase();
  const headgear = (rawHeadgear === 'brak' || rawHeadgear === 'shaved') ? 'none' : rawHeadgear;
  const isBalaclava = (headgear === 'balaclava');
  const hasHat = (headgear === 'beret' || headgear === 'cap' || headgear === 'boonie');

  // W pełnej kominiarce taktycznej cała głowa i fryzura są szczelnie schowane pod materiałem
  if (isBalaclava) {
    return;
  }

  // 1. Subtelne cieniowanie wygolonych skroni / potylicy (fade bazowy dla krótkich/podgolonych fryzur)
  if (style === 'buzzcut' || style === 'crewcut' || style === 'mohawk' || style === 'slickback' || style === 'topknot') {
    const buzzGrad = ctx.createLinearGradient(-6.2, -6.5, 2.2, 0.5);
    buzzGrad.addColorStop(0.0, pal.fadeStart);
    buzzGrad.addColorStop(0.6, pal.fadeMid);
    buzzGrad.addColorStop(1.0, pal.fadeEnd);

    ctx.beginPath();
    ctx.moveTo(-6.0, -1.8);
    ctx.quadraticCurveTo(-5.4, -6.8, -1.2, -7.0);
    ctx.quadraticCurveTo(2.4, -6.8, 3.8, -5.0);
    ctx.quadraticCurveTo(1.0, -3.0, -2.5, -1.0);
    ctx.closePath();
    ctx.fillStyle = buzzGrad;
    ctx.fill();
  }

  if (style === 'buzzcut') {
    return;
  }

  const hairGrad = ctx.createLinearGradient(-6.5, -10.5, 4.5, 2.5);
  hairGrad.addColorStop(0.0, pal.dark);
  hairGrad.addColorStop(0.55, pal.base);
  hairGrad.addColorStop(1.0, pal.light);

  // 2. KRÓTKIE FRYZURY NA CZASZCE (ukrywane gdy nałożony jest pełny hełm balistyczny, beret, czapka lub kapelusz)
  if (!hasHelmet && !hasHat) {
    if (style === 'crewcut') {
      // Wojskowy jeżyk (Flat Top / High & Tight)
      ctx.beginPath();
      ctx.moveTo(-5.6, -3.6);
      ctx.quadraticCurveTo(-6.1, -6.4, -4.7, -8.3);
      ctx.lineTo(0.2, -8.8);
      ctx.lineTo(4.7, -8.5);
      ctx.quadraticCurveTo(4.6, -6.6, 4.1, -5.1);
      ctx.lineTo(1.8, -5.3);
      ctx.quadraticCurveTo(0.4, -4.4, -1.8, -4.1);
      ctx.quadraticCurveTo(-4.0, -4.0, -5.6, -3.6);
      ctx.closePath();
      ctx.fillStyle = hairGrad;
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      ctx.strokeStyle = pal.highlight;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      for (let hx = -3.8; hx <= 3.8; hx += 1.25) {
        ctx.moveTo(hx, -6.8);
        ctx.lineTo(hx + 0.3, -8.3);
      }
      ctx.stroke();

    } else if (style === 'mohawk') {
      // Kultowy Irokez (Soldat Mohawk) – 5 ostrych, wygiętych w tył kolców od czoła po kark
      ctx.beginPath();
      ctx.moveTo(-5.7, 1.4);
      ctx.quadraticCurveTo(-7.6, 0.8, -8.8, -0.4);
      ctx.quadraticCurveTo(-7.4, -1.3, -6.4, -1.8);
      ctx.quadraticCurveTo(-8.6, -2.8, -9.8, -4.6);
      ctx.quadraticCurveTo(-7.8, -5.1, -6.1, -5.2);
      ctx.quadraticCurveTo(-7.2, -7.8, -7.4, -10.6);
      ctx.quadraticCurveTo(-5.0, -9.2, -3.5, -7.4);
      ctx.quadraticCurveTo(-3.2, -10.2, -1.8, -12.0);
      ctx.quadraticCurveTo(-0.2, -10.2, 0.7, -7.5);
      ctx.quadraticCurveTo(1.8, -10.0, 4.1, -11.2);
      ctx.quadraticCurveTo(4.3, -8.2, 3.6, -5.6);
      ctx.quadraticCurveTo(0.8, -6.4, -2.2, -5.8);
      ctx.quadraticCurveTo(-4.6, -4.0, -4.8, -0.8);
      ctx.lineTo(-5.7, 1.4);
      ctx.closePath();
      ctx.fillStyle = hairGrad;
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      ctx.strokeStyle = pal.highlight;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(2.4, -6.4);
      ctx.lineTo(3.4, -10.0);
      ctx.moveTo(-0.8, -7.0);
      ctx.lineTo(-1.5, -10.8);
      ctx.moveTo(-4.4, -6.2);
      ctx.lineTo(-6.6, -9.5);
      ctx.stroke();

    } else if (style === 'slickback') {
      // Zaczes do tyłu schodzący po boku głowy i zahaczający górę ucha
      ctx.beginPath();
      ctx.moveTo(4.1, -5.2);
      ctx.quadraticCurveTo(5.1, -7.2, 3.6, -8.5);
      ctx.bezierCurveTo(0.8, -9.6, -3.6, -9.2, -7.8, -5.4);
      ctx.lineTo(-6.1, -4.5);
      ctx.lineTo(-7.9, -3.2);
      ctx.lineTo(-5.8, -2.4);
      ctx.lineTo(-7.1, -1.0);
      // Bok głowy i lekkie przysłonięcie górnej krawędzi ucha
      ctx.quadraticCurveTo(-4.6, -0.6, -2.4, -1.4);
      ctx.quadraticCurveTo(-0.5, -2.2, 0.8, -3.5);
      ctx.quadraticCurveTo(1.6, -4.5, 4.1, -5.2);
      ctx.closePath();
      ctx.fillStyle = hairGrad;
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      ctx.strokeStyle = pal.highlight;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(3.4, -7.0);
      ctx.quadraticCurveTo(-0.5, -8.2, -5.8, -5.0);
      ctx.moveTo(1.8, -5.0);
      ctx.quadraticCurveTo(-1.5, -5.4, -5.5, -2.8);
      ctx.stroke();

    } else if (style === 'messy') {
      // Krótkie potargane włosy zachodzące na skroń, bok głowy i górną połowę ucha
      ctx.beginPath();
      ctx.moveTo(-5.0, 2.4);
      ctx.lineTo(-6.8, 1.3);
      ctx.lineTo(-5.9, 0.2);
      ctx.lineTo(-7.4, -1.4);
      ctx.lineTo(-6.2, -2.6);
      ctx.lineTo(-7.6, -4.8);
      ctx.lineTo(-5.8, -5.8);
      ctx.lineTo(-6.2, -8.2);
      ctx.lineTo(-4.0, -7.8);
      ctx.lineTo(-3.2, -9.7);
      ctx.lineTo(-1.1, -8.3);
      ctx.lineTo(0.6, -9.8);
      ctx.lineTo(2.1, -8.1);
      ctx.lineTo(4.2, -9.0);
      ctx.lineTo(3.8, -7.0);
      // Kosmyki grzywki nad czołem
      ctx.lineTo(5.4, -5.8);
      ctx.lineTo(4.1, -5.1);
      ctx.lineTo(5.0, -4.0);
      // Zejście po skroni i boku głowy z kosmykiem przysłaniającym ucho (-2.6, -0.6)
      ctx.quadraticCurveTo(2.6, -4.2, 1.0, -3.2);
      ctx.lineTo(0.2, -1.0);
      ctx.lineTo(-1.1, -2.1);
      ctx.lineTo(-2.2, 0.1);
      ctx.lineTo(-3.3, -1.1);
      ctx.quadraticCurveTo(-4.4, 0.6, -5.0, 2.4);
      ctx.closePath();
      ctx.fillStyle = hairGrad;
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      ctx.strokeStyle = pal.highlight;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(-2.8, -8.4);
      ctx.lineTo(-1.2, -5.2);
      ctx.moveTo(0.4, -8.8);
      ctx.lineTo(1.2, -4.8);
      ctx.moveTo(-5.5, -4.4);
      ctx.lineTo(-3.0, -2.2);
      ctx.stroke();
    }
  }

  // 3. DŁUGIE WŁOSY Z ZWIĘKSZONĄ SWOBODĄ FIZYKI 2D I BOGATYMI PASMAMI
  if (style === 'ponytail') {
    // 5 niezależnie pracujących pasm w końskim ogonie (podkład, pasma środkowe, gruba kita i swobodny kosmyk)
    const underChain = updateAndBuildHairChain(
      p, 'ponytail', currentFacingDir, torsoTilt, headPitch,
      -5.3, -1.9, 2.35, { id: 'pt_under', phase: -1.2, restOffset: -0.16, liftMult: 0.88, gravMult: 1.10, stiffMult: 0.90 }
    );
    const lowMidChain = updateAndBuildHairChain(
      p, 'ponytail', currentFacingDir, torsoTilt, headPitch,
      -5.45, -2.3, 2.50, { id: 'pt_low_mid', phase: -0.5, restOffset: -0.08, liftMult: 0.98, gravMult: 1.02, stiffMult: 0.95 }
    );
    const mainChain = updateAndBuildHairChain(
      p, 'ponytail', currentFacingDir, torsoTilt, headPitch,
      -5.6, -2.7, 2.65, { id: 'pt_main', phase: 0.0, restOffset: 0.0, liftMult: 1.08, gravMult: 0.95, stiffMult: 1.0 }
    );
    const highMidChain = updateAndBuildHairChain(
      p, 'ponytail', currentFacingDir, torsoTilt, headPitch,
      -5.68, -3.05, 2.55, { id: 'pt_high_mid', phase: 0.7, restOffset: 0.08, liftMult: 1.20, gravMult: 0.88, stiffMult: 1.08 }
    );
    const flyChain = updateAndBuildHairChain(
      p, 'ponytail', currentFacingDir, torsoTilt, headPitch,
      -5.75, -3.35, 2.40, { id: 'pt_fly', phase: 1.4, restOffset: 0.18, liftMult: 1.40, gravMult: 0.75, stiffMult: 1.18 }
    );

    drawTaperedHairStrand(ctx, underChain.pts, underChain.norms, [1.3, 1.5, 1.4, 1.1, 0.75, 0.40, 0.0], pal.dark, '#09090b', null);
    drawTaperedHairStrand(ctx, lowMidChain.pts, lowMidChain.norms, [1.6, 1.85, 1.7, 1.35, 0.95, 0.50, 0.0], pal.base, '#09090b', null);
    drawTaperedHairStrand(ctx, mainChain.pts, mainChain.norms, [2.1, 2.4, 2.2, 1.8, 1.30, 0.70, 0.0], hairGrad, '#09090b', pal.highlight);
    drawTaperedHairStrand(ctx, highMidChain.pts, highMidChain.norms, [1.5, 1.8, 1.65, 1.3, 0.90, 0.48, 0.0], hairGrad, '#09090b', pal.highlight);
    drawTaperedHairStrand(ctx, flyChain.pts, flyChain.norms, [1.0, 1.25, 1.15, 0.85, 0.60, 0.32, 0.0], hairGrad, '#09090b', pal.highlight);

    // Zaczesane włosy pokrywające potylicę, skroń i bok głowy wchodzące głęboko pod nakrycie głowy (eliminuje jakiekolwiek przerwy)
    ctx.beginPath();
    ctx.moveTo(-4.8, 2.3);
    ctx.quadraticCurveTo(-6.5, 0.0, -6.4, -3.2);
    if (!hasHelmet && !hasHat) {
      ctx.quadraticCurveTo(-5.7, -7.7, -1.0, -7.8);
      ctx.quadraticCurveTo(2.9, -7.5, 4.2, -5.2);
    } else {
      ctx.quadraticCurveTo(-5.6, -6.0, -1.0, -6.2);
      ctx.quadraticCurveTo(2.0, -5.8, 4.0, -4.4);
    }
    ctx.quadraticCurveTo(2.2, -4.6, 1.0, -3.2);
    ctx.quadraticCurveTo(-0.2, -1.4, -1.8, -0.5);
    ctx.quadraticCurveTo(-3.2, 0.1, -4.8, 2.3);
    ctx.closePath();
    ctx.fillStyle = hairGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    ctx.strokeStyle = pal.highlight;
    ctx.lineWidth = 0.72;
    ctx.beginPath();
    if (!hasHelmet && !hasHat) {
      ctx.moveTo(2.6, -6.2);
      ctx.quadraticCurveTo(-1.5, -6.2, -5.8, -3.1);
    }
    ctx.moveTo(0.8, -4.1);
    ctx.quadraticCurveTo(-2.4, -3.5, -5.7, -2.2);
    ctx.stroke();

  } else if (style === 'long_flowing') {
    // 1. Warstwa głębokiego podkładu (3 pasma przy karku i potylicy eliminujące jakiekolwiek prześwity)
    const deepNape = updateAndBuildHairChain(
      p, 'long_flowing', currentFacingDir, torsoTilt, headPitch,
      -3.8, -1.2, 2.50, { id: 'lf_0_nape', phase: 0.0, restOffset: -0.16, archRoot: 0.05, liftMult: 0.82, gravMult: 1.12, stiffMult: 0.88 }
    );
    const deepMid = updateAndBuildHairChain(
      p, 'long_flowing', currentFacingDir, torsoTilt, headPitch,
      -4.5, -2.2, 2.60, { id: 'lf_0_deepmid', phase: 0.4, restOffset: -0.10, archRoot: 0.08, liftMult: 0.86, gravMult: 1.08, stiffMult: 0.90 }
    );
    const deepBack = updateAndBuildHairChain(
      p, 'long_flowing', currentFacingDir, torsoTilt, headPitch,
      -5.2, -3.2, 2.70, { id: 'lf_1_deepback', phase: 0.8, restOffset: -0.04, archRoot: 0.12, liftMult: 0.92, gravMult: 1.04, stiffMult: 0.92 }
    );
    drawTaperedHairStrand(ctx, deepNape.pts, deepNape.norms, [1.8, 2.1, 1.95, 1.6, 1.15, 0.60, 0.0], pal.dark, '#09090b', null);
    drawTaperedHairStrand(ctx, deepMid.pts, deepMid.norms, [1.7, 2.0, 1.85, 1.5, 1.05, 0.55, 0.0], pal.dark, '#09090b', null);
    drawTaperedHairStrand(ctx, deepBack.pts, deepBack.norms, [2.0, 2.3, 2.15, 1.8, 1.25, 0.68, 0.0], pal.dark, '#09090b', null);

    // Baza u nasady potylicy i sklepienia czaszki (wchodzi głęboko pod nakrycie głowy, eliminując przerwę)
    ctx.beginPath();
    ctx.moveTo(-5.6, -1.5);
    ctx.quadraticCurveTo(-6.6, -4.5, -5.6, -6.4);
    if (!hasHelmet && !hasHat) {
      ctx.quadraticCurveTo(-4.2, -8.6, -0.8, -8.6);
      ctx.quadraticCurveTo(2.8, -8.4, 4.4, -5.8);
    } else {
      ctx.quadraticCurveTo(-3.8, -6.5, -0.8, -6.2);
      ctx.quadraticCurveTo(2.2, -6.0, 4.0, -4.6);
    }
    ctx.lineTo(4.7, -4.4);
    ctx.quadraticCurveTo(2.2, -4.4, 0.4, -3.2);
    ctx.quadraticCurveTo(-2.2, -1.8, -5.6, -1.5);
    ctx.closePath();
    ctx.fillStyle = pal.dark;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.85;
    ctx.stroke();

    // 2. BOGATE NIEZALEŻNE PASMA ZE SWOBODNĄ FIZYKĄ 2D
    const strandsOnHead = (hasHelmet || hasHat)
      ? [
          // Pasma karku, potylicy i ramion zakotwiczone głęboko pod nakryciem (od y = -4.8 do -3.0)
          // ze swobodną, bogatą fizyką 2D powiewającą za postacią
          { id: 'lf_h1', x: -5.4, y: -4.8, len: 3.10, widths: [1.8, 2.15, 2.0, 1.65, 1.20, 0.65, 0.0], col: pal.base, hl: pal.highlight, opts: { phase: 1.0, restOffset: 0.18, archRoot: 0.22, liftMult: 1.28, gravMult: 0.85, stiffMult: 0.98 } },
          { id: 'lf_h2', x: -4.8, y: -4.2, len: 3.00, widths: [1.8, 2.10, 1.95, 1.60, 1.15, 0.60, 0.0], col: hairGrad, hl: pal.highlight, opts: { phase: 1.8, restOffset: 0.10, archRoot: 0.16, liftMult: 1.20, gravMult: 0.90, stiffMult: 0.96 } },
          { id: 'lf_h3', x: -4.0, y: -3.8, len: 2.95, widths: [1.7, 2.05, 1.90, 1.55, 1.10, 0.58, 0.0], col: hairGrad, hl: pal.highlight, opts: { phase: 2.6, restOffset: 0.02, archRoot: 0.12, liftMult: 1.15, gravMult: 0.94, stiffMult: 0.95 } },
          { id: 'lf_h4', x: -3.0, y: -3.6, len: 2.85, widths: [1.6, 1.95, 1.80, 1.45, 1.05, 0.52, 0.0], col: hairGrad, hl: pal.highlight, opts: { phase: 3.4, restOffset: -0.04, archRoot: 0.08, liftMult: 1.12, gravMult: 0.96, stiffMult: 0.96 } },
          { id: 'lf_h5', x: -1.8, y: -3.8, len: 2.75, widths: [1.5, 1.85, 1.70, 1.35, 0.95, 0.48, 0.0], col: hairGrad, hl: pal.highlight, opts: { phase: 4.2, restOffset: -0.08, archRoot: 0.06, liftMult: 1.15, gravMult: 0.94, stiffMult: 0.98 } },
          { id: 'lf_h6', x: -0.6, y: -4.0, len: 2.60, widths: [1.3, 1.60, 1.45, 1.15, 0.80, 0.40, 0.0], col: hairGrad, hl: pal.highlight, opts: { phase: 5.0, restOffset: -0.14, archRoot: 0.04, liftMult: 1.22, gravMult: 0.90, stiffMult: 1.02 } },
          { id: 'lf_h7', x: -5.8, y: -3.2, len: 2.90, widths: [1.7, 2.00, 1.85, 1.50, 1.08, 0.55, 0.0], col: pal.base, hl: null,          opts: { phase: 5.8, restOffset: 0.12, archRoot: 0.14, liftMult: 1.22, gravMult: 0.88, stiffMult: 0.97 } }
        ]
      : [
          // A. Tylna potylica i kaskada karku
          { id: 'lf_2_backtop',    x: -4.8, y: -6.4, len: 3.10, widths: [1.7, 2.05, 1.95, 1.6, 1.15, 0.60, 0.0], col: pal.base, hl: null,          opts: { phase: 1.2, restOffset: 0.18, archRoot: 0.24, liftMult: 1.20, gravMult: 0.88, stiffMult: 1.02 } },
          { id: 'lf_3_backmid',    x: -5.4, y: -4.4, len: 2.95, widths: [1.75, 2.1, 1.95, 1.6, 1.15, 0.60, 0.0], col: hairGrad, hl: pal.highlight, opts: { phase: 1.8, restOffset: 0.10, archRoot: 0.16, liftMult: 1.10, gravMult: 0.94, stiffMult: 0.98 } },
          { id: 'lf_3b_occipital', x: -5.8, y: -2.6, len: 2.85, widths: [1.65, 2.0, 1.85, 1.5, 1.05, 0.55, 0.0], col: pal.base, hl: null,          opts: { phase: 2.5, restOffset: 0.02, archRoot: 0.12, liftMult: 1.04, gravMult: 0.98, stiffMult: 0.95 } },
          // B. Szczyt czaszki i korona głowy
          { id: 'lf_4_crowntop',   x: -2.4, y: -7.7, len: 3.30, widths: [1.8, 2.15, 2.0, 1.65, 1.2, 0.62, 0.0], col: hairGrad, hl: pal.highlight, opts: { phase: 3.1, restOffset: 0.12, archRoot: 0.36, liftMult: 1.25, gravMult: 0.86, stiffMult: 1.04 } },
          { id: 'lf_5_parietal',   x: -3.2, y: -5.2, len: 3.00, widths: [1.7, 2.0, 1.85, 1.5, 1.08, 0.56, 0.0], col: pal.base, hl: null,          opts: { phase: 3.8, restOffset: -0.02, archRoot: 0.20, liftMult: 1.00, gravMult: 0.98, stiffMult: 0.95 } },
          // C. Środek głowy, bok czaszki i strefa ucha
          { id: 'lf_6_topcenter',  x:  0.2, y: -7.6, len: 3.25, widths: [1.75, 2.1, 1.95, 1.6, 1.15, 0.60, 0.0], col: hairGrad, hl: pal.highlight, opts: { phase: 4.4, restOffset: 0.06, archRoot: 0.42, liftMult: 1.18, gravMult: 0.90, stiffMult: 1.00 } },
          { id: 'lf_6b_topmid',    x: -1.0, y: -6.6, len: 3.10, widths: [1.65, 1.95, 1.8, 1.45, 1.05, 0.54, 0.0], col: hairGrad, hl: pal.highlight, opts: { phase: 5.0, restOffset: 0.00, archRoot: 0.30, liftMult: 1.12, gravMult: 0.94, stiffMult: 0.98 } },
          { id: 'lf_7_sideear',    x: -1.2, y: -5.3, len: 2.90, widths: [1.65, 1.95, 1.8, 1.45, 1.02, 0.52, 0.0], col: hairGrad, hl: pal.highlight, opts: { phase: 5.6, restOffset: -0.06, archRoot: 0.22, liftMult: 1.10, gravMult: 0.95, stiffMult: 1.00 } },
          { id: 'lf_7b_overear',   x: -0.4, y: -4.2, len: 2.80, widths: [1.5, 1.8, 1.65, 1.35, 0.95, 0.48, 0.0], col: pal.base, hl: null,          opts: { phase: 6.1, restOffset: -0.10, archRoot: 0.18, liftMult: 1.05, gravMult: 0.98, stiffMult: 0.96 } },
          // D. Przód głowy, czoło i skroń
          { id: 'lf_8_forehead',   x:  2.5, y: -6.5, len: 3.10, widths: [1.5, 1.85, 1.75, 1.4, 1.0, 0.52, 0.0],  col: hairGrad, hl: pal.highlight, opts: { phase: 6.7, restOffset: -0.04, archRoot: 0.48, liftMult: 1.28, gravMult: 0.85, stiffMult: 1.06 } },
          { id: 'lf_9_temple',     x:  1.2, y: -4.5, len: 2.65, widths: [1.25, 1.5, 1.38, 1.1, 0.76, 0.40, 0.0], col: hairGrad, hl: pal.highlight, opts: { phase: 7.3, restOffset: -0.14, archRoot: 0.24, liftMult: 1.20, gravMult: 0.90, stiffMult: 1.04 } },
          // E. Lekki, luźny kosmyk powiewający z maksymalną swobodą
          { id: 'lf_fly_loose',    x: -2.0, y: -8.0, len: 2.85, widths: [0.95, 1.20, 1.05, 0.80, 0.55, 0.28, 0.0], col: hairGrad, hl: pal.highlight, opts: { phase: 8.0, restOffset: 0.22, archRoot: 0.38, liftMult: 1.45, gravMult: 0.75, stiffMult: 1.16 } }
        ];

    for (let s = 0; s < strandsOnHead.length; s++) {
      const st = strandsOnHead[s];
      const chain = updateAndBuildHairChain(
        p, 'long_flowing', currentFacingDir, torsoTilt, headPitch,
        st.x, st.y, st.len, { id: st.id, ...st.opts }
      );
      drawTaperedHairStrand(ctx, chain.pts, chain.norms, st.widths, st.col, '#09090b', st.hl);
    }

  } else if (style === 'dreadlocks' || style === 'half_up') {
    // 3. PÓŁ-ROZPUSZCZONE Z DODATKOWYM KUCYKIEM (HALF-UP HALF-DOWN)
    // Krótsza długa wersja: rozpuszczone włosy do karku i ramion z dodatkowym kucykiem spiętym na koronie głowy

    // A. Warstwa głębokiego podkładu przy karku (3 pasma eliminujące jakiekolwiek prześwity)
    const baseNape1 = updateAndBuildHairChain(
      p, 'dreadlocks', currentFacingDir, torsoTilt, headPitch,
      -3.8, -1.2, 2.20, { id: 'hu_b_nape1', phase: 0.0, restOffset: -0.16, archRoot: 0.04, liftMult: 0.85, gravMult: 1.10, stiffMult: 0.90 }
    );
    const baseNape2 = updateAndBuildHairChain(
      p, 'dreadlocks', currentFacingDir, torsoTilt, headPitch,
      -4.5, -2.2, 2.30, { id: 'hu_b_nape2', phase: 0.5, restOffset: -0.10, archRoot: 0.06, liftMult: 0.88, gravMult: 1.05, stiffMult: 0.92 }
    );
    const baseBack = updateAndBuildHairChain(
      p, 'dreadlocks', currentFacingDir, torsoTilt, headPitch,
      -5.2, -3.2, 2.40, { id: 'hu_b_back', phase: 1.0, restOffset: -0.04, archRoot: 0.10, liftMult: 0.92, gravMult: 1.02, stiffMult: 0.94 }
    );
    drawTaperedHairStrand(ctx, baseNape1.pts, baseNape1.norms, [1.6, 1.9, 1.75, 1.45, 1.05, 0.55, 0.0], pal.dark, '#09090b', null);
    drawTaperedHairStrand(ctx, baseNape2.pts, baseNape2.norms, [1.7, 2.0, 1.85, 1.50, 1.10, 0.58, 0.0], pal.dark, '#09090b', null);
    drawTaperedHairStrand(ctx, baseBack.pts, baseBack.norms, [1.8, 2.1, 1.95, 1.55, 1.15, 0.60, 0.0], pal.dark, '#09090b', null);

    // B. Baza sklepienia czaszki zebrana ku nasadzie kucyka / karku (wchodzi pod nakrycie głowy, eliminując przerwę)
    ctx.beginPath();
    ctx.moveTo(-5.5, -1.8);
    ctx.quadraticCurveTo(-6.6, -4.4, -5.6, -6.4);
    if (!hasHelmet && !hasHat) {
      ctx.quadraticCurveTo(-4.0, -8.3, -0.8, -8.3);
      ctx.quadraticCurveTo(2.8, -8.1, 4.3, -5.6);
    } else {
      ctx.quadraticCurveTo(-3.8, -6.5, -0.8, -6.2);
      ctx.quadraticCurveTo(2.2, -6.0, 4.0, -4.4);
    }
    ctx.lineTo(4.6, -4.2);
    ctx.quadraticCurveTo(2.4, -4.2, 0.8, -3.2);
    ctx.quadraticCurveTo(-1.8, -1.8, -5.5, -1.8);
    ctx.closePath();
    ctx.fillStyle = hairGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.90;
    ctx.stroke();

    if (!hasHelmet && !hasHat) {
      // Płynne linie zaczesu biegnące od czoła i skroni w stronę nasady kucyka
      ctx.strokeStyle = pal.highlight;
      ctx.lineWidth = 0.70;
      ctx.beginPath();
      ctx.moveTo(3.2, -6.4);
      ctx.quadraticCurveTo(0.2, -7.2, -4.2, -6.0);
      ctx.moveTo(1.8, -4.6);
      ctx.quadraticCurveTo(-1.0, -5.2, -4.4, -5.4);
      ctx.stroke();
    }

    // C. Rozpuszczone pasma opadające na kark i ramiona (o długościach segmentów 2.10–2.65, swobodna fizyka 2D)
    const looseStrands = (hasHelmet || hasHat)
      ? [
          { id: 'hu_ls_h1', x: -5.4, y: -4.4, len: 2.65, widths: [1.75, 2.10, 1.95, 1.55, 1.10, 0.58, 0.0], col: pal.base, hl: pal.highlight, opts: { phase: 1.0, restOffset: 0.16, archRoot: 0.18, liftMult: 1.25, gravMult: 0.88, stiffMult: 0.98 } },
          { id: 'hu_ls_h2', x: -4.8, y: -3.8, len: 2.55, widths: [1.70, 2.05, 1.90, 1.50, 1.05, 0.52, 0.0], col: hairGrad, hl: pal.highlight, opts: { phase: 1.8, restOffset: 0.08, archRoot: 0.14, liftMult: 1.18, gravMult: 0.92, stiffMult: 0.96 } },
          { id: 'hu_ls_h3', x: -3.8, y: -3.4, len: 2.45, widths: [1.60, 1.95, 1.80, 1.40, 0.95, 0.48, 0.0], col: hairGrad, hl: pal.highlight, opts: { phase: 2.6, restOffset: 0.00, archRoot: 0.10, liftMult: 1.14, gravMult: 0.95, stiffMult: 0.96 } },
          { id: 'hu_ls_h4', x: -2.6, y: -3.2, len: 2.35, widths: [1.50, 1.80, 1.65, 1.30, 0.88, 0.44, 0.0], col: hairGrad, hl: pal.highlight, opts: { phase: 3.4, restOffset: -0.06, archRoot: 0.06, liftMult: 1.15, gravMult: 0.94, stiffMult: 0.98 } },
          { id: 'hu_ls_h5', x: -5.6, y: -2.8, len: 2.50, widths: [1.65, 1.95, 1.80, 1.45, 1.00, 0.50, 0.0], col: pal.base, hl: null,          opts: { phase: 4.2, restOffset: 0.10, archRoot: 0.12, liftMult: 1.20, gravMult: 0.90, stiffMult: 0.97 } }
        ]
      : [
          { id: 'hu_ls_backtop', x: -5.4, y: -4.4, len: 2.45, widths: [1.65, 2.0, 1.85, 1.5, 1.05, 0.55, 0.0],  col: hairGrad, hl: pal.highlight, opts: { phase: 1.2, restOffset: 0.12, archRoot: 0.18, liftMult: 1.12, gravMult: 0.94, stiffMult: 1.0 } },
          { id: 'hu_ls_backmid', x: -5.6, y: -2.6, len: 2.40, widths: [1.6, 1.9, 1.75, 1.4, 1.0, 0.50, 0.0],    col: pal.base, hl: null,          opts: { phase: 1.8, restOffset: 0.04, archRoot: 0.12, liftMult: 1.06, gravMult: 0.98, stiffMult: 0.96 } },
          { id: 'hu_ls_sideear', x: -2.8, y: -4.8, len: 2.35, widths: [1.55, 1.85, 1.7, 1.35, 0.95, 0.48, 0.0], col: hairGrad, hl: pal.highlight, opts: { phase: 2.5, restOffset: -0.04, archRoot: 0.22, liftMult: 1.10, gravMult: 0.95, stiffMult: 1.0 } },
          { id: 'hu_ls_overear', x: -1.2, y: -4.2, len: 2.25, widths: [1.45, 1.75, 1.6, 1.25, 0.88, 0.44, 0.0], col: pal.base, hl: null,          opts: { phase: 3.2, restOffset: -0.08, archRoot: 0.18, liftMult: 1.08, gravMult: 0.98, stiffMult: 0.98 } },
          { id: 'hu_ls_temple',  x:  0.6, y: -4.2, len: 2.10, widths: [1.2, 1.45, 1.3, 1.0, 0.70, 0.35, 0.0],   col: hairGrad, hl: pal.highlight, opts: { phase: 3.9, restOffset: -0.14, archRoot: 0.14, liftMult: 1.15, gravMult: 0.92, stiffMult: 1.02 } },
          { id: 'hu_ls_fly',     x: -2.2, y: -6.0, len: 2.25, widths: [0.95, 1.2, 1.05, 0.8, 0.55, 0.28, 0.0],  col: hairGrad, hl: pal.highlight, opts: { phase: 4.6, restOffset: 0.18, archRoot: 0.26, liftMult: 1.35, gravMult: 0.80, stiffMult: 1.12 } }
        ];

    for (let s = 0; s < looseStrands.length; s++) {
      const st = looseStrands[s];
      const chain = updateAndBuildHairChain(
        p, 'dreadlocks', currentFacingDir, torsoTilt, headPitch,
        st.x, st.y, st.len, { id: st.id, ...st.opts }
      );
      drawTaperedHairStrand(ctx, chain.pts, chain.norms, st.widths, st.col, '#09090b', st.hl);
    }

    // D. Dodatkowy kucyk spięty na koronie głowy (half-up ponytail z frotką)
    if (!hasHelmet && !hasHat) {
      const ptUnder = updateAndBuildHairChain(
        p, 'dreadlocks', currentFacingDir, torsoTilt, headPitch,
        -4.7, -5.6, 2.25,
        { id: 'hu_pt_under', phase: -0.6, restOffset: -0.10, archRoot: 0.24, liftMult: 0.94, gravMult: 1.06, stiffMult: 0.95, restProfile: PONYTAIL_ARCH_PROFILE }
      );
      const ptMain = updateAndBuildHairChain(
        p, 'dreadlocks', currentFacingDir, torsoTilt, headPitch,
        -4.9, -5.9, 2.45,
        { id: 'hu_pt_main', phase: 0.3, restOffset: 0.06, archRoot: 0.32, liftMult: 1.16, gravMult: 0.92, stiffMult: 1.02, restProfile: PONYTAIL_ARCH_PROFILE }
      );
      const ptTop = updateAndBuildHairChain(
        p, 'dreadlocks', currentFacingDir, torsoTilt, headPitch,
        -5.1, -6.2, 2.30,
        { id: 'hu_pt_top', phase: 1.0, restOffset: 0.14, archRoot: 0.38, liftMult: 1.26, gravMult: 0.86, stiffMult: 1.06, restProfile: PONYTAIL_ARCH_PROFILE }
      );
      const ptFly = updateAndBuildHairChain(
        p, 'dreadlocks', currentFacingDir, torsoTilt, headPitch,
        -5.2, -6.5, 2.10,
        { id: 'hu_pt_fly', phase: 1.7, restOffset: 0.22, archRoot: 0.44, liftMult: 1.42, gravMult: 0.76, stiffMult: 1.15, restProfile: PONYTAIL_ARCH_PROFILE }
      );

      drawTaperedHairStrand(ctx, ptUnder.pts, ptUnder.norms, [1.3, 1.55, 1.4, 1.1, 0.75, 0.38, 0.0], pal.dark, '#09090b', null);
      drawTaperedHairStrand(ctx, ptMain.pts, ptMain.norms, [1.9, 2.25, 2.05, 1.65, 1.20, 0.62, 0.0], hairGrad, '#09090b', pal.highlight);
      drawTaperedHairStrand(ctx, ptTop.pts, ptTop.norms, [1.4, 1.7, 1.55, 1.2, 0.85, 0.44, 0.0], hairGrad, '#09090b', pal.highlight);
      drawTaperedHairStrand(ctx, ptFly.pts, ptFly.norms, [0.9, 1.15, 1.0, 0.75, 0.50, 0.25, 0.0], hairGrad, '#09090b', pal.highlight);

      // Frotka / opaska spinająca kucyk u nasady
      ctx.save();
      ctx.translate(-4.8, -5.8);
      ctx.rotate(0.35);
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.15, 1.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(-0.2, 0, 0.85, 1.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.light;
      ctx.beginPath();
      ctx.ellipse(-0.3, 0, 0.35, 1.05, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

  } else if (style === 'topknot') {
    if (hasHelmet || hasHat) {
      return;
    }
    // 3 niezależne pasma kitki wojownika
    const tkUnder = updateAndBuildHairChain(
      p, 'topknot', currentFacingDir, torsoTilt, headPitch,
      -4.5, -5.9, 2.05, { id: 'tk_under', phase: -0.8, restOffset: -0.14, liftMult: 0.92, gravMult: 1.05, stiffMult: 0.95 }
    );
    const tkMain = updateAndBuildHairChain(
      p, 'topknot', currentFacingDir, torsoTilt, headPitch,
      -4.6, -6.4, 2.25, { id: 'tk_main', phase: 0.4, restOffset: 0.08, liftMult: 1.22, gravMult: 0.88, stiffMult: 1.08 }
    );
    const tkFly = updateAndBuildHairChain(
      p, 'topknot', currentFacingDir, torsoTilt, headPitch,
      -4.8, -6.8, 1.95, { id: 'tk_fly', phase: 1.3, restOffset: 0.20, liftMult: 1.38, gravMult: 0.78, stiffMult: 1.15 }
    );

    drawTaperedHairStrand(ctx, tkUnder.pts, tkUnder.norms, [1.3, 1.6, 1.45, 1.15, 0.8, 0.42, 0.0], pal.dark, '#09090b', null);
    drawTaperedHairStrand(ctx, tkMain.pts, tkMain.norms, [1.65, 2.05, 1.85, 1.45, 1.05, 0.55, 0.0], hairGrad, '#09090b', pal.highlight);
    drawTaperedHairStrand(ctx, tkFly.pts, tkFly.norms, [0.95, 1.2, 1.05, 0.8, 0.55, 0.28, 0.0], hairGrad, '#09090b', pal.highlight);

    if (!hasHelmet) {
      ctx.beginPath();
      ctx.moveTo(-5.3, -4.6);
      ctx.quadraticCurveTo(-5.5, -7.7, -1.2, -7.9);
      ctx.quadraticCurveTo(2.6, -7.5, 4.0, -5.4);
      ctx.quadraticCurveTo(1.5, -5.0, -1.0, -4.4);
      ctx.quadraticCurveTo(-3.4, -4.2, -5.3, -4.6);
      ctx.closePath();
      ctx.fillStyle = hairGrad;
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      ctx.strokeStyle = pal.highlight;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(2.2, -6.2);
      ctx.quadraticCurveTo(-1.2, -6.8, -4.8, -6.1);
      ctx.stroke();
    }
  }
}

export function drawCharacterHairOverEarProfile(ctx, v, pal, hasHelmet) {
  if (hasHelmet) return;
  const rawHeadgear = String((v && v.headgearStyle) || 'none').toLowerCase();
  if (rawHeadgear === 'balaclava') return;
  const style = String(v.hairStyle || 'buzzcut').toLowerCase();

  if (style === 'messy' || style === 'dreadlocks' || style === 'half_up') {
    // Kosmyk skroniowy przy uchu opadający przed małżowinę uszną
    ctx.fillStyle = pal.base;
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(-0.6, -2.6);
    ctx.lineTo(0.2, 0.4);
    ctx.lineTo(-1.1, -0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

export function drawCharacterHairFrontOrBack(ctx, v, isBackView, hasHelmet) {
  const rawStyle = String(v.hairStyle || 'buzzcut').toLowerCase();
  const style = (rawStyle === 'shaved' || rawStyle === 'none') ? 'buzzcut' : rawStyle;
  const pal = getHairPalette(v.hairColor || v.hairColor0 || '#18181b');

  const buzzGrad = ctx.createLinearGradient(0, -8.0, 0, 1.0);
  buzzGrad.addColorStop(0.0, pal.fadeStart);
  buzzGrad.addColorStop(0.7, pal.fadeMid);
  buzzGrad.addColorStop(1.0, pal.fadeEnd);

  if (isBackView) {
    ctx.beginPath();
    ctx.ellipse(0, -2.5, 4.7, 4.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = buzzGrad;
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, -2.5, 4.8, Math.PI * 0.85, Math.PI * 0.15, true);
    ctx.closePath();
    ctx.fillStyle = buzzGrad;
    ctx.fill();
  }

  if (hasHelmet || style === 'buzzcut') return;

  ctx.fillStyle = pal.base;
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.9;

  if (style === 'mohawk') {
    ctx.beginPath();
    ctx.moveTo(-1.6, -5.5);
    ctx.lineTo(0, -11.5);
    ctx.lineTo(1.6, -5.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === 'crewcut') {
    ctx.beginPath();
    ctx.moveTo(-4.6, -4.5);
    ctx.lineTo(-4.8, -8.2);
    ctx.lineTo(4.8, -8.2);
    ctx.lineTo(4.6, -4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === 'dreadlocks' || style === 'half_up') {
    ctx.beginPath();
    ctx.arc(0, -2.8, 5.2, Math.PI * 0.92, Math.PI * 0.08, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (isBackView) {
      // Zebrany kucyk na górze widoczny od tyłu
      ctx.fillStyle = pal.dark;
      ctx.beginPath();
      ctx.ellipse(0, -7.0, 1.5, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.arc(0, -2.8, 5.2, Math.PI * 0.92, Math.PI * 0.08, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/**
 * Renderuje samą głowę z wybraną fryzurą i kolorem włosów na kafelku wyboru w Kreatorze Postaci.
 */
export function drawHeadHairPreview(ctx, canvasW, canvasH, hairStyle = 'buzzcut', hairColor = '#18181b') {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasW, canvasH);

  const v = {
    ...DEFAULT_VISUALS,
    hairStyle,
    hairColor
  };
  const hairPal = getHairPalette(hairColor);

  // Statyczny obiekt podglądu z naturalną falą S i rozdzieleniem pasm dla kafelka
  const tileDummy = {
    _isStaticTile: true
  };

  ctx.save();
  // Wyśrodkowanie głowy wraz z miejscem na wysokiego irokeza u góry oraz długie włosy z tyłu/dołu
  ctx.translate(canvasW * 0.58, canvasH * 0.50);
  const scale = Math.min(canvasW, canvasH) / 29.0;
  ctx.scale(scale, scale);

  // 1. Krótki odcinek szyi pod głową (by długie włosy naturalnie układały się za karkiem)
  const neckGrad = ctx.createLinearGradient(-3.2, 0, 2.0, 0);
  neckGrad.addColorStop(0.0, v.skinDark);
  neckGrad.addColorStop(0.5, v.skinBack);
  neckGrad.addColorStop(1.0, v.skinMid);

  ctx.beginPath();
  ctx.moveTo(-3.0, 2.2);
  ctx.lineTo(-3.2, 7.6);
  ctx.quadraticCurveTo(-0.5, 8.4, 2.0, 7.6);
  ctx.lineTo(1.8, 3.2);
  ctx.closePath();
  ctx.fillStyle = neckGrad;
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // Cień pod żuchwą
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.moveTo(-0.8, 3.2);
  ctx.lineTo(1.8, 3.8);
  ctx.lineTo(1.7, 5.4);
  ctx.lineTo(-0.8, 4.4);
  ctx.closePath();
  ctx.fill();

  // 2. Czaszka i profil twarzy
  const faceGrad = ctx.createLinearGradient(-5.0, 0, 7.0, 0);
  faceGrad.addColorStop(0.0, v.skinBack);
  faceGrad.addColorStop(0.5, v.skinMid);
  faceGrad.addColorStop(1.0, v.skinLight);

  ctx.beginPath();
  ctx.moveTo(-4.6, 2.5);
  ctx.quadraticCurveTo(-6.4, 0.2, -6.0, -2.8);
  ctx.quadraticCurveTo(-5.4, -7.2, -1.2, -7.2);
  ctx.quadraticCurveTo(2.8, -7.0, 4.2, -5.2);
  ctx.lineTo(4.4, -3.4);
  ctx.lineTo(6.8, -1.0);
  ctx.lineTo(5.1, -0.4);
  ctx.lineTo(5.5, 0.6);
  ctx.lineTo(4.9, 1.4);
  ctx.lineTo(5.3, 2.3);
  ctx.lineTo(4.3, 4.8);
  ctx.lineTo(0.2, 4.4);
  ctx.lineTo(-3.5, 3.8);
  ctx.closePath();
  ctx.fillStyle = faceGrad;
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // 3. Ucho (rysowane PRZED włosami, aby długie fryzury mogły zakrywać lub przysłaniać ucho)
  ctx.fillStyle = v.skinBack;
  ctx.beginPath();
  ctx.ellipse(-2.6, -0.6, 1.6, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = v.skinDark;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(-2.5, -0.6, 1.1, 0.4 * Math.PI, 1.7 * Math.PI, false);
  ctx.stroke();

  // 4. Fryzura (warstwa główna, bok głowy i długie pasma)
  drawCharacterHairProfile(ctx, tileDummy, v, 1, 0, 0, false);

  // 5. Kosmyki przed uchem / na skroni
  drawCharacterHairOverEarProfile(ctx, v, hairPal, false);

  // 6. Oko i brew
  const eyeCenterX = 2.7;
  const eyeCenterY = -2.1;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(eyeCenterX, eyeCenterY, 1.5, 1.0, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(eyeCenterX + 0.55, eyeCenterY, 0.72, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(eyeCenterX + 0.52, eyeCenterY - 0.25, 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hairPal.dark;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(1.4, -3.3);
  ctx.lineTo(4.4, -3.5);
  ctx.stroke();

  ctx.restore();
}





