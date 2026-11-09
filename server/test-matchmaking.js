import { WebSocket } from 'ws';

const URL = 'ws://localhost:3000';

async function connectPlayer(name) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(URL);
    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'MATCHMAKE',
        name,
        preferredArena: 'arena-1',
        mode: 'TEAMS',
        classId: 'STRIKER'
      }));
    });
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw);
      if (msg.type === 'MATCH_JOINED') {
        resolve({ ws, msg });
      }
    });
    ws.on('error', reject);
  });
}

async function run() {
  console.log('Testing 6 players joining...');
  const clients = [];
  for (let i = 1; i <= 6; i++) {
    const res = await connectPlayer(`Tester_${i}`);
    clients.push(res);
    console.log(`Player ${i} joined Room: ${res.msg.roomId}, Slot: ${res.msg.slotIndex}, Team: ${res.msg.team}`);
  }

  console.log('\nConnecting 7th player (should create Room 2 because Room 1 is full at 6 players)...');
  const p7 = await connectPlayer('Tester_7');
  clients.push(p7);
  console.log(`Player 7 joined Room: ${p7.msg.roomId}, Slot: ${p7.msg.slotIndex}, Team: ${p7.msg.team}`);

  const room1 = clients[0].msg.roomId;
  const room2 = p7.msg.roomId;

  if (room1 !== room2) {
    console.log('\nSUCCESS: Room 1 reached cap of 6 players! Player 7 created a new Room 2.');
  } else {
    console.error('\nFAILURE: Player 7 joined the same room despite cap of 6!');
    process.exit(1);
  }

  // Cleanup
  for (const c of clients) {
    c.ws.close();
  }
  process.exit(0);
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
