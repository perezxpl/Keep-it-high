# Instrukcje i Architektura dla Agenta AI (Projekt: Keep-it-high)

## 0. Obowiązkowy Start Każdego Zadania — Synchronizacja z Git
- **Zasada Bezwzględna**: Przed przystąpieniem do analizy kodu, planowania czy jakiejkolwiek edycji plików, agent ma BEZWZGLĘDNY OBOWIĄZEK sprawdzić stan zdalnego repozytorium i pobrać najnowsze zmiany:
  ```bash
  git pull origin main
  ```
- **Weryfikacja zmian**: Jeśli na gałęzi `main` pojawiły się nowe commity (np. zmiany wprowadzone przez brata lub z innego urządzenia), agent analizuje co doszło i kontynuuje zadanie bezpośrednio na zaktualizowanym kodzie, aby nigdy nie nadpisać cudzej pracy.

## 1. Korzystanie z CodeGraph (MCP)
- **Zasada Główna**: Przed rozpoczęciem analizy kodu, szukaniem funkcji, zmiennych czy powiązań między plikami JS, ZAWSZE używaj narzędzia CodeGraph (`codegraph_explore` lub `codegraph explore "<zapytanie>"`).
- **Synchronizacja**: Po każdym dodaniu nowego pliku `.js` lub większej refaktoryzacji uruchom `codegraph sync`, aby zaktualizować graf powiązań.

## 2. Architektura Projektu — Co Gdzie Trafia (Mapa Modułów)
Projekt wykorzystuje natywne moduły ES (`type="module"`). **`js/main.js` (~970 linii) jest wyłącznie koordynatorem pętli gry (`update()` / `draw()`) oraz inicjalizacji** — NIE dopisuj tam nowej logiki rozgrywki, sterowania ani rysowania.

Każdą nową funkcję umieszczaj w odpowiednim module domenowym:

### Sterowanie i Wejście (`js/input/`)
- `js/input/index.js` — punkt wejścia łączący wszystkie urządzenia sterujące (`initAllInputHandlers`).
- `js/input/keyboardMouse.js` — obsługa zdarzeń klawiatury i myszy PC (`keydown`, `keyup`, `mousemove`, `mousedown`, `mouseup`) oraz współdzielone obiekty stanu `keys`, `mouseState` i `inputSession`.
- `js/input/touchHandlers.js` — obsługa zdarzeń dotykowych ekranu mobilnego (`touchstart`, `touchmove`, `touchend`), wirtualnych drążków i kieszeni (pockets).
- `js/input/gamepad.js` — obsługa kontrolerów / padów (Gamepad API: `gamepadState`, `applyDeadzone`, `initGamepadHandlers`, `pollGamepadInput`). Cały nowy kod związany z grą na padzie dodawaj tutaj oraz w `playerController.js`.
- `js/input/playerController.js` — logika wykonywana w każdej klatce `update()`: przeliczanie wejścia (mysz / dotyk / pad) na celowanie (`player.aimX/Y`), strzelanie (`triggerPlayerShoot`), auto-przeładowanie, timery drążków oraz ciąg jetpacka.
- `js/mobileControls.js` — definicje i układ geometryczny wirtualnych drążków (`leftStick`, `rightStick`, `pockets`, `btnCluster`).

