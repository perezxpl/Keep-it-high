// =========================================================================
// SCRIPTS/AI-PLAYTEST.JS - ZAUTOMATYZOWANY RUNNER TESTÓW FIZYKI I WYDAJNOŚCI
// Uruchamia bezobsługowy mecz 6 postaci AI w przeglądarce Headless (Playwright).
// Testuje Arenę 5 (kolizje klocków, squash, tąpnięcia) lub Arenę 3 (zniszczenia rzeki).
// Generuje raport Markdown i JSON w katalogu reports/ oraz wypisuje na stdout.
// Standard: Strict ES Module, Zero emojis, samowystarczalny serwer HTTP.
// =========================================================================

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Parsowanie argumentów CLI
const args = process.argv.slice(2);
function getArg(name, defaultValue) {
  const match = args.find(a => a.startsWith(`--${name}=`));
  if (match) return match.split('=')[1];
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) {
    return args[idx + 1];
  }
  return defaultValue;
}

const ARENA = getArg('arena', 'arena-5');
const DURATION = parseInt(getArg('duration', '25'), 10);
const BOTS = parseInt(getArg('bots', '5'), 10);
const PORT = parseInt(getArg('port', '8000'), 10);
const HEADLESS = getArg('headless', 'true') !== 'false';

// Typy MIME dla wbudowanego lekkiego serwera HTTP
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8'
};

/**
 * Sprawdza czy serwer HTTP już odpowiada pod zadanym portem.
 */
