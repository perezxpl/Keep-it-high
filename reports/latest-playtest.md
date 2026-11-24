# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 24.11.2026, 22:05:13
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (56)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 19.8 s (707 przetworzonych klatek, 647 analizowanych)
- **Średni FPS:** **44.9 FPS** (średni czas klatki: 22.28 ms)
- **1% Low FPS:** **29.8 FPS** (99. percentyl czasu klatki: 33.6 ms)
- **Maksymalny czas wykonania klatki (exec):** 26.5 ms
- **Maksymalny odstęp między klatkami (dt):** 66.9 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 43
- **Średnie Draw Calls / klatkę (GPU):** **1189** (fill: 437, stroke: 644, drawImage: 107, arc: 250, quadraticCurveTo: 570, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1490**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 43 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 13 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=33.6ms, exec=13.6ms (wystąpiło 5 razy, klatki 62-73, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 73 (dt=33.4ms, wykonanie=11.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=33.4ms, exec=9.2ms (wystąpiło 4 razy, klatki 76-86, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 86 (dt=33.3ms, wykonanie=13.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=33.5ms, exec=10.3ms (wystąpiło 5 razy, klatki 90-103, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 103 (dt=33.2ms, wykonanie=11.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=33.3ms, exec=17.7ms (wystąpiło 7 razy, klatki 105-117, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 117 (dt=33.5ms, wykonanie=10.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=33.3ms, exec=9.1ms (wystąpiło 4 razy, klatki 122-133, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 133 (dt=33.4ms, wykonanie=13.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=33.2ms, exec=24.2ms (wystąpiło 5 razy, klatki 137-148, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 148 (dt=33.3ms, wykonanie=21.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1286 > 1275 (wystąpiło 9 razy, klatki 141-149, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 149: totalDrawCalls=1296 (fill=479, stroke=706, drawImage=111, arc=242, quadraticCurveTo=659). Arena: ARENA_3.

### 8. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1294 > 1275 (wystąpiło 12 razy, klatki 150-161, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 161: totalDrawCalls=1300 (fill=478, stroke=713, drawImage=109, arc=245, quadraticCurveTo=657). Arena: ARENA_3.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=33.1ms, exec=19.5ms (wystąpiło 11 razy, klatki 150-164, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 164 (dt=33.4ms, wykonanie=14.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=33.3ms, exec=19.3ms (wystąpiło 4 razy, klatki 165-178, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 178 (dt=33.4ms, wykonanie=16.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=33.4ms, exec=13.1ms (wystąpiło 6 razy, klatki 180-193, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 193 (dt=33.2ms, wykonanie=12.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1383 > 1275 (wystąpiło 18 razy, klatki 192-209, trwanie: 18 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 209: totalDrawCalls=1358 (fill=499, stroke=733, drawImage=126, arc=287, quadraticCurveTo=661). Arena: ARENA_3.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=33.3ms, exec=11.2ms (wystąpiło 4 razy, klatki 197-206, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 206 (dt=33.3ms, wykonanie=12.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1359 > 1275 (wystąpiło 30 razy, klatki 210-239, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 239: totalDrawCalls=1313 (fill=478, stroke=716, drawImage=119, arc=258, quadraticCurveTo=659). Arena: ARENA_3.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=33.3ms, exec=15.2ms (wystąpiło 8 razy, klatki 210-224, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 224 (dt=33.3ms, wykonanie=17.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=33.3ms, exec=24.7ms (wystąpiło 6 razy, klatki 225-238, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 238 (dt=33.3ms, wykonanie=11.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1288 > 1275 (wystąpiło 30 razy, klatki 240-269, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 269: totalDrawCalls=1375 (fill=529, stroke=741, drawImage=105, arc=332, quadraticCurveTo=656). Arena: ARENA_3.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=33.3ms, exec=14.1ms (wystąpiło 4 razy, klatki 242-252, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 252 (dt=33.4ms, wykonanie=13.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=33.3ms, exec=26.5ms (wystąpiło 6 razy, klatki 255-269, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 269 (dt=33.3ms, wykonanie=14.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1367 > 1275 (wystąpiło 30 razy, klatki 270-299, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 299: totalDrawCalls=1440 (fill=588, stroke=756, drawImage=96, arc=394, quadraticCurveTo=653). Arena: ARENA_3.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=33.2ms, exec=15.5ms (wystąpiło 6 razy, klatki 271-284, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 284 (dt=33.3ms, wykonanie=17.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=33.5ms, exec=20.2ms (wystąpiło 5 razy, klatki 287-298, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 298 (dt=33.3ms, wykonanie=13.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1455 > 1275 (wystąpiło 17 razy, klatki 300-316, trwanie: 17 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 316: totalDrawCalls=1447 (fill=590, stroke=759, drawImage=98, arc=418, quadraticCurveTo=655). Arena: ARENA_3.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=33.2ms, exec=16.4ms (wystąpiło 5 razy, klatki 302-313, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 313 (dt=33.4ms, wykonanie=18.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 25. [FRAME_STUTTER] Przycięcie klatki: dt=33.2ms, exec=18.0ms (wystąpiło 5 razy, klatki 316-329, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 329 (dt=33.3ms, wykonanie=11.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 26. [FRAME_STUTTER] Przycięcie klatki: dt=33.4ms, exec=14.0ms (wystąpiło 4 razy, klatki 333-343, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 343 (dt=33.3ms, wykonanie=9.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 27. [FRAME_STUTTER] Przycięcie klatki: dt=33.4ms, exec=12.7ms (wystąpiło 4 razy, klatki 348-359, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 359 (dt=33.4ms, wykonanie=14.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 28. [FRAME_STUTTER] Przycięcie klatki: dt=33.4ms, exec=11.8ms (wystąpiło 7 razy, klatki 360-371, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 371 (dt=33.5ms, wykonanie=11.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 29. [FRAME_STUTTER] Przycięcie klatki: dt=33.3ms, exec=11.6ms (wystąpiło 2 razy, klatki 382-386, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 386 (dt=33.3ms, wykonanie=9.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 30. [FRAME_STUTTER] Przycięcie klatki: dt=33.5ms, exec=11.0ms (wystąpiło 4 razy, klatki 390-400, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 400 (dt=50.0ms, wykonanie=8.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 31. [FRAME_STUTTER] Przycięcie klatki: dt=33.4ms, exec=9.9ms (wystąpiło 5 razy, klatki 406-419, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 419 (dt=33.2ms, wykonanie=9.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 32. [FRAME_STUTTER] Przycięcie klatki: dt=33.4ms, exec=11.6ms (wystąpiło 4 razy, klatki 422-433, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 433 (dt=33.4ms, wykonanie=12.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 33. [FRAME_STUTTER] Przycięcie klatki: dt=33.2ms, exec=11.2ms (wystąpiło 2 razy, klatki 440-444, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 444 (dt=33.2ms, wykonanie=13.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 34. [FRAME_STUTTER] Przycięcie klatki: dt=33.2ms, exec=8.1ms (wystąpiło 3 razy, klatki 454-461, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 461 (dt=33.3ms, wykonanie=10.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 35. [FRAME_STUTTER] Przycięcie klatki: dt=33.2ms, exec=11.9ms (wystąpiło 8 razy, klatki 465-478, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 478 (dt=33.3ms, wykonanie=13.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 36. [FRAME_STUTTER] Przycięcie klatki: dt=33.0ms, exec=13.3ms (wystąpiło 5 razy, klatki 481-494, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 494 (dt=33.6ms, wykonanie=9.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 37. [FRAME_STUTTER] Przycięcie klatki: dt=32.9ms, exec=10.5ms (wystąpiło 4 razy, klatki 497-509, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 509 (dt=33.6ms, wykonanie=13.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 38. [FRAME_STUTTER] Przycięcie klatki: dt=33.4ms, exec=11.4ms (wystąpiło 6 razy, klatki 512-524, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 524 (dt=33.3ms, wykonanie=14.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 39. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1276 > 1275 (wystąpiło 13 razy, klatki 524-539, trwanie: 16 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 539: totalDrawCalls=1277 (fill=463, stroke=692, drawImage=122, arc=274, quadraticCurveTo=660). Arena: ARENA_3.

### 40. [FRAME_STUTTER] Przycięcie klatki: dt=33.4ms, exec=14.8ms (wystąpiło 6 razy, klatki 525-537, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 537 (dt=33.4ms, wykonanie=9.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 41. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1276 > 1275 (wystąpiło 24 razy, klatki 540-567, trwanie: 28 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 567: totalDrawCalls=1277 (fill=458, stroke=696, drawImage=123, arc=258, quadraticCurveTo=660). Arena: ARENA_3.

### 42. [FRAME_STUTTER] Przycięcie klatki: dt=33.0ms, exec=8.7ms (wystąpiło 4 razy, klatki 540-552, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 552 (dt=33.3ms, wykonanie=10.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 43. [FRAME_STUTTER] Przycięcie klatki: dt=33.4ms, exec=9.9ms (wystąpiło 5 razy, klatki 555-568, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 568 (dt=33.3ms, wykonanie=9.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 44. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1281 > 1275 (klatka 571)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 571: totalDrawCalls=1281 (fill=464, stroke=693, drawImage=124, arc=248, quadraticCurveTo=660). Arena: ARENA_3.

### 45. [FRAME_STUTTER] Przycięcie klatki: dt=33.0ms, exec=8.4ms (wystąpiło 4 razy, klatki 573-583, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 583 (dt=33.1ms, wykonanie=10.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 46. [FRAME_STUTTER] Przycięcie klatki: dt=33.2ms, exec=9.7ms (wystąpiło 3 razy, klatki 588-596, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 596 (dt=33.5ms, wykonanie=10.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 47. [FRAME_STUTTER] Przycięcie klatki: dt=33.3ms, exec=9.9ms (wystąpiło 5 razy, klatki 601-614, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 614 (dt=33.3ms, wykonanie=14.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 48. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1301 > 1275 (wystąpiło 19 razy, klatki 611-629, trwanie: 19 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 629: totalDrawCalls=1458 (fill=594, stroke=752, drawImage=112, arc=373, quadraticCurveTo=635). Arena: ARENA_3.

### 49. [FRAME_STUTTER] Przycięcie klatki: dt=33.4ms, exec=11.6ms (wystąpiło 7 razy, klatki 615-627, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 627 (dt=33.4ms, wykonanie=13.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 50. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1472 > 1275 (wystąpiło 30 razy, klatki 630-659, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 659: totalDrawCalls=1425 (fill=574, stroke=741, drawImage=110, arc=371, quadraticCurveTo=635). Arena: ARENA_3.

### 51. [FRAME_STUTTER] Przycięcie klatki: dt=33.3ms, exec=14.4ms (wystąpiło 5 razy, klatki 630-644, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 644 (dt=33.2ms, wykonanie=11.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 52. [FRAME_STUTTER] Przycięcie klatki: dt=33.3ms, exec=16.5ms (wystąpiło 4 razy, klatki 649-659, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 659 (dt=33.3ms, wykonanie=13.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 53. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1431 > 1275 (wystąpiło 21 razy, klatki 660-680, trwanie: 21 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 680: totalDrawCalls=1428 (fill=578, stroke=746, drawImage=104, arc=361, quadraticCurveTo=637). Arena: ARENA_3.

### 54. [FRAME_STUTTER] Przycięcie klatki: dt=33.3ms, exec=16.0ms (wystąpiło 6 razy, klatki 663-674, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 674 (dt=33.4ms, wykonanie=11.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 55. [FRAME_STUTTER] Przycięcie klatki: dt=33.4ms, exec=14.8ms (wystąpiło 3 razy, klatki 678-687, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 687 (dt=33.0ms, wykonanie=11.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 56. [FRAME_STUTTER] Przycięcie klatki: dt=33.7ms, exec=10.6ms (wystąpiło 4 razy, klatki 692-704, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 704 (dt=33.5ms, wykonanie=11.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
