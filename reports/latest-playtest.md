# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 24.11.2026, 15:51:49
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (12)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.3 s (996 przetworzonych klatek, 936 analizowanych)
- **Średni FPS:** **59.1 FPS** (średni czas klatki: 16.92 ms)
- **1% Low FPS:** **54.9 FPS** (99. percentyl czasu klatki: 18.2 ms)
- **Maksymalny czas wykonania klatki (exec):** 34.2 ms
- **Maksymalny odstęp między klatkami (dt):** 75 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 4
- **Średnie Draw Calls / klatkę (GPU):** **1046** (fill: 390, stroke: 553, drawImage: 104, arc: 225, quadraticCurveTo: 493, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1425**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 4 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 8 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=75.0ms, exec=21.5ms (klatka 90)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 90 (dt=75.0ms, wykonanie=21.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=11.6ms (klatka 221)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 221 (dt=36.0ms, wykonanie=11.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1322 > 1275 (wystąpiło 21 razy, klatki 241-261, trwanie: 21 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 261: totalDrawCalls=1373 (fill=541, stroke=710, drawImage=122, arc=331, quadraticCurveTo=643). Arena: ARENA_3.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=16.7ms, exec=34.2ms (wystąpiło 2 razy, klatki 242-243, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 243 (dt=35.1ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1329 > 1275 (klatka 386)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 386: totalDrawCalls=1329 (fill=538, stroke=701, drawImage=90, arc=374, quadraticCurveTo=622). Arena: ARENA_3.

### 6. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1278 > 1275 (wystąpiło 5 razy, klatki 390-398, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 398: totalDrawCalls=1276 (fill=533, stroke=634, drawImage=109, arc=367, quadraticCurveTo=532). Arena: ARENA_3.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=44.6ms, exec=9.7ms (klatka 510)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 510 (dt=44.6ms, wykonanie=9.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1300 > 1275 (wystąpiło 29 razy, klatki 541-569, trwanie: 29 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 569: totalDrawCalls=1283 (fill=496, stroke=666, drawImage=121, arc=276, quadraticCurveTo=664). Arena: ARENA_3.

### 9. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1277 > 1275 (wystąpiło 13 razy, klatki 570-599, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 599: totalDrawCalls=1290 (fill=484, stroke=682, drawImage=124, arc=298, quadraticCurveTo=660). Arena: ARENA_3.

### 10. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1289 > 1275 (wystąpiło 18 razy, klatki 600-619, trwanie: 20 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 619: totalDrawCalls=1288 (fill=480, stroke=688, drawImage=120, arc=261, quadraticCurveTo=658). Arena: ARENA_3.

### 11. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1336 > 1275 (wystąpiło 8 razy, klatki 742-749, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 749: totalDrawCalls=1343 (fill=549, stroke=698, drawImage=96, arc=335, quadraticCurveTo=635). Arena: ARENA_3.

### 12. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1425 > 1275 (wystąpiło 17 razy, klatki 750-766, trwanie: 17 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 766: totalDrawCalls=1363 (fill=581, stroke=691, drawImage=91, arc=374, quadraticCurveTo=570). Arena: ARENA_3.
