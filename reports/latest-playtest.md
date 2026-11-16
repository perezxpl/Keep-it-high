# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 16.11.2026, 13:34:20
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (34)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.5 s (661 przetworzonych klatek, 601 analizowanych)
- **Średni FPS:** **36.3 FPS** (średni czas klatki: 27.52 ms)
- **1% Low FPS:** **20.3 FPS** (99. percentyl czasu klatki: 49.3 ms)
- **Maksymalny czas wykonania klatki (exec):** 21.7 ms
- **Maksymalny odstęp między klatkami (dt):** 72.6 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 34
- **Średnie Draw Calls / klatkę (GPU):** **909** (fill: 280, stroke: 518, drawImage: 111, arc: 187, quadraticCurveTo: 478, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1168**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 34 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 0 | OK |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=47.2ms, exec=9.6ms (klatka 71)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 71 (dt=47.2ms, wykonanie=9.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=44.2ms, exec=9.6ms (klatka 85)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 85 (dt=44.2ms, wykonanie=9.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=48.4ms, exec=8.6ms (wystąpiło 4 razy, klatki 95-102, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 102 (dt=48.2ms, wykonanie=8.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=11.1ms (klatka 131)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 131 (dt=48.2ms, wykonanie=11.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=47.1ms, exec=7.5ms (wystąpiło 3 razy, klatki 138-148, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 148 (dt=48.1ms, wykonanie=13.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=48.0ms, exec=11.0ms (wystąpiło 3 razy, klatki 151-163, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 163 (dt=46.5ms, wykonanie=17.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=48.3ms, exec=17.2ms (wystąpiło 3 razy, klatki 165-170, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 170 (dt=47.9ms, wykonanie=10.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=48.0ms, exec=10.9ms (wystąpiło 3 razy, klatki 182-190, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 190 (dt=48.0ms, wykonanie=7.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=48.9ms, exec=12.3ms (wystąpiło 3 razy, klatki 197-206, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 206 (dt=48.7ms, wykonanie=8.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=43.7ms, exec=10.0ms (wystąpiło 8 razy, klatki 210-224, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 224 (dt=44.5ms, wykonanie=11.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=47.0ms, exec=9.5ms (wystąpiło 8 razy, klatki 225-239, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 239 (dt=36.3ms, wykonanie=21.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=14.6ms (wystąpiło 9 razy, klatki 240-254, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 254 (dt=48.1ms, wykonanie=11.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=47.0ms, exec=15.8ms (wystąpiło 7 razy, klatki 257-269, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 269 (dt=72.6ms, wykonanie=18.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=18.6ms (wystąpiło 7 razy, klatki 273-284, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 284 (dt=43.8ms, wykonanie=12.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=9.3ms (wystąpiło 3 razy, klatki 285-289, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 289 (dt=48.0ms, wykonanie=18.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=6.8ms (klatka 343)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 343 (dt=48.2ms, wykonanie=6.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=42.6ms, exec=8.7ms (klatka 355)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 355 (dt=42.6ms, wykonanie=8.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=48.6ms, exec=9.7ms (klatka 386)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 386 (dt=48.6ms, wykonanie=9.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=41.4ms, exec=7.0ms (klatka 391)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 391 (dt=41.4ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=43.0ms, exec=6.2ms (klatka 406)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 406 (dt=43.0ms, wykonanie=6.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=45.6ms, exec=9.3ms (wystąpiło 2 razy, klatki 476-479, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 479 (dt=48.8ms, wykonanie=9.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=48.6ms, exec=14.3ms (klatka 483)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 483 (dt=48.6ms, wykonanie=14.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=42.2ms, exec=9.1ms (wystąpiło 2 razy, klatki 497-506, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 506 (dt=48.6ms, wykonanie=15.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=43.6ms, exec=8.9ms (klatka 523)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 523 (dt=43.6ms, wykonanie=8.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 25. [FRAME_STUTTER] Przycięcie klatki: dt=29.2ms, exec=9.0ms (klatka 532)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 532 (dt=29.2ms, wykonanie=9.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 26. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=19.9ms (wystąpiło 2 razy, klatki 540-547, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 547 (dt=42.5ms, wykonanie=8.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 27. [FRAME_STUTTER] Przycięcie klatki: dt=48.5ms, exec=8.2ms (klatka 569)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 569 (dt=48.5ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 28. [FRAME_STUTTER] Przycięcie klatki: dt=65.3ms, exec=6.4ms (klatka 571)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 571 (dt=65.3ms, wykonanie=6.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 29. [FRAME_STUTTER] Przycięcie klatki: dt=55.3ms, exec=12.6ms (wystąpiło 2 razy, klatki 595-598, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 598 (dt=48.3ms, wykonanie=11.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 30. [FRAME_STUTTER] Przycięcie klatki: dt=50.4ms, exec=14.7ms (wystąpiło 4 razy, klatki 600-614, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 614 (dt=48.6ms, wykonanie=11.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 31. [FRAME_STUTTER] Przycięcie klatki: dt=48.5ms, exec=12.6ms (wystąpiło 3 razy, klatki 623-629, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 629 (dt=48.4ms, wykonanie=7.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 32. [FRAME_STUTTER] Przycięcie klatki: dt=48.5ms, exec=15.5ms (wystąpiło 5 razy, klatki 631-644, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 644 (dt=48.5ms, wykonanie=17.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 33. [FRAME_STUTTER] Przycięcie klatki: dt=48.5ms, exec=11.4ms (wystąpiło 3 razy, klatki 650-656, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 656 (dt=48.7ms, wykonanie=10.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 34. [FRAME_STUTTER] Przycięcie klatki: dt=42.4ms, exec=10.5ms (klatka 661)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 661 (dt=42.4ms, wykonanie=10.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
