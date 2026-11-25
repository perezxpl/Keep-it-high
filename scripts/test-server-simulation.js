// =========================================================================
// SCRIPTS/TEST-SERVER-SIMULATION.JS - E2E SYMULACJA ROZGRYWKI NA SERWERZE
// Uruchamia dedykowany serwer WebSocket (server/index.js) + serwer HTTP +
// test matchmakingu (6 graczy + przepełnienie do 2. pokoju) + 2 prawdziwych
// klientów Chromium w Playwright łączących się online i prowadzących bitwę:
// ruch, celowanie, strzał, podpalenie/zgon/bezpieczny respawn oraz cleanup.
// =========================================================================

import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import wsPkg from './../server/node_modules/ws/index.js';
const { WebSocket } = wsPkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const WS_PORT = 3030;
const HTTP_PORT = 8095;
const WS_URL = `ws://localhost:${WS_PORT}`;
const HTTP_URL = `http://localhost:${HTTP_PORT}`;
const HEALTH_URL = `http://localhost:${WS_PORT}/`;

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

function startHttpStaticServer(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const urlPath = (req.url || '/').split('?')[0];
        if (urlPath === '/favicon.ico') {
          res.writeHead(204);
          res.end();
          return;
        }
        let safePath = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
        if (safePath === '/' || safePath === '\\') safePath = '/index.html';
        const filePath = path.join(ROOT_DIR, safePath);
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          res.writeHead(404);
          res.end('404 Not Found');
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Cache-Control': 'no-store'
        });
        fs.createReadStream(filePath).pipe(res);
      } catch (err) {
        res.writeHead(500);
        res.end(err.message);
      }
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(body) });
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

async function waitForHealth(url, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetchJson(url);
      if (res.status === 200 && res.json?.status === 'online') return res.json;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('Serwer WebSocket nie uruchomil healthchecka na czas');
}

function connectWsMatchmaker(name, arenaId = 'arena-3') {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const t = setTimeout(() => reject(new Error(`Timeout matchmakingu dla ${name}`)), 5000);
    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'MATCHMAKE',
        name,
        preferredArena: arenaId,
        mode: 'TEAMS',
        classId: 'STRIKER'
      }));
    });
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw);
      if (msg.type === 'MATCH_JOINED') {
        clearTimeout(t);
        resolve({ ws, msg });
      }
    });
    ws.on('error', (err) => {
      clearTimeout(t);
      reject(err);
    });
  });
}

let wsProc = null;
let httpServer = null;
let browser = null;

async function cleanup() {
  if (browser) {
    try { await browser.close(); } catch (_) {}
    browser = null;
  }
  if (httpServer) {
    try { httpServer.close(); } catch (_) {}
    httpServer = null;
  }
  if (wsProc && !wsProc.killed) {
    try { wsProc.kill(); } catch (_) {}
    wsProc = null;
  }
}

