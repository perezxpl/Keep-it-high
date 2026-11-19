# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 19.11.2026, 07:35:09
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (44)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 30.9 s (1092 przetworzonych klatek, 1032 analizowanych)
- **Średni FPS:** **37.8 FPS** (średni czas klatki: 26.48 ms)
- **1% Low FPS:** **18.3 FPS** (99. percentyl czasu klatki: 54.6 ms)
- **Maksymalny czas wykonania klatki (exec):** 39.9 ms
- **Maksymalny odstęp między klatkami (dt):** 75 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 43
- **Średnie Draw Calls / klatkę (GPU):** **800** (fill: 262, stroke: 443, drawImage: 95, arc: 146, quadraticCurveTo: 348, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1277**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 43 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 1 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=28.8ms, exec=6.7ms (klatka 81)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 81 (dt=28.8ms, wykonanie=6.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=30.6ms, exec=8.0ms (wystąpiło 2 razy, klatki 92-102, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 102 (dt=29.3ms, wykonanie=11.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=41.3ms, exec=6.7ms (klatka 113)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 113 (dt=41.3ms, wykonanie=6.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=28.2ms, exec=13.8ms (klatka 133)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 133 (dt=28.2ms, wykonanie=13.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=42.1ms, exec=12.6ms (wystąpiło 2 razy, klatki 141-149, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 149 (dt=44.3ms, wykonanie=8.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=47.9ms, exec=8.0ms (klatka 162)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 162 (dt=47.9ms, wykonanie=8.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=48.3ms, exec=14.9ms (wystąpiło 7 razy, klatki 167-178, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 178 (dt=28.7ms, wykonanie=9.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=49.3ms, exec=9.3ms (wystąpiło 8 razy, klatki 180-192, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 192 (dt=49.3ms, wykonanie=12.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=47.7ms, exec=11.5ms (wystąpiło 4 razy, klatki 196-209, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 209 (dt=47.9ms, wykonanie=9.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=41.4ms, exec=14.8ms (wystąpiło 8 razy, klatki 212-224, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 224 (dt=54.5ms, wykonanie=20.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=47.8ms, exec=19.9ms (wystąpiło 8 razy, klatki 225-238, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 238 (dt=54.6ms, wykonanie=23.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=75.0ms, exec=21.7ms (wystąpiło 8 razy, klatki 240-252, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 252 (dt=43.5ms, wykonanie=22.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=43.5ms, exec=27.9ms (wystąpiło 10 razy, klatki 255-269, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 269 (dt=54.6ms, wykonanie=14.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=10.0ms (wystąpiło 7 razy, klatki 272-284, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 284 (dt=48.1ms, wykonanie=12.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=43.3ms, exec=9.6ms (wystąpiło 4 razy, klatki 286-296, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 296 (dt=50.3ms, wykonanie=9.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1277 > 1275 (klatka 288)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 288: totalDrawCalls=1277 (fill=503, stroke=656, drawImage=118, arc=315, quadraticCurveTo=659). Arena: ARENA_3.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=50.0ms, exec=7.1ms (wystąpiło 2 razy, klatki 318-327, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 327 (dt=30.2ms, wykonanie=7.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=50.3ms, exec=8.1ms (wystąpiło 4 razy, klatki 339-344, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 344 (dt=41.9ms, wykonanie=6.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=30.1ms, exec=8.4ms (wystąpiło 2 razy, klatki 352-355, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 355 (dt=45.9ms, wykonanie=8.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=41.5ms, exec=14.8ms (wystąpiło 6 razy, klatki 361-373, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 373 (dt=47.6ms, wykonanie=26.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=44.9ms, exec=18.3ms (wystąpiło 7 razy, klatki 375-384, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 384 (dt=42.7ms, wykonanie=11.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=42.4ms, exec=13.7ms (wystąpiło 9 razy, klatki 392-404, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 404 (dt=54.6ms, wykonanie=17.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=48.8ms, exec=17.0ms (wystąpiło 5 razy, klatki 406-418, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 418 (dt=48.2ms, wykonanie=11.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=68.1ms, exec=15.3ms (wystąpiło 6 razy, klatki 421-434, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 434 (dt=43.3ms, wykonanie=18.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 25. [FRAME_STUTTER] Przycięcie klatki: dt=48.7ms, exec=15.3ms (wystąpiło 5 razy, klatki 437-446, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 446 (dt=47.5ms, wykonanie=13.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 26. [FRAME_STUTTER] Przycięcie klatki: dt=48.3ms, exec=13.8ms (wystąpiło 4 razy, klatki 450-462, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 462 (dt=30.0ms, wykonanie=10.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 27. [FRAME_STUTTER] Przycięcie klatki: dt=43.8ms, exec=11.9ms (wystąpiło 8 razy, klatki 465-475, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 475 (dt=48.5ms, wykonanie=11.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 2, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 28. [FRAME_STUTTER] Przycięcie klatki: dt=42.8ms, exec=11.1ms (wystąpiło 3 razy, klatki 480-488, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 488 (dt=48.4ms, wykonanie=15.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 29. [FRAME_STUTTER] Przycięcie klatki: dt=28.4ms, exec=8.9ms (wystąpiło 3 razy, klatki 542-549, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 549 (dt=28.8ms, wykonanie=11.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 30. [FRAME_STUTTER] Przycięcie klatki: dt=30.5ms, exec=5.0ms (wystąpiło 4 razy, klatki 573-580, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 580 (dt=75.0ms, wykonanie=8.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 31. [FRAME_STUTTER] Przycięcie klatki: dt=28.1ms, exec=6.2ms (klatka 588)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 588 (dt=28.1ms, wykonanie=6.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 32. [FRAME_STUTTER] Przycięcie klatki: dt=28.1ms, exec=5.4ms (klatka 602)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 602 (dt=28.1ms, wykonanie=5.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 33. [FRAME_STUTTER] Przycięcie klatki: dt=30.7ms, exec=6.5ms (klatka 644)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 644 (dt=30.7ms, wykonanie=6.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 34. [FRAME_STUTTER] Przycięcie klatki: dt=30.6ms, exec=7.1ms (wystąpiło 2 razy, klatki 676-679, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 679 (dt=30.2ms, wykonanie=10.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 35. [FRAME_STUTTER] Przycięcie klatki: dt=31.1ms, exec=7.8ms (klatka 695)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 695 (dt=31.1ms, wykonanie=7.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 36. [FRAME_STUTTER] Przycięcie klatki: dt=31.1ms, exec=6.2ms (wystąpiło 2 razy, klatki 737-746, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 746 (dt=28.3ms, wykonanie=5.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 37. [FRAME_STUTTER] Przycięcie klatki: dt=28.2ms, exec=7.1ms (klatka 784)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 784 (dt=28.2ms, wykonanie=7.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 38. [FRAME_STUTTER] Przycięcie klatki: dt=30.4ms, exec=5.6ms (klatka 836)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 836 (dt=30.4ms, wykonanie=5.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 39. [FRAME_STUTTER] Przycięcie klatki: dt=29.6ms, exec=5.4ms (wystąpiło 2 razy, klatki 901-913, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 913 (dt=30.8ms, wykonanie=4.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 40. [FRAME_STUTTER] Przycięcie klatki: dt=31.2ms, exec=4.9ms (klatka 951)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 951 (dt=31.2ms, wykonanie=4.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 41. [FRAME_STUTTER] Przycięcie klatki: dt=30.4ms, exec=4.0ms (klatka 1008)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1008 (dt=30.4ms, wykonanie=4.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 42. [FRAME_STUTTER] Przycięcie klatki: dt=28.7ms, exec=6.2ms (klatka 1058)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1058 (dt=28.7ms, wykonanie=6.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 43. [FRAME_STUTTER] Przycięcie klatki: dt=28.4ms, exec=9.8ms (klatka 1068)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1068 (dt=28.4ms, wykonanie=9.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 44. [FRAME_STUTTER] Przycięcie klatki: dt=28.5ms, exec=6.5ms (klatka 1084)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1084 (dt=28.5ms, wykonanie=6.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
