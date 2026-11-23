# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 23.11.2026, 13:39:33
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (17)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.4 s (1052 przetworzonych klatek, 992 analizowanych)
- **Średni FPS:** **57.2 FPS** (średni czas klatki: 17.49 ms)
- **1% Low FPS:** **27.8 FPS** (99. percentyl czasu klatki: 36 ms)
- **Maksymalny czas wykonania klatki (exec):** 18.5 ms
- **Maksymalny odstęp między klatkami (dt):** 36.2 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 16
- **Średnie Draw Calls / klatkę (GPU):** **909** (fill: 322, stroke: 491, drawImage: 96, arc: 183, quadraticCurveTo: 423, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1364**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 16 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 1 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=18.3ms (klatka 112)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 112 (dt=36.1ms, wykonanie=18.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=35.8ms, exec=9.4ms (klatka 246)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 246 (dt=35.8ms, wykonanie=9.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=10.6ms (wystąpiło 3 razy, klatki 257-264, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 264 (dt=36.0ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1288 > 1275 (wystąpiło 20 razy, klatki 278-297, trwanie: 20 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 297: totalDrawCalls=1277 (fill=475, stroke=698, drawImage=104, arc=258, quadraticCurveTo=663). Arena: ARENA_3.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=10.2ms (wystąpiło 2 razy, klatki 278-284, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 284 (dt=35.8ms, wykonanie=9.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=7.5ms (wystąpiło 3 razy, klatki 287-295, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 295 (dt=35.8ms, wykonanie=12.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=10.3ms (wystąpiło 3 razy, klatki 304-312, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 312 (dt=35.6ms, wykonanie=7.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.4ms (klatka 324)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 324 (dt=36.0ms, wykonanie=8.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=35.4ms, exec=7.3ms (klatka 335)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 335 (dt=35.4ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=9.0ms (wystąpiło 3 razy, klatki 345-356, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 356 (dt=35.5ms, wykonanie=7.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=8.6ms (wystąpiło 4 razy, klatki 361-371, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 371 (dt=35.7ms, wykonanie=8.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=9.8ms (wystąpiło 3 razy, klatki 377-386, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 386 (dt=35.6ms, wykonanie=12.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.4ms (wystąpiło 3 razy, klatki 391-398, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 398 (dt=35.6ms, wykonanie=6.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=8.5ms (wystąpiło 2 razy, klatki 411-418, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 418 (dt=35.6ms, wykonanie=8.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=36.2ms, exec=10.8ms (wystąpiło 2 razy, klatki 424-425, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 425 (dt=34.9ms, wykonanie=13.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.9ms (klatka 440)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 440 (dt=36.0ms, wykonanie=6.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.7ms (wystąpiło 2 razy, klatki 590-592, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 592 (dt=35.1ms, wykonanie=6.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 7, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
