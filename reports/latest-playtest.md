# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 17.11.2026, 21:34:59
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (26)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 10.2 s (428 przetworzonych klatek, 368 analizowanych)
- **Średni FPS:** **47.7 FPS** (średni czas klatki: 20.95 ms)
- **1% Low FPS:** **27.7 FPS** (99. percentyl czasu klatki: 36.1 ms)
- **Maksymalny czas wykonania klatki (exec):** 12.9 ms
- **Maksymalny odstęp między klatkami (dt):** 54 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 23
- **Średnie Draw Calls / klatkę (GPU):** **1106** (fill: 469, stroke: 577, drawImage: 60, arc: 194, quadraticCurveTo: 759, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1348**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 23 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 3 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=5.1ms (wystąpiło 2 razy, klatki 63-74, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 74 (dt=35.6ms, wykonanie=6.2ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=4.3ms (klatka 90)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 90 (dt=35.6ms, wykonanie=4.3ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=5.3ms (wystąpiło 2 razy, klatki 110-117, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 117 (dt=36.1ms, wykonanie=4.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=3.7ms (klatka 125)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 125 (dt=35.9ms, wykonanie=3.7ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=4.9ms (klatka 151)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 151 (dt=36.0ms, wykonanie=4.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=35.4ms, exec=8.6ms (wystąpiło 6 razy, klatki 168-178, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 178 (dt=35.7ms, wykonanie=9.1ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=36.3ms, exec=7.0ms (wystąpiło 2 razy, klatki 186-192, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 192 (dt=35.9ms, wykonanie=6.6ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=35.4ms, exec=6.4ms (wystąpiło 3 razy, klatki 203-209, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 209 (dt=35.6ms, wykonanie=6.8ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=8.0ms (wystąpiło 3 razy, klatki 213-221, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 221 (dt=35.3ms, wykonanie=8.0ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=7.8ms (wystąpiło 4 razy, klatki 226-237, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 237 (dt=35.2ms, wykonanie=7.1ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=6.6ms (wystąpiło 3 razy, klatki 242-250, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 250 (dt=35.6ms, wykonanie=5.6ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.6ms (wystąpiło 9 razy, klatki 255-269, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 269 (dt=36.0ms, wykonanie=7.5ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=6.3ms (wystąpiło 3 razy, klatki 271-284, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 284 (dt=35.4ms, wykonanie=6.0ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=9.4ms (wystąpiło 4 razy, klatki 290-298, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 298 (dt=35.5ms, wykonanie=8.4ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=6.4ms (wystąpiło 5 razy, klatki 300-314, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 314 (dt=35.3ms, wykonanie=8.1ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=6.4ms (wystąpiło 3 razy, klatki 317-327, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 327 (dt=35.7ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=6.8ms (wystąpiło 3 razy, klatki 331-340, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 340 (dt=34.8ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=34.3ms, exec=7.1ms (wystąpiło 4 razy, klatki 345-359, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 359 (dt=35.7ms, wykonanie=7.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=35.0ms, exec=5.5ms (wystąpiło 3 razy, klatki 360-372, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 372 (dt=35.2ms, wykonanie=6.1ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1276 > 1275 (wystąpiło 3 razy, klatki 373-376, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 376: totalDrawCalls=1279 (fill=562, stroke=651, drawImage=66, arc=289, quadraticCurveTo=748). Arena: ARENA_5.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=7.3ms (wystąpiło 4 razy, klatki 376-388, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 388 (dt=35.6ms, wykonanie=6.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1295 > 1275 (wystąpiło 13 razy, klatki 391-404, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 404: totalDrawCalls=1280 (fill=550, stroke=645, drawImage=85, arc=267, quadraticCurveTo=768). Arena: ARENA_5.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=6.0ms (wystąpiło 4 razy, klatki 393-401, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 401 (dt=53.2ms, wykonanie=5.4ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.0ms (wystąpiło 5 razy, klatki 405-419, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 419 (dt=36.0ms, wykonanie=6.5ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 25. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=6.1ms (wystąpiło 3 razy, klatki 421-427, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 427 (dt=35.1ms, wykonanie=8.6ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 26. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1301 > 1275 (wystąpiło 3 razy, klatki 426-428, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 428: totalDrawCalls=1307 (fill=553, stroke=654, drawImage=100, arc=292, quadraticCurveTo=770). Arena: ARENA_5.