async function launchBrowser() {
  const channels = ['chrome', 'msedge', undefined];
  let lastError = null;
  for (const ch of channels) {
    try {
      const opts = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--mute-audio']
      };
      if (ch) opts.channel = ch;
      return await chromium.launch(opts);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Brak przegladarki Chromium');
}

async function runSimulation() {
  console.log('--- ETAP 1: Uruchamianie dedykowanego serwera WebSocket (server/index.js) oraz serwera HTTP ---');
  wsProc = spawn('node', ['server/index.js'], {
    cwd: ROOT_DIR,
    env: { ...process.env, PORT: String(WS_PORT) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  wsProc.stderr.on('data', (chunk) => {
    const text = chunk.toString().trim();
    if (text) console.error('[WS STDERR]', text);
  });

  const healthInit = await waitForHealth(HEALTH_URL);
  assert.strictEqual(healthInit.service, 'keep-it-high-matchmaker');
  assert.strictEqual(healthInit.maxPlayersPerMatch, 6);
  console.log(`PASS: Serwer matchmakingu dziala poprawnie (${HEALTH_URL}, pokoi: ${healthInit.activeRoomsCount})`);

  httpServer = await startHttpStaticServer(HTTP_PORT);
  console.log(`PASS: Serwer HTTP wystartowal na ${HTTP_URL}`);

  console.log('--- ETAP 2: Test obciazenia i przepełnienia pokoju (6 graczy + 7. w nowym pokoju) ---');
  const wsClients = [];
  for (let i = 1; i <= 6; i++) {
    wsClients.push(await connectWsMatchmaker(`SimBot_${i}`, 'arena-1'));
  }
  const p7 = await connectWsMatchmaker('SimBot_7', 'arena-1');
  wsClients.push(p7);
  assert.notStrictEqual(wsClients[0].msg.roomId, p7.msg.roomId, '7. gracz musi trafic do 2. pokoju');

  const midHealth = await fetchJson(HEALTH_URL);
  assert.strictEqual(midHealth.json.totalPlayersOnline, 7, 'Serwer powinien raportowac dokladnie 7 graczy online');
  assert.strictEqual(midHealth.json.activeRoomsCount, 2, 'Serwer powinien raportowac 2 aktywne pokoje');

  for (const c of wsClients) {
    c.ws.close();
  }
  await new Promise((r) => setTimeout(r, 350));
  const afterDropHealth = await fetchJson(HEALTH_URL);
  assert.strictEqual(afterDropHealth.json.totalPlayersOnline, 0, 'Po rozlaczeniu botow stan online powinien spaść do 0');
  assert.strictEqual(afterDropHealth.json.activeRoomsCount, 0, 'Puste pokoje powinny zostac zamkniete');
  console.log('PASS: Matchmaking 6/6, przepełnienie pokoju i sprzatanie zamknietych pokoi dzialaja bez zarzutu.');

  console.log('--- ETAP 3: Symulacja prawdziwej rozgrywki 2 graczy w Playwright (Host CYAN vs Guest ORANGE na Arena 3) ---');
  browser = await launchBrowser();
  const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page1 = await ctx1.newPage();
  const page2 = await ctx2.newPage();

  const runtimeErrors = [];
  for (const [label, pg] of [['Klient1', page1], ['Klient2', page2]]) {
    pg.on('pageerror', (err) => runtimeErrors.push(`${label} PAGEERROR: ${err.stack || err.message}`));
    pg.on('console', (msg) => {
      if (msg.type() === 'error') {
        const txt = msg.text();
        if (!txt.includes('404')) {
          runtimeErrors.push(`${label} CONSOLE ERROR: ${txt}`);
        }
      }
    });
    await pg.addInitScript((wsUrl) => {
      window.KIH_SERVER_URL = wsUrl;
    }, WS_URL);
  }

  await Promise.all([
    page1.goto(`${HTTP_URL}/?arena=arena-3`, { waitUntil: 'domcontentloaded' }),
    page2.goto(`${HTTP_URL}/?arena=arena-3`, { waitUntil: 'domcontentloaded' })
  ]);

  await Promise.all([
    page1.waitForFunction(() => typeof window.startDedicatedMatchmaking === 'function' && window.player, null, { timeout: 10000 }),
    page2.waitForFunction(() => typeof window.startDedicatedMatchmaking === 'function' && window.player, null, { timeout: 10000 })
  ]);

  // Dolaczenie Host (Klient 1) oraz Goscia (Klient 2)
  await page1.evaluate(() => {
    window.player.name = 'Operator_Alfa';
    window.startDedicatedMatchmaking('Operator_Alfa', { arenaId: 'arena-3', serverUrl: window.KIH_SERVER_URL });
  });
  await page1.waitForFunction(() => window.wsState?.status === 'matched', null, { timeout: 6000 });

  await page2.evaluate(() => {
    window.player.name = 'Operator_Beta';
    window.startDedicatedMatchmaking('Operator_Beta', { arenaId: 'arena-3', serverUrl: window.KIH_SERVER_URL });
  });

  // Oczekiwanie az obaj klienci znajda wspolny pokoj i automatycznie wejda do bitwy (PLAYING)
  await Promise.all([
    page1.waitForFunction(() => (window.GAME_STATE?.current === 'PLAYING' || window.gameState === 'PLAYING') && window.wsState?.status === 'in_game', null, { timeout: 10000 }),
    page2.waitForFunction(() => (window.GAME_STATE?.current === 'PLAYING' || window.gameState === 'PLAYING') && window.wsState?.status === 'in_game', null, { timeout: 10000 })
  ]);

  const matchSnap1 = await page1.evaluate(() => ({
    roomId: window.wsState.roomId,
    isHost: window.wsState.isHost,
    team: window.player.team,
    remoteCount: window.remotePlayers ? window.remotePlayers.size : 0,
    x: window.player.x,
    y: window.player.y
  }));
  const matchSnap2 = await page2.evaluate(() => ({
    roomId: window.wsState.roomId,
    isHost: window.wsState.isHost,
    team: window.player.team,
    remoteCount: window.remotePlayers ? window.remotePlayers.size : 0,
    x: window.player.x,
    y: window.player.y
  }));

  assert.strictEqual(matchSnap1.roomId, matchSnap2.roomId, 'Obaj gracze musza byc w tym samym pokoju');
  assert.strictEqual(matchSnap1.isHost, true, 'Klient 1 powinien byc hostem pokoju');
  assert.strictEqual(matchSnap2.isHost, false, 'Klient 2 powinien byc gosciem pokoju');
  assert.strictEqual(matchSnap1.team, 'CYAN', 'Klient 1 powinien trafic do CYAN');
  assert.strictEqual(matchSnap2.team, 'ORANGE', 'Klient 2 powinien trafic do ORANGE');
  assert.strictEqual(matchSnap1.remoteCount, 1, 'Klient 1 powinien widziec Klienta 2 na liscie remotePlayers');
  assert.strictEqual(matchSnap2.remoteCount, 1, 'Klient 2 powinien widziec Klienta 1 na liscie remotePlayers');
  console.log(`PASS: Obaj klienci weszli do bitwy online (pokoj ${matchSnap1.roomId}, CYAN vs ORANGE).`);

  // Ruch i ogien po zakonczeniu 3-sekundowego odliczania startowego
  await page1.keyboard.down('KeyD');
  await page2.keyboard.down('KeyA');
  await page1.mouse.move(900, 320);
  await page1.mouse.down();
  await page2.mouse.move(320, 320);
  await page2.mouse.down();
  await Promise.all([
    page1.waitForFunction((startX) => Math.abs(window.player.x - startX) > 25, matchSnap1.x, { timeout: 10000 }),
    page2.waitForFunction((startX) => Math.abs(window.player.x - startX) > 25, matchSnap2.x, { timeout: 10000 })
  ]);
  await new Promise((r) => setTimeout(r, 450));
  await page1.mouse.up();
  await page2.mouse.up();
  await page1.keyboard.up('KeyD');
  await page2.keyboard.up('KeyA');

  const syncAfterMove = await Promise.all([
    page1.evaluate(() => {
      const rp = Array.from(window.remotePlayers.values())[0];
      return {
        localX: window.player.x,
        localY: window.player.y,
        remoteX: rp?.x,
        remoteY: rp?.y,
        remoteName: rp?.name,
        ping: window.wsState.ping
      };
    }),
    page2.evaluate(() => {
      const rp = Array.from(window.remotePlayers.values())[0];
      return {
        localX: window.player.x,
        localY: window.player.y,
        remoteX: rp?.x,
        remoteY: rp?.y,
        remoteName: rp?.name,
        ping: window.wsState.ping
      };
    })
  ]);

  assert.ok(Math.abs(syncAfterMove[0].localX - matchSnap1.x) > 15, 'Klient 1 powinien przemiescic sie w trakcie symulacji');
  assert.ok(Math.abs(syncAfterMove[1].localX - matchSnap2.x) > 15, 'Klient 2 powinien przemiescic sie w trakcie symulacji');
  assert.ok(Math.abs(syncAfterMove[0].remoteX - syncAfterMove[1].localX) < 120, 'Pozycja Klienta 2 powinna zsynchronizowac sie u Klienta 1 przez serwer WS');
  assert.ok(Math.abs(syncAfterMove[1].remoteX - syncAfterMove[0].localX) < 120, 'Pozycja Klienta 1 powinna zsynchronizowac sie u Klienta 2 przez serwer WS');
  console.log(`PASS: Ruch, strzelanie i synchronizacja pozycji przez serwer WS dzialaja (delta X1->2: ${Math.round(Math.abs(syncAfterMove[1].remoteX - syncAfterMove[0].localX))}px, delta X2->1: ${Math.round(Math.abs(syncAfterMove[0].remoteX - syncAfterMove[1].localX))}px).`);

  console.log('--- ETAP 4: Weryfikacja zgonu podczas podpalenia i bezpiecznego respawnu w sesji serwerowej ---');
  await page2.evaluate(() => {
    window.player.burnTimer = 240;
    window.player.hp = 0;
    window.player.isDead = true;
    window.player.respawnTimer = 10;
  });
  await page2.waitForFunction(() => window.player && !window.player.isDead && window.player.hp > 0, null, { timeout: 8000 });
  const respawnSnap2 = await page2.evaluate(() => ({
    x: window.player.x,
    y: window.player.y,
    hp: window.player.hp,
    burnTimer: window.player.burnTimer,
    burnAttacker: window.player.burnAttacker,
    isDead: window.player.isDead
  }));
  assert.strictEqual(respawnSnap2.isDead, false, 'Klient 2 powinien sie odrodzic');
  assert.strictEqual(respawnSnap2.burnTimer, 0, 'Po odrodzeniu na serwerze burnTimer musi wynosic 0');
  assert.strictEqual(respawnSnap2.burnAttacker, null, 'Po odrodzeniu burnAttacker musi byc null');
  assert.ok(!(respawnSnap2.x >= 1750 && respawnSnap2.x <= 2650 && respawnSnap2.y > 1200), 'Respawn na serwerze nie moze wpasc do wody na Arenie 3');
  console.log(`PASS: Zgon z podpaleniem i bezpieczny respawn na serwerze bez ognia (${Math.round(respawnSnap2.x)}, ${Math.round(respawnSnap2.y)}).`);

  console.log('--- ETAP 5: Wyjscie z meczu i weryfikacja sprzatania pokoju na serwerze ---');
  await page1.evaluate(() => window.cancelDedicatedMatchmaking && window.cancelDedicatedMatchmaking());
  await page2.evaluate(() => window.cancelDedicatedMatchmaking && window.cancelDedicatedMatchmaking());
  await new Promise((r) => setTimeout(r, 400));

  const finalHealth = await fetchJson(HEALTH_URL);
  assert.strictEqual(finalHealth.json.totalPlayersOnline, 0, 'Po opuszczeniu meczu przez graczy serwer powinien miec 0 osob online');
  assert.strictEqual(finalHealth.json.activeRoomsCount, 0, 'Po opuszczeniu meczu pokoj powinien zostac zamkniety');

  assert.strictEqual(runtimeErrors.length, 0, `Wykryto bledy JS podczas symulacji serwerowej: ${runtimeErrors.join('; ')}`);
  console.log('PASS: Zero bledow runtime w obu klientach, pokoj zamkniety poprawnie.');
  console.log('\n[SUKCES] Pelna symulacja rozgrywki na serwerze zakończona 100% powodzeniem!');
}

runSimulation()
  .catch((err) => {
    console.error('\n[BLAD SYMULACJI SERWEROWEJ]', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
  });