### Postać Gracza (`js/player/`)
- `js/player/state.js` — domyślne statystyki (`DEFAULT_STATS`, `DEFAULT_BODY`), fabryka instancji (`createPlayerInstance`), zmiana klasy (`setPlayerClass`) oraz inicjalizacja skoku (`initiatePlayerJump`).
- `js/player/index.js` — główna pętla fizyki i cyklu życia postaci w klatce (`updatePlayer`).
- `js/player/actions.js` — akcje bojowe i piłkarskie: kopnięcia (zwykłe, nożyce, przewrotka, Spartan Kick), wślizg (`playerSlide`), rzut granatem (`prepareGrenadeThrow`, `releaseGrenadeThrow`).
- `js/player/locomotion.js` — trajektorie stóp, chód, bieg, sprint i kucanie (`evaluateCrouchState`).
- `js/player/ik.js` — kinematyka odwrotna (2-bone IK) dla rąk i nóg.
- `js/player/death.js` — fizyka ragdolla, śmierć i rozczłonkowanie.
- `js/player/renderer.js` — główny potok rysowania sylwetki gracza (`drawPlayer`).
- `js/player/limbs.js` — rysowanie detali kończyn, butów, dłoni i stawów.
- `js/player/armor.js` — rysowanie kamizelek taktycznych, hełmów i pancerza.
- `js/player/hair.js` — fizyka i rysowanie włosów / fryzur.
- `js/player/facialHair.js` — style, kolory i rysowanie zarostu twarzy (brody, wąsy, kilkudniowy zarost).
- `js/player/headgear.js` — style, taktyczne kolory i rysowanie nakryć głowy (beret, czapka, kominiarka, bandana, boonie, gogle).
- `js/player/mask.js` — maski twarzowe, okulary i chusty (okulary ciemne, okulary muchy z przezroczystością, arafatka / shemagh, półmaska Ghost, maska gazowa SAS, maska hokejowa, maska balistyczna, maska Oni, respirator).
- `js/player/neck.js` — ozdoby szyi i klatki piersiowej z pełną fizyką 2D (nieśmiertelnik wojskowy US Army, ciężki złoty łańcuch gangsta ze złotym medalionem).
- `js/player/torso.js` — fasony ubrania torsu (krótki i długi rękaw, kamuflaże moro jasne i ciemne), proceduralne plamy moro oraz renderowanie koszulki bojowej.
- `js/player/pants.js` — fasony spodni (długie bojówki bojowe, krótkie spodenki taktyczne, kamuflaże moro jasne i ciemne), paleta kolorów oraz renderowanie miniaturek spodni.
- `js/player/shoes.js` — fasony i kolory obuwia (buty desantowe, niskie sneakersy, korki piłkarskie, wysokie trampki hi-top, wysokie glany z klamrami), renderowanie stopy i cholewki zakrywającej nogawkę spodni oraz kafelki podglądu w kreatorze.
- `js/player/jetpack.js` — fasony (`JETPACK_STYLE_LIST`) i palety kolorów ognia jetpacka (`JETPACK_COLOR_LIST`, 8 kolorów), `getJetpackFlamePalette(color)` zwracające pełną paletę (base, glow, light, deep, particles) oraz `drawJetpackPreview` do kafelka w kreatorze (zakładka JETPACK).

### Klasy Postaci (`js/classes/`)
- `js/classes/index.js` — rejestr klas (`CLASSES`, `CLASS_LIST`, `DEFAULT_CLASS`).
- `js/classes/aero.js` — Klasa 1: Raptor (Zwiadowca / Lotnik, plecak odrzutowy, zwrotność w powietrzu).
- `js/classes/striker.js` — Klasa 2: Striker (Szturmowiec / Strzelec, buty odrzutowe Rocket Boots, super dashe w powietrzu za 50% paliwa, dopalacz naziemny z podwójnego wychylenia).
- `js/classes/enforcer.js` — Klasa 3: Enforcer (Kolos / Czołg, potężna masa, wstrząsy ziemi, taran).

### Uzbrojenie i Pociski (`js/weapons/`)
- `js/weapons/definitions.js` — parametry i statystyki broni (`WEAPONS`: AK-47, Shotgun, Sniper).
- `js/weapons/bullets.js` — wystrzeliwanie (`shootWeapon`), balistyka pocisków (`updateBullets`), kolizje pocisków i przeładowanie (`reloadWeapon`).
- `js/weapons/renderer.js` — rysowanie modeli broni, celownika laserowego (`drawSniperLaserSight`), łusek i smug.
- `js/projectiles.js` — granaty taktyczne, eksplozje i trajektorie rzutów.

