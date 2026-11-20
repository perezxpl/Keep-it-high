# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 20.11.2026, 20:39:19
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (28)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 15.4 s (725 przetworzonych klatek, 665 analizowanych)
- **Średni FPS:** **53.2 FPS** (średni czas klatki: 18.79 ms)
- **1% Low FPS:** **27.8 FPS** (99. percentyl czasu klatki: 36 ms)
- **Maksymalny czas wykonania klatki (exec):** 16.7 ms
- **Maksymalny odstęp między klatkami (dt):** 69.8 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 26
- **Średnie Draw Calls / klatkę (GPU):** **1078** (fill: 375, stroke: 593, drawImage: 110, arc: 180, quadraticCurveTo: 595, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1283**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 26 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 2 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.6ms (klatka 251)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 251 (dt=36.0ms, wykonanie=9.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.9ms (klatka 267)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 267 (dt=36.0ms, wykonanie=8.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=16.7ms (klatka 281)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 281 (dt=35.5ms, wykonanie=16.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.3ms (wystąpiło 4 razy, klatki 288-299, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 299 (dt=35.8ms, wykonanie=7.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=34.9ms, exec=7.1ms (wystąpiło 2 razy, klatki 305-307, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 307 (dt=36.1ms, wykonanie=6.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.3ms (wystąpiło 4 razy, klatki 315-328, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 328 (dt=35.6ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=6.7ms (wystąpiło 4 razy, klatki 331-343, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 343 (dt=35.7ms, wykonanie=8.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.2ms (wystąpiło 4 razy, klatki 345-355, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 355 (dt=35.6ms, wykonanie=6.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=35.8ms, exec=7.3ms (wystąpiło 2 razy, klatki 362-367, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 367 (dt=35.1ms, wykonanie=5.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=5.7ms (wystąpiło 4 razy, klatki 375-387, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 387 (dt=35.8ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=10.2ms (wystąpiło 3 razy, klatki 394-403, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 403 (dt=35.9ms, wykonanie=10.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.1ms (wystąpiło 6 razy, klatki 407-418, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 418 (dt=36.0ms, wykonanie=8.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1281 > 1275 (wystąpiło 2 razy, klatki 411-412, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 412: totalDrawCalls=1280 (fill=481, stroke=682, drawImage=117, arc=289, quadraticCurveTo=663). Arena: ARENA_3.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.9ms (wystąpiło 4 razy, klatki 422-433, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 433 (dt=36.1ms, wykonanie=8.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=8.2ms (wystąpiło 3 razy, klatki 437-445, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 445 (dt=35.5ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=9.0ms (klatka 450)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 450 (dt=35.1ms, wykonanie=9.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=7.1ms (wystąpiło 2 razy, klatki 562-563, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 563 (dt=69.8ms, wykonanie=10.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=8.9ms (klatka 594)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 594 (dt=35.6ms, wykonanie=8.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=35.0ms, exec=8.8ms (wystąpiło 2 razy, klatki 600-604, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 604 (dt=35.5ms, wykonanie=6.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.9ms (wystąpiło 4 razy, klatki 620-629, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 629 (dt=35.8ms, wykonanie=9.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=7.2ms (wystąpiło 2 razy, klatki 633-637, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 637 (dt=35.1ms, wykonanie=8.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=8.2ms (klatka 647)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 647 (dt=35.5ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=34.4ms, exec=8.9ms (wystąpiło 2 razy, klatki 664-671, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 671 (dt=35.6ms, wykonanie=6.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.4ms (klatka 675)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 675 (dt=36.0ms, wykonanie=6.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 25. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1283 > 1275 (wystąpiło 5 razy, klatki 683-687, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 687: totalDrawCalls=1280 (fill=478, stroke=682, drawImage=120, arc=252, quadraticCurveTo=665). Arena: ARENA_3.

### 26. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.1ms (wystąpiło 2 razy, klatki 697-698, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 698 (dt=35.9ms, wykonanie=6.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 27. [FRAME_STUTTER] Przycięcie klatki: dt=34.7ms, exec=8.4ms (wystąpiło 3 razy, klatki 708-714, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 714 (dt=35.5ms, wykonanie=9.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 28. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=9.3ms (klatka 725)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 725 (dt=36.1ms, wykonanie=9.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
