# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 23.11.2026, 22:22:57
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (23)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 15.3 s (515 przetworzonych klatek, 455 analizowanych)
- **Średni FPS:** **43.8 FPS** (średni czas klatki: 22.81 ms)
- **1% Low FPS:** **22.4 FPS** (99. percentyl czasu klatki: 44.6 ms)
- **Maksymalny czas wykonania klatki (exec):** 55.9 ms
- **Maksymalny odstęp między klatkami (dt):** 65.6 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 20
- **Średnie Draw Calls / klatkę (GPU):** **974** (fill: 319, stroke: 554, drawImage: 102, arc: 160, quadraticCurveTo: 490, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1385**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 20 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 3 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=29.6ms, exec=13.5ms (klatka 69)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 69 (dt=29.6ms, wykonanie=13.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=28.4ms, exec=14.2ms (wystąpiło 2 razy, klatki 99-104, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 104 (dt=30.3ms, wykonanie=17.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=30.2ms, exec=10.9ms (klatka 131)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 131 (dt=30.2ms, wykonanie=10.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=23.1ms, exec=28.5ms (wystąpiło 5 razy, klatki 138-148, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 148 (dt=46.7ms, wykonanie=20.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=24.4ms, exec=49.5ms (wystąpiło 3 razy, klatki 153-163, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 163 (dt=31.1ms, wykonanie=11.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=16.7ms, exec=28.5ms (wystąpiło 4 razy, klatki 165-178, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 178 (dt=28.6ms, wykonanie=8.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=30.6ms, exec=16.5ms (klatka 193)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 193 (dt=30.6ms, wykonanie=16.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=30.6ms, exec=11.2ms (wystąpiło 2 razy, klatki 227-233, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 233 (dt=31.2ms, wykonanie=12.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=16.7ms, exec=55.9ms (wystąpiło 2 razy, klatki 252-253, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 253 (dt=65.6ms, wykonanie=24.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=43.9ms, exec=18.9ms (wystąpiło 3 razy, klatki 255-260, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 260 (dt=44.6ms, wykonanie=14.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1317 > 1275 (wystąpiło 2 razy, klatki 268-269, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 269: totalDrawCalls=1313 (fill=495, stroke=718, drawImage=100, arc=289, quadraticCurveTo=591). Arena: ARENA_3.

### 12. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1314 > 1275 (wystąpiło 30 razy, klatki 270-299, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 299: totalDrawCalls=1353 (fill=524, stroke=712, drawImage=117, arc=324, quadraticCurveTo=597). Arena: ARENA_3.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=42.7ms, exec=15.7ms (wystąpiło 3 razy, klatki 287-293, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 293 (dt=29.8ms, wykonanie=14.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1356 > 1275 (wystąpiło 14 razy, klatki 300-313, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 313: totalDrawCalls=1321 (fill=520, stroke=695, drawImage=106, arc=352, quadraticCurveTo=597). Arena: ARENA_3.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=31.1ms, exec=12.7ms (klatka 311)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 311 (dt=31.1ms, wykonanie=12.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=30.9ms, exec=15.4ms (klatka 320)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 320 (dt=30.9ms, wykonanie=15.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=30.5ms, exec=11.6ms (wystąpiło 3 razy, klatki 333-343, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 343 (dt=31.6ms, wykonanie=11.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=29.9ms, exec=11.0ms (klatka 357)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 357 (dt=29.9ms, wykonanie=11.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=28.4ms, exec=12.6ms (klatka 360)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 360 (dt=28.4ms, wykonanie=12.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=29.7ms, exec=7.2ms (klatka 434)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 434 (dt=29.7ms, wykonanie=7.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=29.2ms, exec=16.0ms (klatka 460)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 460 (dt=29.2ms, wykonanie=16.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=30.2ms, exec=18.0ms (klatka 481)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 481 (dt=30.2ms, wykonanie=18.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=30.7ms, exec=9.0ms (wystąpiło 2 razy, klatki 498-502, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 502 (dt=28.5ms, wykonanie=12.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