### Areny (`js/arenas/`)
- `js/arenas/index.js` — rejestr i przełączanie aren (`getActiveArena`).
- `js/arenas/arena1.js` — Arena 1 (Neonowe Miasto / Stadion).
- `js/arenas/arena2/` — Arena 2 (Toksyczna Rafineria / Sektor X): `state.js`, `physics.js`, `renderer.js`, `acid.js`, `blackout.js`, `sewerPipes.js`, `submergedSkeletons.js`.
- `js/arenas/arena3/` — Arena 3 (Tajemnicza Dżungla): `state.js`, `background.js` (proceduralne nocne niebo, gwiazdy, księżyc, góry, świetliki), `renderer.js`, `destruction.js`.

### Tryb Deathmatch (`js/deathmatch/`)
- `js/deathmatch/state.js` — konfiguracja, stałe czasu (5 minut, 300s), nagrody XP (100, 80, 60, 40 XP), tryby (TDM, FFA), drużyny (CYAN, ORANGE) oraz stan sesji `deathmatchState`.
- `js/deathmatch/logic.js` — pętla bitwy (`updateDeathmatch`), śledzenie zabójstw i zgonów, dynamiczny leaderboard i finalizacja meczu (`finishDeathmatch`).
- `js/deathmatch/renderer.js` — rysowanie HUD-u bitwy (`drawDeathmatchHUD`) z zegarem 5:00 i fragami oraz uroczystego podium z nagrodami XP (`drawDeathmatchPodium`).
- `js/deathmatch/index.js` — główny punkt wejścia i eksport modułu deathmatch.

### Przeszkody i Kolizje (`js/obstacles/`)
- `js/obstacles/state.js` — stan przeszkód, wyniki (`arenaScore`), platformy (`ARENA_PLATFORMS`) i przełączanie aren (`switchArena`).
- `js/obstacles/palette.js` — katalog obiektów edytora (`OBSTACLE_PALETTE`, `getObstacleDef`).
- `js/obstacles/platforms.js` — fizyka lądowania na platformach i powierzchniach (`checkPlayerPlatformLanding`, `getPlatformSurfaceY`).
- `js/obstacles/collisions.js` — kolizje piłki, gracza i bota z przeszkodami (`checkObstacleCollisions`).
- `js/obstacles/renderer.js` — rysowanie przeszkód i platform (`drawObstacles`).
- `js/obstacles/procedural.js` — proceduralne generowanie przeszkód i ptaków na dystansie.

### Sztuczna Inteligencja i Boty (`js/bot.js`)
- `js/bot.js` — konfiguracja profili botów bojowych (`BOT_PROFILES`, `BOT_CLASS_PROFILES`, `BOT_NAMES_BY_CLASS`), fabryka instancji botów (`createBotInstance`), pula aktywnych botów (`bots`, `botCount`, `setBotCount`, `getBotCount`, `getActiveBots`), automatyczny dobór zrównoważonych klas (`balanceBotClasses`, `applyBotClassAndConfig`), logika sztucznej inteligencji (`updateBotBrain` z celowaniem wielopodmiotowym, unikalnymi umiejętnościami specjalnymi klas: Blast Jump dla Enforcera, Rocket Boots Air/Ground Dash dla Strikera, kiting/hover dla Raptora) oraz stopnie trudności (`setBotDifficulty`).

### Rozgrywka Sieciowa i P2P (`js/network.js`, `js/networkMatch.js`, `js/networkUI.js`)
- `js/network.js` — architektura P2P WebRTC (PeerJS), synchronizacja pozycji graczy i botów, autorytatywna synchronizacja obrażeń (`deal_dmg`), rzutów granatów, stanu deathmatch, kwasu na Arenie 2 oraz eliminacji (`kill_event`).
- `js/networkMatch.js` — konfiguracja składów i drużyn w stylu Super Smash Bros (`mpMatchConfig`): szablony taktyczne (`applyMpPreset`: KOOP vs Boty, 2v2, 3v3, 1v1, FFA), przydział graczy do Team Alpha (CYAN) i Team Beta (ORANGE), steppery botów dla każdej drużyny, kalkulacja spawnów (`getMpSpawnPositions`) oraz taktyczne podsumowania składu (`getMpMatchRosterSummary`).
- `js/networkUI.js` — obsługa interfejsu trybu wieloosobowego, modale połączenia, karta składów bitwy (Roster), kod pokoju, czat tekstowy w grze (klawisz T), wskaźnik pingu i synchronizacja konfiguracji drużyn i botów w lobby.

