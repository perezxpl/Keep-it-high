# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 24.11.2026, 20:18:23
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (8)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.4 s (1023 przetworzonych klatek, 963 analizowanych)
- **Średni FPS:** **59.3 FPS** (średni czas klatki: 16.86 ms)
- **1% Low FPS:** **55.2 FPS** (99. percentyl czasu klatki: 18.1 ms)
- **Maksymalny czas wykonania klatki (exec):** 22.2 ms
- **Maksymalny odstęp między klatkami (dt):** 53.4 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 1
- **Średnie Draw Calls / klatkę (GPU):** **1043** (fill: 393, stroke: 551, drawImage: 99, arc: 232, quadraticCurveTo: 488, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1376**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 1 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 7 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1297 > 1275 (wystąpiło 12 razy, klatki 313-324, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 324: totalDrawCalls=1277 (fill=511, stroke=661, drawImage=105, arc=309, quadraticCurveTo=575). Arena: ARENA_3.

### 2. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1368 > 1275 (wystąpiło 23 razy, klatki 337-359, trwanie: 23 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 359: totalDrawCalls=1362 (fill=574, stroke=698, drawImage=90, arc=394, quadraticCurveTo=574). Arena: ARENA_3.

### 3. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1352 > 1275 (wystąpiło 15 razy, klatki 360-389, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 389: totalDrawCalls=1323 (fill=553, stroke=681, drawImage=89, arc=348, quadraticCurveTo=574). Arena: ARENA_3.

### 4. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1323 > 1275 (wystąpiło 30 razy, klatki 390-419, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 419: totalDrawCalls=1344 (fill=558, stroke=697, drawImage=89, arc=354, quadraticCurveTo=574). Arena: ARENA_3.

### 5. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1345 > 1275 (klatka 420)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 420: totalDrawCalls=1345 (fill=561, stroke=695, drawImage=89, arc=358, quadraticCurveTo=576). Arena: ARENA_3.

### 6. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1318 > 1275 (wystąpiło 3 razy, klatki 687-689, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 689: totalDrawCalls=1326 (fill=507, stroke=702, drawImage=117, arc=325, quadraticCurveTo=655). Arena: ARENA_3.

### 7. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1320 > 1275 (wystąpiło 9 razy, klatki 690-698, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 698: totalDrawCalls=1361 (fill=538, stroke=708, drawImage=115, arc=372, quadraticCurveTo=655). Arena: ARENA_3.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=53.4ms, exec=8.4ms (klatka 1000)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1000 (dt=53.4ms, wykonanie=8.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
