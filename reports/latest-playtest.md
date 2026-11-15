# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 15.11.2026, 22:54:40
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (74)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 30.6 s (1231 przetworzonych klatek, 1171 analizowanych)
- **Średni FPS:** **42.2 FPS** (średni czas klatki: 23.68 ms)
- **1% Low FPS:** **18.9 FPS** (99. percentyl czasu klatki: 53 ms)
- **Maksymalny czas wykonania klatki (exec):** 17.7 ms
- **Maksymalny odstęp między klatkami (dt):** 72.1 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 74

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 74 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.6ms (wystąpiło 2 razy, klatki 66-71, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 71 (dt=36.1ms, wykonanie=5.3ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=4.5ms (wystąpiło 3 razy, klatki 77-87, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 87 (dt=36.0ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=34.7ms, exec=5.7ms (wystąpiło 3 razy, klatki 90-100, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 100 (dt=35.5ms, wykonanie=4.5ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=6.2ms (wystąpiło 4 razy, klatki 108-116, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 116 (dt=36.0ms, wykonanie=6.6ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=4.5ms (wystąpiło 3 razy, klatki 120-133, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 133 (dt=35.9ms, wykonanie=4.6ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=4.5ms (wystąpiło 3 razy, klatki 139-148, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 148 (dt=36.0ms, wykonanie=5.5ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=14.9ms (wystąpiło 7 razy, klatki 151-163, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 163 (dt=36.0ms, wykonanie=9.1ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=35.8ms, exec=4.9ms (wystąpiło 5 razy, klatki 165-177, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 177 (dt=53.0ms, wykonanie=6.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=7.1ms (wystąpiło 7 razy, klatki 180-192, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 192 (dt=35.4ms, wykonanie=5.8ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.8ms (wystąpiło 6 razy, klatki 195-207, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 207 (dt=36.1ms, wykonanie=8.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.6ms (wystąpiło 7 razy, klatki 210-224, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 224 (dt=36.1ms, wykonanie=9.4ms > limit 28ms). Arena: ARENA_5, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 16, wybuchy linii: 0.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=8.1ms (wystąpiło 2 razy, klatki 226-233, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 233 (dt=35.5ms, wykonanie=5.3ms > limit 28ms). Arena: ARENA_5, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.9ms (klatka 253)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 253 (dt=36.0ms, wykonanie=6.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=35.4ms, exec=9.0ms (wystąpiło 3 razy, klatki 257-265, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 265 (dt=35.8ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_5, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=36.2ms, exec=5.3ms (wystąpiło 4 razy, klatki 270-284, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 284 (dt=36.0ms, wykonanie=8.3ms > limit 28ms). Arena: ARENA_5, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 1, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=6.8ms (wystąpiło 3 razy, klatki 292-299, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 299 (dt=36.1ms, wykonanie=6.3ms > limit 28ms). Arena: ARENA_5, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 1, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=6.8ms (klatka 308)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 308 (dt=35.6ms, wykonanie=6.8ms > limit 28ms). Arena: ARENA_5, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=5.0ms (wystąpiło 2 razy, klatki 320-329, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 329 (dt=35.3ms, wykonanie=6.1ms > limit 28ms). Arena: ARENA_5, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 4, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=7.5ms (wystąpiło 2 razy, klatki 338-344, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 344 (dt=36.0ms, wykonanie=7.1ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 1, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=54.1ms, exec=7.0ms (wystąpiło 4 razy, klatki 349-357, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 357 (dt=35.9ms, wykonanie=6.2ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.4ms (wystąpiło 5 razy, klatki 360-372, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 372 (dt=35.0ms, wykonanie=7.8ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=7.6ms (wystąpiło 8 razy, klatki 375-389, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 389 (dt=53.4ms, wykonanie=14.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=34.5ms, exec=5.6ms (wystąpiło 9 razy, klatki 390-404, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 404 (dt=36.0ms, wykonanie=9.3ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.4ms (wystąpiło 4 razy, klatki 407-415, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 415 (dt=35.5ms, wykonanie=6.3ms > limit 28ms). Arena: ARENA_5, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 7, wybuchy linii: 0.

### 25. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=7.0ms (klatka 423)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 423 (dt=35.5ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_5, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 7, wybuchy linii: 0.

### 26. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=5.7ms (klatka 438)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 438 (dt=36.0ms, wykonanie=5.7ms > limit 28ms). Arena: ARENA_5, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 27. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=6.3ms (klatka 451)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 451 (dt=35.5ms, wykonanie=6.3ms > limit 28ms). Arena: ARENA_5, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 28. [FRAME_STUTTER] Przycięcie klatki: dt=35.4ms, exec=6.7ms (wystąpiło 2 razy, klatki 466-475, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 475 (dt=35.5ms, wykonanie=5.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 29. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=4.5ms (klatka 507)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 507 (dt=35.9ms, wykonanie=4.5ms > limit 28ms). Arena: ARENA_5, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 30. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=6.1ms (wystąpiło 6 razy, klatki 556-566, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 566 (dt=36.0ms, wykonanie=5.6ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 3, wybuchy linii: 0.

### 31. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.1ms (wystąpiło 5 razy, klatki 571-582, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 582 (dt=35.6ms, wykonanie=7.8ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 32. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=6.9ms (wystąpiło 5 razy, klatki 586-598, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 598 (dt=36.0ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 33. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=8.5ms (wystąpiło 5 razy, klatki 601-613, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 613 (dt=36.0ms, wykonanie=5.6ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 34. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=7.0ms (wystąpiło 4 razy, klatki 617-627, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 627 (dt=35.4ms, wykonanie=5.8ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 35. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=6.3ms (wystąpiło 5 razy, klatki 630-643, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 643 (dt=35.9ms, wykonanie=7.6ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 36. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=5.4ms (wystąpiło 4 razy, klatki 647-657, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 657 (dt=36.0ms, wykonanie=5.1ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 37. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=5.7ms (wystąpiło 5 razy, klatki 661-673, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 673 (dt=35.1ms, wykonanie=5.1ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 38. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=6.3ms (wystąpiło 4 razy, klatki 675-688, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 688 (dt=35.4ms, wykonanie=7.7ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 4, wybuchy linii: 0.

### 39. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=7.0ms (wystąpiło 5 razy, klatki 690-701, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 701 (dt=35.9ms, wykonanie=5.0ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 40. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=7.7ms (wystąpiło 4 razy, klatki 705-717, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 717 (dt=36.2ms, wykonanie=7.1ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 41. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.5ms (wystąpiło 4 razy, klatki 722-733, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 733 (dt=35.1ms, wykonanie=5.4ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 42. [FRAME_STUTTER] Przycięcie klatki: dt=35.4ms, exec=7.1ms (wystąpiło 5 razy, klatki 735-749, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 749 (dt=35.0ms, wykonanie=6.6ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 43. [FRAME_STUTTER] Przycięcie klatki: dt=34.5ms, exec=6.7ms (wystąpiło 3 razy, klatki 753-760, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 760 (dt=35.1ms, wykonanie=5.1ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 44. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=5.9ms (wystąpiło 4 razy, klatki 765-777, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 777 (dt=35.8ms, wykonanie=5.4ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 45. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.0ms (wystąpiło 4 razy, klatki 782-794, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 794 (dt=36.0ms, wykonanie=5.4ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 46. [FRAME_STUTTER] Przycięcie klatki: dt=34.3ms, exec=5.4ms (wystąpiło 3 razy, klatki 797-805, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 805 (dt=36.1ms, wykonanie=4.7ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 47. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=4.9ms (wystąpiło 5 razy, klatki 810-824, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 824 (dt=36.1ms, wykonanie=6.2ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 48. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=5.8ms (wystąpiło 4 razy, klatki 827-837, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 837 (dt=35.6ms, wykonanie=5.4ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 49. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=6.6ms (wystąpiło 5 razy, klatki 840-853, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 853 (dt=36.0ms, wykonanie=5.6ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 50. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=5.2ms (wystąpiło 7 razy, klatki 856-869, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 869 (dt=35.6ms, wykonanie=6.3ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 51. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=5.2ms (wystąpiło 5 razy, klatki 873-883, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 883 (dt=35.9ms, wykonanie=5.4ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 52. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.0ms (wystąpiło 4 razy, klatki 887-898, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 898 (dt=35.9ms, wykonanie=5.4ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 53. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=6.9ms (wystąpiło 6 razy, klatki 902-914, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 914 (dt=36.0ms, wykonanie=6.0ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 54. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.7ms (wystąpiło 8 razy, klatki 916-928, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 928 (dt=36.0ms, wykonanie=7.7ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 55. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=5.8ms (wystąpiło 8 razy, klatki 931-944, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 944 (dt=36.0ms, wykonanie=6.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 56. [FRAME_STUTTER] Przycięcie klatki: dt=54.0ms, exec=8.8ms (wystąpiło 9 razy, klatki 946-959, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 959 (dt=35.5ms, wykonanie=6.4ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 57. [FRAME_STUTTER] Przycięcie klatki: dt=35.8ms, exec=7.4ms (wystąpiło 8 razy, klatki 961-974, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 974 (dt=36.1ms, wykonanie=7.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 1, wybuchy linii: 0.

### 58. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=8.1ms (wystąpiło 9 razy, klatki 976-988, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 988 (dt=36.0ms, wykonanie=7.6ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 1, wybuchy linii: 0.

### 59. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=7.7ms (wystąpiło 11 razy, klatki 990-1003, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1003 (dt=36.0ms, wykonanie=5.2ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 60. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=7.2ms (wystąpiło 8 razy, klatki 1005-1018, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1018 (dt=35.9ms, wykonanie=7.8ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 61. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=7.8ms (wystąpiło 9 razy, klatki 1020-1033, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1033 (dt=36.1ms, wykonanie=5.8ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 62. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.7ms (wystąpiło 9 razy, klatki 1035-1048, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1048 (dt=35.7ms, wykonanie=6.8ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 63. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=6.0ms (wystąpiło 10 razy, klatki 1051-1064, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1064 (dt=34.8ms, wykonanie=8.3ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 64. [FRAME_STUTTER] Przycięcie klatki: dt=34.2ms, exec=6.0ms (wystąpiło 10 razy, klatki 1066-1079, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1079 (dt=35.9ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 65. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=6.1ms (wystąpiło 10 razy, klatki 1080-1093, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1093 (dt=36.1ms, wykonanie=7.6ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 66. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=7.8ms (wystąpiło 10 razy, klatki 1095-1109, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1109 (dt=35.5ms, wykonanie=6.7ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 67. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=6.7ms (wystąpiło 9 razy, klatki 1111-1123, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1123 (dt=36.0ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 68. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=6.7ms (wystąpiło 10 razy, klatki 1125-1139, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1139 (dt=35.9ms, wykonanie=6.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 69. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=7.4ms (wystąpiło 10 razy, klatki 1140-1153, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1153 (dt=36.2ms, wykonanie=7.8ms > limit 28ms). Arena: ARENA_5, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 1, wybuchy linii: 0.

### 70. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.5ms (wystąpiło 10 razy, klatki 1155-1168, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1168 (dt=35.9ms, wykonanie=5.4ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 71. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=7.2ms (wystąpiło 9 razy, klatki 1170-1183, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1183 (dt=35.6ms, wykonanie=5.0ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 72. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=5.6ms (wystąpiło 9 razy, klatki 1185-1198, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1198 (dt=35.5ms, wykonanie=6.0ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 73. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=5.4ms (wystąpiło 9 razy, klatki 1200-1214, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1214 (dt=35.1ms, wykonanie=5.4ms > limit 28ms). Arena: ARENA_5, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 74. [FRAME_STUTTER] Przycięcie klatki: dt=35.0ms, exec=6.7ms (wystąpiło 7 razy, klatki 1216-1229, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1229 (dt=34.3ms, wykonanie=4.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
