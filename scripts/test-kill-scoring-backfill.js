// =========================================================================
// TEST-KILL-SCORING-BACKFILL.JS
// Weryfikacja:
// 1. Rozroznienie punktacji XP oraz statystyk za zabicie Bota (+5 XP) vs
//    zywego Gracza (+25 XP) vs Zombie (+3 XP) + brak podwojnego naliczania.
// 2. Automatyczny backfill botow na serwerze (1/6 -> 5 botow, 2/6 -> 4 boty,
//    wyjscie gracza -> bot wraca).
// =========================================================================

import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import wsPkg from '../server/node_modules/ws/index.js';

const { WebSocket } = wsPkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Mock localStorage / window dla modulu progression.js
const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => { storage.set(k, String(v)); },
  removeItem: (k) => { storage.delete(k); }
};
globalThis.window = globalThis;

const {
  XP_REWARDS,
  getPlayerXP,
  recordKill,
  resetPlayerStats,
  getPlayerStatsSummary,
  setXpNotificationCallback
} = await import('../js/progression.js');

console.log('--- TEST 1: Rozroznienie XP i statystyk Gracz vs Bot vs Zombie ---');
{
  storage.clear();
  resetPlayerStats();
  const notifs = [];
  setXpNotificationCallback((text, amount) => notifs.push({ text, amount }));

  assert.strictEqual(XP_REWARDS.PLAYER_KILL, 25, 'Zabicie zywego gracza musi dawac 25 XP');
  assert.strictEqual(XP_REWARDS.BOT_KILL, 5, 'Zabicie bota AI musi dawac 5 XP');
  assert.strictEqual(XP_REWARDS.ZOMBIE_KILL, 3, 'Zabicie zombie musi dawac 3 XP');

  // 1a. Zabicie zywego gracza zdalnego
  const remoteEnemy = { id: 'p_123', peerId: 'p_123', isRemote: true, isBot: false, hp: 0, isDead: true };
  recordKill(remoteEnemy);
  assert.strictEqual(getPlayerXP(), 25, 'Po zabiciu gracza XP powinno wzrosnac o 25');
  // Proba ponownego naliczenia tej samej smierci (np. z pakietu kill_event) nie moze podwoic XP!
  recordKill({ victim: remoteEnemy, victimId: 'p_123', targetType: 'PLAYER' });
  assert.strictEqual(getPlayerXP(), 25, 'Ta sama eliminacja nie moze byc naliczona podwojnie');

  // 1b. Zabicie bota AI
  const botEnemy = { id: 'bot_1', isBot: true, isRemote: false, hp: 0, isDead: true };
  recordKill(botEnemy);
  assert.strictEqual(getPlayerXP(), 30, 'Po zabiciu bota XP powinno wzrosnac o +5 (razem 30)');

  // 1c. Zabicie zombie
  const zombieEnemy = { id: 'zmb_1', isZombie: true, hp: 0, isDead: true };
  recordKill(zombieEnemy);
  assert.strictEqual(getPlayerXP(), 33, 'Po zabiciu zombie XP powinno wzrosnac o +3 (razem 33)');

  const summary = getPlayerStatsSummary();
  assert.strictEqual(summary.playerKills, 1, 'Licznik zabojstw graczy powinien wynosic 1');
  assert.strictEqual(summary.botKills, 1, 'Licznik zabojstw botow powinien wynosic 1');
  assert.strictEqual(summary.zombieKills, 1, 'Licznik zabojstw zombie powinien wynosic 1');
  assert.strictEqual(summary.kills, 2, 'Laczne fragi (gracze + boty) powinny wynosic 2');
  assert.strictEqual(summary.pvpKdRatio, '1.00', 'PvP K/D powinno liczyc tylko zabicia graczy (1.00)');
  assert.ok(notifs.some(n => n.text.includes('GRACZ') && n.amount === 25));
  assert.ok(notifs.some(n => n.text.includes('BOT') && n.amount === 5));
  console.log('PASS: XP oraz statystyki precyzyjnie rozrozniaja graczy (+25), boty (+5) i zombie (+3).');
}

