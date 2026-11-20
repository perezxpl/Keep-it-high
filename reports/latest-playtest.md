# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 20.11.2026, 20:28:51
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (23)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.4 s (1007 przetworzonych klatek, 947 analizowanych)
- **Średni FPS:** **54.6 FPS** (średni czas klatki: 18.32 ms)
- **1% Low FPS:** **27.8 FPS** (99. percentyl czasu klatki: 36 ms)
- **Maksymalny czas wykonania klatki (exec):** 14.8 ms
- **Maksymalny odstęp między klatkami (dt):** 53.2 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 21
- **Średnie Draw Calls / klatkę (GPU):** **821** (fill: 274, stroke: 447, drawImage: 99, arc: 134, quadraticCurveTo: 439, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1320**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 21 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 2 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=35.8ms, exec=9.8ms (klatka 229)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 229 (dt=35.8ms, wykonanie=9.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=7.6ms (wystąpiło 3 razy, klatki 241-251, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 251 (dt=35.5ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=8.9ms (wystąpiło 3 razy, klatki 257-265, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 265 (dt=35.7ms, wykonanie=8.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=6.5ms (wystąpiło 6 razy, klatki 271-284, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 284 (dt=34.9ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=10.2ms (wystąpiło 6 razy, klatki 288-297, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 297 (dt=35.1ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.4ms (wystąpiło 4 razy, klatki 301-314, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 314 (dt=36.1ms, wykonanie=7.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.5ms (wystąpiło 6 razy, klatki 316-328, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 328 (dt=35.8ms, wykonanie=8.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1297 > 1275 (wystąpiło 5 razy, klatki 325-329, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 329: totalDrawCalls=1286 (fill=530, stroke=647, drawImage=109, arc=319, quadraticCurveTo=651). Arena: ARENA_3.

### 9. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1300 > 1275 (wystąpiło 26 razy, klatki 330-355, trwanie: 26 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 355: totalDrawCalls=1278 (fill=523, stroke=661, drawImage=94, arc=336, quadraticCurveTo=653). Arena: ARENA_3.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=8.4ms (wystąpiło 5 razy, klatki 332-343, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 343 (dt=35.2ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=10.8ms (wystąpiło 3 razy, klatki 347-356, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 356 (dt=36.0ms, wykonanie=8.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=10.7ms (wystąpiło 5 razy, klatki 360-374, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 374 (dt=36.0ms, wykonanie=11.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=7.7ms (wystąpiło 4 razy, klatki 376-387, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 387 (dt=36.0ms, wykonanie=7.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=34.6ms, exec=6.4ms (klatka 390)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 390 (dt=34.6ms, wykonanie=6.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=34.6ms, exec=8.7ms (wystąpiło 4 razy, klatki 411-418, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 418 (dt=35.3ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=34.7ms, exec=6.5ms (wystąpiło 7 razy, klatki 421-431, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 431 (dt=35.4ms, wykonanie=11.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.7ms (klatka 435)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 435 (dt=36.0ms, wykonanie=6.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=7.0ms (wystąpiło 3 razy, klatki 519-523, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 523 (dt=53.2ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=8.5ms (wystąpiło 2 razy, klatki 525-534, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 534 (dt=35.5ms, wykonanie=6.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=34.9ms, exec=7.3ms (wystąpiło 3 razy, klatki 540-553, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 553 (dt=35.4ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=7.3ms (wystąpiło 5 razy, klatki 559-569, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 569 (dt=36.0ms, wykonanie=6.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=34.8ms, exec=6.8ms (wystąpiło 2 razy, klatki 574-581, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 581 (dt=35.6ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.3ms (klatka 587)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 587 (dt=36.0ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