### Świat, Kamera, UI i Narzędzia (`js/world/`, `js/ui/`, `js/dev/`)
- `js/world/` — stan świata i kamery (`state.js`), niebo (`sky.js`), podłoże (`ground.js`), teren (`terrain.js`), gore/krew (`gore.js`), cząsteczki (`particles.js`).
- `js/ui/hudCanvas.js` — rysowanie HUD-u na płótnie (`drawHUD`).
- `js/ui/combatFeed.js` — dolny taktyczny baner eliminacji i zgonów (`ZABIŁEŚ [NICK]` / `ZABITY PRZEZ [NICK]`) z animacją wejścia i wygasania.
- `js/ui/classSelectModal.js` — karty wyboru klas postaci na płótnie.
- `js/uiManager.js` — obsługa ekranów HTML/CSS (Menu główne, Wybór areny, Ustawienia, Kreator, Pauza).
- `js/dev/devPanel.js` — przyciski panelu DEV (`BOT`, `Arena`, `ZOOM`, `PAD`, `HEŁM`, `KAMIZELKA`).
- `js/dev/obstacleEditor.js` — edytor przeszkód na żywo w grze.

### Progresja i Rangi (`js/progression.js`, `js/ui/rankHud.js`)
- `js/progression.js` — system prestiżowych rang wojskowych (od Szeregowego do Generała Areny) z odblokowaniami nagród (`unlocks`: bronie, perki, serie zabójstw, kamuflaże) oraz statystyk bojowych gracza w `localStorage` (`RANKS`, `getPlayerXP`, `addPlayerXP`, `getPlayerStatsSummary`, `recordMatchResult`, `recordKill`, `recordDeath`, `recordGoal`, `resetPlayerStats`).
- `js/ui/rankHud.js` — wizualna prezentacja stopni wojskowych i paska XP w HUD, animowane powiadomienia XP oraz baner zwycięstwa w meczu (+40 XP).

### Serie Zabójstw — Killstreaks (`js/killstreaks/`)
- `js/killstreaks/state.js` — rejestr serii zabójstw w stylu Call of Duty (`KILLSTREAKS`: UAV, Care Package, Mortar Strike, Sentry Gun, Attack Drone, Juggernaut) oraz obiekt stanu sesji `killstreakState` (bieżąca seria na jedno życie, odblokowane nagrody `availableStreaks`, aktywne efekty `activeStreaks`).
- `js/killstreaks/carePackage.js` — zrzut zaopatrzenia (Care Package): skrzynia airdrop z opadaniem na spadochronie, lądowanie na platformach/ziemi (`getCarePackageSurfaceY`), flary dymne na podłożu, okrągły pierścień postępu przechwytywania (1.2s dla gracza z [E] lub dotykiem, 1.8s dla botów) oraz pełna tabela łupów (Ciężki Pancerz 100 HP + hełm FAST, Odnowienie amunicji i granatów, Nalot Moździerzowy, Dron Bojowy, Juggernaut 250 HP).
- `js/killstreaks/supportStrikes.js` — nalot moździerzowy (kaskadowa salwa 5 pocisków artyleryjskich spadających z nieba z detonacją obszarową) oraz dron bojowy (quadcopter stealth podążający za operatorem, namierzający cele laserem i prowadzący ogień ciągły przez 25s).
- `js/killstreaks/sentryGun.js` — wieżyczka strażnicza (Sentry Gun): automatyczne obrotowe działko na statywie taktycznym rozstawiane na ziemi/platformie (120 HP, 30s misji, pancerz mantlet, celownik LIDAR/IR, ogień zaporowy seriami, opadające łuski i detonacja przy zniszczeniu).
- `js/killstreaks/logic.js` — zliczanie eliminacji na jedno życie (`registerKillstreakKill`), reset po zgonie (`resetKillstreak`), aktywacja wsparcia bojowego (`activateKillstreak`, `activateNextAvailableStreak`) oraz cykl życia timerów (`updateKillstreaks`).
- `js/killstreaks/renderer.js` — potok renderowania efektów świata (skaner radarowy UAV, taktyczne ramki namierzania wrogów `[BRACKETS]`, odległości w metrach oraz wskaźniki krawędziowe celów poza ekranem) oraz minimalistyczny widget HUD serii zabójstw (`drawKillstreakHUD`).
- `js/killstreaks/index.js` — główny punkt wejścia i eksport modułu serii zabójstw.

