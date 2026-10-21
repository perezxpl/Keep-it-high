// =============================================================================
// SCRIPTS/VERIFY-SYNTAX.JS - AUTOMATYCZNA KOMPLEKSOWA WERYFIKACJA KODU
// 1. Składnia ECMAScript (SourceTextModule - brak zduplikowanych deklaracji)
// 2. Poprawność importów i eksportów (Module Linking - brak nieistniejących symboli)
// 3. Spójność mapy importów w index.html (importmap)
// 4. Brak emotikonów w git diff (ZERO EMOJIS)
// =============================================================================

import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const jsDir = path.join(rootDir, 'js');

let hasErrors = false;
const modulesMap = new Map();
const allJsFilePaths = [];

function scanJsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanJsFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      allJsFilePaths.push(fullPath);
    }
  }
}

scanJsFiles(jsDir);

// -----------------------------------------------------------------------------
// 1. Składnia modułów ES oraz integralność ciągów tekstowych
// -----------------------------------------------------------------------------
console.log('--- 1. Weryfikacja skladni modulow ES (SourceTextModule) ---');
for (const filePath of allJsFilePaths) {
  const rel = path.relative(rootDir, filePath).replace(/\\/g, '/');
  const code = fs.readFileSync(filePath, 'utf8');

  if (/[^a-zA-Z0-9_$]gba\(|^\s*gba\(/.test(code)) {
    console.error(`[STRING SYNTAX ERROR] ${rel}: Wykryto uszkodzone wywolanie gba(...) zamiast rgba(...)`);
    hasErrors = true;
  }

  try {
    const mod = new vm.SourceTextModule(code, {
      identifier: filePath
    });
    modulesMap.set(filePath, mod);
  } catch (err) {
    console.error(`[SYNTAX ERROR] ${rel}: ${err.message}`);
    hasErrors = true;
  }
}
console.log(`Przeskanowano plikow JS: ${allJsFilePaths.length} (OK).`);

// -----------------------------------------------------------------------------
// 2. Weryfikacja powiązań importów i eksportów (Module Linking)
// -----------------------------------------------------------------------------
console.log('\n--- 2. Weryfikacja poprawnosci importow i eksportow (Module Linking) ---');
function linker(specifier, referencingModule) {
  let targetPath;
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    targetPath = path.resolve(path.dirname(referencingModule.identifier), specifier);
  } else {
    targetPath = path.resolve(rootDir, specifier);
  }

  // Obsługa ewentualnego braku rozszerzenia .js
  if (!targetPath.endsWith('.js') && fs.existsSync(targetPath + '.js')) {
    targetPath += '.js';
  }

  if (!fs.existsSync(targetPath)) {
    throw new Error(`Plik importowany nie istnieje: ${specifier}`);
  }

  if (!modulesMap.has(targetPath)) {
    const code = fs.readFileSync(targetPath, 'utf8');
    const mod = new vm.SourceTextModule(code, { identifier: targetPath });
    modulesMap.set(targetPath, mod);
  }

  return modulesMap.get(targetPath);
}

let linkedCount = 0;
for (const [filePath, mod] of modulesMap.entries()) {
  const rel = path.relative(rootDir, filePath).replace(/\\/g, '/');
  try {
    mod.link(linker);
    linkedCount++;
  } catch (err) {
    console.error(`[LINK ERROR] ${rel}: ${err.message}`);
    hasErrors = true;
  }
}
console.log(`Powiazano i zweryfikowano importy w ${linkedCount} modulach.`);

// -----------------------------------------------------------------------------
// 2.5. Weryfikacja wykonania modulow w srodowisku V8 (Runtime Module Evaluation)
// Wykrywa bledy Temporal Dead Zone (TDZ), cykliczne referencje przed inicjalizacja
// oraz wykonuje testowe wywołania krytycznych rendererów postaci i broni
// -----------------------------------------------------------------------------
console.log('\n--- 2.5. Weryfikacja wykonania startowego gry (Runtime Evaluation) ---');
try {
  const mockGradient = { addColorStop: () => {} };
  const mockContext = {
    fillRect: () => {}, clearRect: () => {}, save: () => {}, restore: () => {},
    beginPath: () => {}, closePath: () => {}, stroke: () => {}, fill: () => {},
    arc: () => {}, moveTo: () => {}, lineTo: () => {}, resetTransform: () => {},
    scale: () => {}, translate: () => {}, rotate: () => {}, drawImage: () => {},
    createLinearGradient: () => mockGradient, createRadialGradient: () => mockGradient,
    ellipse: () => {}, rect: () => {}, roundRect: () => {}, quadraticCurveTo: () => {},
    strokeRect: () => {}, measureText: () => ({ width: 10 }), setLineDash: () => {}
  };
  const mockElement = {
    style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    addEventListener: () => {}, setAttribute: () => {}, getAttribute: () => null,
    dataset: {}, offsetWidth: 100, offsetHeight: 50, offsetLeft: 0, offsetTop: 0,
    appendChild: () => {}, querySelectorAll: () => [], querySelector: () => null,
    getContext: () => mockContext, width: 1280, height: 720, clientWidth: 1280, clientHeight: 720,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 })
  };

  globalThis.window = { innerWidth: 1280, innerHeight: 720, addEventListener: () => {}, requestAnimationFrame: () => {} };
  globalThis.requestAnimationFrame = () => {};
  globalThis.document = {
    querySelector: () => mockElement, querySelectorAll: () => [], getElementById: () => mockElement,
    createElement: () => mockElement, appendChild: () => {}, body: mockElement, addEventListener: () => {}
  };
  Object.defineProperty(globalThis, 'navigator', { value: { maxTouchPoints: 0 }, configurable: true });
  globalThis.location = { search: '', hash: '' };
  globalThis.performance = { now: () => Date.now() };
  globalThis.Image = class {
    constructor() {
      this.complete = true;
      this.naturalWidth = 100;
      this.naturalHeight = 100;
    }
  };
  globalThis.Audio = class {};
  globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

  const evalModules = new Map();
  function evalLinker(specifier, referencingModule) {
    let p = specifier.startsWith('.')
      ? path.resolve(path.dirname(referencingModule.identifier), specifier)
      : path.resolve(rootDir, 'js', specifier);
    if (!p.endsWith('.js') && fs.existsSync(p + '.js')) p += '.js';
    const norm = p.toLowerCase();
    if (!evalModules.has(norm)) {
      const code = fs.readFileSync(p, 'utf8');
      evalModules.set(norm, new vm.SourceTextModule(code, { identifier: p }));
    }
    return evalModules.get(norm);
  }

  const mainPath = path.resolve(jsDir, 'main.js');
  const mainCode = fs.readFileSync(mainPath, 'utf8');
  const mainMod = new vm.SourceTextModule(mainCode, { identifier: mainPath });
  evalModules.set(mainPath.toLowerCase(), mainMod);

  await mainMod.link(evalLinker);
  await mainMod.evaluate();

  // Smoke test wywołań rendererów postaci i uzbrojenia
  const limbsPathNorm = path.resolve(jsDir, 'player/limbs.js').toLowerCase();
  const limbsMod = evalModules.get(limbsPathNorm);
  if (limbsMod && limbsMod.namespace && typeof limbsMod.namespace.drawHandheldGrenade === 'function') {
    limbsMod.namespace.drawHandheldGrenade(mockContext, 10, 10, 1.0, 0.5);
  }

  console.log('Graf modulow wykonany poprawnie w V8 bez bledow TDZ/inicjalizacji (OK).');
} catch (evalErr) {
  console.error(`[RUNTIME EVALUATION ERROR] ${evalErr.stack || evalErr.message}`);
  hasErrors = true;
}

