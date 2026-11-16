# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 16.11.2026, 09:41:22
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (48)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 30.8 s (774 przetworzonych klatek, 714 analizowanych)
- **Średni FPS:** **27.4 FPS** (średni czas klatki: 36.44 ms)
- **1% Low FPS:** **13.9 FPS** (99. percentyl czasu klatki: 72.1 ms)
- **Maksymalny czas wykonania klatki (exec):** 40.4 ms
- **Maksymalny odstęp między klatkami (dt):** 75 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 48
- **Średnie Draw Calls / klatkę (GPU):** **2577** (fill: 611, stroke: 1008, drawImage: 57, arc: 339, quadraticCurveTo: 562, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **3672**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 48 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=48.0ms, exec=11.7ms (wystąpiło 8 razy, klatki 62-73, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 73 (dt=48.1ms, wykonanie=8.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=48.0ms, exec=10.7ms (wystąpiło 10 razy, klatki 75-89, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 89 (dt=48.6ms, wykonanie=10.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=9.6ms (wystąpiło 6 razy, klatki 91-104, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 104 (dt=51.3ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=7.1ms (wystąpiło 9 razy, klatki 106-118, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 118 (dt=49.0ms, wykonanie=17.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=24.2ms, exec=33.9ms (wystąpiło 10 razy, klatki 120-134, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 134 (dt=31.3ms, wykonanie=9.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=12.7ms (wystąpiło 9 razy, klatki 137-149, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 149 (dt=47.0ms, wykonanie=20.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=64.0ms, exec=20.0ms (wystąpiło 13 razy, klatki 150-164, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 164 (dt=41.8ms, wykonanie=12.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=60.7ms, exec=10.5ms (wystąpiło 11 razy, klatki 166-179, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 179 (dt=48.4ms, wykonanie=13.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=54.8ms, exec=14.8ms (wystąpiło 8 razy, klatki 181-194, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 194 (dt=48.2ms, wykonanie=10.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=48.3ms, exec=10.2ms (wystąpiło 7 razy, klatki 197-208, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 208 (dt=48.2ms, wykonanie=8.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=48.3ms, exec=13.3ms (wystąpiło 9 razy, klatki 211-224, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 224 (dt=48.2ms, wykonanie=8.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=10.2ms (wystąpiło 7 razy, klatki 228-238, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 238 (dt=48.2ms, wykonanie=10.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=48.0ms, exec=9.4ms (wystąpiło 9 razy, klatki 240-254, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 254 (dt=47.9ms, wykonanie=11.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=17.0ms (wystąpiło 11 razy, klatki 255-268, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 268 (dt=48.0ms, wykonanie=10.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=47.3ms, exec=14.8ms (wystąpiło 8 razy, klatki 270-282, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 282 (dt=48.1ms, wykonanie=20.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=12.1ms (wystąpiło 9 razy, klatki 285-298, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 298 (dt=49.8ms, wykonanie=9.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=11.2ms (wystąpiło 7 razy, klatki 301-313, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 313 (dt=48.9ms, wykonanie=9.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=48.0ms, exec=12.4ms (wystąpiło 5 razy, klatki 315-322, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 322 (dt=31.1ms, wykonanie=18.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=14.1ms (klatka 337)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 337 (dt=48.1ms, wykonanie=14.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=40.1ms, exec=17.0ms (wystąpiło 3 razy, klatki 355-358, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 358 (dt=50.6ms, wykonanie=10.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=30.7ms, exec=11.6ms (wystąpiło 7 razy, klatki 360-373, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 373 (dt=48.1ms, wykonanie=10.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=49.0ms, exec=10.7ms (wystąpiło 6 razy, klatki 375-389, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 389 (dt=48.2ms, wykonanie=13.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=13.1ms (wystąpiło 3 razy, klatki 393-402, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 402 (dt=48.3ms, wykonanie=8.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=47.5ms, exec=11.6ms (wystąpiło 5 razy, klatki 408-419, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 419 (dt=42.8ms, wykonanie=16.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 25. [FRAME_STUTTER] Przycięcie klatki: dt=48.0ms, exec=11.8ms (wystąpiło 5 razy, klatki 420-433, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 433 (dt=48.3ms, wykonanie=15.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 26. [FRAME_STUTTER] Przycięcie klatki: dt=48.4ms, exec=9.4ms (wystąpiło 4 razy, klatki 437-447, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 447 (dt=48.6ms, wykonanie=11.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 27. [FRAME_STUTTER] Przycięcie klatki: dt=44.7ms, exec=13.2ms (wystąpiło 5 razy, klatki 451-462, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 462 (dt=48.1ms, wykonanie=11.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 28. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=8.2ms (wystąpiło 2 razy, klatki 469-479, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 479 (dt=48.1ms, wykonanie=12.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 29. [FRAME_STUTTER] Przycięcie klatki: dt=28.3ms, exec=7.7ms (wystąpiło 4 razy, klatki 482-493, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 493 (dt=49.1ms, wykonanie=13.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 30. [FRAME_STUTTER] Przycięcie klatki: dt=48.0ms, exec=16.4ms (wystąpiło 7 razy, klatki 496-508, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 508 (dt=48.2ms, wykonanie=11.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 31. [FRAME_STUTTER] Przycięcie klatki: dt=48.4ms, exec=18.4ms (wystąpiło 6 razy, klatki 510-521, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 521 (dt=48.1ms, wykonanie=11.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 32. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=17.5ms (wystąpiło 5 razy, klatki 526-537, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 537 (dt=48.7ms, wykonanie=12.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 33. [FRAME_STUTTER] Przycięcie klatki: dt=48.4ms, exec=13.5ms (wystąpiło 4 razy, klatki 543-553, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 553 (dt=42.7ms, wykonanie=9.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 34. [FRAME_STUTTER] Przycięcie klatki: dt=48.0ms, exec=14.5ms (wystąpiło 4 razy, klatki 562-569, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 569 (dt=47.1ms, wykonanie=14.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 35. [FRAME_STUTTER] Przycięcie klatki: dt=44.4ms, exec=9.3ms (wystąpiło 9 razy, klatki 570-584, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 584 (dt=48.0ms, wykonanie=9.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 36. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=14.5ms (wystąpiło 9 razy, klatki 586-598, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 598 (dt=48.3ms, wykonanie=9.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 37. [FRAME_STUTTER] Przycięcie klatki: dt=49.1ms, exec=8.2ms (wystąpiło 10 razy, klatki 601-614, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 614 (dt=48.5ms, wykonanie=10.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 38. [FRAME_STUTTER] Przycięcie klatki: dt=51.3ms, exec=11.7ms (wystąpiło 10 razy, klatki 616-629, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 629 (dt=48.0ms, wykonanie=7.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 39. [FRAME_STUTTER] Przycięcie klatki: dt=47.7ms, exec=12.7ms (wystąpiło 9 razy, klatki 631-643, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 643 (dt=47.3ms, wykonanie=9.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 40. [FRAME_STUTTER] Przycięcie klatki: dt=43.9ms, exec=8.9ms (wystąpiło 5 razy, klatki 646-657, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 657 (dt=48.2ms, wykonanie=12.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 41. [FRAME_STUTTER] Przycięcie klatki: dt=49.0ms, exec=9.7ms (wystąpiło 7 razy, klatki 660-672, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 672 (dt=31.6ms, wykonanie=21.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 42. [FRAME_STUTTER] Przycięcie klatki: dt=48.6ms, exec=18.9ms (wystąpiło 11 razy, klatki 675-689, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 689 (dt=51.8ms, wykonanie=16.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 43. [FRAME_STUTTER] Przycięcie klatki: dt=42.5ms, exec=19.0ms (wystąpiło 12 razy, klatki 690-704, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 704 (dt=48.1ms, wykonanie=15.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 44. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=10.9ms (wystąpiło 11 razy, klatki 705-719, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 719 (dt=49.2ms, wykonanie=15.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 45. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=15.4ms (wystąpiło 13 razy, klatki 720-734, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 734 (dt=48.8ms, wykonanie=13.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 46. [FRAME_STUTTER] Przycięcie klatki: dt=50.4ms, exec=24.4ms (wystąpiło 14 razy, klatki 735-749, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 749 (dt=48.0ms, wykonanie=13.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 47. [FRAME_STUTTER] Przycięcie klatki: dt=48.4ms, exec=14.1ms (wystąpiło 14 razy, klatki 750-763, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 763 (dt=47.9ms, wykonanie=14.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 48. [FRAME_STUTTER] Przycięcie klatki: dt=75.0ms, exec=18.8ms (wystąpiło 8 razy, klatki 765-774, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 774 (dt=72.9ms, wykonanie=17.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
