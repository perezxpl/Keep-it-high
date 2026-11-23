# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 23.11.2026, 07:57:33
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (29)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.4 s (998 przetworzonych klatek, 938 analizowanych)
- **Średni FPS:** **54 FPS** (średni czas klatki: 18.52 ms)
- **1% Low FPS:** **27.7 FPS** (99. percentyl czasu klatki: 36.1 ms)
- **Maksymalny czas wykonania klatki (exec):** 18.6 ms
- **Maksymalny odstęp między klatkami (dt):** 71.4 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 27
- **Średnie Draw Calls / klatkę (GPU):** **992** (fill: 359, stroke: 527, drawImage: 106, arc: 198, quadraticCurveTo: 489, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1400**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 27 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 2 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.3ms (klatka 238)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 238 (dt=36.0ms, wykonanie=6.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=35.0ms, exec=11.1ms (wystąpiło 2 razy, klatki 250-253, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 253 (dt=35.1ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=7.9ms (wystąpiło 3 razy, klatki 255-266, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 266 (dt=36.0ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=35.0ms, exec=7.5ms (wystąpiło 6 razy, klatki 271-283, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 283 (dt=35.0ms, wykonanie=7.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=34.5ms, exec=7.3ms (wystąpiło 5 razy, klatki 286-299, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 299 (dt=36.0ms, wykonanie=7.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.2ms (wystąpiło 3 razy, klatki 305-314, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 314 (dt=36.0ms, wykonanie=12.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=8.2ms (wystąpiło 4 razy, klatki 317-326, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 326 (dt=35.7ms, wykonanie=7.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=35.4ms, exec=11.4ms (wystąpiło 6 razy, klatki 331-341, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 341 (dt=35.1ms, wykonanie=9.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=9.9ms (wystąpiło 6 razy, klatki 345-359, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 359 (dt=35.9ms, wykonanie=13.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=11.9ms (wystąpiło 4 razy, klatki 362-373, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 373 (dt=35.2ms, wykonanie=12.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=12.3ms (wystąpiło 5 razy, klatki 376-388, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 388 (dt=36.1ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=34.3ms, exec=10.2ms (wystąpiło 4 razy, klatki 391-395, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 395 (dt=35.0ms, wykonanie=7.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=6.0ms (klatka 405)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 405 (dt=35.7ms, wykonanie=6.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=8.1ms (klatka 454)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 454 (dt=35.1ms, wykonanie=8.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=7.3ms (wystąpiło 2 razy, klatki 484-494, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 494 (dt=35.7ms, wykonanie=7.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=9.1ms (klatka 510)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 510 (dt=35.2ms, wykonanie=9.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.8ms (klatka 539)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 539 (dt=36.0ms, wykonanie=6.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=7.0ms (klatka 545)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 545 (dt=35.2ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=35.4ms, exec=6.7ms (wystąpiło 3 razy, klatki 585-599, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 599 (dt=35.0ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=5.6ms (wystąpiło 2 razy, klatki 677-687, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 687 (dt=35.6ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=8.5ms (klatka 699)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 699 (dt=36.1ms, wykonanie=8.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=18.6ms (wystąpiło 2 razy, klatki 710-716, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 716 (dt=36.0ms, wykonanie=8.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=12.0ms (wystąpiło 3 razy, klatki 721-729, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 729 (dt=34.8ms, wykonanie=6.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=11.8ms (wystąpiło 3 razy, klatki 736-748, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 748 (dt=34.7ms, wykonanie=9.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 25. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1294 > 1275 (wystąpiło 6 razy, klatki 744-749, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 749: totalDrawCalls=1400 (fill=623, stroke=681, drawImage=96, arc=409, quadraticCurveTo=654). Arena: ARENA_3.

### 26. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1399 > 1275 (wystąpiło 27 razy, klatki 750-776, trwanie: 27 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 776: totalDrawCalls=1357 (fill=627, stroke=640, drawImage=90, arc=467, quadraticCurveTo=487). Arena: ARENA_3.

### 27. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=12.8ms (wystąpiło 7 razy, klatki 750-764, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 764 (dt=35.5ms, wykonanie=8.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 2, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 28. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=9.7ms (wystąpiło 3 razy, klatki 770-777, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 777 (dt=35.9ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 29. [FRAME_STUTTER] Przycięcie klatki: dt=71.4ms, exec=5.7ms (wystąpiło 3 razy, klatki 862-864, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 864 (dt=36.0ms, wykonanie=4.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
