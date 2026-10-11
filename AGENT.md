# Instrukcje dla Agenta AI (Projekt: Keep-it-high)

## 1. Korzystanie z CodeGraph (MCP)
- **Zasada Główna**: Przed rozpoczęciem jakiejkolwiek analizy kodu, szukaniem funkcji, zmiennych czy powiązań między plikami JS, ZAWSZE używaj narzędzia CodeGraph MCP (`codegraph_explore`).
- **Zakaz**: Nie przeszukuj całego repozytorium tekstem (narzędziami typu grep/find), jeśli możesz pobrać strukturę obiektów z bazy CodeGraph. Oszczędzaj tokeny i czas kontekstu.
- **Synchronizacja**: Po każdej większej refaktoryzacji kodu lub dodaniu nowego pliku skryptowego uruchom `codegraph sync`, aby zaktualizować bazę danych.

## 2. Architektura i Modularność Kodu (Higiena Plików)
- **Limity wielkości plików**:
  - **Miękki limit (~800–1000 linii)**: Gdy plik zbliża się do 1000 linii, nowe funkcje i podsystemy wydzielaj do osobnych modułów tematycznych.
  - **Twardy limit (~1500 linii)**: Nie dopuszczaj do rozrastania się plików logiki powyżej 1500 linii. `js/main.js` musi pozostać wyłącznie lekkim koordynatorem pętli gry (`update()` / `draw()`) oraz inicjalizacji.
- **Podział katalogów domenowych w `js/`**:
  - `js/input/` — wszystko związane ze sterowaniem:
    - `keyboardMouse.js` (klawiatura i mysz PC),
    - `touchHandlers.js` (obsługa ekranu dotykowego / Dual-Stick),
    - `gamepad.js` (obsługa kontrolerów / padów przez Gamepad API),
    - `playerController.js` (przeliczanie wejścia na celowanie, strzał, przeładowanie i ciąg jetpacka w klatce gry),
    - `index.js` (punkt wejścia dla całego podsystemu `input`).
  - `js/player/` — logika i renderowanie postaci (`state.js`, `index.js`, `actions.js`, `locomotion.js`, `ik.js`, `death.js`, `renderer.js`, `limbs.js`, `armor.js`).
  - `js/arenas/` — logika, fizyka i renderowanie poszczególnych aren (`arena1.js`, `arena2/`, `arena3/`).
  - `js/obstacles/` — przeszkody, kolizje, platformy i ich renderowanie (`state.js`, `collisions.js`, `platforms.js`, `renderer.js`, `procedural.js`).
  - `js/weapons/` — definicje broni, balistyka pocisków i rysowanie uzbrojenia (`definitions.js`, `bullets.js`, `renderer.js`).
  - `js/world/` — kamera, cząsteczki, niebo, teren i krew/gore (`state.js`, `sky.js`, `ground.js`, `gore.js`, `particles.js`).
  - `js/ui/` — HUD na płótnie i modale (`hudCanvas.js`, `classSelectModal.js`).
  - `js/dev/` — narzędzia deweloperskie i edytor przeszkód (`devPanel.js`, `obstacleEditor.js`).

## 3. Bezpieczeństwo Modułów ES i Stanu Współdzielonego
- **Współdzielony stan między modułami**: Zmienne modyfikowane z wielu modułów (np. `mouseState`, `inputSession`, `gamepadState`, `arena1State`, `worldState`) przechowuj jako właściwości eksportowanych obiektów stanu. Nigdy nie polegaj na nadpisywaniu wyeksportowanych prymitywów `let` z zewnątrz modułu.
- **Aktualizacja `index.html` (`importmap`)**: Po dodaniu każdego nowego pliku `.js` obowiązkowo dopisz go do `<script type="importmap">` w `index.html` z aktualnym parametrem cache-bustera `?v=...`.
- **Weryfikacja po wydzieleniu kodu**: Po przeniesieniu funkcji lub zmiennych między plikami zawsze zweryfikuj, że w starym pliku nie pozostały wywołania niezaimportowanych funkcji (brak `ReferenceError` w czasie działania) oraz że wszystkie eksporty/importy się zgadzają.

## 4. Zarządzanie Gałęziami Git i Kopią Zapasową
- **Ochrona `backup-main`**: NIGDY nie nadpisuj ani nie wypychaj zmian na gałąź `backup-main` bez wyraźnego, bezpośredniego polecenia użytkownika. Gdy użytkownik prosi o wypchnięcie na `main`, wypychaj wyłącznie `main`.
