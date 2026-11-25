# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 25.11.2026, 10:33:45
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (4)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.3 s (1052 przetworzonych klatek, 992 analizowanych)
- **Średni FPS:** **59.7 FPS** (średni czas klatki: 16.75 ms)
- **1% Low FPS:** **55.2 FPS** (99. percentyl czasu klatki: 18.1 ms)
- **Maksymalny czas wykonania klatki (exec):** 24.9 ms
- **Maksymalny odstęp między klatkami (dt):** 18.1 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 0
- **Średnie Draw Calls / klatkę (GPU):** **1002** (fill: 368, stroke: 532, drawImage: 102, arc: 216, quadraticCurveTo: 487, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1320**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 0 | OK |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 4 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1278 > 1275 (wystąpiło 2 razy, klatki 265-268, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 268: totalDrawCalls=1320 (fill=489, stroke=721, drawImage=110, arc=315, quadraticCurveTo=751). Arena: ARENA_3.

### 2. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1314 > 1275 (wystąpiło 4 razy, klatki 353-356, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 356: totalDrawCalls=1317 (fill=530, stroke=690, drawImage=97, arc=349, quadraticCurveTo=660). Arena: ARENA_3.

### 3. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1288 > 1275 (wystąpiło 8 razy, klatki 862-869, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 869: totalDrawCalls=1287 (fill=554, stroke=633, drawImage=100, arc=377, quadraticCurveTo=548). Arena: ARENA_3.

### 4. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1287 > 1275 (wystąpiło 21 razy, klatki 870-890, trwanie: 21 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 890: totalDrawCalls=1282 (fill=551, stroke=635, drawImage=96, arc=400, quadraticCurveTo=546). Arena: ARENA_3.
