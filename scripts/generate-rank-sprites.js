// =============================================================================
// SCRIPTS/GENERATE-RANK-SPRITES.JS
// Generator profesjonalnego arkusza odznak stopni wojskowych (Military Rank Sprite Sheet)
// Format: 512x384 pikseli (4 kolumny x 3 wiersze, 128x128px na stopień)
// 12 prestiżowych rang Modern Military: od Szeregowego do Generała Areny
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const svgOutputPath = path.join(rootDir, 'assets/ranks_spritesheet.svg');

function generateSvg() {
  const W = 512;
  const H = 384;
  const CELL = 128;

  // Definicje gradientów, cieni i filtrów optycznych
  const defs = `
  <defs>
    <!-- Filtry kinowe -->
    <filter id="insignia-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.85" />
    </filter>
    <filter id="insignia-glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="3.5" flood-color="#00e5ff" flood-opacity="0.6" />
    </filter>
    <filter id="insignia-glow-gold" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="4.0" flood-color="#facc15" flood-opacity="0.65" />
    </filter>

    <!-- Tła naramienników (Shield backings) -->
    <linearGradient id="shield-grad-dark" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="40%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#060913" />
    </linearGradient>

    <!-- Gradienty metaliczne: Tytan / Stal Szeregowych -->
    <linearGradient id="metal-titanium-hi" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e0f2fe" />
      <stop offset="50%" stop-color="#7dd3fc" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="metal-titanium-lo" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#0369a1" />
      <stop offset="100%" stop-color="#082f49" />
    </linearGradient>

    <!-- Gradienty metaliczne: Wojskowe Złoto (Gold) -->
    <linearGradient id="metal-gold-hi" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="45%" stop-color="#facc15" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
    <linearGradient id="metal-gold-lo" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#eab308" />
      <stop offset="55%" stop-color="#a16207" />
      <stop offset="100%" stop-color="#713f12" />
    </linearGradient>

    <!-- Gradienty metaliczne: Polerowane Srebro / Platyna Oficerska (Silver) -->
    <linearGradient id="metal-silver-hi" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="45%" stop-color="#e2e8f0" />
      <stop offset="100%" stop-color="#94a3b8" />
    </linearGradient>
    <linearGradient id="metal-silver-lo" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#cbd5e1" />
      <stop offset="55%" stop-color="#64748b" />
      <stop offset="100%" stop-color="#334155" />
    </linearGradient>

    <!-- Obramowania tarcz wg tierów -->
    <linearGradient id="border-tier-enlisted" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#00e5ff" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="border-tier-nco" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
    <linearGradient id="border-tier-officer" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="50%" stop-color="#67e8f9" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="border-tier-general" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="40%" stop-color="#fbbf24" />
      <stop offset="80%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#ef4444" />
    </linearGradient>
  </defs>
  `;

  // Funkcja pomocnicza: bazowy naramiennik / pagon
  function drawShield(cx, cy, borderGradientId, isGeneral = false) {
    const sw = 92;
    const sh = 108;
    const x0 = cx - sw / 2;
    const y0 = cy - sh / 2;
    const r = 10;
    // Kształt naramiennika bojowego ze ściętymi dolnymi bokami schodzącymi w szewron
    const p = `
      M ${cx - sw/2 + r} ${y0}
      L ${cx + sw/2 - r} ${y0}
      Q ${cx + sw/2} ${y0} ${cx + sw/2} ${y0 + r}
      L ${cx + sw/2} ${y0 + sh - 28}
      L ${cx} ${y0 + sh}
      L ${cx - sw/2} ${y0 + sh - 28}
      L ${cx - sw/2} ${y0 + r}
      Q ${cx - sw/2} ${y0} ${cx - sw/2 + r} ${y0}
      Z
    `;
    const innerP = `
      M ${cx - sw/2 + r + 3} ${y0 + 3}
      L ${cx + sw/2 - r - 3} ${y0 + 3}
      Q ${cx + sw/2 - 3} ${y0 + 3} ${cx + sw/2 - 3} ${y0 + r + 3}
      L ${cx + sw/2 - 3} ${y0 + sh - 29}
      L ${cx} ${y0 + sh - 4}
      L ${cx - sw/2 + 3} ${y0 + sh - 29}
      L ${cx - sw/2 + 3} ${y0 + r + 3}
      Q ${cx - sw/2 + 3} ${y0 + 3} ${cx - sw/2 + r + 3} ${y0 + 3}
      Z
    `;

    return `
      <!-- Tarcza bazowa -->
      <path d="${p}" fill="url(#shield-grad-dark)" stroke="url(#${borderGradientId})" stroke-width="${isGeneral ? 2.5 : 2.0}" filter="url(#insignia-shadow)" />
      <!-- Wewnętrzna osnowa naramiennika -->
      <path d="${innerP}" fill="none" stroke="${isGeneral ? 'rgba(250, 204, 21, 0.45)' : 'rgba(255, 255, 255, 0.12)'}" stroke-width="1.2" stroke-dasharray="${isGeneral ? 'none' : '4,2'}" />
    `;
  }

  // Funkcja pomocnicza: belka pozioma (Horizontal Bar)
  function drawBar(cx, y, w = 62, h = 10, gradHi = 'metal-titanium-hi', gradLo = 'metal-titanium-lo') {
    const hw = w / 2;
    // Fasetowany profil 3D (górna połowa jasna, dolna ciemna)
    return `
      <g filter="url(#insignia-shadow)">
        <!-- Górna faseta -->
        <polygon points="${cx - hw},${y} ${cx + hw},${y} ${cx + hw - 4},${y + h/2} ${cx - hw + 4},${y + h/2}" fill="url(#${gradHi})" />
        <!-- Dolna faseta -->
        <polygon points="${cx - hw + 4},${y + h/2} ${cx + hw - 4},${y + h/2} ${cx + hw},${y + h} ${cx - hw},${y + h}" fill="url(#${gradLo})" />
        <!-- Obwódka i nit centralny -->
        <polygon points="${cx - hw},${y} ${cx + hw},${y} ${cx + hw},${y + h} ${cx - hw},${y + h}" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.8" />
        <circle cx="${cx}" cy="${y + h/2}" r="1.5" fill="#ffffff" opacity="0.85" />
      </g>
    `;
  }

  // Funkcja pomocnicza: fasetowany szewron V (Military V-Chevron)
  function drawChevron(cx, cy, w = 64, thickness = 11, angleY = 16, gradHi = 'metal-gold-hi', gradLo = 'metal-gold-lo') {
    const hw = w / 2;
    // Punkty szewronu (skierowanego w górę)
    // Grzbiet zewnętrzny: (cx - hw, cy + angleY) -> (cx, cy) -> (cx + hw, cy + angleY)
    // Grzbiet wewnętrzny: (cx - hw, cy + angleY + thickness) -> (cx, cy + thickness) -> (cx + hw, cy + angleY + thickness)
    const pLeft = `
      M ${cx - hw} ${cy + angleY}
      L ${cx} ${cy}
      L ${cx} ${cy + thickness}
      L ${cx - hw} ${cy + angleY + thickness}
      Z
    `;
    const pRight = `
      M ${cx} ${cy}
      L ${cx + hw} ${cy + angleY}
      L ${cx + hw} ${cy + angleY + thickness}
      L ${cx} ${cy + thickness}
      Z
    `;
    return `
      <g filter="url(#insignia-shadow)">
        <!-- Lewe ramię (rozświetlone) -->
        <path d="${pLeft}" fill="url(#${gradHi})" stroke="rgba(255,255,255,0.4)" stroke-width="0.8" />
        <!-- Prawe ramię (cieniowane) -->
        <path d="${pRight}" fill="url(#${gradLo})" stroke="rgba(255,255,255,0.2)" stroke-width="0.8" />
        <!-- Centralny szew / grzbiet 3D -->
        <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + thickness}" stroke="#ffffff" stroke-width="1.2" opacity="0.8" />
      </g>
    `;
  }

  // Funkcja pomocnicza: łuk dolny / belka zamykająca pod szewronami (Rocker bar)
  function drawRocker(cx, cy, w = 62, thickness = 9, gradHi = 'metal-gold-hi', gradLo = 'metal-gold-lo') {
    const hw = w / 2;
    const p = `
      M ${cx - hw} ${cy}
      Q ${cx} ${cy + 8} ${cx + hw} ${cy}
      L ${cx + hw} ${cy + thickness}
      Q ${cx} ${cy + 8 + thickness} ${cx - hw} ${cy + thickness}
      Z
    `;
    return `
      <g filter="url(#insignia-shadow)">
        <path d="${p}" fill="url(#${gradHi})" stroke="rgba(255,255,255,0.3)" stroke-width="0.8" />
        <circle cx="${cx - hw + 8}" cy="${cy + 4.5}" r="1.5" fill="#ffffff" opacity="0.8" />
        <circle cx="${cx + hw - 8}" cy="${cy + 4.5}" r="1.5" fill="#ffffff" opacity="0.8" />
      </g>
    `;
  }

  // Funkcja pomocnicza: fasetowana gwiazda wojskowa 3D (5-Pointed 3D Star)
  function draw3DStar(cx, cy, rOuter = 16, rInner = 6.8, gradHi = 'metal-silver-hi', gradLo = 'metal-silver-lo') {
    let rays = '';
    for (let i = 0; i < 5; i++) {
      const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const a1 = a0 + Math.PI / 5;
      const a2 = a0 + (2 * Math.PI) / 5;

      const xTip = cx + Math.cos(a0) * rOuter;
      const yTip = cy + Math.sin(a0) * rOuter;
      const xIn1 = cx + Math.cos(a1) * rInner;
      const yIn1 = cy + Math.sin(a1) * rInner;

      // Lewa jasna faseta ramienia
      rays += `<polygon points="${cx},${cy} ${xTip},${yTip} ${xIn1},${yIn1}" fill="url(#${gradHi})" />`;
      // Prawa ciemna faseta ramienia (od poprzedniego punktu wewnętrznego)
      const aPrevIn = a0 - Math.PI / 5;
      const xInPrev = cx + Math.cos(aPrevIn) * rInner;
      const yInPrev = cy + Math.sin(aPrevIn) * rInner;
      rays += `<polygon points="${cx},${cy} ${xInPrev},${yInPrev} ${xTip},${yTip}" fill="url(#${gradLo})" />`;
    }
    return `
      <g filter="url(#insignia-shadow)">
        ${rays}
        <circle cx="${cx}" cy="${cy}" r="1.8" fill="#ffffff" opacity="0.9" />
      </g>
    `;
  }

  // Funkcja pomocnicza: diament oficerski (Faceted Officer Lozenge)
  function drawDiamond(cx, cy, w = 38, h = 48, gradHi = 'metal-silver-hi', gradLo = 'metal-silver-lo') {
    const hw = w / 2;
    const hh = h / 2;
    return `
      <g filter="url(#insignia-shadow)">
        <!-- Obwódka zewnętrzna -->
        <polygon points="${cx},${cy - hh - 3} ${cx + hw + 3},${cy} ${cx},${cy + hh + 3} ${cx - hw - 3},${cy}" fill="none" stroke="url(#${gradHi})" stroke-width="1.8" />
        <!-- 4 fasetowane ćwiartki rombu -->
        <!-- Lewa górna (najjaśniejsza) -->
        <polygon points="${cx},${cy} ${cx},${cy - hh} ${cx - hw},${cy}" fill="url(#${gradHi})" />
        <!-- Prawa górna -->
        <polygon points="${cx},${cy} ${cx + hw},${cy} ${cx},${cy - hh}" fill="url(#${gradLo})" opacity="0.9" />
        <!-- Lewa dolna -->
        <polygon points="${cx},${cy} ${cx - hw},${cy} ${cx},${cy + hh}" fill="url(#${gradLo})" />
        <!-- Prawa dolna (najciemniejsza) -->
        <polygon points="${cx},${cy} ${cx},${cy + hh} ${cx + hw},${cy}" fill="url(#${gradLo})" opacity="0.75" />
        <!-- Błysk wierzchołka -->
        <circle cx="${cx}" cy="${cy}" r="2.5" fill="#00e5ff" />
      </g>
    `;
  }

  // Funkcja pomocnicza: wieniec laurowy (Victory Laurel Wreath)
  function drawWreath(cx, cy, r = 26, strokeGrad = 'metal-gold-hi') {
    // Lewa i prawa gałąź laurowa
    return `
      <g filter="url(#insignia-shadow)">
        <!-- Lewa gałąź -->
        <path d="M ${cx - 5} ${cy + r} C ${cx - r - 8} ${cy + r/2}, ${cx - r - 8} ${cy - r/2}, ${cx - 6} ${cy - r}" fill="none" stroke="url(#${strokeGrad})" stroke-width="2.5" stroke-linecap="round" />
        <!-- Prawa gałąź -->
        <path d="M ${cx + 5} ${cy + r} C ${cx + r + 8} ${cy + r/2}, ${cx + r + 8} ${cy - r/2}, ${cx + 6} ${cy - r}" fill="none" stroke="url(#${strokeGrad})" stroke-width="2.5" stroke-linecap="round" />
        <!-- Liście laurowe lewe -->
        <ellipse cx="${cx - r + 3}" cy="${cy - 12}" rx="5.5" ry="2.8" transform="rotate(-35 ${cx - r + 3} ${cy - 12})" fill="url(#${strokeGrad})" />
        <ellipse cx="${cx - r - 1}" cy="${cy}" rx="5.8" ry="2.8" transform="rotate(5 ${cx - r - 1} ${cy})" fill="url(#${strokeGrad})" />
        <ellipse cx="${cx - r + 4}" cy="${cy + 12}" rx="5.5" ry="2.8" transform="rotate(40 ${cx - r + 4} ${cy + 12})" fill="url(#${strokeGrad})" />
        <!-- Liście laurowe prawe -->
        <ellipse cx="${cx + r - 3}" cy="${cy - 12}" rx="5.5" ry="2.8" transform="rotate(35 ${cx + r - 3} ${cy - 12})" fill="url(#${strokeGrad})" />
        <ellipse cx="${cx + r + 1}" cy="${cy}" rx="5.8" ry="2.8" transform="rotate(-5 ${cx + r + 1} ${cy})" fill="url(#${strokeGrad})" />
        <ellipse cx="${cx + r - 4}" cy="${cy + 12}" rx="5.5" ry="2.8" transform="rotate(-40 ${cx + r - 4} ${cy + 12})" fill="url(#${strokeGrad})" />
        <!-- Złota wstęga na dole -->
        <rect x="${cx - 7}" y="${cy + r - 2}" width="14" height="4.5" rx="1.5" fill="url(#${strokeGrad})" />
      </g>
    `;
  }

  // Funkcja pomocnicza: skrzyżowane szable wojskowe (Crossed Sabres)
  function drawCrossedSabres(cx, cy, len = 42) {
    const hl = len / 2;
    return `
      <g filter="url(#insignia-shadow)" stroke="#fef08a" stroke-linecap="round">
        <!-- Ostrze 1: z lewego dołu w prawy górny róg -->
        <line x1="${cx - hl}" y1="${cy + hl - 4}" x2="${cx + hl}" y2="${cy - hl + 4}" stroke-width="2.2" stroke="url(#metal-silver-hi)" />
        <circle cx="${cx - hl}" cy="${cy + hl - 4}" r="3" fill="#facc15" stroke="none" />
        <!-- Ostrze 2: z prawego dołu w lewy górny róg -->
        <line x1="${cx + hl}" y1="${cy + hl - 4}" x2="${cx - hl}" y2="${cy - hl + 4}" stroke-width="2.2" stroke="url(#metal-silver-hi)" />
        <circle cx="${cx + hl}" cy="${cy + hl - 4}" r="3" fill="#facc15" stroke="none" />
      </g>
    `;
  }

  // Funkcja pomocnicza: orzeł wojskowy (Military Crest Eagle)
  function drawMilitaryEagle(cx, cy) {
    // Stylizowany, symetryczny orzeł wojskowy z rozpostartymi skrzydłami
    return `
      <g filter="url(#insignia-shadow)">
        <!-- Skrzydła lewe -->
        <path d="M ${cx} ${cy - 2} C ${cx - 16} ${cy - 14}, ${cx - 28} ${cy - 8}, ${cx - 32} ${cy + 4} C ${cx - 24} ${cy + 3}, ${cx - 14} ${cy + 8}, ${cx} ${cy + 12} Z" fill="url(#metal-gold-hi)" />
        <!-- Skrzydła prawe -->
        <path d="M ${cx} ${cy - 2} C ${cx + 16} ${cy - 14}, ${cx + 28} ${cy - 8}, ${cx + 32} ${cy + 4} C ${cx + 24} ${cy + 3}, ${cx + 14} ${cy + 8}, ${cx} ${cy + 12} Z" fill="url(#metal-gold-hi)" />
        <!-- Pióra zewnętrzne -->
        <path d="M ${cx - 32} ${cy + 4} L ${cx - 26} ${cy + 8} L ${cx - 20} ${cy + 7} L ${cx - 14} ${cy + 10} L ${cx} ${cy + 13} L ${cx + 14} ${cy + 10} L ${cx + 20} ${cy + 7} L ${cx + 26} ${cy + 8} L ${cx + 32} ${cy + 4}" stroke="#ffffff" stroke-width="0.8" fill="none" opacity="0.7" />
        <!-- Korpus i głowa orła -->
        <path d="M ${cx} ${cy - 10} L ${cx + 3} ${cy - 6} L ${cx + 4} ${cy + 6} L ${cx} ${cy + 14} L ${cx - 4} ${cy + 6} L ${cx - 3} ${cy - 6} Z" fill="url(#metal-gold-hi)" />
        <!-- Korona orła -->
        <polygon points="${cx - 4},${cy - 10} ${cx - 5},${cy - 14} ${cx - 2},${cy - 12} ${cx},${cy - 15} ${cx + 2},${cy - 12} ${cx + 5},${cy - 14} ${cx + 4},${cy - 10}" fill="#fef08a" />
      </g>
    `;
  }

  // =========================================================================
  // GENEROWANIE 12 ODRĘBNYCH RANG W SIATCE 4x3
  // =========================================================================
  let cellsContent = '';

  // 1. TIER 1: SZEREGOWY (Col 0, Row 0)
  {
    const cx = 0 * CELL + 64;
    const cy = 0 * CELL + 64;
    cellsContent += `
      <!-- TIER 01: SZEREGOWY -->
      <g id="rank-szeregowy">
        ${drawShield(cx, cy, 'border-tier-enlisted')}
        <!-- 1 tytanowa belka pozioma -->
        ${drawBar(cx, cy - 6, 56, 12, 'metal-titanium-hi', 'metal-titanium-lo')}
      </g>
    `;
  }

  // 2. TIER 2: STARSZY SZEREGOWY (Col 1, Row 0)
  {
    const cx = 1 * CELL + 64;
    const cy = 0 * CELL + 64;
    cellsContent += `
      <!-- TIER 02: STARSZY SZEREGOWY -->
      <g id="rank-st-szeregowy">
        ${drawShield(cx, cy, 'border-tier-enlisted')}
        <!-- 2 tytanowe belki poziome -->
        ${drawBar(cx, cy - 14, 56, 10, 'metal-titanium-hi', 'metal-titanium-lo')}
        ${drawBar(cx, cy + 3, 56, 10, 'metal-titanium-hi', 'metal-titanium-lo')}
      </g>
    `;
  }

  // 3. TIER 3: KAPRAL (Col 2, Row 0)
  {
    const cx = 2 * CELL + 64;
    const cy = 0 * CELL + 64;
    cellsContent += `
      <!-- TIER 03: KAPRAL -->
      <g id="rank-kapral">
        ${drawShield(cx, cy, 'border-tier-nco')}
        <!-- 2 szewrony złote V -->
        ${drawChevron(cx, cy - 18, 62, 10.5, 14, 'metal-gold-hi', 'metal-gold-lo')}
        ${drawChevron(cx, cy - 3, 62, 10.5, 14, 'metal-gold-hi', 'metal-gold-lo')}
      </g>
    `;
  }

  // 4. TIER 4: STARSZY KAPRAL (Col 3, Row 0)
  {
    const cx = 3 * CELL + 64;
    const cy = 0 * CELL + 64;
    cellsContent += `
      <!-- TIER 04: STARSZY KAPRAL -->
      <g id="rank-st-kapral">
        ${drawShield(cx, cy, 'border-tier-nco')}
        <!-- 2 szewrony złote V + łuk bazowy -->
        ${drawChevron(cx, cy - 22, 62, 10, 13, 'metal-gold-hi', 'metal-gold-lo')}
        ${drawChevron(cx, cy - 8, 62, 10, 13, 'metal-gold-hi', 'metal-gold-lo')}
        ${drawRocker(cx, cy + 18, 58, 8, 'metal-gold-hi', 'metal-gold-lo')}
      </g>
    `;
  }

  // 5. TIER 5: PLUTONOWY (Col 0, Row 1)
  {
    const cx = 0 * CELL + 64;
    const cy = 1 * CELL + 64;
    cellsContent += `
      <!-- TIER 05: PLUTONOWY -->
      <g id="rank-plutonowy">
        ${drawShield(cx, cy, 'border-tier-nco')}
        <!-- 3 szewrony złote V -->
        ${drawChevron(cx, cy - 26, 62, 9.5, 12, 'metal-gold-hi', 'metal-gold-lo')}
        ${drawChevron(cx, cy - 12, 62, 9.5, 12, 'metal-gold-hi', 'metal-gold-lo')}
        ${drawChevron(cx, cy + 2, 62, 9.5, 12, 'metal-gold-hi', 'metal-gold-lo')}
      </g>
    `;
  }

  // 6. TIER 6: SIERŻANT (Col 1, Row 1)
  {
    const cx = 1 * CELL + 64;
    const cy = 1 * CELL + 64;
    cellsContent += `
      <!-- TIER 06: SIERŻANT -->
      <g id="rank-sierzant">
        ${drawShield(cx, cy, 'border-tier-nco')}
        <!-- 3 szewrony złote V + łuk bazowy rocker -->
        ${drawChevron(cx, cy - 28, 62, 9, 12, 'metal-gold-hi', 'metal-gold-lo')}
        ${drawChevron(cx, cy - 15, 62, 9, 12, 'metal-gold-hi', 'metal-gold-lo')}
        ${drawChevron(cx, cy - 2, 62, 9, 12, 'metal-gold-hi', 'metal-gold-lo')}
        ${drawRocker(cx, cy + 20, 60, 8.5, 'metal-gold-hi', 'metal-gold-lo')}
      </g>
    `;
  }

  // 7. TIER 7: CHORĄŻY (Col 2, Row 1)
  {
    const cx = 2 * CELL + 64;
    const cy = 1 * CELL + 64;
    cellsContent += `
      <!-- TIER 07: CHORĄŻY -->
      <g id="rank-chorazy">
        ${drawShield(cx, cy, 'border-tier-officer')}
        <!-- Wojskowy diament oficerski (Faceted Lozenge) -->
        ${drawDiamond(cx, cy - 2, 44, 54, 'metal-silver-hi', 'metal-silver-lo')}
      </g>
    `;
  }

  // 8. TIER 8: PODPORUCZNIK (Col 3, Row 1)
  {
    const cx = 3 * CELL + 64;
    const cy = 1 * CELL + 64;
    cellsContent += `
      <!-- TIER 08: PODPORUCZNIK -->
      <g id="rank-podporucznik">
        ${drawShield(cx, cy, 'border-tier-officer')}
        <!-- 2 platynowe gwiazdy 3D -->
        ${draw3DStar(cx, cy - 18, 15, 6.2, 'metal-silver-hi', 'metal-silver-lo')}
        ${draw3DStar(cx, cy + 16, 15, 6.2, 'metal-silver-hi', 'metal-silver-lo')}
      </g>
    `;
  }

  // 9. TIER 9: KAPITAN (Col 0, Row 2)
  {
    const cx = 0 * CELL + 64;
    const cy = 2 * CELL + 64;
    cellsContent += `
      <!-- TIER 09: KAPITAN -->
      <g id="rank-kapitan">
        ${drawShield(cx, cy, 'border-tier-officer')}
        <!-- 3 platynowe gwiazdy 3D ułożone w prestiżowy trójkąt oficerski -->
        ${draw3DStar(cx, cy - 20, 14, 5.8, 'metal-silver-hi', 'metal-silver-lo')}
        ${draw3DStar(cx - 17, cy + 12, 13, 5.5, 'metal-silver-hi', 'metal-silver-lo')}
        ${draw3DStar(cx + 17, cy + 12, 13, 5.5, 'metal-silver-hi', 'metal-silver-lo')}
      </g>
    `;
  }

  // 10. TIER 10: MAJOR (Col 1, Row 2)
  {
    const cx = 1 * CELL + 64;
    const cy = 2 * CELL + 64;
    cellsContent += `
      <!-- TIER 10: MAJOR -->
      <g id="rank-major">
        ${drawShield(cx, cy, 'border-tier-general')}
        <!-- Złoty wieniec laurowy otaczający dużą złotą gwiazdę 3D -->
        ${drawWreath(cx, cy, 28, 'metal-gold-hi')}
        ${draw3DStar(cx, cy - 1, 16, 6.5, 'metal-gold-hi', 'metal-gold-lo')}
      </g>
    `;
  }

  // 11. TIER 11: PUŁKOWNIK (Col 2, Row 2)
  {
    const cx = 2 * CELL + 64;
    const cy = 2 * CELL + 64;
    cellsContent += `
      <!-- TIER 11: PUŁKOWNIK -->
      <g id="rank-pulkownik">
        ${drawShield(cx, cy, 'border-tier-general')}
        <!-- 2 belki oficerskie na dole naramiennika -->
        ${drawBar(cx, cy + 18, 56, 6, 'metal-gold-hi', 'metal-gold-lo')}
        ${drawBar(cx, cy + 27, 56, 6, 'metal-gold-hi', 'metal-gold-lo')}
        <!-- Złoty orzeł wojskowy z koroną i gwiazdą -->
        ${drawMilitaryEagle(cx, cy - 10)}
        ${draw3DStar(cx, cy + 6, 10, 4.2, 'metal-silver-hi', 'metal-silver-lo')}
      </g>
    `;
  }

  // 12. TIER 12: GENERAŁ ARENY (Col 3, Row 2)
  {
    const cx = 3 * CELL + 64;
    const cy = 2 * CELL + 64;
    cellsContent += `
      <!-- TIER 12: GENERAŁ ARENY -->
      <g id="rank-general">
        ${drawShield(cx, cy, 'border-tier-general', true)}
        <!-- Skrzyżowane złote szable marszałkowskie -->
        ${drawCrossedSabres(cx, cy + 2, 46)}
        <!-- Wieniec laurowy chwały -->
        ${drawWreath(cx, cy + 2, 30, 'metal-gold-hi')}
        <!-- Centralny orzeł w koronie i 4 złote gwiazdy generalskie -->
        ${drawMilitaryEagle(cx, cy - 10)}
        <g filter="url(#insignia-glow-gold)">
          ${draw3DStar(cx, cy + 16, 8, 3.2, 'metal-gold-hi', 'metal-gold-lo')}
          ${draw3DStar(cx - 15, cy + 22, 6.5, 2.6, 'metal-gold-hi', 'metal-gold-lo')}
          ${draw3DStar(cx + 15, cy + 22, 6.5, 2.6, 'metal-gold-hi', 'metal-gold-lo')}
        </g>
      </g>
    `;
  }

  const svgXml = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  ${defs}
  <rect width="${W}" height="${H}" fill="none" />
  ${cellsContent}
</svg>
`;

  return svgXml;
}

const svgData = generateSvg();
fs.writeFileSync(svgOutputPath, svgData, 'utf8');
console.log(`[GENERATOR] Utworzono profesjonalny sprite sheet rang: ${svgOutputPath} (${svgData.length} bajtow)`);
