# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 16.11.2026, 19:07:56
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (36)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 30.7 s (1518 przetworzonych klatek, 1458 analizowanych)
- **Średni FPS:** **53.7 FPS** (średni czas klatki: 18.6 ms)
- **1% Low FPS:** **27.7 FPS** (99. percentyl czasu klatki: 36.1 ms)
- **Maksymalny czas wykonania klatki (exec):** 18.1 ms
- **Maksymalny odstęp między klatkami (dt):** 72.1 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 31
- **Średnie Draw Calls / klatkę (GPU):** **852** (fill: 279, stroke: 477, drawImage: 96, arc: 166, quadraticCurveTo: 418, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1315**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 31 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 5 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=11.7ms (klatka 183)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 183 (dt=35.6ms, wykonanie=11.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=8.5ms (klatka 221)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 221 (dt=35.6ms, wykonanie=8.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=12.0ms (wystąpiło 2 razy, klatki 227-237, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 237 (dt=36.1ms, wykonanie=8.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=11.4ms (wystąpiło 3 razy, klatki 246-254, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 254 (dt=36.2ms, wykonanie=11.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=8.5ms (wystąpiło 6 razy, klatki 257-268, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 268 (dt=36.0ms, wykonanie=10.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1300 > 1275 (klatka 269)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 269: totalDrawCalls=1300 (fill=455, stroke=732, drawImage=113, arc=235, quadraticCurveTo=706). Arena: ARENA_3.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=10.5ms (wystąpiło 7 razy, klatki 272-284, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 284 (dt=36.1ms, wykonanie=9.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.3ms (wystąpiło 7 razy, klatki 286-298, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 298 (dt=35.9ms, wykonanie=11.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1296 > 1275 (wystąpiło 12 razy, klatki 288-299, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 299: totalDrawCalls=1300 (fill=461, stroke=719, drawImage=120, arc=257, quadraticCurveTo=702). Arena: ARENA_3.

### 10. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1296 > 1275 (wystąpiło 5 razy, klatki 300-304, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 304: totalDrawCalls=1293 (fill=464, stroke=710, drawImage=119, arc=255, quadraticCurveTo=706). Arena: ARENA_3.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=12.2ms (wystąpiło 8 razy, klatki 300-312, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 312 (dt=35.5ms, wykonanie=10.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=11.4ms (wystąpiło 5 razy, klatki 315-326, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 326 (dt=36.1ms, wykonanie=7.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.1ms (wystąpiło 3 razy, klatki 331-343, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 343 (dt=36.1ms, wykonanie=7.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=10.9ms (wystąpiło 5 razy, klatki 346-359, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 359 (dt=36.1ms, wykonanie=10.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=8.8ms (wystąpiło 5 razy, klatki 360-372, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 372 (dt=35.7ms, wykonanie=9.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=7.6ms (wystąpiło 4 razy, klatki 375-388, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 388 (dt=35.4ms, wykonanie=10.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=11.5ms (wystąpiło 5 razy, klatki 392-402, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 402 (dt=35.6ms, wykonanie=7.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1280 > 1275 (wystąpiło 3 razy, klatki 395-419, trwanie: 25 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 419: totalDrawCalls=1302 (fill=474, stroke=697, drawImage=131, arc=267, quadraticCurveTo=707). Arena: ARENA_3.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=9.5ms (wystąpiło 8 razy, klatki 406-419, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 419 (dt=36.0ms, wykonanie=9.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1280 > 1275 (wystąpiło 4 razy, klatki 420-431, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 431: totalDrawCalls=1276 (fill=464, stroke=685, drawImage=127, arc=271, quadraticCurveTo=707). Arena: ARENA_3.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=53.2ms, exec=8.1ms (wystąpiło 6 razy, klatki 422-434, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 434 (dt=35.2ms, wykonanie=9.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=9.5ms (wystąpiło 10 razy, klatki 435-449, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 449 (dt=36.0ms, wykonanie=9.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=9.9ms (wystąpiło 8 razy, klatki 450-464, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 464 (dt=36.0ms, wykonanie=9.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.9ms (wystąpiło 7 razy, klatki 466-479, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 479 (dt=36.0ms, wykonanie=6.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 25. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=6.1ms (wystąpiło 5 razy, klatki 481-493, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 493 (dt=35.9ms, wykonanie=6.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 26. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=7.9ms (wystąpiło 2 razy, klatki 501-509, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 509 (dt=35.0ms, wykonanie=13.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 27. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=10.4ms (klatka 512)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 512 (dt=36.0ms, wykonanie=10.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 28. [FRAME_STUTTER] Przycięcie klatki: dt=34.9ms, exec=6.9ms (wystąpiło 2 razy, klatki 772-774, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 774 (dt=35.2ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 29. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=7.7ms (wystąpiło 2 razy, klatki 786-794, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 794 (dt=34.7ms, wykonanie=5.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 30. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.6ms (klatka 799)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 799 (dt=36.0ms, wykonanie=6.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 31. [FRAME_STUTTER] Przycięcie klatki: dt=34.9ms, exec=8.2ms (klatka 1020)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1020 (dt=34.9ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 32. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.6ms (klatka 1047)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1047 (dt=36.0ms, wykonanie=9.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 33. [FRAME_STUTTER] Przycięcie klatki: dt=34.4ms, exec=7.3ms (wystąpiło 7 razy, klatki 1052-1064, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1064 (dt=34.3ms, wykonanie=5.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 34. [FRAME_STUTTER] Przycięcie klatki: dt=34.7ms, exec=9.3ms (klatka 1076)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1076 (dt=34.7ms, wykonanie=9.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 35. [FRAME_STUTTER] Przycięcie klatki: dt=34.8ms, exec=8.1ms (klatka 1080)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1080 (dt=34.8ms, wykonanie=8.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 36. [FRAME_STUTTER] Przycięcie klatki: dt=54.0ms, exec=11.5ms (klatka 1343)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1343 (dt=54.0ms, wykonanie=11.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
