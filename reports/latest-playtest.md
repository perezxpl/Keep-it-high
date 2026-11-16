# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 16.11.2026, 19:53:41
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (124)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 45.9 s (1733 przetworzonych klatek, 1673 analizowanych)
- **Średni FPS:** **39.2 FPS** (średni czas klatki: 25.49 ms)
- **1% Low FPS:** **18.6 FPS** (99. percentyl czasu klatki: 53.9 ms)
- **Maksymalny czas wykonania klatki (exec):** 22.7 ms
- **Maksymalny odstęp między klatkami (dt):** 70.9 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 98
- **Średnie Draw Calls / klatkę (GPU):** **1538** (fill: 628, stroke: 796, drawImage: 114, arc: 349, quadraticCurveTo: 894, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **2757**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 98 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 26 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=6.4ms (wystąpiło 2 razy, klatki 211-216, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 216 (dt=35.9ms, wykonanie=10.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=8.5ms (wystąpiło 3 razy, klatki 226-237, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 237 (dt=36.1ms, wykonanie=6.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=6.2ms (wystąpiło 4 razy, klatki 240-252, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 252 (dt=35.9ms, wykonanie=7.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=35.8ms, exec=7.2ms (wystąpiło 3 razy, klatki 256-263, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 263 (dt=36.0ms, wykonanie=6.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.2ms (wystąpiło 3 razy, klatki 273-281, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 281 (dt=36.1ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=11.4ms (wystąpiło 5 razy, klatki 289-299, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 299 (dt=35.2ms, wykonanie=8.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=34.6ms, exec=10.8ms (wystąpiło 6 razy, klatki 301-313, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 313 (dt=36.0ms, wykonanie=9.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=9.6ms (wystąpiło 7 razy, klatki 315-328, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 328 (dt=35.6ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.0ms (wystąpiło 5 razy, klatki 330-342, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 342 (dt=35.6ms, wykonanie=8.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=17.2ms (wystąpiło 7 razy, klatki 345-357, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 357 (dt=36.0ms, wykonanie=12.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=7.9ms (wystąpiło 4 razy, klatki 360-372, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 372 (dt=36.0ms, wykonanie=7.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=10.7ms (wystąpiło 4 razy, klatki 378-388, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 388 (dt=35.7ms, wykonanie=10.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1276 > 1275 (klatka 386)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 386: totalDrawCalls=1276 (fill=464, stroke=693, drawImage=119, arc=257, quadraticCurveTo=705). Arena: ARENA_3.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.5ms (klatka 391)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 391 (dt=36.0ms, wykonanie=9.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1308 > 1275 (klatka 398)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 398: totalDrawCalls=1308 (fill=467, stroke=726, drawImage=115, arc=297, quadraticCurveTo=703). Arena: ARENA_3.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=7.9ms (klatka 407)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 407 (dt=35.1ms, wykonanie=7.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.3ms (wystąpiło 3 razy, klatki 423-433, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 433 (dt=35.6ms, wykonanie=8.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=10.9ms (wystąpiło 10 razy, klatki 436-448, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 448 (dt=35.5ms, wykonanie=10.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.7ms (wystąpiło 5 razy, klatki 450-458, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 458 (dt=36.1ms, wykonanie=8.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=8.6ms (klatka 472)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 472 (dt=35.3ms, wykonanie=8.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.7ms (klatka 488)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 488 (dt=36.0ms, wykonanie=8.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.4ms (wystąpiło 5 razy, klatki 529-538, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 538 (dt=36.0ms, wykonanie=7.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=8.5ms (wystąpiło 2 razy, klatki 542-546, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 546 (dt=36.1ms, wykonanie=6.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=7.8ms (wystąpiło 2 razy, klatki 578-582, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 582 (dt=36.0ms, wykonanie=7.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 25. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=9.1ms (wystąpiło 3 razy, klatki 585-596, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 596 (dt=36.1ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 26. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.4ms (wystąpiło 3 razy, klatki 600-611, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 611 (dt=36.0ms, wykonanie=8.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 27. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=8.9ms (klatka 622)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 622 (dt=35.5ms, wykonanie=8.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 28. [FRAME_STUTTER] Przycięcie klatki: dt=36.3ms, exec=6.0ms (klatka 646)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 646 (dt=36.3ms, wykonanie=6.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 29. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=8.4ms (klatka 672)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 672 (dt=36.1ms, wykonanie=8.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 30. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.7ms (klatka 687)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 687 (dt=36.0ms, wykonanie=7.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 31. [FRAME_STUTTER] Przycięcie klatki: dt=35.8ms, exec=9.6ms (wystąpiło 2 razy, klatki 693-699, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 699 (dt=36.1ms, wykonanie=6.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 32. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.9ms (klatka 715)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 715 (dt=36.0ms, wykonanie=6.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 33. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.7ms (klatka 733)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 733 (dt=36.0ms, wykonanie=6.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 34. [FRAME_STUTTER] Przycięcie klatki: dt=35.0ms, exec=7.9ms (wystąpiło 2 razy, klatki 742-746, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 746 (dt=36.0ms, wykonanie=9.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 35. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.0ms (wystąpiło 2 razy, klatki 752-762, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 762 (dt=35.2ms, wykonanie=4.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 36. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=11.0ms (wystąpiło 3 razy, klatki 771-778, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 778 (dt=35.8ms, wykonanie=8.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 37. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=10.7ms (wystąpiło 3 razy, klatki 784-791, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 791 (dt=36.0ms, wykonanie=6.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 38. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.6ms (wystąpiło 2 razy, klatki 797-805, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 805 (dt=36.0ms, wykonanie=9.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 39. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.4ms (wystąpiło 2 razy, klatki 812-818, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 818 (dt=36.0ms, wykonanie=6.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 40. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=5.8ms (wystąpiło 2 razy, klatki 831-838, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 838 (dt=36.0ms, wykonanie=8.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 41. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=7.5ms (wystąpiło 2 razy, klatki 841-853, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 853 (dt=36.0ms, wykonanie=8.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 42. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.5ms (wystąpiło 2 razy, klatki 860-867, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 867 (dt=34.8ms, wykonanie=6.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 43. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=6.7ms (klatka 877)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 877 (dt=35.2ms, wykonanie=6.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 44. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=8.3ms (wystąpiło 3 razy, klatki 889-894, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 894 (dt=36.0ms, wykonanie=7.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 45. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=5.9ms (wystąpiło 3 razy, klatki 901-912, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 912 (dt=35.9ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 46. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.5ms (wystąpiło 7 razy, klatki 916-928, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 928 (dt=36.1ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 47. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=7.9ms (wystąpiło 7 razy, klatki 930-944, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 944 (dt=35.9ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 8, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 48. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.9ms (wystąpiło 7 razy, klatki 945-959, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 959 (dt=36.2ms, wykonanie=9.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 9, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 49. [FRAME_STUTTER] Przycięcie klatki: dt=35.0ms, exec=8.5ms (wystąpiło 7 razy, klatki 961-973, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 973 (dt=36.0ms, wykonanie=7.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 9, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 50. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.8ms (wystąpiło 6 razy, klatki 976-988, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 988 (dt=36.0ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 9, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 51. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=9.6ms (wystąpiło 7 razy, klatki 990-1003, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1003 (dt=36.0ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 9, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 52. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.5ms (wystąpiło 7 razy, klatki 1005-1019, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1019 (dt=35.9ms, wykonanie=10.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 9, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 53. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=8.9ms (wystąpiło 6 razy, klatki 1021-1032, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1032 (dt=36.1ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 9, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 54. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=13.3ms (wystąpiło 7 razy, klatki 1035-1049, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1049 (dt=36.0ms, wykonanie=11.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 8, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 55. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1579 > 1530 (wystąpiło 12 razy, klatki 1038-1049, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1049: totalDrawCalls=1565 (fill=665, stroke=799, drawImage=101, arc=415, quadraticCurveTo=861). Arena: ARENA_3.

### 56. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1565 > 1530 (wystąpiło 30 razy, klatki 1050-1079, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1079: totalDrawCalls=1567 (fill=668, stroke=799, drawImage=100, arc=414, quadraticCurveTo=863). Arena: ARENA_3.

### 57. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.1ms (wystąpiło 7 razy, klatki 1050-1063, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1063 (dt=36.1ms, wykonanie=10.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 8, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 58. [FRAME_STUTTER] Przycięcie klatki: dt=35.8ms, exec=9.4ms (wystąpiło 8 razy, klatki 1065-1079, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1079 (dt=35.2ms, wykonanie=8.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 8, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 59. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1563 > 1530 (wystąpiło 16 razy, klatki 1080-1095, trwanie: 16 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1095: totalDrawCalls=1558 (fill=665, stroke=772, drawImage=121, arc=404, quadraticCurveTo=861). Arena: ARENA_3.

### 60. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=9.2ms (wystąpiło 8 razy, klatki 1082-1094, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1094 (dt=35.8ms, wykonanie=10.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 8, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 61. [FRAME_STUTTER] Przycięcie klatki: dt=35.8ms, exec=9.3ms (wystąpiło 6 razy, klatki 1096-1108, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1108 (dt=36.1ms, wykonanie=8.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 9, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 62. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=7.5ms (wystąpiło 7 razy, klatki 1111-1123, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1123 (dt=36.0ms, wykonanie=9.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 9, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 63. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=7.3ms (wystąpiło 8 razy, klatki 1125-1137, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1137 (dt=36.1ms, wykonanie=6.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 9, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 64. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1655 > 1615 (wystąpiło 2 razy, klatki 1138-1139, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1139: totalDrawCalls=1657 (fill=733, stroke=822, drawImage=102, arc=459, quadraticCurveTo=860). Arena: ARENA_3.

### 65. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1656 > 1615 (wystąpiło 28 razy, klatki 1140-1167, trwanie: 28 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1167: totalDrawCalls=1625 (fill=720, stroke=811, drawImage=94, arc=442, quadraticCurveTo=860). Arena: ARENA_3.

### 66. [FRAME_STUTTER] Przycięcie klatki: dt=35.0ms, exec=10.9ms (wystąpiło 8 razy, klatki 1140-1154, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1154 (dt=36.0ms, wykonanie=8.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 8, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 67. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=10.7ms (wystąpiło 7 razy, klatki 1157-1168, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1168 (dt=36.0ms, wykonanie=12.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 8, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 68. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1761 > 1615 (wystąpiło 30 razy, klatki 1170-1199, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1199: totalDrawCalls=1761 (fill=772, stroke=890, drawImage=99, arc=447, quadraticCurveTo=1025). Arena: ARENA_3.

### 69. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=11.5ms (wystąpiło 7 razy, klatki 1171-1183, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1183 (dt=35.7ms, wykonanie=11.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 8, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 70. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.4ms (wystąpiło 9 razy, klatki 1185-1199, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1199 (dt=36.1ms, wykonanie=10.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 8, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 71. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1758 > 1615 (wystąpiło 30 razy, klatki 1200-1229, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1229: totalDrawCalls=1784 (fill=775, stroke=902, drawImage=107, arc=449, quadraticCurveTo=1028). Arena: ARENA_3.

### 72. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=8.8ms (wystąpiło 11 razy, klatki 1200-1213, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1213 (dt=36.0ms, wykonanie=9.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 9, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 73. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.8ms (wystąpiło 11 razy, klatki 1215-1229, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1229 (dt=36.0ms, wykonanie=10.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 9, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 74. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1785 > 1615 (wystąpiło 30 razy, klatki 1230-1259, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1259: totalDrawCalls=1772 (fill=763, stroke=886, drawImage=123, arc=428, quadraticCurveTo=1028). Arena: ARENA_3.

### 75. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=10.4ms (wystąpiło 11 razy, klatki 1230-1244, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1244 (dt=35.8ms, wykonanie=10.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 9, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 76. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=11.6ms (wystąpiło 9 razy, klatki 1246-1258, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1258 (dt=34.7ms, wykonanie=7.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 10, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 77. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1781 > 1700 (wystąpiło 30 razy, klatki 1260-1289, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1289: totalDrawCalls=1758 (fill=753, stroke=883, drawImage=122, arc=418, quadraticCurveTo=1028). Arena: ARENA_3.

### 78. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=7.5ms (wystąpiło 8 razy, klatki 1260-1274, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1274 (dt=35.5ms, wykonanie=7.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 10, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 79. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=8.9ms (wystąpiło 8 razy, klatki 1277-1289, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1289 (dt=35.9ms, wykonanie=9.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 10, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 80. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1758 > 1700 (wystąpiło 30 razy, klatki 1290-1319, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1319: totalDrawCalls=1985 (fill=887, stroke=989, drawImage=109, arc=512, quadraticCurveTo=1132). Arena: ARENA_3.

### 81. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.4ms (wystąpiło 9 razy, klatki 1290-1303, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1303 (dt=36.0ms, wykonanie=8.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 10, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 82. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.7ms (wystąpiło 10 razy, klatki 1305-1319, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1319 (dt=35.7ms, wykonanie=8.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 9, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 83. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1985 > 1700 (wystąpiło 30 razy, klatki 1320-1349, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1349: totalDrawCalls=1985 (fill=885, stroke=989, drawImage=111, arc=512, quadraticCurveTo=1132). Arena: ARENA_3.

### 84. [FRAME_STUTTER] Przycięcie klatki: dt=35.8ms, exec=8.7ms (wystąpiło 13 razy, klatki 1320-1334, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1334 (dt=34.6ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 9, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 85. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=8.7ms (wystąpiło 12 razy, klatki 1335-1349, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1349 (dt=35.6ms, wykonanie=9.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 9, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 86. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1985 > 1700 (wystąpiło 30 razy, klatki 1350-1379, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1379: totalDrawCalls=1983 (fill=874, stroke=990, drawImage=119, arc=506, quadraticCurveTo=1133). Arena: ARENA_3.

### 87. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=11.3ms (wystąpiło 11 razy, klatki 1351-1363, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1363 (dt=36.1ms, wykonanie=8.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 11, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 88. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=9.8ms (wystąpiło 12 razy, klatki 1365-1379, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1379 (dt=35.9ms, wykonanie=6.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 11, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 89. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1986 > 1785 (wystąpiło 30 razy, klatki 1380-1409, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1409: totalDrawCalls=1967 (fill=875, stroke=975, drawImage=117, arc=507, quadraticCurveTo=1133). Arena: ARENA_3.

### 90. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=9.7ms (wystąpiło 10 razy, klatki 1381-1393, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1393 (dt=36.1ms, wykonanie=7.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 11, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 91. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.4ms (wystąpiło 13 razy, klatki 1395-1409, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1409 (dt=35.2ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 11, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 92. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1972 > 1785 (wystąpiło 30 razy, klatki 1410-1439, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1439: totalDrawCalls=2127 (fill=945, stroke=1058, drawImage=124, arc=522, quadraticCurveTo=1298). Arena: ARENA_3.

### 93. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=7.3ms (wystąpiło 12 razy, klatki 1410-1424, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1424 (dt=35.9ms, wykonanie=10.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 11, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 94. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=10.1ms (wystąpiło 13 razy, klatki 1425-1438, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1438 (dt=36.0ms, wykonanie=8.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 11, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 95. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 2119 > 1785 (wystąpiło 30 razy, klatki 1440-1469, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1469: totalDrawCalls=2127 (fill=942, stroke=1055, drawImage=130, arc=526, quadraticCurveTo=1301). Arena: ARENA_3.

### 96. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=10.6ms (wystąpiło 15 razy, klatki 1440-1454, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1454 (dt=35.5ms, wykonanie=7.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 11, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 97. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.9ms (wystąpiło 14 razy, klatki 1455-1468, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1468 (dt=53.6ms, wykonanie=8.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 12, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 98. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 2119 > 1785 (wystąpiło 30 razy, klatki 1470-1499, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1499: totalDrawCalls=2143 (fill=940, stroke=1055, drawImage=148, arc=522, quadraticCurveTo=1301). Arena: ARENA_3.

### 99. [FRAME_STUTTER] Przycięcie klatki: dt=53.2ms, exec=11.3ms (wystąpiło 14 razy, klatki 1470-1484, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1484 (dt=36.2ms, wykonanie=7.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 12, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 100. [FRAME_STUTTER] Przycięcie klatki: dt=52.4ms, exec=9.7ms (wystąpiło 15 razy, klatki 1485-1499, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1499 (dt=35.6ms, wykonanie=10.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 12, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 101. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 2140 > 1785 (wystąpiło 30 razy, klatki 1500-1529, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1529: totalDrawCalls=2121 (fill=940, stroke=1045, drawImage=136, arc=522, quadraticCurveTo=1303). Arena: ARENA_3.

### 102. [FRAME_STUTTER] Przycięcie klatki: dt=35.8ms, exec=10.1ms (wystąpiło 14 razy, klatki 1500-1514, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1514 (dt=35.7ms, wykonanie=10.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 12, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 103. [FRAME_STUTTER] Przycięcie klatki: dt=34.3ms, exec=9.9ms (wystąpiło 14 razy, klatki 1515-1529, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1529 (dt=35.6ms, wykonanie=7.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 12, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 104. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 2122 > 1785 (wystąpiło 30 razy, klatki 1530-1559, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1559: totalDrawCalls=2217 (fill=1010, stroke=1081, drawImage=126, arc=591, quadraticCurveTo=1298). Arena: ARENA_3.

### 105. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=10.0ms (wystąpiło 15 razy, klatki 1530-1544, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1544 (dt=35.1ms, wykonanie=11.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 11, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 106. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=11.6ms (wystąpiło 14 razy, klatki 1545-1559, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1559 (dt=54.1ms, wykonanie=11.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 11, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 107. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 2214 > 1785 (wystąpiło 30 razy, klatki 1560-1589, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1589: totalDrawCalls=2278 (fill=1058, stroke=1100, drawImage=120, arc=629, quadraticCurveTo=1297). Arena: ARENA_3.

### 108. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=8.0ms (wystąpiło 13 razy, klatki 1560-1574, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1574 (dt=35.9ms, wykonanie=13.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 11, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 109. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=12.3ms (wystąpiło 14 razy, klatki 1575-1589, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1589 (dt=36.1ms, wykonanie=11.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 11, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 110. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 2278 > 1870 (wystąpiło 30 razy, klatki 1590-1619, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1619: totalDrawCalls=2274 (fill=1057, stroke=1099, drawImage=118, arc=629, quadraticCurveTo=1297). Arena: ARENA_3.

### 111. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=8.4ms (wystąpiło 14 razy, klatki 1590-1604, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1604 (dt=35.7ms, wykonanie=9.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 11, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 112. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=11.0ms (wystąpiło 14 razy, klatki 1606-1619, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1619 (dt=35.6ms, wykonanie=9.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 11, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 113. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 2273 > 1870 (wystąpiło 30 razy, klatki 1620-1649, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1649: totalDrawCalls=2391 (fill=1102, stroke=1165, drawImage=124, arc=617, quadraticCurveTo=1462). Arena: ARENA_3.

### 114. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=8.4ms (wystąpiło 14 razy, klatki 1620-1633, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1633 (dt=35.1ms, wykonanie=9.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 12, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 115. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=9.1ms (wystąpiło 14 razy, klatki 1635-1649, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1649 (dt=35.6ms, wykonanie=11.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 12, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 116. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 2388 > 1955 (wystąpiło 30 razy, klatki 1650-1679, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1679: totalDrawCalls=2662 (fill=1241, stroke=1286, drawImage=135, arc=715, quadraticCurveTo=1572). Arena: ARENA_3.

### 117. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=9.9ms (wystąpiło 15 razy, klatki 1650-1664, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1664 (dt=36.0ms, wykonanie=11.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 12, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 118. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=9.0ms (wystąpiło 14 razy, klatki 1665-1679, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1679 (dt=36.0ms, wykonanie=9.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 13, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 119. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 2662 > 1955 (wystąpiło 30 razy, klatki 1680-1709, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1709: totalDrawCalls=2708 (fill=1260, stroke=1296, drawImage=152, arc=735, quadraticCurveTo=1572). Arena: ARENA_3.

### 120. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=9.3ms (wystąpiło 15 razy, klatki 1680-1694, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1694 (dt=53.1ms, wykonanie=10.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 13, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 121. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=8.9ms (wystąpiło 15 razy, klatki 1695-1709, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1709 (dt=35.7ms, wykonanie=10.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 13, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 122. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 2718 > 1955 (wystąpiło 24 razy, klatki 1710-1733, trwanie: 24 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1733: totalDrawCalls=2710 (fill=1254, stroke=1297, drawImage=159, arc=746, quadraticCurveTo=1573). Arena: ARENA_3.

### 123. [FRAME_STUTTER] Przycięcie klatki: dt=52.8ms, exec=8.6ms (wystąpiło 15 razy, klatki 1710-1724, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1724 (dt=36.1ms, wykonanie=13.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 14, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 124. [FRAME_STUTTER] Przycięcie klatki: dt=54.0ms, exec=8.8ms (wystąpiło 9 razy, klatki 1725-1733, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1733 (dt=53.2ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 14, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
