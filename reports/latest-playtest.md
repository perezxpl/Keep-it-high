# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 16.11.2026, 18:38:24
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (67)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 30.7 s (1418 przetworzonych klatek, 1358 analizowanych)
- **Średni FPS:** **50 FPS** (średni czas klatki: 20.02 ms)
- **1% Low FPS:** **27.7 FPS** (99. percentyl czasu klatki: 36.1 ms)
- **Maksymalny czas wykonania klatki (exec):** 20.4 ms
- **Maksymalny odstęp między klatkami (dt):** 54.1 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 61
- **Średnie Draw Calls / klatkę (GPU):** **1058** (fill: 390, stroke: 563, drawImage: 105, arc: 232, quadraticCurveTo: 578, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1463**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 61 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 6 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=9.2ms (klatka 181)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 181 (dt=35.6ms, wykonanie=9.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=8.1ms (klatka 202)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 202 (dt=36.1ms, wykonanie=8.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=10.9ms (wystąpiło 3 razy, klatki 212-224, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 224 (dt=36.0ms, wykonanie=6.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=9.8ms (wystąpiło 4 razy, klatki 228-238, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 238 (dt=36.0ms, wykonanie=9.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=8.0ms (wystąpiło 5 razy, klatki 241-252, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 252 (dt=36.1ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.9ms (wystąpiło 7 razy, klatki 255-268, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 268 (dt=35.7ms, wykonanie=9.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=54.1ms, exec=11.5ms (wystąpiło 10 razy, klatki 270-283, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 283 (dt=36.1ms, wykonanie=11.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=8.6ms (wystąpiło 7 razy, klatki 285-297, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 297 (dt=36.0ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=10.2ms (wystąpiło 6 razy, klatki 300-312, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 312 (dt=35.7ms, wykonanie=7.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.7ms (wystąpiło 5 razy, klatki 315-327, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 327 (dt=35.9ms, wykonanie=9.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=6.7ms (wystąpiło 5 razy, klatki 330-343, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 343 (dt=35.5ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.4ms (wystąpiło 4 razy, klatki 346-357, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 357 (dt=36.1ms, wykonanie=9.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=8.7ms (wystąpiło 5 razy, klatki 360-373, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 373 (dt=36.0ms, wykonanie=8.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.1ms (wystąpiło 5 razy, klatki 376-389, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 389 (dt=36.0ms, wykonanie=11.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=34.9ms, exec=7.8ms (wystąpiło 5 razy, klatki 391-404, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 404 (dt=35.9ms, wykonanie=10.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=34.7ms, exec=8.3ms (wystąpiło 4 razy, klatki 406-417, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 417 (dt=36.1ms, wykonanie=7.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=8.9ms (wystąpiło 3 razy, klatki 422-430, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 430 (dt=36.0ms, wykonanie=6.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=8.1ms (wystąpiło 3 razy, klatki 435-445, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 445 (dt=35.5ms, wykonanie=6.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=8.3ms (wystąpiło 8 razy, klatki 451-463, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 463 (dt=36.1ms, wykonanie=9.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=11.7ms (wystąpiło 6 razy, klatki 466-477, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 477 (dt=36.0ms, wykonanie=7.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=8.6ms (wystąpiło 4 razy, klatki 481-492, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 492 (dt=36.0ms, wykonanie=7.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=10.2ms (wystąpiło 4 razy, klatki 496-508, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 508 (dt=36.0ms, wykonanie=9.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=7.1ms (wystąpiło 4 razy, klatki 514-524, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 524 (dt=34.7ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1285 > 1275 (wystąpiło 14 razy, klatki 517-532, trwanie: 16 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 532: totalDrawCalls=1284 (fill=493, stroke=674, drawImage=117, arc=295, quadraticCurveTo=680). Arena: ARENA_3.

### 25. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=11.4ms (wystąpiło 4 razy, klatki 530-538, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 538 (dt=36.0ms, wykonanie=14.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 26. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=14.8ms (wystąpiło 4 razy, klatki 540-552, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 552 (dt=36.2ms, wykonanie=9.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 27. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=11.8ms (wystąpiło 3 razy, klatki 558-567, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 567 (dt=36.0ms, wykonanie=8.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 28. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.2ms (wystąpiło 2 razy, klatki 572-577, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 577 (dt=36.0ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 29. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=8.1ms (klatka 590)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 590 (dt=35.3ms, wykonanie=8.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 30. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.2ms (klatka 625)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 625 (dt=36.0ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 31. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=10.7ms (klatka 633)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 633 (dt=36.0ms, wykonanie=10.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 32. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=8.1ms (klatka 658)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 658 (dt=35.1ms, wykonanie=8.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 33. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=8.5ms (klatka 687)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 687 (dt=35.5ms, wykonanie=8.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 34. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.3ms (klatka 890)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 890 (dt=36.0ms, wykonanie=6.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 35. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=5.6ms (klatka 942)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 942 (dt=35.2ms, wykonanie=5.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 36. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=7.2ms (wystąpiło 3 razy, klatki 948-955, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 955 (dt=35.2ms, wykonanie=5.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 37. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=5.7ms (wystąpiło 4 razy, klatki 960-972, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 972 (dt=35.6ms, wykonanie=5.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 38. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=5.6ms (wystąpiło 5 razy, klatki 976-989, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 989 (dt=34.2ms, wykonanie=9.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 39. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.7ms (wystąpiło 3 razy, klatki 991-1003, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1003 (dt=36.0ms, wykonanie=8.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 40. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1342 > 1275 (wystąpiło 23 razy, klatki 997-1019, trwanie: 23 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1019: totalDrawCalls=1378 (fill=563, stroke=702, drawImage=113, arc=369, quadraticCurveTo=700). Arena: ARENA_3.

### 41. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.6ms (wystąpiło 6 razy, klatki 1006-1019, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1019 (dt=35.6ms, wykonanie=8.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 42. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1377 > 1275 (wystąpiło 10 razy, klatki 1020-1043, trwanie: 24 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1043: totalDrawCalls=1463 (fill=623, stroke=731, drawImage=109, arc=415, quadraticCurveTo=699). Arena: ARENA_3.

### 43. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.5ms (wystąpiło 4 razy, klatki 1024-1034, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1034 (dt=36.0ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 44. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.4ms (wystąpiło 3 razy, klatki 1038-1046, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1046 (dt=36.0ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 45. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.4ms (wystąpiło 2 razy, klatki 1052-1062, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1062 (dt=35.1ms, wykonanie=9.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 46. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=6.8ms (wystąpiło 2 razy, klatki 1072-1076, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1076 (dt=35.2ms, wykonanie=9.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 47. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=7.2ms (wystąpiło 4 razy, klatki 1080-1094, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1094 (dt=36.3ms, wykonanie=5.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 48. [FRAME_STUTTER] Przycięcie klatki: dt=52.2ms, exec=6.5ms (wystąpiło 2 razy, klatki 1175-1184, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1184 (dt=36.0ms, wykonanie=6.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 49. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=6.9ms (wystąpiło 4 razy, klatki 1186-1198, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1198 (dt=36.0ms, wykonanie=6.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 50. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=7.2ms (wystąpiło 3 razy, klatki 1203-1212, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1212 (dt=35.2ms, wykonanie=7.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 51. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=9.3ms (wystąpiło 2 razy, klatki 1215-1216, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1216 (dt=35.6ms, wykonanie=6.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 52. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1280 > 1275 (wystąpiło 3 razy, klatki 1218-1220, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1220: totalDrawCalls=1276 (fill=495, stroke=663, drawImage=118, arc=299, quadraticCurveTo=706). Arena: ARENA_3.

### 53. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=6.0ms (klatka 1231)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1231 (dt=35.9ms, wykonanie=6.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 54. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=6.1ms (wystąpiło 3 razy, klatki 1254-1259, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1259 (dt=35.9ms, wykonanie=12.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 55. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=9.2ms (klatka 1271)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1271 (dt=35.5ms, wykonanie=9.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 56. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=14.3ms (wystąpiło 3 razy, klatki 1277-1281, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1281 (dt=36.0ms, wykonanie=10.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 57. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=12.8ms (klatka 1294)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1294 (dt=35.6ms, wykonanie=12.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 58. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=7.7ms (klatka 1319)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1319 (dt=35.2ms, wykonanie=7.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 59. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=7.5ms (wystąpiło 4 razy, klatki 1324-1334, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1334 (dt=36.0ms, wykonanie=7.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 60. [FRAME_STUTTER] Przycięcie klatki: dt=36.2ms, exec=7.8ms (wystąpiło 4 razy, klatki 1339-1349, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1349 (dt=36.1ms, wykonanie=8.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 61. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=6.7ms (wystąpiło 6 razy, klatki 1352-1363, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1363 (dt=35.6ms, wykonanie=10.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 62. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.9ms (wystąpiło 7 razy, klatki 1365-1378, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1378 (dt=36.0ms, wykonanie=9.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 63. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1314 > 1275 (klatka 1371)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1371: totalDrawCalls=1314 (fill=536, stroke=685, drawImage=93, arc=367, quadraticCurveTo=697). Arena: ARENA_3.

### 64. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1333 > 1275 (wystąpiło 19 razy, klatki 1380-1398, trwanie: 19 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1398: totalDrawCalls=1311 (fill=542, stroke=659, drawImage=110, arc=354, quadraticCurveTo=695). Arena: ARENA_3.

### 65. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.1ms (wystąpiło 6 razy, klatki 1381-1393, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1393 (dt=36.0ms, wykonanie=12.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 66. [FRAME_STUTTER] Przycięcie klatki: dt=35.4ms, exec=12.4ms (wystąpiło 5 razy, klatki 1396-1409, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1409 (dt=35.4ms, wykonanie=7.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 67. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=11.2ms (wystąpiło 2 razy, klatki 1413-1417, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1417 (dt=36.0ms, wykonanie=10.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
