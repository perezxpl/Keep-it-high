// scripts/generate_minigun_svg.js
// Generates assets/weapons/minigun_spritesheet.svg (1024x384, 4 cols x 3 rows of 256x128)
import fs from 'fs';
import path from 'path';

const CELL_W = 256;
const CELL_H = 128;
const COLS = 4;
const ROWS = 3;
const TOTAL_W = CELL_W * COLS; // 1024
const TOTAL_H = CELL_H * ROWS; // 384

// Anchor points within each 256x128 cell:
// Right hand D-grip: (52, 66)
// Left hand chainsaw handle: (122, 38)
// Muzzle center: (246, 74)

function renderCell(col, row) {
  const thetaDeg = col * 15;
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const offsetX = col * CELL_W;
  const offsetY = row * CELL_H;

  let svg = `  <!-- Cell col=${col} row=${row} (offset: ${offsetX}, ${offsetY}) -->\n`;
  svg += `  <g transform="translate(${offsetX}, ${offsetY})">\n`;

  // Clip rect for safety
  svg += `    <clipPath id="cell-clip-${col}-${row}"><rect x="0" y="0" width="${CELL_W}" height="${CELL_H}"/></clipPath>\n`;
  svg += `    <g clip-path="url(#cell-clip-${col}-${row})">\n`;

  // =========================================================================
  // 1. REAR AMMO CHUTE & LINKED BELT (UNDER RECEIVER, x: 84..114, y: 92..112)
  // =========================================================================
  svg += `      <!-- Ammo Feed Chute and Linked Brass Belt -->\n`;
  svg += `      <path d="M 84 92 L 114 92 L 112 100 L 86 100 Z" fill="#1e293b" stroke="#0f172a" stroke-width="1"/>\n`;

  // Draw 5 curved belt links with dynamic horizontal shift per col (shift = col * 2 px)
  const linkPitch = 7.0;
  const linkShift = (col * 1.75) % linkPitch;
  for (let li = 0; li < 5; li++) {
    const lx = 86 + li * linkPitch + linkShift;
    if (lx >= 84 && lx <= 112) {
      const ly = 100 + Math.sin((lx - 84) / 28 * Math.PI) * 11;
      svg += `      <rect x="${(lx - 2.5).toFixed(1)}" y="${ly.toFixed(1)}" width="4.8" height="6.5" rx="1.5" fill="#d97706" stroke="#78350f" stroke-width="0.8"/>\n`;
      svg += `      <rect x="${(lx - 1.2).toFixed(1)}" y="${(ly + 1).toFixed(1)}" width="2.2" height="4.5" fill="#fde047" opacity="0.6"/>\n`;
    }
  }

  // =========================================================================
  // 2. FIXED RECEIVER BODY & ELECTRIC MOTOR (x: 62..126, y: 54..92)
  // =========================================================================
  svg += `      <!-- Main Receiver & Electric Motor Housing -->\n`;
  // Electric drive motor cylindrical lower housing
  svg += `      <rect x="64" y="74" width="36" height="19" rx="3" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>\n`;
  svg += `      <rect x="66" y="76" width="32" height="4" fill="#1e293b"/>\n`;
  svg += `      <rect x="66" y="82" width="32" height="4" fill="#1e293b"/>\n`;
  svg += `      <rect x="66" y="88" width="32" height="3" fill="#1e293b"/>\n`;
  svg += `      <circle cx="100" cy="83" r="3.5" fill="#334155" stroke="#0f172a" stroke-width="0.8"/>\n`;

  // Main gearbox & receiver block
  svg += `      <path d="M 62 56 L 122 56 L 125 62 L 125 88 L 62 88 Z" fill="#1e293b" stroke="#0f172a" stroke-width="1.2"/>\n`;
  svg += `      <rect x="66" y="58" width="54" height="6" fill="#334155" opacity="0.7"/>\n`;

  // Cooling ribs / ventilation slots on receiver
  for (let r = 0; r < 5; r++) {
    const ry = 66 + r * 4;
    svg += `      <line x1="72" y1="${ry}" x2="116" y2="${ry}" stroke="#0f172a" stroke-width="1.6" stroke-linecap="round"/>\n`;
    svg += `      <line x1="72" y1="${ry - 0.5}" x2="116" y2="${ry - 0.5}" stroke="#475569" stroke-width="0.7" stroke-linecap="round"/>\n`;
  }

  // Front rotor collar / mounting flange
  svg += `      <path d="M 122 54 L 128 54 L 128 92 L 122 92 Z" fill="#334155" stroke="#0f172a" stroke-width="1"/>\n`;
  svg += `      <rect x="123" y="56" width="3" height="34" fill="#475569"/>\n`;

  // =========================================================================
  // 3. REAR D-GRIP / SPADE HANDLE (x: 44..62, y: 54..78, center: 52, 66)
  // =========================================================================
  svg += `      <!-- Rear D-Grip / Spade Trigger Handle -->\n`;
  // Bracket from receiver to D-loop
  svg += `      <path d="M 58 63 L 64 63 L 64 69 L 58 69 Z" fill="#334155" stroke="#0f172a" stroke-width="1"/>\n`;
  // Outer D-shaped protective guard
  svg += `      <path d="M 58 58 C 46 58 44 61 44 66 C 44 71 46 74 58 74" fill="none" stroke="#1e293b" stroke-width="4.5" stroke-linecap="round"/>\n`;
  svg += `      <path d="M 58 58 C 46 58 44 61 44 66 C 44 71 46 74 58 74" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round"/>\n`;
  // Inner vertical spade grip post (RIGHT HAND ANCHOR AT 52, 66)
  svg += `      <rect x="50" y="59" width="4.5" height="14" rx="2.2" fill="#090d16" stroke="#334155" stroke-width="1"/>\n`;
  // Ergonomic grip rings on post
  svg += `      <line x1="50" y1="62" x2="54.5" y2="62" stroke="#475569" stroke-width="0.8"/>\n`;
  svg += `      <line x1="50" y1="66" x2="54.5" y2="66" stroke="#facc15" stroke-width="1"/> <!-- Trigger button at 66 -->\n`;
  svg += `      <line x1="50" y1="70" x2="54.5" y2="70" stroke="#475569" stroke-width="0.8"/>\n`;

  // =========================================================================
  // 4. TOP CHAINSAW HANDLE (x: 96..144, y: 35..56, grip center: 122, 38)
  // =========================================================================
  svg += `      <!-- Top Chainsaw Handle Bar -->\n`;
  // Rear strut connecting receiver to top bar
  svg += `      <path d="M 98 56 L 102 56 L 108 39 L 103 39 Z" fill="#1e293b" stroke="#0f172a" stroke-width="1"/>\n`;
  // Front strut connecting front rotor collar to top bar
  svg += `      <path d="M 126 56 L 131 56 L 140 39 L 135 39 Z" fill="#1e293b" stroke="#0f172a" stroke-width="1"/>\n`;
  // Main horizontal chainsaw handle bar (x: 100..144, y: 35..41)
  svg += `      <rect x="101" y="35" width="41" height="6.5" rx="3.2" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>\n`;
  // Rubberized knurled grip sleeve (LEFT HAND ANCHOR AT 122, 38)
  svg += `      <rect x="113" y="34.5" width="18" height="7.5" rx="2.5" fill="#18181b" stroke="#3f3f46" stroke-width="0.8"/>\n`;
  svg += `      <line x1="116" y1="35" x2="116" y2="41.5" stroke="#52525b" stroke-width="0.8"/>\n`;
  svg += `      <line x1="119" y1="35" x2="119" y2="41.5" stroke="#52525b" stroke-width="0.8"/>\n`;
  svg += `      <line x1="122" y1="35" x2="122" y2="41.5" stroke="#71717a" stroke-width="1"/> <!-- Center marker -->\n`;
  svg += `      <line x1="125" y1="35" x2="125" y2="41.5" stroke="#52525b" stroke-width="0.8"/>\n`;
  svg += `      <line x1="128" y1="35" x2="128" y2="41.5" stroke="#52525b" stroke-width="0.8"/>\n`;

  // =========================================================================
  // 5. ROTATING BARRELS & DEPTH SORTING (x: 124..244, yCenter: 74, R: 11)
  // =========================================================================
  svg += `      <!-- 6 Rotating Barrels (theta = ${thetaDeg} deg) -->\n`;

  // Center rotor axle shaft
  svg += `      <rect x="124" y="72.5" width="118" height="3" fill="#1e293b" stroke="#0f172a" stroke-width="0.6"/>\n`;

  // Compute 6 barrels
  const barrels = [];
  for (let k = 0; k < 6; k++) {
    const ang = thetaRad + (k * 60 * Math.PI) / 180;
    const y_k = 74 + 11 * Math.sin(ang);
    const z_k = Math.cos(ang); // depth: -1 (back) to +1 (front)
    barrels.push({ k, ang, y_k, z_k });
  }

  // Sort by z_k ascending (render back to front)
  barrels.sort((a, b) => a.z_k - b.z_k);

  // Gradient definitions per row
  let gradId = `bgrad-${col}-${row}`;
  if (row === 0) {
    // Cold gunmetal
    svg += `      <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="0">\n`;
    svg += `        <stop offset="0%" stop-color="#334155"/>\n`;
    svg += `        <stop offset="70%" stop-color="#475569"/>\n`;
    svg += `        <stop offset="100%" stop-color="#64748b"/>\n`;
    svg += `      </linearGradient>\n`;
  } else if (row === 1) {
    // Warm tips
    svg += `      <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="0">\n`;
    svg += `        <stop offset="0%" stop-color="#334155"/>\n`;
    svg += `        <stop offset="55%" stop-color="#475569"/>\n`;
    svg += `        <stop offset="78%" stop-color="#b45309"/>\n`;
    svg += `        <stop offset="92%" stop-color="#f59e0b"/>\n`;
    svg += `        <stop offset="100%" stop-color="#fde047"/>\n`;
    svg += `      </linearGradient>\n`;
  } else {
    // Overheated glowing incandescent
    svg += `      <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="0">\n`;
    svg += `        <stop offset="0%" stop-color="#334155"/>\n`;
    svg += `        <stop offset="35%" stop-color="#7f1d1d"/>\n`;
    svg += `        <stop offset="60%" stop-color="#dc2626"/>\n`;
    svg += `        <stop offset="82%" stop-color="#ea580c"/>\n`;
    svg += `        <stop offset="95%" stop-color="#facc15"/>\n`;
    svg += `        <stop offset="100%" stop-color="#fef08a"/>\n`;
    svg += `      </linearGradient>\n`;
  }

  for (const b of barrels) {
    const yTop = b.y_k - 2.1;
    const bHeight = 4.2;
    const isBack = b.z_k < -0.35;
    const isFront = b.z_k > 0.35;

    let fillColor, strokeColor, hlColor;
    if (row === 0) {
      if (isBack) {
        fillColor = '#1e293b';
        strokeColor = '#0f172a';
        hlColor = '#334155';
      } else if (isFront) {
        fillColor = '#64748b';
        strokeColor = '#1e293b';
        hlColor = '#cbd5e1';
      } else {
        fillColor = '#475569';
        strokeColor = '#0f172a';
        hlColor = '#94a3b8';
      }
    } else {
      fillColor = `url(#${gradId})`;
      strokeColor = isBack ? '#450a0a' : (row === 2 ? '#7c2d12' : '#0f172a');
      hlColor = row === 2 ? '#fef08a' : '#fde047';
    }

    // Main barrel tube from x=124 to x=244
    svg += `      <!-- Barrel k=${b.k} z=${b.z_k.toFixed(2)} -->\n`;
    svg += `      <rect x="124" y="${yTop.toFixed(2)}" width="120" height="${bHeight.toFixed(2)}" rx="1.0" fill="${fillColor}" stroke="${strokeColor}" stroke-width="0.8"/>\n`;
    // Barrel top highlight ridge
    if (!isBack) {
      const hlOpacity = row === 2 ? '0.85' : (isFront ? '0.75' : '0.45');
      svg += `      <line x1="126" y1="${(yTop + 0.8).toFixed(2)}" x2="242" y2="${(yTop + 0.8).toFixed(2)}" stroke="${hlColor}" stroke-width="0.9" opacity="${hlOpacity}"/>\n`;
    }
    // Muzzle crown collar
    const crownColor = row === 2 ? '#fef08a' : (row === 1 ? '#f59e0b' : '#334155');
    svg += `      <rect x="241" y="${(yTop - 0.4).toFixed(2)}" width="3" height="${(bHeight + 0.8).toFixed(2)}" rx="0.6" fill="${crownColor}" stroke="${strokeColor}" stroke-width="0.6"/>\n`;
  }

  // Heat blur streaks in Row 1 & Row 2
  if (row === 1) {
    svg += `      <line x1="198" y1="71" x2="244" y2="71" stroke="#fbbf24" stroke-width="1.2" opacity="0.35"/>\n`;
    svg += `      <line x1="198" y1="77" x2="244" y2="77" stroke="#fbbf24" stroke-width="1.2" opacity="0.35"/>\n`;
  } else if (row === 2) {
    svg += `      <line x1="175" y1="69" x2="245" y2="69" stroke="#f97316" stroke-width="2.2" opacity="0.45"/>\n`;
    svg += `      <line x1="170" y1="74" x2="245" y2="74" stroke="#fde047" stroke-width="2.0" opacity="0.65"/>\n`;
    svg += `      <line x1="175" y1="79" x2="245" y2="79" stroke="#f97316" stroke-width="2.2" opacity="0.45"/>\n`;
  }

  // =========================================================================
  // 6. ROTATING CLAMP COLLARS / STABILIZER RINGS (x: 158, 200, 236)
  // =========================================================================
  const clampXs = [158, 200, 236];
  for (const cx of clampXs) {
    const clampColor = row === 2 ? '#7f1d1d' : '#1e293b';
    const clampEdge = row === 2 ? '#ea580c' : '#0f172a';
    svg += `      <!-- Stabilizer Clamp at x=${cx} -->\n`;
    svg += `      <rect x="${cx - 2.5}" y="${74 - 13.5}" width="5" height="27" rx="1.8" fill="${clampColor}" stroke="${clampEdge}" stroke-width="1"/>\n`;
    svg += `      <rect x="${cx - 1}" y="${74 - 12}" width="2" height="24" fill="#475569" opacity="0.6"/>\n`;
    // Clamp notches / alignment bolts moving vertically according to theta
    for (let k = 0; k < 6; k++) {
      const ang = thetaRad + (k * 60 * Math.PI) / 180;
      const boltY = 74 + 11.5 * Math.sin(ang);
      const boltZ = Math.cos(ang);
      if (boltZ > -0.2) {
        const boltCol = row === 2 ? '#fde047' : '#94a3b8';
        svg += `      <circle cx="${cx}" cy="${boltY.toFixed(2)}" r="1.1" fill="${boltCol}"/>\n`;
      }
    }
  }

  // =========================================================================
  // 7. FRONT BULKHEAD / MUZZLE CAP DISK AT x=244
  // =========================================================================
  const capColor = row === 2 ? '#f97316' : '#1e293b';
  svg += `      <rect x="244" y="${74 - 11}" width="2" height="22" rx="1" fill="${capColor}" stroke="#0f172a" stroke-width="0.8"/>\n`;

  svg += `    </g>\n`;
  svg += `  </g>\n`;
  return svg;
}

let fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TOTAL_W} ${TOTAL_H}" width="${TOTAL_W}" height="${TOTAL_H}">\n`;
fullSvg += `  <defs>\n`;
fullSvg += `    <style>\n`;
fullSvg += `      rect, path, circle, line { shape-rendering: geometricPrecision; }\n`;
fullSvg += `    </style>\n`;
fullSvg += `  </defs>\n`;

for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    fullSvg += renderCell(c, r);
  }
}

fullSvg += `</svg>\n`;

const outPath = path.resolve('assets/weapons/minigun_spritesheet.svg');
fs.writeFileSync(outPath, fullSvg, 'utf8');
console.log('Successfully generated minigun_spritesheet.svg (' + fullSvg.length + ' bytes)');
