# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 17.11.2026, 22:00:50
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (62)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 25.6 s (1146 przetworzonych klatek, 1086 analizowanych)
- **Średni FPS:** **48.3 FPS** (średni czas klatki: 20.72 ms)
- **1% Low FPS:** **27.7 FPS** (99. percentyl czasu klatki: 36.1 ms)
- **Maksymalny czas wykonania klatki (exec):** 20.7 ms
- **Maksymalny odstęp między klatkami (dt):** 75 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 54
- **Średnie Draw Calls / klatkę (GPU):** **1077** (fill: 369, stroke: 591, drawImage: 116, arc: 204, quadraticCurveTo: 568, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1392**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 54 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 8 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=6.7ms (klatka 224)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 224 (dt=35.2ms, wykonanie=6.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=35.8ms, exec=7.4ms (wystąpiło 2 razy, klatki 226-235, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 235 (dt=35.6ms, wykonanie=9.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=8.3ms (wystąpiło 2 razy, klatki 247-251, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 251 (dt=36.0ms, wykonanie=8.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=34.9ms, exec=8.1ms (wystąpiło 4 razy, klatki 255-267, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 267 (dt=35.6ms, wykonanie=7.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=12.2ms (wystąpiło 13 razy, klatki 270-284, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 284 (dt=36.0ms, wykonanie=10.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1392 > 1275 (wystąpiło 26 razy, klatki 274-299, trwanie: 26 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 299: totalDrawCalls=1371 (fill=523, stroke=723, drawImage=125, arc=349, quadraticCurveTo=700). Arena: ARENA_3.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=12.4ms (wystąpiło 9 razy, klatki 286-299, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 299 (dt=36.0ms, wykonanie=7.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1373 > 1275 (wystąpiło 27 razy, klatki 300-329, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 329: totalDrawCalls=1277 (fill=462, stroke=694, drawImage=121, arc=268, quadraticCurveTo=690). Arena: ARENA_3.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=34.7ms, exec=11.3ms (wystąpiło 8 razy, klatki 300-312, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 312 (dt=36.0ms, wykonanie=7.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=10.1ms (wystąpiło 8 razy, klatki 315-328, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 328 (dt=35.0ms, wykonanie=11.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=10.4ms (wystąpiło 5 razy, klatki 332-342, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 342 (dt=35.2ms, wykonanie=11.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1284 > 1275 (wystąpiło 2 razy, klatki 342-343, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 343: totalDrawCalls=1288 (fill=472, stroke=700, drawImage=116, arc=253, quadraticCurveTo=696). Arena: ARENA_3.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.0ms (wystąpiło 7 razy, klatki 345-359, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 359 (dt=36.0ms, wykonanie=10.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=10.0ms (wystąpiło 5 razy, klatki 362-374, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 374 (dt=36.0ms, wykonanie=8.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=9.7ms (wystąpiło 5 razy, klatki 376-388, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 388 (dt=35.4ms, wykonanie=10.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1293 > 1275 (wystąpiło 7 razy, klatki 383-389, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 389: totalDrawCalls=1281 (fill=469, stroke=691, drawImage=121, arc=275, quadraticCurveTo=696). Arena: ARENA_3.

### 17. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1283 > 1275 (wystąpiło 30 razy, klatki 390-419, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 419: totalDrawCalls=1281 (fill=468, stroke=694, drawImage=119, arc=290, quadraticCurveTo=692). Arena: ARENA_3.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=9.8ms (wystąpiło 6 razy, klatki 390-404, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 404 (dt=35.2ms, wykonanie=10.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=10.1ms (wystąpiło 9 razy, klatki 406-419, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 419 (dt=34.9ms, wykonanie=11.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1288 > 1275 (wystąpiło 15 razy, klatki 420-437, trwanie: 18 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 437: totalDrawCalls=1282 (fill=465, stroke=700, drawImage=117, arc=250, quadraticCurveTo=694). Arena: ARENA_3.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.6ms (wystąpiło 6 razy, klatki 422-432, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 432 (dt=36.0ms, wykonanie=12.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=35.4ms, exec=11.8ms (wystąpiło 6 razy, klatki 435-448, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 448 (dt=35.3ms, wykonanie=10.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=9.4ms (wystąpiło 2 razy, klatki 451-454, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 454 (dt=35.3ms, wykonanie=6.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=8.6ms (klatka 477)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 477 (dt=35.2ms, wykonanie=8.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 25. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=5.9ms (klatka 490)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 490 (dt=35.3ms, wykonanie=5.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 26. [FRAME_STUTTER] Przycięcie klatki: dt=75.0ms, exec=6.2ms (wystąpiło 3 razy, klatki 529-531, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 531 (dt=71.6ms, wykonanie=5.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 27. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=9.1ms (wystąpiło 3 razy, klatki 541-548, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 548 (dt=35.7ms, wykonanie=6.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 28. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=6.9ms (klatka 579)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 579 (dt=35.7ms, wykonanie=6.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 29. [FRAME_STUTTER] Przycięcie klatki: dt=34.9ms, exec=7.3ms (klatka 596)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 596 (dt=34.9ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 30. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=8.9ms (wystąpiło 4 razy, klatki 600-613, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 613 (dt=36.1ms, wykonanie=8.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 31. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.2ms (wystąpiło 4 razy, klatki 621-628, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 628 (dt=36.1ms, wykonanie=8.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 32. [FRAME_STUTTER] Przycięcie klatki: dt=35.8ms, exec=9.3ms (wystąpiło 5 razy, klatki 631-643, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 643 (dt=35.6ms, wykonanie=8.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 33. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.9ms (wystąpiło 6 razy, klatki 646-659, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 659 (dt=36.1ms, wykonanie=10.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 34. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.5ms (wystąpiło 7 razy, klatki 661-673, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 673 (dt=35.6ms, wykonanie=8.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 35. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=8.9ms (wystąpiło 4 razy, klatki 676-687, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 687 (dt=35.6ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 36. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=5.8ms (wystąpiło 4 razy, klatki 691-701, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 701 (dt=35.5ms, wykonanie=7.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 37. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=7.4ms (wystąpiło 2 razy, klatki 707-716, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 716 (dt=36.0ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 38. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=6.0ms (wystąpiło 2 razy, klatki 738-747, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 747 (dt=35.2ms, wykonanie=6.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 39. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=5.5ms (klatka 760)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 760 (dt=35.9ms, wykonanie=5.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 40. [FRAME_STUTTER] Przycięcie klatki: dt=34.7ms, exec=6.0ms (wystąpiło 2 razy, klatki 765-768, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 768 (dt=34.8ms, wykonanie=7.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 41. [FRAME_STUTTER] Przycięcie klatki: dt=35.4ms, exec=7.7ms (wystąpiło 6 razy, klatki 782-793, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 793 (dt=35.6ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 42. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=7.9ms (wystąpiło 4 razy, klatki 797-808, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 808 (dt=35.1ms, wykonanie=6.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 43. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=5.5ms (wystąpiło 4 razy, klatki 813-824, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 824 (dt=35.5ms, wykonanie=6.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 44. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=6.8ms (wystąpiło 4 razy, klatki 828-839, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 839 (dt=35.5ms, wykonanie=12.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 45. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=7.8ms (wystąpiło 3 razy, klatki 841-852, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 852 (dt=35.4ms, wykonanie=9.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 46. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=6.2ms (wystąpiło 3 razy, klatki 856-865, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 865 (dt=35.5ms, wykonanie=8.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 47. [FRAME_STUTTER] Przycięcie klatki: dt=35.4ms, exec=8.0ms (wystąpiło 2 razy, klatki 872-880, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 880 (dt=35.9ms, wykonanie=6.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 48. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=8.4ms (wystąpiło 2 razy, klatki 886-890, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 890 (dt=35.1ms, wykonanie=6.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 49. [FRAME_STUTTER] Przycięcie klatki: dt=34.9ms, exec=6.1ms (wystąpiło 2 razy, klatki 900-908, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 908 (dt=35.4ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 50. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=7.5ms (wystąpiło 2 razy, klatki 940-943, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 943 (dt=35.5ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 51. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.5ms (wystąpiło 2 razy, klatki 947-953, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 953 (dt=35.9ms, wykonanie=5.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 52. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.0ms (klatka 1031)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1031 (dt=36.0ms, wykonanie=6.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 53. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.5ms (wystąpiło 5 razy, klatki 1035-1046, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1046 (dt=35.4ms, wykonanie=6.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 54. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=4.5ms (wystąpiło 4 razy, klatki 1051-1064, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1064 (dt=36.0ms, wykonanie=8.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 55. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.9ms (wystąpiło 4 razy, klatki 1066-1077, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1077 (dt=36.0ms, wykonanie=9.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 56. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=8.2ms (wystąpiło 4 razy, klatki 1081-1094, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1094 (dt=36.0ms, wykonanie=11.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 57. [FRAME_STUTTER] Przycięcie klatki: dt=36.2ms, exec=9.4ms (wystąpiło 4 razy, klatki 1097-1108, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1108 (dt=36.0ms, wykonanie=10.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 58. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1287 > 1275 (wystąpiło 9 razy, klatki 1101-1109, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1109: totalDrawCalls=1336 (fill=544, stroke=656, drawImage=136, arc=392, quadraticCurveTo=536). Arena: ARENA_3.

### 59. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1336 > 1275 (wystąpiło 14 razy, klatki 1110-1123, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1123: totalDrawCalls=1285 (fill=525, stroke=639, drawImage=121, arc=400, quadraticCurveTo=536). Arena: ARENA_3.

### 60. [FRAME_STUTTER] Przycięcie klatki: dt=34.5ms, exec=11.5ms (wystąpiło 6 razy, klatki 1111-1122, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1122 (dt=35.6ms, wykonanie=11.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 61. [FRAME_STUTTER] Przycięcie klatki: dt=35.4ms, exec=7.6ms (wystąpiło 4 razy, klatki 1125-1135, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1135 (dt=35.8ms, wykonanie=7.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 62. [FRAME_STUTTER] Przycięcie klatki: dt=35.0ms, exec=9.0ms (wystąpiło 4 razy, klatki 1140-1146, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1146 (dt=35.9ms, wykonanie=7.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