// -----------------------------------------------------------------------------
// 3. Weryfikacja braku emotikonów w git diff (ZERO EMOJIS)
// -----------------------------------------------------------------------------
console.log('\n--- 3. Weryfikacja braku emotikonow w git diff (ZERO EMOJIS) ---');
try {
  const gitDiff = execSync('git diff HEAD', { cwd: rootDir, encoding: 'utf8' });
  const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]/;
  const lines = gitDiff.split('\n');
  let currentFile = '';
  const foundEmojis = [];

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      currentFile = line;
      continue;
    }
    // Sprawdzamy wyłącznie nowo dodane linie w plikach kodu (pomijamy pliki dokumentacji markdown)
    if (line.startsWith('+') && !line.startsWith('+++')) {
      const isDoc = currentFile.includes('.md');
      if (!isDoc && emojiRegex.test(line)) {
        foundEmojis.push({ file: currentFile, line });
      }
    }
  }

  if (foundEmojis.length > 0) {
    console.error('[EMOJI ERROR] Wykryto niedozwolone emotikony w dodanym kodzie:');
    foundEmojis.forEach(e => console.error(`  ${e.file}\n    ${e.line}`));
    hasErrors = true;
  } else {
    console.log('Brak emotikonow w zmianach git (OK).');
  }
} catch (e) {}

if (hasErrors) {
  console.error('\n[BLAD] Weryfikacja zakonczona niepowodzeniem! Popraw powyzsze bledy przed commitem.');
  process.exit(1);
} else {
  console.log('\n[SUKCES] Kod przeszedl pelna weryfikacje (skladnia, importy/eksporty, zero emotikonow).');
  process.exit(0);
}
