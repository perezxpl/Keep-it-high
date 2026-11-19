# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 19.11.2026, 13:32:29
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (29)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.6 s (712 przetworzonych klatek, 652 analizowanych)
- **Średni FPS:** **38.1 FPS** (średni czas klatki: 26.21 ms)
- **1% Low FPS:** **18.8 FPS** (99. percentyl czasu klatki: 53.3 ms)
- **Maksymalny czas wykonania klatki (exec):** 28.7 ms
- **Maksymalny odstęp między klatkami (dt):** 75 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 27
- **Średnie Draw Calls / klatkę (GPU):** **1007** (fill: 336, stroke: 565, drawImage: 107, arc: 165, quadraticCurveTo: 531, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1330**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 27 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 2 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=21.8ms, exec=28.7ms (wystąpiło 2 razy, klatki 75-76, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 76 (dt=43.7ms, wykonanie=11.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=30.0ms, exec=7.5ms (wystąpiło 2 razy, klatki 138-148, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 148 (dt=67.9ms, wykonanie=15.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=28.6ms, exec=11.5ms (klatka 156)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 156 (dt=28.6ms, wykonanie=11.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=31.3ms, exec=8.6ms (wystąpiło 2 razy, klatki 175-179, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 179 (dt=63.5ms, wykonanie=14.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=75.0ms, exec=12.2ms (wystąpiło 5 razy, klatki 181-194, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 194 (dt=46.4ms, wykonanie=13.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=29.5ms, exec=11.1ms (wystąpiło 4 razy, klatki 197-206, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 206 (dt=43.6ms, wykonanie=7.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=48.8ms, exec=12.4ms (wystąpiło 10 razy, klatki 211-223, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 223 (dt=48.0ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=41.9ms, exec=9.9ms (wystąpiło 8 razy, klatki 225-237, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 237 (dt=48.8ms, wykonanie=9.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=48.8ms, exec=9.5ms (wystąpiło 6 razy, klatki 241-253, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 253 (dt=51.1ms, wykonanie=13.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1320 > 1275 (wystąpiło 23 razy, klatki 247-269, trwanie: 23 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 269: totalDrawCalls=1312 (fill=513, stroke=704, drawImage=95, arc=329, quadraticCurveTo=656). Arena: ARENA_3.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=14.7ms (wystąpiło 9 razy, klatki 255-268, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 268 (dt=50.6ms, wykonanie=16.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1312 > 1275 (wystąpiło 7 razy, klatki 270-276, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 276: totalDrawCalls=1307 (fill=510, stroke=702, drawImage=95, arc=337, quadraticCurveTo=654). Arena: ARENA_3.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=45.2ms, exec=18.8ms (wystąpiło 5 razy, klatki 270-278, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 278 (dt=46.8ms, wykonanie=12.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=43.9ms, exec=13.5ms (wystąpiło 2 razy, klatki 286-298, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 298 (dt=49.9ms, wykonanie=9.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=28.1ms, exec=9.7ms (klatka 370)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 370 (dt=28.1ms, wykonanie=9.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=44.3ms, exec=10.4ms (wystąpiło 4 razy, klatki 375-383, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 383 (dt=41.1ms, wykonanie=8.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=42.2ms, exec=11.8ms (wystąpiło 3 razy, klatki 391-402, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 402 (dt=52.4ms, wykonanie=9.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=30.2ms, exec=10.2ms (wystąpiło 2 razy, klatki 412-414, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 414 (dt=48.3ms, wykonanie=7.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=36.2ms, exec=7.4ms (wystąpiło 2 razy, klatki 421-432, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 432 (dt=44.1ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=11.3ms (wystąpiło 4 razy, klatki 442-446, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 446 (dt=39.2ms, wykonanie=13.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=8.1ms (wystąpiło 5 razy, klatki 450-462, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 462 (dt=49.1ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=49.6ms, exec=9.0ms (wystąpiło 2 razy, klatki 467-477, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 477 (dt=43.9ms, wykonanie=10.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=49.0ms, exec=10.1ms (wystąpiło 4 razy, klatki 481-491, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 491 (dt=49.9ms, wykonanie=10.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=44.3ms, exec=13.4ms (wystąpiło 6 razy, klatki 495-505, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 505 (dt=49.9ms, wykonanie=9.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 25. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=7.7ms (wystąpiło 3 razy, klatki 517-522, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 522 (dt=42.0ms, wykonanie=8.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 26. [FRAME_STUTTER] Przycięcie klatki: dt=42.3ms, exec=7.0ms (klatka 527)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 527 (dt=42.3ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 27. [FRAME_STUTTER] Przycięcie klatki: dt=47.6ms, exec=10.9ms (klatka 609)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 609 (dt=47.6ms, wykonanie=10.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 28. [FRAME_STUTTER] Przycięcie klatki: dt=29.5ms, exec=8.5ms (klatka 662)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 662 (dt=29.5ms, wykonanie=8.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 29. [FRAME_STUTTER] Przycięcie klatki: dt=51.1ms, exec=8.7ms (klatka 689)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 689 (dt=51.1ms, wykonanie=8.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
