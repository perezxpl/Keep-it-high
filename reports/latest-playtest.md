# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 17.11.2026, 23:12:19
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (27)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.6 s (694 przetworzonych klatek, 634 analizowanych)
- **Średni FPS:** **37.2 FPS** (średni czas klatki: 26.91 ms)
- **1% Low FPS:** **19.7 FPS** (99. percentyl czasu klatki: 50.7 ms)
- **Maksymalny czas wykonania klatki (exec):** 44.4 ms
- **Maksymalny odstęp między klatkami (dt):** 72.9 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 25
- **Średnie Draw Calls / klatkę (GPU):** **899** (fill: 310, stroke: 490, drawImage: 99, arc: 161, quadraticCurveTo: 507, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1394**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 25 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 2 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=12.4ms (klatka 63)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 63 (dt=48.1ms, wykonanie=12.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=28.9ms, exec=7.7ms (wystąpiło 3 razy, klatki 120-128, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 128 (dt=44.0ms, wykonanie=12.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=53.1ms, exec=13.6ms (klatka 148)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 148 (dt=53.1ms, wykonanie=13.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=47.9ms, exec=12.2ms (klatka 164)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 164 (dt=47.9ms, wykonanie=12.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=47.6ms, exec=12.4ms (wystąpiło 4 razy, klatki 167-177, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 177 (dt=48.3ms, wykonanie=8.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=15.0ms (klatka 192)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 192 (dt=48.1ms, wykonanie=15.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=48.8ms, exec=16.4ms (wystąpiło 5 razy, klatki 196-209, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 209 (dt=43.7ms, wykonanie=11.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=12.2ms (wystąpiło 4 razy, klatki 212-224, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 224 (dt=58.6ms, wykonanie=12.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=58.5ms, exec=15.7ms (wystąpiło 7 razy, klatki 225-239, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 239 (dt=41.0ms, wykonanie=8.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=44.5ms, exec=11.6ms (wystąpiło 8 razy, klatki 240-253, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 253 (dt=48.2ms, wykonanie=15.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1314 > 1275 (wystąpiło 27 razy, klatki 243-269, trwanie: 27 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 269: totalDrawCalls=1329 (fill=542, stroke=695, drawImage=92, arc=362, quadraticCurveTo=697). Arena: ARENA_3.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=16.1ms (wystąpiło 10 razy, klatki 255-268, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 268 (dt=48.0ms, wykonanie=10.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1347 > 1275 (wystąpiło 20 razy, klatki 270-289, trwanie: 20 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 289: totalDrawCalls=1340 (fill=550, stroke=698, drawImage=92, arc=390, quadraticCurveTo=701). Arena: ARENA_3.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=16.7ms (wystąpiło 10 razy, klatki 270-282, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 282 (dt=55.0ms, wykonanie=10.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=48.3ms, exec=11.9ms (wystąpiło 8 razy, klatki 285-299, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 299 (dt=45.8ms, wykonanie=12.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=49.2ms, exec=9.7ms (wystąpiło 2 razy, klatki 308-314, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 314 (dt=42.1ms, wykonanie=9.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=42.6ms, exec=9.1ms (klatka 318)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 318 (dt=42.6ms, wykonanie=9.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=18.4ms, exec=42.0ms (wystąpiło 2 razy, klatki 364-366, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 366 (dt=46.2ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=28.4ms, exec=9.5ms (wystąpiło 3 razy, klatki 379-381, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 381 (dt=47.8ms, wykonanie=10.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=32.1ms, exec=9.4ms (klatka 404)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 404 (dt=32.1ms, wykonanie=9.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=44.7ms, exec=11.5ms (wystąpiło 8 razy, klatki 435-449, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 449 (dt=44.1ms, wykonanie=11.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=47.4ms, exec=10.7ms (wystąpiło 4 razy, klatki 451-457, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 457 (dt=45.6ms, wykonanie=8.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=48.0ms, exec=7.7ms (wystąpiło 2 razy, klatki 467-477, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 477 (dt=46.6ms, wykonanie=11.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=47.8ms, exec=14.3ms (wystąpiło 3 razy, klatki 501-508, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 508 (dt=48.5ms, wykonanie=13.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 25. [FRAME_STUTTER] Przycięcie klatki: dt=48.0ms, exec=13.5ms (wystąpiło 4 razy, klatki 511-522, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 522 (dt=72.9ms, wykonanie=6.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 26. [FRAME_STUTTER] Przycięcie klatki: dt=28.2ms, exec=6.0ms (wystąpiło 2 razy, klatki 593-599, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 599 (dt=30.0ms, wykonanie=5.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 27. [FRAME_STUTTER] Przycięcie klatki: dt=31.8ms, exec=6.3ms (wystąpiło 4 razy, klatki 600-612, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 612 (dt=28.6ms, wykonanie=6.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