## 3. Limity Wielkości Plików i Zasady Jakości Kodu
1. **Limity linii kodu**:
   - **Miękki limit (~800–1000 linii)**: Gdy plik przekracza 1000 linii, wydziel nowe funkcje do osobnego podmodułu w odpowiednim katalogu.
   - **Twardy limit (1500 linii)**: Żaden plik logiki nie może rosnąć powyżej 1500 linii. Jeśli istniejący plik (np. renderer) jest już duży, nową zawartość (np. nowe efekty lub typy obiektów) umieszczaj w osobnym pliku pomocniczym i importuj.
2. **Bezpieczeństwo stanu między modułami ES**:
   - Zmienne modyfikowane z wielu modułów (np. `mouseState`, `inputSession`, `gamepadState`, `arena1State`, `worldState`) przechowuj zawsze jako właściwości eksportowanych obiektów (`state.prop = ...`), a NIE jako prymitywy `export let`, których nie da się nadpisać z innego modułu.
3. **Obowiązkowa aktualizacja `importmap` w `index.html`**:
   - Po utworzeniu każdego nowego pliku `.js` dopisz go do `<script type="importmap">` w `index.html` i zaktualizuj wersję cache-bustera `?v=...`.
   - W samych plikach `.js` używaj czystych ścieżek względnych (np. `import { ... } from './state.js';` bez `?v=...`), ponieważ wersjonowaniem zarządza `importmap` w `index.html`.
4. **Bezwzględny wymóg walidacji składni przed commitem**:
   - **Zakaz polegania na samym `node -c`**: Polecenie `node -c` traktuje pliki jak klasyczne skrypty CommonJS i NIE wyłapuje błędów specyficznych dla modułów ES (takich jak powtórzone `const`/`let` wewnątrz funkcji czy kolizje deklaracji), co prowadzi do błędów `SyntaxError` w przeglądarce.
   - **Obowiązkowa weryfikacja automatyczna**: Przed KAŻDYM zatwierdzeniem zmian (`git commit`) i wypchnięciem (`git push`), agent ma BEZWZGLĘDNY OBOWIĄZEK uruchomić dedykowany skrypt walidacji składni modułów ES:
     ```bash
     node --experimental-vm-modules scripts/verify-syntax.js
     ```
   - Skrypt skanuje wszystkie pliki `.js` za pomocą natywnego kompilatora V8 `SourceTextModule` (dokładnie tak, jak kompiluje przeglądarka) i sprawdza brak zakazanych emotikonów w `git diff`. Jeśli skrypt zwróci jakikolwiek błąd, commit jest bezwzględnie wstrzymany do momentu naprawy.
5. **Weryfikacja referencji po refaktoryzacji**:
   - Upewnij się, że po przeniesieniu funkcji między plikami w starym pliku nie zostało żadne wywołanie niezaimportowanej funkcji (brak `ReferenceError`) ani zduplikowany `export`.

## 4. Procedura Wdrażania Całkowicie Nowych Podsystemów Gry
Gdy użytkownik zleca stworzenie nowego elementu gry, którego jeszcze nie ma (np. dźwięk/audio, power-upy/znajdźki, system umiejętności/perków, nowy tryb gry, system zapisu/ekwipunku, nowi wrogowie/bossowie):
1. **Zakaz upychania do istniejących plików**:
   - Nowy element NIE może być wklejany luzem do `js/main.js`, `js/world.js` ani `js/player.js`.