function checkServerRunning(port) {
  return new Promise(resolve => {
    const req = http.get(`http://localhost:${port}/index.html`, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 304);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Uruchamia wbudowany lekki serwer HTTP, jeśli port jest wolny.
 */
function startInternalHttpServer(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const urlPath = req.url.split('?')[0];
        if (urlPath === '/favicon.ico') {
          res.writeHead(204, { 'Content-Type': 'image/x-icon' });
          res.end();
          return;
        }

        let safePath = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
        if (safePath === '/' || safePath === '\\') safePath = '/index.html';

        const filePath = path.join(ROOT_DIR, safePath);
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache'
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Internal Server Error: ${err.message}`);
      }
    });

    server.listen(port, '0.0.0.0', () => {
      resolve(server);
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Próbuje uruchomić przeglądarkę Chromium (Chrome, Edge lub wbudowany kanał).
 */
async function launchBrowser(isHeadless) {
  const channels = ['chrome', 'msedge', undefined];
  let lastError = null;

  for (const ch of channels) {
    try {
      const opts = {
        headless: isHeadless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--mute-audio'
        ]
      };
      if (ch) opts.channel = ch;
      const b = await chromium.launch(opts);
      return b;
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(`Nie udalo sie uruchomic zadnej przegladarki Chromium (Chrome/Edge): ${lastError?.message}`);
}

/**
 * Główna funkcja wykonująca automatyczny test symulacji.
 */
async function runPlaytest() {
  console.log(`[AI-PLAYTEST] Rozpoczynanie testu: arena=${ARENA}, czas=${DURATION}s, boty=${BOTS}, port=${PORT}`);

  let internalServer = null;
  const isAlreadyRunning = await checkServerRunning(PORT);

  if (!isAlreadyRunning) {
    console.log(`[AI-PLAYTEST] Uruchamianie wbudowanego serwera HTTP na http://localhost:${PORT}...`);
    internalServer = await startInternalHttpServer(PORT);
  } else {
    console.log(`[AI-PLAYTEST] Wykryto dzialajacy serwer HTTP na porcie ${PORT}.`);
  }

  let browser = null;
  const caughtErrors = [];

  try {
    browser = await launchBrowser(HEADLESS);
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      hasTouch: false
    });

    const page = await context.newPage();

    // Przechwytywanie logów i błędów z konsoli gry
    page.on('pageerror', (err) => {
      const msg = `[PAGE ERROR] ${err.message}`;
      caughtErrors.push(msg);
      console.error(msg);
    });

    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error' && !text.includes('favicon') && !text.includes('net::ERR_') && !text.includes('status of 404')) {
        caughtErrors.push(`[CONSOLE ERROR] ${text}`);
      }
    });

    const targetUrl = `http://localhost:${PORT}/?arena=${ARENA}&autostart=STRIKER&aiTest=1&bots=${BOTS}`;
    console.log(`[AI-PLAYTEST] Ladowanie gry pod adresem: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Oczekiwanie na start pętli gry i zainicjalizowanie watchdoga
    await page.waitForFunction(() => {
      return typeof window.physicsWatchdog !== 'undefined' &&
             window.GAME_STATE &&
             window.GAME_STATE.current === 'PLAYING';
    }, { timeout: 10000 });

    console.log(`[AI-PLAYTEST] Gra pomyslnie wystartowala w trybie PLAYING. Rozpoczynanie ${DURATION}s symulacji walki...`);

    // Pętla symulacji z okresowym wyzwalaniem zdarzeń stresowych co 5 sekund
    const intervalSec = 5;
    const steps = Math.floor(DURATION / intervalSec);
    const remainderSec = DURATION % intervalSec;

    for (let s = 1; s <= steps; s++) {
      await page.waitForTimeout(intervalSec * 1000);
      const elapsedSec = s * intervalSec;

      // Zdarzenia stresowe: zrzut suwnicy lub wybuchy struktur
      await page.evaluate((arena) => {
        try {
          if (arena === 'arena-5' || arena === '5') {
            // Wymuszenie opadnięcia suwnicy, jeśli jest gotowa
            if (window.arena5State && window.arena5State.crane && window.arena5State.crane.phase === 'COOLDOWN') {
              window.arena5State.crane.cooldownTimer = 0;
            }
          } else if (arena === 'arena-3' || arena === '3') {
            // Naruszenie losowej belki mostu lub klocka
            if (Array.isArray(window.ARENA_3_BRIDGE_BLOCKS)) {
              const intactBlocks = window.ARENA_3_BRIDGE_BLOCKS.filter(b => b && b.intact);
              if (intactBlocks.length > 0 && typeof window.breakBridgeBlock === 'function') {
                const target = intactBlocks[Math.floor(Math.random() * intactBlocks.length)];
                window.breakBridgeBlock(target, 0, 0, 15);
              }
            }
          }
        } catch (_) {}
      }, ARENA);

      // Pobranie bieżących statystyk dla logu postępu
      const quickStats = await page.evaluate(() => {
        return window.physicsWatchdog ? window.physicsWatchdog.getStats() : null;
      });

      if (quickStats) {
        console.log(`[AI-PLAYTEST] Postep: ${elapsedSec}/${DURATION}s | Sredni FPS: ${quickStats.avgFps} | 1% Low: ${quickStats.onePercentLowFps} | Wykrytych anomalii: ${quickStats.frameCount}`);
      }
    }

    if (remainderSec > 0) {
      await page.waitForTimeout(remainderSec * 1000);
    }

    console.log(`[AI-PLAYTEST] Zakonczono czas symulacji. Pobieranie pelnego raportu diagnostycznego...`);

    // Pobranie raportów z silnika gry
    const summaryMarkdown = await page.evaluate(() => {
      return (window.physicsWatchdog && typeof window.physicsWatchdog.getSummaryMarkdown === 'function')
        ? window.physicsWatchdog.getSummaryMarkdown()
        : '# BŁĄD: physicsWatchdog niedostępny na window';
    });

    const reportJSON = await page.evaluate(() => {
      return (window.physicsWatchdog && typeof window.physicsWatchdog.getReportJSON === 'function')
        ? window.physicsWatchdog.getReportJSON()
        : '{}';
    });

    // Zapisanie raportów na dysk
    const reportsDir = path.join(ROOT_DIR, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const mdPath = path.join(reportsDir, 'latest-playtest.md');
    const jsonPath = path.join(reportsDir, 'latest-playtest.json');

    // Dołączenie ewentualnych błędów z konsoli do raportu Markdown
    let finalMarkdown = summaryMarkdown;
    if (caughtErrors.length > 0) {
      finalMarkdown += `\n\n## 4. Przechwycone Błędy Konsoli JS (${caughtErrors.length})\n`;
      caughtErrors.forEach((err, i) => {
        finalMarkdown += `- ${i + 1}. \`${err}\`\n`;
      });
    }

    fs.writeFileSync(mdPath, finalMarkdown, 'utf-8');
    fs.writeFileSync(jsonPath, reportJSON, 'utf-8');

    console.log(`\n================================================================================`);
    console.log(`[AI-PLAYTEST] RAPORT ZAPISANY DO: reports/latest-playtest.md`);
    console.log(`================================================================================\n`);
    console.log(finalMarkdown);
    console.log(`\n================================================================================\n`);

    const parsedJson = JSON.parse(reportJSON || '{}');
    const anomaliesCount = parsedJson.anomaliesCount || 0;
    const hasCriticalErrors = caughtErrors.length > 0;

    if (anomaliesCount === 0 && !hasCriticalErrors) {
      console.log(`[AI-PLAYTEST] SUKCES: Brak anomalii fizyki i bledow wykonania.`);
    } else {
      console.log(`[AI-PLAYTEST] UWAGA: Wykryto ${anomaliesCount} anomalii fizyki lub bledy konsoli (${caughtErrors.length}). Sprawdz powyzszy raport.`);
    }

  } finally {
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
    if (internalServer) {
      try { internalServer.close(); } catch (_) {}
    }
  }
}

runPlaytest().catch((err) => {
  console.error(`[AI-PLAYTEST FATAL ERROR]`, err);
  process.exit(1);
});