console.log('--- TEST 2: Automatyczny backfill botow na serwerze przy dolaczaniu i wychodzeniu graczy ---');
{
  const TEST_PORT = 3035;
  const serverProc = spawn('node', ['server/index.js'], {
    cwd: ROOT_DIR,
    env: { ...process.env, PORT: String(TEST_PORT) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const waitForReady = () => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server start timeout')), 5000);
    serverProc.stdout.on('data', (d) => {
      if (d.toString().includes('nasluchuje')) {
        clearTimeout(timer);
        resolve();
      }
    });
    serverProc.stderr.on('data', (d) => {
      const s = d.toString();
      if (s.trim()) console.error('[SRV ERR]', s);
    });
  });

  const connectAndWaitMsg = (name, expectedType) => new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${TEST_PORT}`);
    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'MATCHMAKE',
        name,
        preferredArena: 'arena-2',
        mode: 'TEAMS',
        classId: 'STRIKER'
      }));
    });
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === expectedType) {
        resolve({ ws, msg });
      }
    });
    ws.on('error', reject);
  });

  try {
    await waitForReady();

    // Gracz 1 dolacza sam -> serwer uzupelnia 5 botow (2 CYAN + 3 ORANGE = 3v3)
    const c1 = await connectAndWaitMsg('Gracz_Alfa', 'MATCH_JOINED');
    assert.strictEqual(c1.msg.playersCount, 1);
    assert.strictEqual(c1.msg.botCount, 5, 'Dla 1 gracza w otwartym pokoju serwer powinien dodac 5 botow');
    assert.strictEqual(c1.msg.team, 'CYAN');
    assert.deepStrictEqual(c1.msg.botTeams, ['CYAN', 'CYAN', 'ORANGE', 'ORANGE', 'ORANGE']);

    // Przygotuj listener u Gracza 1 na PLAYER_JOINED i PLAYER_LEFT
    const p1Events = [];
    c1.ws.on('message', (raw) => {
      const m = JSON.parse(raw.toString());
      if (m.type === 'PLAYER_JOINED' || m.type === 'PLAYER_LEFT') p1Events.push(m);
    });

    // Gracz 2 dolacza do otwartego pokoju -> trafia do ORANGE i zmniejsza liczbe botow do 4 (2 CYAN + 2 ORANGE)
    const c2 = await connectAndWaitMsg('Gracz_Beta', 'MATCH_JOINED');
    assert.strictEqual(c2.msg.roomId, c1.msg.roomId, 'Gracz 2 musi dolaczyc do otwartego pokoju Gracza 1');
    assert.strictEqual(c2.msg.team, 'ORANGE');
    assert.strictEqual(c2.msg.botCount, 4, 'Po dolaczeniu 2. gracza liczba botow musi spasc do 4');
    assert.deepStrictEqual(c2.msg.botTeams, ['CYAN', 'CYAN', 'ORANGE', 'ORANGE']);

    await new Promise((r) => setTimeout(r, 150));
    const joinedEv = p1Events.find(e => e.type === 'PLAYER_JOINED');
    assert.ok(joinedEv, 'Gracz 1 powinien otrzymac PLAYER_JOINED');
    assert.strictEqual(joinedEv.botCount, 4, 'PLAYER_JOINED powinien synchronizowac spadek botow do 4');

    // Gracz 2 wychodzi -> bot automatycznie wraca na brakujace miejsce w ORANGE (znowu 5 botow)
    c2.ws.close();
    await new Promise((r) => setTimeout(r, 200));
    const leftEv = p1Events.find(e => e.type === 'PLAYER_LEFT');
    assert.ok(leftEv, 'Gracz 1 powinien otrzymac PLAYER_LEFT po wyjsciu Gracza 2');
    assert.strictEqual(leftEv.botCount, 5, 'Po wyjsciu gracza bot powinien automatycznie wrocic (5 botow)');
    assert.deepStrictEqual(leftEv.botTeams, ['CYAN', 'CYAN', 'ORANGE', 'ORANGE', 'ORANGE']);

    c1.ws.close();
    console.log('PASS: Backfill botow dynamicznie dopasowuje sklady przy wejsciu i wyjsciu graczy.');
  } finally {
    serverProc.kill();
  }
}

console.log('\n[SUKCES] Wszystkie testy rozroznienia punktacji i backfillu botow przeszly!');
