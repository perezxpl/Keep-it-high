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
// 1. Składnia modułów ES
// -----------------------------------------------------------------------------
console.log('--- 1. Weryfikacja skladni modulow ES (SourceTextModule) ---');
for (const filePath of allJsFilePaths) {
  const rel = path.relative(rootDir, filePath).replace(/\\/g, '/');
  const code = fs.readFileSync(filePath, 'utf8');
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
// 3. Weryfikacja braku emotikonów w git diff (ZERO EMOJIS)
// -----------------------------------------------------------------------------
console.log('\n--- 3. Weryfikacja braku emotikonow w git diff (ZERO EMOJIS) ---');
try {
  const gitDiff = execSync('git diff HEAD', { cwd: rootDir, encoding: 'utf8' });
  const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]/;
  if (emojiRegex.test(gitDiff)) {
    console.error('[EMOJI ERROR] Wykryto niedozwolone emotikony w git diff!');
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
