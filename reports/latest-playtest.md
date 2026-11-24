# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 24.11.2026, 13:58:05
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (10)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.4 s (1023 przetworzonych klatek, 963 analizowanych)
- **Średni FPS:** **59.5 FPS** (średni czas klatki: 16.8 ms)
- **1% Low FPS:** **55.2 FPS** (99. percentyl czasu klatki: 18.1 ms)
- **Maksymalny czas wykonania klatki (exec):** 20.2 ms
- **Maksymalny odstęp między klatkami (dt):** 20.7 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 0
- **Średnie Draw Calls / klatkę (GPU):** **1170** (fill: 446, stroke: 613, drawImage: 110, arc: 266, quadraticCurveTo: 573, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1546**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 0 | OK |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 10 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1297 > 1275 (wystąpiło 27 razy, klatki 540-566, trwanie: 27 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 566: totalDrawCalls=1427 (fill=597, stroke=731, drawImage=99, arc=432, quadraticCurveTo=658). Arena: ARENA_3.

### 2. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1364 > 1275 (wystąpiło 6 razy, klatki 684-689, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 689: totalDrawCalls=1369 (fill=550, stroke=708, drawImage=111, arc=382, quadraticCurveTo=665). Arena: ARENA_3.

### 3. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1367 > 1275 (wystąpiło 11 razy, klatki 690-700, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 700: totalDrawCalls=1370 (fill=546, stroke=712, drawImage=112, arc=373, quadraticCurveTo=665). Arena: ARENA_3.

### 4. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1301 > 1275 (wystąpiło 27 razy, klatki 843-869, trwanie: 27 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 869: totalDrawCalls=1305 (fill=550, stroke=639, drawImage=116, arc=391, quadraticCurveTo=549). Arena: ARENA_3.

### 5. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1300 > 1275 (wystąpiło 14 razy, klatki 870-883, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 883: totalDrawCalls=1282 (fill=532, stroke=634, drawImage=116, arc=365, quadraticCurveTo=548). Arena: ARENA_3.

### 6. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1291 > 1275 (klatka 929)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 929: totalDrawCalls=1291 (fill=531, stroke=641, drawImage=119, arc=347, quadraticCurveTo=498). Arena: ARENA_3.

### 7. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1290 > 1275 (wystąpiło 25 razy, klatki 930-959, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 959: totalDrawCalls=1369 (fill=595, stroke=674, drawImage=100, arc=430, quadraticCurveTo=498). Arena: ARENA_3.

### 8. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1371 > 1275 (wystąpiło 30 razy, klatki 960-989, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 989: totalDrawCalls=1419 (fill=637, stroke=682, drawImage=100, arc=501, quadraticCurveTo=498). Arena: ARENA_3.

### 9. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1418 > 1275 (wystąpiło 30 razy, klatki 990-1019, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1019: totalDrawCalls=1299 (fill=559, stroke=638, drawImage=102, arc=418, quadraticCurveTo=532). Arena: ARENA_3.

### 10. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1300 > 1275 (wystąpiło 4 razy, klatki 1020-1023, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1023: totalDrawCalls=1302 (fill=562, stroke=638, drawImage=102, arc=422, quadraticCurveTo=532). Arena: ARENA_3.
