# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 24.11.2026, 16:16:10
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (3)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.3 s (1028 przetworzonych klatek, 968 analizowanych)
- **Średni FPS:** **59.7 FPS** (średni czas klatki: 16.76 ms)
- **1% Low FPS:** **55.2 FPS** (99. percentyl czasu klatki: 18.1 ms)
- **Maksymalny czas wykonania klatki (exec):** 18.9 ms
- **Maksymalny odstęp między klatkami (dt):** 20.4 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 0
- **Średnie Draw Calls / klatkę (GPU):** **1035** (fill: 354, stroke: 572, drawImage: 108, arc: 176, quadraticCurveTo: 547, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1349**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 0 | OK |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 3 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1291 > 1275 (wystąpiło 7 razy, klatki 413-419, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 419: totalDrawCalls=1288 (fill=470, stroke=696, drawImage=122, arc=334, quadraticCurveTo=656). Arena: ARENA_3.

### 2. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1288 > 1275 (wystąpiło 24 razy, klatki 420-443, trwanie: 24 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 443: totalDrawCalls=1289 (fill=491, stroke=664, drawImage=134, arc=297, quadraticCurveTo=658). Arena: ARENA_3.

### 3. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1343 > 1275 (wystąpiło 4 razy, klatki 880-883, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 883: totalDrawCalls=1347 (fill=522, stroke=717, drawImage=108, arc=284, quadraticCurveTo=659). Arena: ARENA_3.
