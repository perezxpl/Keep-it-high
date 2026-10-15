// =============================================================================
// SCRIPTS/VERIFY-SYNTAX.JS - AUTOMATYCZNA WERYFIKACJA SKŁADNI MODUŁÓW ES I EMOJI
// Sprawdza rygorystycznie składnię ECMAScript (w tym zduplikowane const/let/var)
// oraz brak emotikonów w zmodyfikowanym kodzie przed commitem.
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
let filesChecked = 0;

function checkJsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      checkJsFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      filesChecked++;
      const code = fs.readFileSync(fullPath, 'utf8');
      try {
        new vm.SourceTextModule(code, {
          identifier: path.relative(rootDir, fullPath)
        });
      } catch (err) {
        console.error(`[SYNTAX ERROR] ${path.relative(rootDir, fullPath)}: ${err.message}`);
        hasErrors = true;
      }
    }
  }
}

console.log('--- 1. Weryfikacja skladni modulow ES (SourceTextModule) ---');
checkJsFiles(jsDir);
console.log(`Przeskanowano plikow JS: ${filesChecked}`);

console.log('\n--- 2. Weryfikacja braku emotikonow w git diff (ZERO EMOJIS) ---');
try {
  const gitDiff = execSync('git diff HEAD', { cwd: rootDir, encoding: 'utf8' });
  const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]/;
  if (emojiRegex.test(gitDiff)) {
    console.error('[EMOJI ERROR] Wykryto niedozwolone emotikony w git diff!');
    hasErrors = true;
  } else {
    console.log('Brak emotikonow w zmianach git (OK).');
  }
} catch (e) {
  // W przypadku braku repozytorium lub braku zmian ignorujemy błąd exec
}

if (hasErrors) {
  console.error('\n[BLAD] Weryfikacja zakonczona niepowodzeniem! Popraw powyzsze bledy przed commitem.');
  process.exit(1);
} else {
  console.log('\n[SUKCES] Wszystkie pliki JS poprawne skladniowo. Gotowe do commita.');
  process.exit(0);
}
