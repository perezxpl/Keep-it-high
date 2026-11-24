# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 24.11.2026, 22:32:23
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (19)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 15.3 s (524 przetworzonych klatek, 464 analizowanych)
- **Średni FPS:** **42.6 FPS** (średni czas klatki: 23.49 ms)
- **1% Low FPS:** **33 FPS** (99. percentyl czasu klatki: 30.3 ms)
- **Maksymalny czas wykonania klatki (exec):** 41.8 ms
- **Maksymalny odstęp między klatkami (dt):** 49.9 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 16
- **Średnie Draw Calls / klatkę (GPU):** **1004** (fill: 336, stroke: 560, drawImage: 108, arc: 178, quadraticCurveTo: 484, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1420**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 16 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 3 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=30.2ms, exec=20.6ms (klatka 62)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 62 (dt=30.2ms, wykonanie=20.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=29.1ms, exec=13.2ms (klatka 104)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 104 (dt=29.1ms, wykonanie=13.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=28.7ms, exec=15.3ms (klatka 143)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 143 (dt=28.7ms, wykonanie=15.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=29.9ms, exec=17.2ms (wystąpiło 2 razy, klatki 150-160, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 160 (dt=30.1ms, wykonanie=13.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=29.1ms, exec=9.8ms (wystąpiło 2 razy, klatki 201-204, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 204 (dt=28.9ms, wykonanie=18.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=24.2ms, exec=31.5ms (wystąpiło 3 razy, klatki 232-237, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 237 (dt=31.4ms, wykonanie=14.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=29.3ms, exec=14.0ms (wystąpiło 4 razy, klatki 242-251, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 251 (dt=30.0ms, wykonanie=23.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1352 > 1275 (wystąpiło 26 razy, klatki 244-269, trwanie: 26 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 269: totalDrawCalls=1348 (fill=510, stroke=734, drawImage=104, arc=311, quadraticCurveTo=661). Arena: ARENA_3.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=29.0ms, exec=14.2ms (klatka 260)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 260 (dt=29.0ms, wykonanie=14.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1343 > 1275 (wystąpiło 30 razy, klatki 270-299, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 299: totalDrawCalls=1350 (fill=519, stroke=727, drawImage=104, arc=355, quadraticCurveTo=657). Arena: ARENA_3.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=30.0ms, exec=18.9ms (wystąpiło 2 razy, klatki 281-283, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 283 (dt=29.4ms, wykonanie=26.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1352 > 1275 (wystąpiło 3 razy, klatki 300-302, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 302: totalDrawCalls=1349 (fill=520, stroke=725, drawImage=104, arc=336, quadraticCurveTo=657). Arena: ARENA_3.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=30.1ms, exec=18.7ms (klatka 308)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 308 (dt=30.1ms, wykonanie=18.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=28.4ms, exec=15.0ms (klatka 320)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 320 (dt=28.4ms, wykonanie=15.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=29.9ms, exec=7.3ms (klatka 371)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 371 (dt=29.9ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=30.3ms, exec=12.3ms (klatka 378)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 378 (dt=30.3ms, wykonanie=12.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=30.1ms, exec=11.0ms (klatka 429)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 429 (dt=30.1ms, wykonanie=11.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=45.1ms, exec=12.7ms (klatka 458)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 458 (dt=45.1ms, wykonanie=12.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=28.2ms, exec=12.9ms (klatka 501)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 501 (dt=28.2ms, wykonanie=12.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
