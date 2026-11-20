# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 20.11.2026, 20:53:50
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (28)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 15.3 s (753 przetworzonych klatek, 693 analizowanych)
- **Średni FPS:** **54.7 FPS** (średni czas klatki: 18.29 ms)
- **1% Low FPS:** **27.8 FPS** (99. percentyl czasu klatki: 36 ms)
- **Maksymalny czas wykonania klatki (exec):** 22.9 ms
- **Maksymalny odstęp między klatkami (dt):** 53.1 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 22
- **Średnie Draw Calls / klatkę (GPU):** **1120** (fill: 406, stroke: 603, drawImage: 111, arc: 214, quadraticCurveTo: 597, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1469**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 22 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 6 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=6.9ms (wystąpiło 2 razy, klatki 236-239, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 239 (dt=36.1ms, wykonanie=8.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=8.8ms (wystąpiło 3 razy, klatki 242-251, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 251 (dt=36.0ms, wykonanie=7.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.4ms (wystąpiło 3 razy, klatki 255-261, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 261 (dt=36.0ms, wykonanie=6.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.7ms (wystąpiło 3 razy, klatki 287-294, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 294 (dt=36.0ms, wykonanie=7.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=35.0ms, exec=13.0ms (wystąpiło 2 razy, klatki 302-305, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 305 (dt=35.9ms, wykonanie=7.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=34.7ms, exec=9.7ms (wystąpiło 2 razy, klatki 315-321, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 321 (dt=36.0ms, wykonanie=6.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=9.1ms (wystąpiło 2 razy, klatki 331-336, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 336 (dt=36.0ms, wykonanie=7.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=34.8ms, exec=9.6ms (wystąpiło 4 razy, klatki 345-358, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 358 (dt=36.0ms, wykonanie=8.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=8.0ms (wystąpiło 2 razy, klatki 369-374, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 374 (dt=36.0ms, wykonanie=6.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=7.9ms (klatka 380)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 380 (dt=35.7ms, wykonanie=7.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=5.8ms (wystąpiło 2 razy, klatki 390-399, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 399 (dt=35.5ms, wykonanie=6.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=35.4ms, exec=6.1ms (wystąpiło 3 razy, klatki 406-417, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 417 (dt=36.0ms, wykonanie=6.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=35.4ms, exec=7.4ms (klatka 428)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 428 (dt=35.4ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1292 > 1275 (wystąpiło 3 razy, klatki 447-449, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 449: totalDrawCalls=1292 (fill=495, stroke=674, drawImage=123, arc=319, quadraticCurveTo=665). Arena: ARENA_3.

### 15. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1291 > 1275 (wystąpiło 18 razy, klatki 450-472, trwanie: 23 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 472: totalDrawCalls=1290 (fill=493, stroke=673, drawImage=124, arc=285, quadraticCurveTo=665). Arena: ARENA_3.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=7.3ms (klatka 491)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 491 (dt=35.2ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=7.2ms (wystąpiło 2 razy, klatki 499-506, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 506 (dt=35.9ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1287 > 1275 (klatka 509)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 509: totalDrawCalls=1287 (fill=497, stroke=667, drawImage=123, arc=295, quadraticCurveTo=663). Arena: ARENA_3.

### 19. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1281 > 1275 (wystąpiło 26 razy, klatki 510-535, trwanie: 26 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 535: totalDrawCalls=1357 (fill=549, stroke=691, drawImage=117, arc=331, quadraticCurveTo=656). Arena: ARENA_3.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.7ms (wystąpiło 3 razy, klatki 513-524, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 524 (dt=36.0ms, wykonanie=9.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=35.4ms, exec=10.3ms (wystąpiło 2 razy, klatki 536-538, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 538 (dt=35.2ms, wykonanie=12.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1451 > 1275 (wystąpiło 30 razy, klatki 540-569, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 569: totalDrawCalls=1452 (fill=614, stroke=728, drawImage=110, arc=419, quadraticCurveTo=653). Arena: ARENA_3.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=34.7ms, exec=12.0ms (wystąpiło 3 razy, klatki 544-553, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 553 (dt=34.9ms, wykonanie=9.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=9.0ms (wystąpiło 2 razy, klatki 564-566, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 566 (dt=35.6ms, wykonanie=9.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 25. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1449 > 1275 (wystąpiło 17 razy, klatki 570-586, trwanie: 17 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 586: totalDrawCalls=1469 (fill=622, stroke=744, drawImage=103, arc=399, quadraticCurveTo=653). Arena: ARENA_3.

### 26. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.0ms (wystąpiło 5 razy, klatki 570-582, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 582 (dt=35.7ms, wykonanie=9.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 27. [FRAME_STUTTER] Przycięcie klatki: dt=35.8ms, exec=9.0ms (klatka 587)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 587 (dt=35.8ms, wykonanie=9.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 28. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=6.5ms (wystąpiło 2 razy, klatki 683-684, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 684 (dt=53.1ms, wykonanie=6.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
