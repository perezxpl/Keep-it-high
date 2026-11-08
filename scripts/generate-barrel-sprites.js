// =============================================================================
// SCRIPTS/GENERATE-BARREL-SPRITES.JS
// Generator profesjonalnego arkusza sprajtow beczek przemyslowych (Barrel Sprite Sheet)
// Format: 512x704 pikseli (4 kolumny x 4 wiersze, 128x176px na sprajt)
// 4 stany zniszczenia: Intact -> Damaged -> Leaking/Burning -> Critical/Fuse
// 4 typy beczek: Explosive (Czerwona), Toxic (Zielona), Cryo (Cyjan), Ordnance (Zloto/Grafit)
// Standard: Zero emojis, 60 FPS, najwyzsza jakosc graficzna
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const svgOutputPath = path.join(rootDir, 'assets/barrels_spritesheet.svg');

function generateSvg() {
  const W = 512;
  const H = 704;
  const CELL_W = 128;
  const CELL_H = 176;

  // Definicje gradientow, wzorcow paskow ostrzegawczych i filtrow
  const defs = `
  <defs>
    <!-- Filtry optyczne i cienie -->
    <filter id="drum-drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="3.0" flood-color="#000000" flood-opacity="0.8" />
    </filter>
    <filter id="glow-fire" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="4.0" flood-color="#f97316" flood-opacity="0.85" />
    </filter>
    <filter id="glow-toxic" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="4.0" flood-color="#22c55e" flood-opacity="0.85" />
    </filter>
    <filter id="glow-cryo" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="4.0" flood-color="#38bdf8" flood-opacity="0.85" />
    </filter>

    <!-- Skosne paski ostrzegawcze (Hazard Chevrons) -->
    <pattern id="hazard-stripes-yellow" width="16" height="16" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="16" stroke="#eab308" stroke-width="8" />
      <line x1="8" y1="0" x2="8" y2="16" stroke="#18181b" stroke-width="8" />
    </pattern>
    <pattern id="hazard-stripes-orange" width="16" height="16" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="16" stroke="#f97316" stroke-width="8" />
      <line x1="8" y1="0" x2="8" y2="16" stroke="#18181b" stroke-width="8" />
    </pattern>

    <!-- 1. CYLINDRYCZNY GRADIENT BECZKI CZERWONEJ (EXPLOSIVE) -->
    <linearGradient id="drum-grad-red" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7f1d1d" />
      <stop offset="6%" stop-color="#450a0a" />
      <stop offset="18%" stop-color="#ef4444" />
      <stop offset="28%" stop-color="#fca5a5" />
      <stop offset="38%" stop-color="#ef4444" />
      <stop offset="65%" stop-color="#dc2626" />
      <stop offset="85%" stop-color="#991b1b" />
      <stop offset="100%" stop-color="#450a0a" />
    </linearGradient>

    <!-- 2. CYLINDRYCZNY GRADIENT BECZKI CZERWONEJ ROZPALONEJ (CRITICAL) -->
    <linearGradient id="drum-grad-red-critical" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#991b1b" />
      <stop offset="12%" stop-color="#ea580c" />
      <stop offset="30%" stop-color="#fed7aa" />
      <stop offset="50%" stop-color="#f97316" />
      <stop offset="75%" stop-color="#dc2626" />
      <stop offset="100%" stop-color="#7f1d1d" />
    </linearGradient>

    <!-- 3. CYLINDRYCZNY GRADIENT BECZKI ZIELONEJ (TOXIC) -->
    <linearGradient id="drum-grad-green" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#14532d" />
      <stop offset="6%" stop-color="#052e16" />
      <stop offset="18%" stop-color="#22c55e" />
      <stop offset="28%" stop-color="#bbf7d0" />
      <stop offset="38%" stop-color="#22c55e" />
      <stop offset="65%" stop-color="#16a34a" />
      <stop offset="85%" stop-color="#15803d" />
      <stop offset="100%" stop-color="#052e16" />
    </linearGradient>

    <!-- 4. CYLINDRYCZNY GRADIENT BECZKI ZIELONEJ ROZPALONEJ (CRITICAL) -->
    <linearGradient id="drum-grad-green-critical" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#14532d" />
      <stop offset="14%" stop-color="#16a34a" />
      <stop offset="30%" stop-color="#dcfce7" />
      <stop offset="50%" stop-color="#4ade80" />
      <stop offset="75%" stop-color="#15803d" />
      <stop offset="100%" stop-color="#052e16" />
    </linearGradient>

    <!-- 5. CYLINDRYCZNY GRADIENT BECZKI KRIOGENICZNEJ (CRYO) -->
    <linearGradient id="drum-grad-cryo" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0c4a6e" />
      <stop offset="6%" stop-color="#082f49" />
      <stop offset="18%" stop-color="#38bdf8" />
      <stop offset="28%" stop-color="#e0f2fe" />
      <stop offset="38%" stop-color="#38bdf8" />
      <stop offset="65%" stop-color="#0284c7" />
      <stop offset="85%" stop-color="#0369a1" />
      <stop offset="100%" stop-color="#082f49" />
    </linearGradient>

    <!-- 6. CYLINDRYCZNY GRADIENT BECZKI WOJSKOWEJ / ZLOTO-GRAFITOWEJ (ORDNANCE) -->
    <linearGradient id="drum-grad-ordnance" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#27272a" />
      <stop offset="6%" stop-color="#18181b" />
      <stop offset="18%" stop-color="#71717a" />
      <stop offset="28%" stop-color="#f4f4f5" />
      <stop offset="38%" stop-color="#71717a" />
      <stop offset="65%" stop-color="#3f3f46" />
      <stop offset="85%" stop-color="#27272a" />
      <stop offset="100%" stop-color="#09090b" />
    </linearGradient>

    <!-- GRADIENTY ZEBER I OBRĘCZY STALOWYCH (STEEL RIMS) -->
    <linearGradient id="rim-grad-dark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#18181b" />
      <stop offset="15%" stop-color="#52525b" />
      <stop offset="28%" stop-color="#d4d4d8" />
      <stop offset="42%" stop-color="#52525b" />
      <stop offset="80%" stop-color="#27272a" />
      <stop offset="100%" stop-color="#09090b" />
    </linearGradient>
    <linearGradient id="rim-bevel-top" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.45)" />
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)" />
    </linearGradient>
    <linearGradient id="rim-bevel-bottom" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(0, 0, 0, 0.0)" />
      <stop offset="100%" stop-color="rgba(0, 0, 0, 0.65)" />
    </linearGradient>

    <!-- POKRYWA GORNA I WLEW PALIWA -->
    <linearGradient id="lid-top-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#27272a" />
      <stop offset="50%" stop-color="#18181b" />
      <stop offset="100%" stop-color="#09090b" />
    </linearGradient>
    <linearGradient id="bung-hex-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d4d4d8" />
      <stop offset="50%" stop-color="#71717a" />
      <stop offset="100%" stop-color="#27272a" />
    </linearGradient>
  </defs>
  `;

  /**
   * Generuje piktogram ostrzegawczy: Ogień (Flame)
   */
  function renderFlameIcon(cx, cy, scale = 1.0) {
    const s = scale;
    return `
      <!-- Piktogram Plomienia -->
      <path d="
        M ${cx} ${cy - 12 * s}
        C ${cx + 7 * s} ${cy - 5 * s}, ${cx + 9 * s} ${cy + 4 * s}, ${cx + 5 * s} ${cy + 10 * s}
        C ${cx + 3 * s} ${cy + 13 * s}, ${cx - 3 * s} ${cy + 13 * s}, ${cx - 5 * s} ${cy + 10 * s}
        C ${cx - 9 * s} ${cy + 4 * s}, ${cx - 7 * s} ${cy - 5 * s}, ${cx} ${cy - 12 * s}
        Z
      " fill="#facc15" />
      <path d="
        M ${cx} ${cy - 5 * s}
        C ${cx + 3.5 * s} ${cy - 1 * s}, ${cx + 4.5 * s} ${cy + 5 * s}, ${cx + 2.5 * s} ${cy + 8 * s}
        C ${cx + 1 * s} ${cy + 10 * s}, ${cx - 1 * s} ${cy + 10 * s}, ${cx - 2.5 * s} ${cy + 8 * s}
        C ${cx - 4.5 * s} ${cy + 5 * s}, ${cx - 3.5 * s} ${cy - 1 * s}, ${cx} ${cy - 5 * s}
        Z
      " fill="#ef4444" />
    `;
  }

  /**
   * Generuje piktogram ostrzegawczy: Czaszka i Piszczele / Biohazard (Skull)
   */
  function renderSkullIcon(cx, cy, scale = 1.0) {
    const s = scale;
    return `
      <!-- Piktogram Czaszki -->
      <!-- Piszczele skrzyzowane -->
      <line x1="${cx - 9 * s}" y1="${cy - 7 * s}" x2="${cx + 9 * s}" y2="${cy + 7 * s}" stroke="#ffffff" stroke-width="${2.2 * s}" stroke-linecap="round" />
      <line x1="${cx + 9 * s}" y1="${cy - 7 * s}" x2="${cx - 9 * s}" y2="${cy + 7 * s}" stroke="#ffffff" stroke-width="${2.2 * s}" stroke-linecap="round" />
      <!-- Czaszka -->
      <circle cx="${cx}" cy="${cy - 2 * s}" r="${5.5 * s}" fill="#ffffff" />
      <rect x="${cx - 3 * s}" y="${cy + 1.5 * s}" width="${6 * s}" height="${4.5 * s}" rx="${1 * s}" fill="#ffffff" />
      <!-- Oczodoly i nos -->
      <circle cx="${cx - 2 * s}" cy="${cy - 2.5 * s}" r="${1.4 * s}" fill="#052e16" />
      <circle cx="${cx + 2 * s}" cy="${cy - 2.5 * s}" r="${1.4 * s}" fill="#052e16" />
      <polygon points="${cx},${cy - 0.5 * s} ${cx - 0.8 * s},${cy + 0.8 * s} ${cx + 0.8 * s},${cy + 0.8 * s}" fill="#052e16" />
      <!-- Zeby -->
      <line x1="${cx - 1.5 * s}" y1="${cy + 2.5 * s}" x2="${cx - 1.5 * s}" y2="${cy + 5.5 * s}" stroke="#052e16" stroke-width="${0.7 * s}" />
      <line x1="${cx}" y1="${cy + 2.5 * s}" x2="${cx}" y2="${cy + 5.5 * s}" stroke="#052e16" stroke-width="${0.7 * s}" />
      <line x1="${cx + 1.5 * s}" y1="${cy + 2.5 * s}" x2="${cx + 1.5 * s}" y2="${cy + 5.5 * s}" stroke="#052e16" stroke-width="${0.7 * s}" />
    `;
  }

  /**
   * Generuje piktogram ostrzegawczy: Płatek śniegu / Kriogenika (Frost)
   */
  function renderCryoIcon(cx, cy, scale = 1.0) {
    const s = scale;
    return `
      <!-- Piktogram Mrozu -->
      <g stroke="#ffffff" stroke-width="${1.8 * s}" stroke-linecap="round">
        <line x1="${cx}" y1="${cy - 9 * s}" x2="${cx}" y2="${cy + 9 * s}" />
        <line x1="${cx - 8 * s}" y1="${cy - 4.5 * s}" x2="${cx + 8 * s}" y2="${cy + 4.5 * s}" />
        <line x1="${cx - 8 * s}" y1="${cy + 4.5 * s}" x2="${cx + 8 * s}" y2="${cy - 4.5 * s}" />
      </g>
      <circle cx="${cx}" cy="${cy}" r="${2 * s}" fill="#38bdf8" />
    `;
  }

  /**
   * Generuje piktogram ostrzegawczy: Wojskowy pocisk / bomba (Ordnance)
   */
  function renderBombIcon(cx, cy, scale = 1.0) {
    const s = scale;
    return `
      <!-- Piktogram Bomby -->
      <circle cx="${cx}" cy="${cy + 1 * s}" r="${5.5 * s}" fill="#facc15" />
      <rect x="${cx - 2 * s}" y="${cy - 6 * s}" width="${4 * s}" height="${3 * s}" fill="#71717a" />
      <path d="M ${cx} ${cy - 6 * s} Q ${cx + 4 * s} ${cy - 10 * s} ${cx + 6 * s} ${cy - 8 * s}" fill="none" stroke="#f97316" stroke-width="${1.4 * s}" stroke-linecap="round" />
    `;
  }

  /**
   * Rysuje pojedynczą beczkę w danej komórce siatki
   */
  function renderBarrelSprite(cellX, cellY, type, state) {
    // Wspolrzedne srodka i wymiary beczki
    const bx = cellX + 18;
    const by = cellY + 18;
    const bw = 92;
    const bh = 140;
    const centerX = bx + bw * 0.5;

    // Dobór gradientu korpusu i detali wg typu
    let drumGrad = 'url(#drum-grad-red)';
    let placardBg = '#facc15';
    let placardStroke = '#b45309';
    let hazardClassText = '3';
    let labelText = 'FLAMMABLE';
    let unText = 'UN 1203';
    let renderIcon = renderFlameIcon;

    if (type === 'TOXIC') {
      drumGrad = (state === 'CRITICAL') ? 'url(#drum-grad-green-critical)' : 'url(#drum-grad-green)';
      placardBg = '#eab308';
      placardStroke = '#14532d';
      hazardClassText = '6';
      labelText = 'TOXIC WASTE';
      unText = 'UN 2922';
      renderIcon = renderSkullIcon;
    } else if (type === 'CRYO') {
      drumGrad = 'url(#drum-grad-cryo)';
      placardBg = '#0284c7';
      placardStroke = '#ffffff';
      hazardClassText = '2';
      labelText = 'LIQUID NITRO';
      unText = 'UN 1977';
      renderIcon = renderCryoIcon;
    } else if (type === 'ORDNANCE') {
      drumGrad = 'url(#drum-grad-ordnance)';
      placardBg = '#f59e0b';
      placardStroke = '#18181b';
      hazardClassText = '1';
      labelText = 'EXPLOSIVE';
      unText = 'HE-105';
      renderIcon = renderBombIcon;
    } else {
      // EXPLOSIVE
      drumGrad = (state === 'CRITICAL') ? 'url(#drum-grad-red-critical)' : 'url(#drum-grad-red)';
    }

    // Deformacja / wgniecenie konturu dla stanu DAMAGED i LEAKING
    const isDented = (state === 'DAMAGED' || state === 'LEAKING' || state === 'CRITICAL');
    const dentPath = isDented
      ? `
        M ${bx + 6} ${by + 6}
        L ${bx + bw - 6} ${by + 6}
        Q ${bx + bw} ${by + 6} ${bx + bw} ${by + 14}
        L ${bx + bw} ${by + bh - 14}
        Q ${bx + bw} ${by + bh} ${bx + bw - 6} ${by + bh}
        L ${bx + 6} ${by + bh}
        Q ${bx} ${by + bh} ${bx} ${by + bh - 14}
        L ${bx} ${by + 80}
        C ${bx + 8} ${by + 65}, ${bx + 6} ${by + 45}, ${bx} ${by + 35}
        L ${bx} ${by + 14}
        Q ${bx} ${by + 6} ${bx + 6} ${by + 6}
        Z
      `
      : `
        M ${bx + 6} ${by + 6}
        L ${bx + bw - 6} ${by + 6}
        Q ${bx + bw} ${by + 6} ${bx + bw} ${by + 14}
        L ${bx + bw} ${by + bh - 14}
        Q ${bx + bw} ${by + bh} ${bx + bw - 6} ${by + bh}
        L ${bx + 6} ${by + bh}
        Q ${bx} ${by + bh} ${bx} ${by + bh - 14}
        L ${bx} ${by + 14}
        Q ${bx} ${by + 6} ${bx + 6} ${by + 6}
        Z
      `;

    let svg = `
      <!-- SPRITE: ${type} [${state}] (x: ${cellX}, y: ${cellY}) -->
      <g id="barrel_${type.toLowerCase()}_${state.toLowerCase()}">
        <!-- Cien podstrefowy na podlozu -->
        <ellipse cx="${centerX}" cy="${by + bh + 4}" rx="${bw * 0.46}" ry="6" fill="rgba(0, 0, 0, 0.45)" />

        <!-- 1. GLOWNY KORPUS BECZKI (WALEC Z GRADIENTEM) -->
        <path d="${dentPath}" fill="${drumGrad}" stroke="#18181b" stroke-width="2.0" filter="url(#drum-drop-shadow)" />

        <!-- 2. POKRYWA GORNA I DOLNA KRAWĘDŹ (CHIMES) -->
        <!-- Dolna krawedz flanszowa -->
        <rect x="${bx - 2}" y="${by + bh - 8}" width="${bw + 4}" height="9" rx="3" fill="url(#rim-grad-dark)" stroke="#09090b" stroke-width="1.2" />
        <rect x="${bx - 1}" y="${by + bh - 8}" width="${bw + 2}" height="3" fill="url(#rim-bevel-top)" />

        <!-- Gorny kołnierz (Chime Lip) -->
        <rect x="${bx - 2}" y="${by + 4}" width="${bw + 4}" height="9" rx="3" fill="url(#rim-grad-dark)" stroke="#09090b" stroke-width="1.2" />
        <rect x="${bx - 1}" y="${by + 4}" width="${bw + 2}" height="3" fill="url(#rim-bevel-top)" />
        <rect x="${bx - 1}" y="${by + 10}" width="${bw + 2}" height="3" fill="url(#rim-bevel-bottom)" />

        <!-- Zaglebiona pokrywa gora (Top Lid) -->
        <ellipse cx="${centerX}" cy="${by + 6}" rx="${bw * 0.45}" ry="5" fill="url(#lid-top-grad)" stroke="#27272a" stroke-width="1.0" />

        <!-- Korek wlewu paliwa (2-calowy Bung Hex Cap) -->
        <ellipse cx="${bx + 26}" cy="${by + 5.5}" rx="5.5" ry="3.2" fill="url(#bung-hex-grad)" stroke="#09090b" stroke-width="1.0" />
        <ellipse cx="${bx + 26}" cy="${by + 5.5}" rx="2.5" ry="1.5" fill="#18181b" />
        <!-- Maly korek odpowietrznika (3/4-calowy vent bung) -->
        <ellipse cx="${bx + bw - 24}" cy="${by + 6}" rx="3.5" ry="2.0" fill="url(#bung-hex-grad)" stroke="#09090b" stroke-width="0.8" />

        <!-- 3. CENTRALNE STALOWE ZEBERKA WZMACNIAJACE (ROLLING HOOPS) -->
        <!-- Gorne zebro toczne -->
        <rect x="${bx - 1}" y="${by + 46}" width="${bw + 2}" height="7" rx="2" fill="url(#rim-grad-dark)" stroke="#09090b" stroke-width="1.0" />
        <rect x="${bx}" y="${by + 46}" width="${bw}" height="2.5" fill="url(#rim-bevel-top)" />
        <rect x="${bx}" y="${by + 50.5}" width="${bw}" height="2.5" fill="url(#rim-bevel-bottom)" />

        <!-- Dolne zebro toczne -->
        <rect x="${bx - 1}" y="${by + 98}" width="${bw + 2}" height="7" rx="2" fill="url(#rim-grad-dark)" stroke="#09090b" stroke-width="1.0" />
        <rect x="${bx}" y="${by + 98}" width="${bw}" height="2.5" fill="url(#rim-bevel-top)" />
        <rect x="${bx}" y="${by + 102.5}" width="${bw}" height="2.5" fill="url(#rim-bevel-bottom)" />

        <!-- 4. CENTRALNY PAS OSTRZEGAWCZY I TABLICA HAZMAT -->
        <!-- Tlo pasa ostrzegawczego -->
        <rect x="${bx + 2}" y="${by + 64}" width="${bw - 4}" height="24" fill="url(#hazard-stripes-yellow)" opacity="0.85" />
        <rect x="${bx + 2}" y="${by + 64}" width="${bw - 4}" height="24" fill="none" stroke="#18181b" stroke-width="1.2" />

        <!-- Romb ostrzegawczy HAZMAT (Placard Diamond) -->
        <g transform="translate(${centerX}, ${by + 76}) rotate(45)">
          <rect x="-15" y="-15" width="30" height="30" rx="2" fill="${placardBg}" stroke="${placardStroke}" stroke-width="2.0" filter="url(#drum-drop-shadow)" />
          <rect x="-12.5" y="-12.5" width="25" height="25" fill="none" stroke="#18181b" stroke-width="1.0" />
        </g>

        <!-- Piktogram w srodku rombu -->
        ${renderIcon(centerX, by + 72, 0.95)}

        <!-- Klasa zagrozenia DOT (Numer na dole rombu) -->
        <text x="${centerX}" y="${by + 86}" font-family="monospace, sans-serif" font-weight="900" font-size="7.5" fill="#18181b" text-anchor="middle">${hazardClassText}</text>

        <!-- Napisy szablonowe (Stencils) -->
        <text x="${centerX}" y="${by + 38}" font-family="Arial, sans-serif" font-weight="900" font-size="6.5" fill="rgba(255, 255, 255, 0.85)" letter-spacing="1.2" text-anchor="middle">${labelText}</text>
        <text x="${centerX}" y="${by + 124}" font-family="monospace, sans-serif" font-weight="700" font-size="5.8" fill="rgba(255, 255, 255, 0.7)" letter-spacing="0.8" text-anchor="middle">${unText} • 55 GAL / 208L</text>
    `;

    // 5. DODATKI DLA POSZCZEGOLNYCH STANOW ZNISZCZENIA
    if (state === 'DAMAGED' || state === 'LEAKING' || state === 'CRITICAL') {
      // Przestrzal / dziura po kuli 1
      svg += `
        <!-- Przestrzaly i odpryski farby -->
        <circle cx="${bx + 32}" cy="${by + 58}" r="4.5" fill="#18181b" stroke="#71717a" stroke-width="1.2" />
        <circle cx="${bx + 32}" cy="${by + 58}" r="2.2" fill="#09090b" />
        <path d="M ${bx + 32} ${by + 58} l -5 6 l 2 3 l -3 4" fill="none" stroke="#27272a" stroke-width="1.0" />

        <!-- Rysa i odrapanie powloki z odslonieciem stali -->
        <path d="M ${bx + 62} ${by + 32} Q ${bx + 54} ${by + 44} ${bx + 68} ${by + 56}" fill="none" stroke="#d4d4d8" stroke-width="1.4" />
        <circle cx="${bx + 72}" cy="${by + 114}" r="3.5" fill="#18181b" stroke="#52525b" stroke-width="1.0" />
      `;
    }

    if (state === 'LEAKING') {
      if (type === 'EXPLOSIVE') {
        // Płomień buchający z przestrzału i zaciek paliwa
        svg += `
          <!-- Buchajacy plomien z dziury -->
          <g filter="url(#glow-fire)">
            <path d="M ${bx + 32} ${by + 58} C ${bx + 20} ${by + 45}, ${bx + 15} ${by + 35}, ${bx + 24} ${by + 24} C ${bx + 30} ${by + 34}, ${bx + 36} ${by + 48}, ${bx + 32} ${by + 58} Z" fill="#facc15" />
            <path d="M ${bx + 32} ${by + 58} C ${bx + 24} ${by + 50}, ${bx + 22} ${by + 40}, ${bx + 26} ${by + 32} C ${bx + 30} ${by + 40}, ${bx + 34} ${by + 50}, ${bx + 32} ${by + 58} Z" fill="#ef4444" />
          </g>
          <!-- Zaciek ciemnego paliwa w dol -->
          <path d="M ${bx + 32} ${by + 60} Q ${bx + 34} ${by + 80} ${bx + 31} ${by + 110} Q ${bx + 32} ${by + 130} ${bx + 33} ${by + 138}" fill="none" stroke="#18181b" stroke-width="2.5" opacity="0.85" stroke-linecap="round" />
        `;
      } else if (type === 'TOXIC') {
        // Cieknący żrący zielony kwas i bąble
        svg += `
          <!-- Cieknacy jaskrawy kwas -->
          <g filter="url(#glow-toxic)">
            <path d="M ${bx + 32} ${by + 60} Q ${bx + 30} ${by + 85} ${bx + 34} ${by + 115} Q ${bx + 33} ${by + 135} ${bx + 31} ${by + 142}" fill="none" stroke="#4ade80" stroke-width="3.2" stroke-linecap="round" />
            <circle cx="${bx + 31}" cy="${by + 144}" r="3.2" fill="#86efac" />
            <circle cx="${bx + 28}" cy="${by + 85}" r="2.2" fill="#bbf7d0" />
            <circle cx="${bx + 36}" cy="${by + 105}" r="1.8" fill="#dcfce7" />
          </g>
        `;
      } else if (type === 'CRYO') {
        // Szron i lodowe sople
        svg += `
          <g filter="url(#glow-cryo)">
            <path d="M ${bx + 32} ${by + 60} L ${bx + 30} ${by + 95} L ${bx + 32} ${by + 92} L ${bx + 34} ${by + 88}" fill="none" stroke="#e0f2fe" stroke-width="2.5" />
            <circle cx="${bx + 30}" cy="${by + 96}" r="2.0" fill="#ffffff" />
          </g>
        `;
      }
    }

    if (state === 'CRITICAL') {
      // Stan krytyczny: rozżarzony rdzeń, pęknięcia termiczne i snop iskier z korka wlewu
      const glowFilter = (type === 'TOXIC') ? 'url(#glow-toxic)' : 'url(#glow-fire)';
      const sparkColor1 = (type === 'TOXIC') ? '#4ade80' : '#facc15';
      const sparkColor2 = (type === 'TOXIC') ? '#86efac' : '#ef4444';

      svg += `
        <!-- Pekniecia termiczne powłoki pod cisnieniem -->
        <g filter="${glowFilter}">
          <path d="M ${bx + 18} ${by + 40} L ${bx + 34} ${by + 52} L ${bx + 28} ${by + 72} L ${bx + 42} ${by + 94} L ${bx + 38} ${by + 118}" fill="none" stroke="${sparkColor1}" stroke-width="2.0" stroke-linecap="round" />
          <path d="M ${bx + 68} ${by + 36} L ${bx + 58} ${by + 56} L ${bx + 72} ${by + 78} L ${bx + 64} ${by + 104}" fill="none" stroke="${sparkColor2}" stroke-width="1.8" stroke-linecap="round" />
        </g>

        <!-- Snop iskier i syczacy plomien z korka wlewu -->
        <g filter="${glowFilter}">
          <circle cx="${bx + 26}" cy="${by + 4}" r="6.0" fill="${sparkColor1}" />
          <circle cx="${bx + 26}" cy="${by + 4}" r="3.2" fill="#ffffff" />
          <!-- Wystrzelone iskry -->
          <circle cx="${bx + 22}" cy="${by - 6}" r="2.0" fill="${sparkColor1}" />
          <circle cx="${bx + 31}" cy="${by - 10}" r="2.4" fill="#ffffff" />
          <circle cx="${bx + 16}" cy="${by - 12}" r="1.6" fill="${sparkColor2}" />
          <circle cx="${bx + 36}" cy="${by - 5}" r="1.8" fill="${sparkColor1}" />
          <circle cx="${bx + 27}" cy="${by - 16}" r="1.4" fill="#ffffff" />
        </g>
      `;
    }

    svg += `
      </g>
    `;

    return svg;
  }

  // Budowa całości arkusza (4 kolumny x 4 wiersze)
  const types = ['EXPLOSIVE', 'TOXIC', 'CRYO', 'ORDNANCE'];
  const states = ['INTACT', 'DAMAGED', 'LEAKING', 'CRITICAL'];

  let spritesSvg = '';
  for (let r = 0; r < types.length; r++) {
    for (let c = 0; c < states.length; c++) {
      const cellX = c * CELL_W;
      const cellY = r * CELL_H;
      spritesSvg += renderBarrelSprite(cellX, cellY, types[r], states[c]);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  ${defs}
  <!-- ARKUSZ SPRITE'OW BECZEK WOJSKOWYCH (512x704px, 4x4) -->
  ${spritesSvg}
</svg>
`;
}

// Zapis pliku SVG do assets/barrels_spritesheet.svg
const svgContent = generateSvg();
fs.writeFileSync(svgOutputPath, svgContent, 'utf-8');
console.log(`[SUKCES] Wygenerowano arkusz sprite'ow beczek: ${svgOutputPath} (${svgContent.length} bajtow)`);