2. **Stworzenie dedykowanego katalogu domenowego**:
   - Utwórz nowy katalog `js/<nowy_moduł>/` (np. `js/audio/`, `js/powerups/`, `js/gamemodes/`, `js/skills/`).
   - Zastosuj sprawdzony trójpodział:
     - `state.js` — definicje, konfiguracja, stan instancji, lista aktywnych obiektów.
     - `logic.js` (lub `physics.js`) — aktualizacja w każdej klatce (`update...`), kolizje, wygasanie timerów, reakcje na zdarzenia.
     - `renderer.js` — rysowanie na płótnie (`draw...`).
     - `index.js` — punkt wejścia wystawiający prosty, czysty interfejs na zewnątrz (np. `init...()`, `update...(dt)`, `draw...(ctx)`).
3. **Zasada „Maksymalnie 3 linijek w `main.js`”**:
   - `main.js` jest tylko koordynatorem — nie powinien znać wewnętrznej logiki nowego podsystemu.
   - W `main.js` dopisujesz wyłącznie:
     1. Import funkcji z `js/<nowy_moduł>/index.js`.
     2. Inicjalizację przy starcie: `initX()`.
     3. Wywołanie w pętli `update()`: `updateX(...)`.
     4. Wywołanie w pętli `draw()`: `drawX(ctx, camera)`.
4. **Obowiązkowa rejestracja**:
   - Nowe pliki dopisz do `index.html` (`importmap`), zaktualizuj `AGENTS.md` (dopisz moduł do mapy w sekcji 2) i uruchom `codegraph sync`.

## 5. Zarządzanie Gałęziami Git i Kopią Zapasową
- **Automatyczny `git pull origin main` przed startem**: Zgodnie z punktem 0, każde nowe zadanie zaczynaj od pobrania aktualizacji z `origin/main`.
- **Bezwzględna ochrona `backup-main`**: NIGDY nie nadpisuj ani nie wypychaj zmian na gałąź `backup-main` bez wyraźnego, bezpośredniego polecenia użytkownika. Gdy użytkownik prosi o wypchnięcie na `main`, wypychaj wyłącznie `main`.

## 6. Standard Wizualny UI i Minimalizm Wojskowy (Zasada Przeciw Zaśmiecaniu)
- **Bezwzględny zakaz tanich emotikon (ZERO EMOJIS)**:
  - Pod żadnym pozorem NIE dodawaj kolorowych, tanich emotikonek (`🔥`, `⚡`, `💀`, `🤖`, `🛡️`, `🪖`, `🏆`, `📱`, `🛑`, `👑`, `🎮`, `🔫`, `🧱` itp.) do menu, przycisków, zakładek, HUD-u, kafelków wyboru, powiadomień ani komunikatów w grze.
  - Interfejs ma stosować czystą, profesjonalną typografię, surowe etykiety tekstowe (np. `[HEŁM]`, `PANCERZ (TORS)`, `HP`, `BOT: ON`, `EDYTOR`), minimalistyczne ikony wektorowe SVG lub wojskowe oznaczenia stopni (`▲`, `◆`, `◈`).
- **Zakaz duplikowania informacji i zaśmiecania ekranu zbędnymi szczegółami**:
  - **Kreator Postaci**: Zawsze otwiera się bezpośrednio do edytora ze zwięzłym, czystym 3-przyciskowym selektorem operatorów (`[RAPTOR] [STRIKER] [ENFORCER]`) nad podglądem postaci. Żadnych pośrednich ekranów z wypracowaniami tekstowymi ani powtórzonych podpisów pod modelem.
  - **Czystość podglądu postaci**: W kreatorze postać stoi w neutralnej pozie garderoby (BEZ efektów bitewnych, ładowania zdolności, pary bojowej, iskier czy dymu).
  - **Ekrany wyboru map i menu**: Krótkie, jednotaktowe streszczenia taktyczne. Żadnych ścian tekstu, list punktów XP, pucharów ani przeładowanych grafiką elementów.
  - **Minimalizm HUD**: Wskaźniki bojowe mają być zwarte, czytelne w ułamku sekundy i pozbawione zbędnych ozdobników. Zawsze kieruj się zasadą: *„Jeśli element nie jest krytyczny dla czytelności walki lub obsługi, usuń go”*.
