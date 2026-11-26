# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 26.11.2026, 07:55:57
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (12)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 10.1 s (494 przetworzonych klatek, 434 analizowanych)
- **Średni FPS:** **59.3 FPS** (średni czas klatki: 16.85 ms)
- **1% Low FPS:** **55.2 FPS** (99. percentyl czasu klatki: 18.1 ms)
- **Maksymalny czas wykonania klatki (exec):** 15.2 ms
- **Maksymalny odstęp między klatkami (dt):** 18.2 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 0
- **Średnie Draw Calls / klatkę (GPU):** **1180** (fill: 620, stroke: 519, drawImage: 41, arc: 157, quadraticCurveTo: 664, clip: 10)
- **Maksymalne Draw Calls / klatkę (GPU):** **1350**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 0 | OK |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 12 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1317 > 1275 (wystąpiło 25 razy, klatki 155-179, trwanie: 25 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 179: totalDrawCalls=1309 (fill=679, stroke=589, drawImage=41, arc=194, quadraticCurveTo=770). Arena: ARENA_1.

### 2. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1313 > 1275 (wystąpiło 28 razy, klatki 180-209, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 209: totalDrawCalls=1284 (fill=666, stroke=576, drawImage=42, arc=173, quadraticCurveTo=774). Arena: ARENA_1.

### 3. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1278 > 1275 (wystąpiło 29 razy, klatki 210-239, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 239: totalDrawCalls=1285 (fill=667, stroke=576, drawImage=42, arc=202, quadraticCurveTo=772). Arena: ARENA_1.

### 4. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1285 > 1275 (wystąpiło 27 razy, klatki 240-269, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 269: totalDrawCalls=1285 (fill=670, stroke=574, drawImage=41, arc=184, quadraticCurveTo=774). Arena: ARENA_1.

### 5. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1279 > 1275 (wystąpiło 30 razy, klatki 270-299, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 299: totalDrawCalls=1279 (fill=663, stroke=575, drawImage=41, arc=188, quadraticCurveTo=770). Arena: ARENA_1.

### 6. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1283 > 1275 (wystąpiło 29 razy, klatki 300-329, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 329: totalDrawCalls=1283 (fill=667, stroke=575, drawImage=41, arc=179, quadraticCurveTo=772). Arena: ARENA_1.

### 7. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1283 > 1275 (wystąpiło 30 razy, klatki 330-359, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 359: totalDrawCalls=1279 (fill=663, stroke=575, drawImage=41, arc=171, quadraticCurveTo=770). Arena: ARENA_1.

### 8. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1287 > 1275 (wystąpiło 29 razy, klatki 360-389, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 389: totalDrawCalls=1331 (fill=687, stroke=587, drawImage=57, arc=192, quadraticCurveTo=772). Arena: ARENA_1.

### 9. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1330 > 1275 (wystąpiło 30 razy, klatki 390-419, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 419: totalDrawCalls=1326 (fill=683, stroke=586, drawImage=57, arc=215, quadraticCurveTo=772). Arena: ARENA_1.

### 10. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1328 > 1275 (wystąpiło 29 razy, klatki 420-449, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 449: totalDrawCalls=1290 (fill=658, stroke=575, drawImage=57, arc=168, quadraticCurveTo=770). Arena: ARENA_1.

### 11. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1298 > 1275 (wystąpiło 29 razy, klatki 450-479, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 479: totalDrawCalls=1290 (fill=662, stroke=575, drawImage=53, arc=167, quadraticCurveTo=772). Arena: ARENA_1.

### 12. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1288 > 1275 (wystąpiło 14 razy, klatki 480-493, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 493: totalDrawCalls=1279 (fill=658, stroke=575, drawImage=46, arc=159, quadraticCurveTo=770). Arena: ARENA_1.
