# Dedykowany Serwer Matchmakingu (Keep-it-high)

Serwer czasu rzeczywistego (Node.js + WebSocket) obslugujacy automatyczny matchmaking i synchronizacje dla maksymalnie **6 graczy na jeden mecz** (3 vs 3 Team Deathmatch lub 6-osobowe FFA).

---

## 1. Uruchomienie lokalne na Twoim komputerze (za darmo)

1. W glownym folderze projektu Keep-it-high otworz terminal.
2. Wejdz do katalogu serwera i uruchom go:
   ```bash
   cd server
   npm install
   npm start
   ```
3. Serwer uruchomi sie na porcie `3000` (`ws://localhost:3000`).

---

## 2. Wdrozenie w chmurze za 0 zl (np. na Render.com)

1. Zaloguj sie na darmowe konto na [Render.com](https://render.com).
2. Kliknij **New +** -> **Web Service**.
3. Polacz swoje repozytorium GitHub `perezxpl/Keep-it-high`.
4. Ustaw nastepujace parametry:
   * **Root Directory:** `server`
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node index.js`
   * **Instance Type:** `Free` (0 USD)
5. Kliknij **Create Web Service**.
6. Po 1 minucie otrzymasz swoj publiczny adres serwera SSL: `wss://twoj-projekt.onrender.com`.
