# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 18.11.2026, 06:35:35
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (24)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.7 s (705 przetworzonych klatek, 645 analizowanych)
- **Średni FPS:** **38.2 FPS** (średni czas klatki: 26.21 ms)
- **1% Low FPS:** **15.6 FPS** (99. percentyl czasu klatki: 64.2 ms)
- **Maksymalny czas wykonania klatki (exec):** 58.5 ms
- **Maksymalny odstęp między klatkami (dt):** 75 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 22
- **Średnie Draw Calls / klatkę (GPU):** **883** (fill: 292, stroke: 492, drawImage: 100, arc: 157, quadraticCurveTo: 416, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1396**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 22 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 2 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=29.4ms, exec=9.4ms (wystąpiło 2 razy, klatki 69-72, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 72 (dt=30.1ms, wykonanie=9.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=29.8ms, exec=8.1ms (klatka 81)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 81 (dt=29.8ms, wykonanie=8.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=28.6ms, exec=10.8ms (klatka 98)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 98 (dt=28.6ms, wykonanie=10.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=24.4ms, exec=51.7ms (wystąpiło 2 razy, klatki 130-131, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 131 (dt=52.7ms, wykonanie=15.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=23.9ms, exec=47.6ms (wystąpiło 3 razy, klatki 137-147, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 147 (dt=47.1ms, wykonanie=8.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=42.0ms, exec=9.3ms (wystąpiło 5 razy, klatki 151-163, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 163 (dt=48.1ms, wykonanie=10.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=14.6ms (wystąpiło 7 razy, klatki 166-178, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 178 (dt=48.3ms, wykonanie=12.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=49.4ms, exec=9.2ms (wystąpiło 4 razy, klatki 185-194, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 194 (dt=39.8ms, wykonanie=14.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=46.8ms, exec=15.3ms (wystąpiło 7 razy, klatki 195-206, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 206 (dt=48.2ms, wykonanie=11.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=15.5ms (wystąpiło 5 razy, klatki 210-223, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 223 (dt=48.1ms, wykonanie=9.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=42.7ms, exec=42.6ms (wystąpiło 10 razy, klatki 226-239, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 239 (dt=48.2ms, wykonanie=19.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1279 > 1275 (wystąpiło 5 razy, klatki 231-236, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 236: totalDrawCalls=1277 (fill=457, stroke=700, drawImage=120, arc=265, quadraticCurveTo=661). Arena: ARENA_3.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=52.2ms, exec=12.9ms (wystąpiło 7 razy, klatki 240-251, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 251 (dt=75.0ms, wykonanie=17.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1362 > 1275 (wystąpiło 13 razy, klatki 243-255, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 255: totalDrawCalls=1396 (fill=560, stroke=693, drawImage=143, arc=408, quadraticCurveTo=657). Arena: ARENA_3.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=65.0ms, exec=17.3ms (wystąpiło 6 razy, klatki 256-267, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 267 (dt=48.3ms, wykonanie=10.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=42.1ms, exec=16.3ms (wystąpiło 7 razy, klatki 270-284, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 284 (dt=30.0ms, wykonanie=16.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=36.6ms, exec=19.6ms (wystąpiło 4 razy, klatki 285-299, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 299 (dt=47.5ms, wykonanie=14.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=40.7ms, exec=10.7ms (klatka 303)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 303 (dt=40.7ms, wykonanie=10.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=30.6ms, exec=13.1ms (klatka 329)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 329 (dt=30.6ms, wykonanie=13.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=28.9ms, exec=5.7ms (wystąpiło 2 razy, klatki 376-387, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 387 (dt=28.4ms, wykonanie=6.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=43.4ms, exec=7.6ms (klatka 424)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 424 (dt=43.4ms, wykonanie=7.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=49.1ms, exec=9.6ms (klatka 522)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 522 (dt=49.1ms, wykonanie=9.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=47.2ms, exec=9.8ms (wystąpiło 4 razy, klatki 527-536, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 536 (dt=48.0ms, wykonanie=13.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=48.3ms, exec=12.2ms (klatka 546)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 546 (dt=48.3ms, wykonanie=12.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
