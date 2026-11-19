# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 19.11.2026, 09:31:12
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (44)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 30.9 s (1163 przetworzonych klatek, 1103 analizowanych)
- **Średni FPS:** **40.6 FPS** (średni czas klatki: 24.61 ms)
- **1% Low FPS:** **19.5 FPS** (99. percentyl czasu klatki: 51.4 ms)
- **Maksymalny czas wykonania klatki (exec):** 54.2 ms
- **Maksymalny odstęp między klatkami (dt):** 75 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 44
- **Średnie Draw Calls / klatkę (GPU):** **682** (fill: 203, stroke: 394, drawImage: 86, arc: 121, quadraticCurveTo: 277, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1265**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 44 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 0 | OK |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=49.7ms, exec=9.0ms (klatka 76)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 76 (dt=49.7ms, wykonanie=9.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=24.7ms, exec=47.3ms (wystąpiło 2 razy, klatki 99-101, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 101 (dt=58.4ms, wykonanie=14.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=24.2ms, exec=54.2ms (wystąpiło 8 razy, klatki 150-164, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 164 (dt=48.2ms, wykonanie=19.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=44.1ms, exec=21.9ms (wystąpiło 9 razy, klatki 167-179, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 179 (dt=44.5ms, wykonanie=14.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=47.4ms, exec=15.6ms (wystąpiło 7 razy, klatki 182-194, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 194 (dt=36.9ms, wykonanie=11.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=38.2ms, exec=10.2ms (wystąpiło 6 razy, klatki 197-209, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 209 (dt=48.4ms, wykonanie=8.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=43.3ms, exec=13.7ms (wystąpiło 8 razy, klatki 214-224, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 224 (dt=51.4ms, wykonanie=13.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=48.0ms, exec=15.0ms (wystąpiło 9 razy, klatki 225-237, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 237 (dt=48.1ms, wykonanie=13.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=37.4ms, exec=10.6ms (wystąpiło 7 razy, klatki 240-253, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 253 (dt=37.5ms, wykonanie=14.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=48.3ms, exec=15.2ms (wystąpiło 5 razy, klatki 256-269, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 269 (dt=48.1ms, wykonanie=17.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=35.8ms, exec=13.4ms (wystąpiło 4 razy, klatki 270-280, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 280 (dt=29.0ms, wykonanie=9.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=30.1ms, exec=6.0ms (wystąpiło 2 razy, klatki 287-294, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 294 (dt=31.2ms, wykonanie=7.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=46.7ms, exec=7.3ms (klatka 312)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 312 (dt=46.7ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=41.5ms, exec=13.0ms (wystąpiło 2 razy, klatki 324-328, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 328 (dt=49.2ms, wykonanie=12.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=63.8ms, exec=9.2ms (wystąpiło 2 razy, klatki 332-334, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 334 (dt=28.9ms, wykonanie=7.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=31.5ms, exec=13.5ms (wystąpiło 4 razy, klatki 345-357, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 357 (dt=32.0ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=28.5ms, exec=10.7ms (wystąpiło 2 razy, klatki 386-387, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 387 (dt=31.0ms, wykonanie=11.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=28.6ms, exec=8.3ms (klatka 405)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 405 (dt=28.6ms, wykonanie=8.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=29.3ms, exec=10.3ms (wystąpiło 3 razy, klatki 421-432, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 432 (dt=30.9ms, wykonanie=5.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=30.0ms, exec=8.1ms (klatka 446)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 446 (dt=30.0ms, wykonanie=8.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=18.7ms, exec=49.6ms (wystąpiło 3 razy, klatki 528-533, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 533 (dt=28.3ms, wykonanie=5.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=29.7ms, exec=7.6ms (klatka 544)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 544 (dt=29.7ms, wykonanie=7.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=28.4ms, exec=9.0ms (wystąpiło 2 razy, klatki 562-569, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 569 (dt=30.7ms, wykonanie=5.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=28.2ms, exec=7.1ms (klatka 593)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 593 (dt=28.2ms, wykonanie=7.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 25. [FRAME_STUTTER] Przycięcie klatki: dt=29.3ms, exec=5.2ms (klatka 603)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 603 (dt=29.3ms, wykonanie=5.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 26. [FRAME_STUTTER] Przycięcie klatki: dt=28.1ms, exec=13.6ms (wystąpiło 2 razy, klatki 638-639, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 639 (dt=31.7ms, wykonanie=8.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 27. [FRAME_STUTTER] Przycięcie klatki: dt=29.2ms, exec=5.8ms (klatka 673)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 673 (dt=29.2ms, wykonanie=5.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 28. [FRAME_STUTTER] Przycięcie klatki: dt=29.7ms, exec=10.0ms (klatka 709)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 709 (dt=29.7ms, wykonanie=10.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 29. [FRAME_STUTTER] Przycięcie klatki: dt=28.8ms, exec=6.7ms (klatka 804)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 804 (dt=28.8ms, wykonanie=6.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 30. [FRAME_STUTTER] Przycięcie klatki: dt=30.1ms, exec=8.2ms (klatka 810)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 810 (dt=30.1ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 31. [FRAME_STUTTER] Przycięcie klatki: dt=28.1ms, exec=3.3ms (klatka 860)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 860 (dt=28.1ms, wykonanie=3.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 32. [FRAME_STUTTER] Przycięcie klatki: dt=73.2ms, exec=9.6ms (wystąpiło 3 razy, klatki 888-890, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 890 (dt=75.0ms, wykonanie=6.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 33. [FRAME_STUTTER] Przycięcie klatki: dt=44.1ms, exec=8.0ms (klatka 920)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 920 (dt=44.1ms, wykonanie=8.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 34. [FRAME_STUTTER] Przycięcie klatki: dt=28.2ms, exec=7.7ms (klatka 945)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 945 (dt=28.2ms, wykonanie=7.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 35. [FRAME_STUTTER] Przycięcie klatki: dt=61.5ms, exec=10.3ms (klatka 974)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 974 (dt=61.5ms, wykonanie=10.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 36. [FRAME_STUTTER] Przycięcie klatki: dt=71.0ms, exec=9.4ms (wystąpiło 2 razy, klatki 977-979, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 979 (dt=52.2ms, wykonanie=9.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 37. [FRAME_STUTTER] Przycięcie klatki: dt=42.1ms, exec=9.0ms (wystąpiło 4 razy, klatki 1007-1018, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1018 (dt=41.4ms, wykonanie=10.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 38. [FRAME_STUTTER] Przycięcie klatki: dt=43.4ms, exec=11.0ms (klatka 1053)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1053 (dt=43.4ms, wykonanie=11.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 39. [FRAME_STUTTER] Przycięcie klatki: dt=29.1ms, exec=7.4ms (klatka 1071)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1071 (dt=29.1ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 40. [FRAME_STUTTER] Przycięcie klatki: dt=28.5ms, exec=5.9ms (klatka 1089)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1089 (dt=28.5ms, wykonanie=5.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 41. [FRAME_STUTTER] Przycięcie klatki: dt=29.6ms, exec=4.6ms (klatka 1102)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1102 (dt=29.6ms, wykonanie=4.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 42. [FRAME_STUTTER] Przycięcie klatki: dt=29.5ms, exec=7.1ms (wystąpiło 2 razy, klatki 1126-1139, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1139 (dt=30.0ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 43. [FRAME_STUTTER] Przycięcie klatki: dt=31.1ms, exec=7.3ms (klatka 1140)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1140 (dt=31.1ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 44. [FRAME_STUTTER] Przycięcie klatki: dt=30.1ms, exec=13.9ms (klatka 1160)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1160 (dt=30.1ms, wykonanie=13.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
