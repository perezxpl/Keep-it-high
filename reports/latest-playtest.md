# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 17.11.2026, 20:05:34
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (18)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 10.2 s (359 przetworzonych klatek, 299 analizowanych)
- **Średni FPS:** **40.9 FPS** (średni czas klatki: 24.46 ms)
- **1% Low FPS:** **18.8 FPS** (99. percentyl czasu klatki: 53.1 ms)
- **Maksymalny czas wykonania klatki (exec):** 13.9 ms
- **Maksymalny odstęp między klatkami (dt):** 53.5 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 13
- **Średnie Draw Calls / klatkę (GPU):** **1020** (fill: 533, stroke: 451, drawImage: 37, arc: 115, quadraticCurveTo: 545, clip: 9)
- **Maksymalne Draw Calls / klatkę (GPU):** **1300**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 13 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 5 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=5.9ms (klatka 124)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 124 (dt=36.1ms, wykonanie=5.9ms > limit 28ms). Arena: ARENA_1, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.9ms (klatka 193)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 193 (dt=36.0ms, wykonanie=7.9ms > limit 28ms). Arena: ARENA_1, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=6.5ms (wystąpiło 3 razy, klatki 197-207, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 207 (dt=35.9ms, wykonanie=9.6ms > limit 28ms). Arena: ARENA_1, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1281 > 1275 (wystąpiło 9 razy, klatki 201-209, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 209: totalDrawCalls=1288 (fill=662, stroke=584, drawImage=42, arc=182, quadraticCurveTo=774). Arena: ARENA_1.

### 5. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1283 > 1275 (klatka 210)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 210: totalDrawCalls=1283 (fill=657, stroke=584, drawImage=42, arc=190, quadraticCurveTo=772). Arena: ARENA_1.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=10.6ms (wystąpiło 13 razy, klatki 210-224, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 224 (dt=36.0ms, wykonanie=8.9ms > limit 28ms). Arena: ARENA_1, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=8.4ms (wystąpiło 10 razy, klatki 225-238, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 238 (dt=35.6ms, wykonanie=9.9ms > limit 28ms). Arena: ARENA_1, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=8.0ms (wystąpiło 13 razy, klatki 240-254, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 254 (dt=36.0ms, wykonanie=10.7ms > limit 28ms). Arena: ARENA_1, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=8.5ms (wystąpiło 10 razy, klatki 255-269, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 269 (dt=35.9ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_1, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=34.9ms, exec=6.5ms (wystąpiło 8 razy, klatki 271-284, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 284 (dt=35.7ms, wykonanie=8.0ms > limit 28ms). Arena: ARENA_1, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1287 > 1275 (wystąpiło 16 razy, klatki 280-295, trwanie: 16 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 295: totalDrawCalls=1294 (fill=652, stroke=584, drawImage=58, arc=152, quadraticCurveTo=768). Arena: ARENA_1.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.6ms (wystąpiło 10 razy, klatki 286-298, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 298 (dt=36.0ms, wykonanie=5.8ms > limit 28ms). Arena: ARENA_1, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=8.6ms (wystąpiło 10 razy, klatki 300-313, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 313 (dt=35.6ms, wykonanie=9.1ms > limit 28ms). Arena: ARENA_1, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=7.3ms (wystąpiło 13 razy, klatki 315-329, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 329 (dt=35.5ms, wykonanie=9.8ms > limit 28ms). Arena: ARENA_1, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1300 > 1275 (wystąpiło 2 razy, klatki 328-329, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 329: totalDrawCalls=1300 (fill=657, stroke=585, drawImage=58, arc=161, quadraticCurveTo=774). Arena: ARENA_1.

### 16. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1296 > 1275 (wystąpiło 12 razy, klatki 330-341, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 341: totalDrawCalls=1291 (fill=650, stroke=583, drawImage=58, arc=201, quadraticCurveTo=770). Arena: ARENA_1.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=10.0ms (wystąpiło 12 razy, klatki 330-344, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 344 (dt=35.1ms, wykonanie=8.5ms > limit 28ms). Arena: ARENA_1, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=34.4ms, exec=8.0ms (wystąpiło 13 razy, klatki 345-358, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 358 (dt=35.3ms, wykonanie=8.5ms > limit 28ms). Arena: ARENA_1, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
