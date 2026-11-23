# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 23.11.2026, 10:03:53
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (23)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.5 s (1008 przetworzonych klatek, 948 analizowanych)
- **Średni FPS:** **55.3 FPS** (średni czas klatki: 18.09 ms)
- **1% Low FPS:** **27.8 FPS** (99. percentyl czasu klatki: 36 ms)
- **Maksymalny czas wykonania klatki (exec):** 36.1 ms
- **Maksymalny odstęp między klatkami (dt):** 36.1 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 21
- **Średnie Draw Calls / klatkę (GPU):** **1008** (fill: 354, stroke: 549, drawImage: 105, arc: 185, quadraticCurveTo: 515, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1314**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 21 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 2 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=16.7ms, exec=36.1ms (wystąpiło 2 razy, klatki 103-104, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 104 (dt=35.5ms, wykonanie=9.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=7.7ms (klatka 205)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 205 (dt=35.5ms, wykonanie=7.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=7.8ms (wystąpiło 2 razy, klatki 216-223, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 223 (dt=35.7ms, wykonanie=10.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=35.0ms, exec=12.2ms (wystąpiło 5 razy, klatki 225-236, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 236 (dt=36.0ms, wykonanie=6.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.9ms (wystąpiło 3 razy, klatki 241-251, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 251 (dt=35.9ms, wykonanie=6.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.5ms (wystąpiło 5 razy, klatki 257-268, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 268 (dt=36.0ms, wykonanie=9.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=6.9ms (wystąpiło 4 razy, klatki 275-284, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 284 (dt=35.9ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=7.2ms (wystąpiło 3 razy, klatki 288-297, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 297 (dt=36.0ms, wykonanie=10.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=7.2ms (wystąpiło 4 razy, klatki 300-314, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 314 (dt=35.6ms, wykonanie=12.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=8.9ms (wystąpiło 4 razy, klatki 316-326, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 326 (dt=35.5ms, wykonanie=9.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=12.3ms (wystąpiło 4 razy, klatki 331-343, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 343 (dt=35.6ms, wykonanie=14.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1308 > 1275 (wystąpiło 20 razy, klatki 340-359, trwanie: 20 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 359: totalDrawCalls=1310 (fill=517, stroke=698, drawImage=95, arc=332, quadraticCurveTo=658). Arena: ARENA_3.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=14.3ms (wystąpiło 6 razy, klatki 346-359, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 359 (dt=35.6ms, wykonanie=13.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1302 > 1275 (wystąpiło 17 razy, klatki 360-376, trwanie: 17 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 376: totalDrawCalls=1302 (fill=510, stroke=698, drawImage=94, arc=322, quadraticCurveTo=654). Arena: ARENA_3.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.0ms (wystąpiło 4 razy, klatki 362-372, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 372 (dt=36.1ms, wykonanie=10.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=7.6ms (wystąpiło 4 razy, klatki 375-387, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 387 (dt=35.9ms, wykonanie=10.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.0ms (wystąpiło 2 razy, klatki 392-401, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 401 (dt=35.8ms, wykonanie=10.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=6.6ms (klatka 405)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 405 (dt=35.6ms, wykonanie=6.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=34.3ms, exec=6.2ms (klatka 466)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 466 (dt=34.3ms, wykonanie=6.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.1ms (wystąpiło 2 razy, klatki 700-704, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 704 (dt=35.6ms, wykonanie=6.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=5.3ms (klatka 708)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 708 (dt=35.9ms, wykonanie=5.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=34.9ms, exec=9.4ms (wystąpiło 2 razy, klatki 828-832, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 832 (dt=34.8ms, wykonanie=10.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=5.3ms (klatka 1008)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1008 (dt=36.0ms, wykonanie=5.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
