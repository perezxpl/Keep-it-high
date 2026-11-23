# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 23.11.2026, 17:52:56
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (21)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.4 s (1021 przetworzonych klatek, 961 analizowanych)
- **Średni FPS:** **55.5 FPS** (średni czas klatki: 18.01 ms)
- **1% Low FPS:** **27.8 FPS** (99. percentyl czasu klatki: 36 ms)
- **Maksymalny czas wykonania klatki (exec):** 17.4 ms
- **Maksymalny odstęp między klatkami (dt):** 69.8 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 18
- **Średnie Draw Calls / klatkę (GPU):** **942** (fill: 338, stroke: 499, drawImage: 105, arc: 187, quadraticCurveTo: 485, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1409**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 18 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 3 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=11.9ms (wystąpiło 3 razy, klatki 216-220, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 220 (dt=35.7ms, wykonanie=8.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=8.3ms (wystąpiło 4 razy, klatki 225-237, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 237 (dt=35.5ms, wykonanie=7.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=6.6ms (wystąpiło 4 razy, klatki 241-254, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 254 (dt=35.7ms, wykonanie=7.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.0ms (wystąpiło 3 razy, klatki 260-267, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 267 (dt=36.0ms, wykonanie=12.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=35.8ms, exec=9.5ms (wystąpiło 2 razy, klatki 275-278, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 278 (dt=34.8ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=11.9ms (wystąpiło 6 razy, klatki 285-296, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 296 (dt=35.0ms, wykonanie=12.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=7.8ms (wystąpiło 4 razy, klatki 300-312, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 312 (dt=35.6ms, wykonanie=9.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=7.0ms (wystąpiło 5 razy, klatki 316-329, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 329 (dt=35.6ms, wykonanie=9.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=6.4ms (wystąpiło 2 razy, klatki 333-336, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 336 (dt=36.1ms, wykonanie=8.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=6.8ms (wystąpiło 2 razy, klatki 348-357, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 357 (dt=35.8ms, wykonanie=7.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1285 > 1275 (wystąpiło 16 razy, klatki 583-599, trwanie: 17 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 599: totalDrawCalls=1326 (fill=536, stroke=680, drawImage=110, arc=308, quadraticCurveTo=658). Arena: ARENA_3.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=51.8ms, exec=17.4ms (wystąpiło 5 razy, klatki 587-599, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 599 (dt=35.4ms, wykonanie=10.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1300 > 1275 (wystąpiło 30 razy, klatki 600-629, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 629: totalDrawCalls=1377 (fill=581, stroke=683, drawImage=113, arc=369, quadraticCurveTo=635). Arena: ARENA_3.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.4ms (wystąpiło 6 razy, klatki 603-614, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 614 (dt=35.4ms, wykonanie=13.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=14.1ms (wystąpiło 2 razy, klatki 618-621, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 621 (dt=35.1ms, wykonanie=10.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1376 > 1275 (wystąpiło 9 razy, klatki 630-638, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 638: totalDrawCalls=1376 (fill=584, stroke=686, drawImage=106, arc=362, quadraticCurveTo=637). Arena: ARENA_3.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=9.4ms (wystąpiło 2 razy, klatki 631-639, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 639 (dt=36.0ms, wykonanie=8.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=8.1ms (klatka 658)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 658 (dt=35.5ms, wykonanie=8.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=8.7ms (wystąpiło 2 razy, klatki 677-680, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 680 (dt=35.6ms, wykonanie=9.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=64.7ms, exec=5.1ms (klatka 753)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 753 (dt=64.7ms, wykonanie=5.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=35.1ms, exec=6.8ms (klatka 910)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 910 (dt=35.1ms, wykonanie=6.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
