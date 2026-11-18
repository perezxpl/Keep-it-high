# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 18.11.2026, 06:49:34
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (22)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.6 s (708 przetworzonych klatek, 648 analizowanych)
- **Średni FPS:** **38.3 FPS** (średni czas klatki: 26.13 ms)
- **1% Low FPS:** **20.3 FPS** (99. percentyl czasu klatki: 49.2 ms)
- **Maksymalny czas wykonania klatki (exec):** 21.5 ms
- **Maksymalny odstęp między klatkami (dt):** 72.1 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 20
- **Średnie Draw Calls / klatkę (GPU):** **914** (fill: 315, stroke: 496, drawImage: 103, arc: 168, quadraticCurveTo: 458, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1363**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 20 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 2 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=28.9ms, exec=11.2ms (klatka 71)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 71 (dt=28.9ms, wykonanie=11.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=46.2ms, exec=11.5ms (klatka 115)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 115 (dt=46.2ms, wykonanie=11.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=44.1ms, exec=11.3ms (klatka 156)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 156 (dt=44.1ms, wykonanie=11.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=42.4ms, exec=17.6ms (klatka 177)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 177 (dt=42.4ms, wykonanie=17.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=47.9ms, exec=16.4ms (wystąpiło 5 razy, klatki 180-191, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 191 (dt=44.2ms, wykonanie=10.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=12.5ms (wystąpiło 7 razy, klatki 196-209, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 209 (dt=66.4ms, wykonanie=13.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=41.9ms, exec=13.0ms (wystąpiło 5 razy, klatki 211-220, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 220 (dt=48.2ms, wykonanie=12.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=48.3ms, exec=9.0ms (wystąpiło 7 razy, klatki 225-238, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 238 (dt=47.8ms, wykonanie=21.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=61.0ms, exec=15.3ms (wystąpiło 9 razy, klatki 240-254, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 254 (dt=48.1ms, wykonanie=18.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1337 > 1275 (wystąpiło 24 razy, klatki 246-269, trwanie: 24 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 269: totalDrawCalls=1361 (fill=532, stroke=735, drawImage=94, arc=340, quadraticCurveTo=737). Arena: ARENA_3.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=48.7ms, exec=16.2ms (wystąpiło 7 razy, klatki 256-267, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 267 (dt=43.0ms, wykonanie=15.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1310 > 1275 (wystąpiło 19 razy, klatki 270-289, trwanie: 20 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 289: totalDrawCalls=1277 (fill=509, stroke=674, drawImage=94, arc=303, quadraticCurveTo=654). Arena: ARENA_3.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=14.4ms (wystąpiło 7 razy, klatki 270-283, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 283 (dt=48.6ms, wykonanie=12.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=48.5ms, exec=12.8ms (wystąpiło 7 razy, klatki 287-299, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 299 (dt=48.4ms, wykonanie=11.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=31.2ms, exec=9.8ms (wystąpiło 2 razy, klatki 303-306, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 306 (dt=48.1ms, wykonanie=9.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=44.6ms, exec=7.1ms (klatka 372)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 372 (dt=44.6ms, wykonanie=7.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=72.1ms, exec=12.6ms (wystąpiło 2 razy, klatki 381-386, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 386 (dt=49.1ms, wykonanie=11.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=11.0ms (wystąpiło 4 razy, klatki 406-417, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 417 (dt=48.6ms, wykonanie=8.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=11.9ms (wystąpiło 6 razy, klatki 420-430, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 430 (dt=52.9ms, wykonanie=13.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=29.2ms, exec=4.5ms (klatka 544)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 544 (dt=29.2ms, wykonanie=4.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=30.8ms, exec=7.3ms (wystąpiło 2 razy, klatki 679-681, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 681 (dt=30.3ms, wykonanie=12.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=42.9ms, exec=13.2ms (klatka 703)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 703 (dt=42.9ms, wykonanie=13.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 3, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
