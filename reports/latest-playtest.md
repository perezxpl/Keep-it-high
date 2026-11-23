# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 23.11.2026, 22:05:34
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (29)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.5 s (732 przetworzonych klatek, 672 analizowanych)
- **Średni FPS:** **43.5 FPS** (średni czas klatki: 22.98 ms)
- **1% Low FPS:** **31.9 FPS** (99. percentyl czasu klatki: 31.3 ms)
- **Maksymalny czas wykonania klatki (exec):** 31.1 ms
- **Maksymalny odstęp między klatkami (dt):** 50.9 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 25
- **Średnie Draw Calls / klatkę (GPU):** **1103** (fill: 409, stroke: 589, drawImage: 105, arc: 217, quadraticCurveTo: 598, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1334**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 25 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 4 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=29.1ms, exec=13.0ms (klatka 71)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 71 (dt=29.1ms, wykonanie=13.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=30.7ms, exec=18.8ms (klatka 80)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 80 (dt=30.7ms, wykonanie=18.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=30.3ms, exec=10.7ms (klatka 98)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 98 (dt=30.3ms, wykonanie=10.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=30.0ms, exec=20.0ms (wystąpiło 2 razy, klatki 132-133, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 133 (dt=25.5ms, wykonanie=29.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=31.3ms, exec=10.1ms (klatka 149)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 149 (dt=31.3ms, wykonanie=10.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=29.2ms, exec=13.3ms (klatka 159)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 159 (dt=29.2ms, wykonanie=13.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=32.5ms, exec=8.2ms (wystąpiło 4 razy, klatki 225-239, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 239 (dt=39.3ms, wykonanie=15.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1287 > 1275 (wystąpiło 20 razy, klatki 250-269, trwanie: 20 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 269: totalDrawCalls=1291 (fill=507, stroke=674, drawImage=110, arc=313, quadraticCurveTo=643). Arena: ARENA_3.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=25.0ms, exec=29.8ms (klatka 250)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 250 (dt=25.0ms, wykonanie=29.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1301 > 1275 (wystąpiło 30 razy, klatki 270-299, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 299: totalDrawCalls=1294 (fill=519, stroke=667, drawImage=108, arc=346, quadraticCurveTo=646). Arena: ARENA_3.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=30.2ms, exec=17.6ms (klatka 285)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 285 (dt=30.2ms, wykonanie=17.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1290 > 1275 (wystąpiło 10 razy, klatki 300-309, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 309: totalDrawCalls=1277 (fill=512, stroke=660, drawImage=105, arc=328, quadraticCurveTo=644). Arena: ARENA_3.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=30.2ms, exec=12.4ms (klatka 334)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 334 (dt=30.2ms, wykonanie=12.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=34.6ms, exec=17.0ms (klatka 354)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 354 (dt=34.6ms, wykonanie=17.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=28.4ms, exec=8.6ms (klatka 399)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 399 (dt=28.4ms, wykonanie=8.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=28.3ms, exec=11.4ms (wystąpiło 2 razy, klatki 407-411, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 411 (dt=29.2ms, wykonanie=10.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=28.1ms, exec=14.1ms (klatka 433)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 433 (dt=28.1ms, wykonanie=14.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=28.5ms, exec=15.0ms (wystąpiło 2 razy, klatki 435-442, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 442 (dt=28.8ms, wykonanie=18.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=50.9ms, exec=12.3ms (klatka 461)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 461 (dt=50.9ms, wykonanie=12.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=29.4ms, exec=12.2ms (klatka 483)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 483 (dt=29.4ms, wykonanie=12.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=31.5ms, exec=15.7ms (klatka 521)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 521 (dt=31.5ms, wykonanie=15.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=29.4ms, exec=16.0ms (klatka 547)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 547 (dt=29.4ms, wykonanie=16.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=32.3ms, exec=11.2ms (klatka 568)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 568 (dt=32.3ms, wykonanie=11.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=30.1ms, exec=14.4ms (wystąpiło 2 razy, klatki 585-594, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 594 (dt=30.6ms, wykonanie=14.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 25. [FRAME_STUTTER] Przycięcie klatki: dt=29.0ms, exec=15.0ms (wystąpiło 2 razy, klatki 601-606, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 606 (dt=29.4ms, wykonanie=13.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 26. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1282 > 1275 (wystąpiło 7 razy, klatki 606-612, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 612: totalDrawCalls=1276 (fill=520, stroke=658, drawImage=98, arc=332, quadraticCurveTo=649). Arena: ARENA_3.

### 27. [FRAME_STUTTER] Przycięcie klatki: dt=28.4ms, exec=16.3ms (klatka 623)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 623 (dt=28.4ms, wykonanie=16.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 28. [FRAME_STUTTER] Przycięcie klatki: dt=29.4ms, exec=9.4ms (klatka 632)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 632 (dt=29.4ms, wykonanie=9.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 29. [FRAME_STUTTER] Przycięcie klatki: dt=28.5ms, exec=12.3ms (klatka 667)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 667 (dt=28.5ms, wykonanie=12.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
