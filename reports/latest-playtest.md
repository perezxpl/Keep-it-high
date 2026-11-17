# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 17.11.2026, 23:28:32
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (24)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.6 s (723 przetworzonych klatek, 663 analizowanych)
- **Średni FPS:** **38.9 FPS** (średni czas klatki: 25.67 ms)
- **1% Low FPS:** **20.5 FPS** (99. percentyl czasu klatki: 48.8 ms)
- **Maksymalny czas wykonania klatki (exec):** 26.7 ms
- **Maksymalny odstęp między klatkami (dt):** 75 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 20
- **Średnie Draw Calls / klatkę (GPU):** **846** (fill: 281, stroke: 472, drawImage: 94, arc: 163, quadraticCurveTo: 399, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1330**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 20 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 4 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=48.0ms, exec=6.7ms (klatka 67)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 67 (dt=48.0ms, wykonanie=6.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=13.0ms (klatka 130)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 130 (dt=48.2ms, wykonanie=13.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=11.2ms (klatka 159)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 159 (dt=48.1ms, wykonanie=11.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1276 > 1275 (wystąpiło 12 razy, klatki 165-178, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 178: totalDrawCalls=1321 (fill=482, stroke=732, drawImage=107, arc=296, quadraticCurveTo=756). Arena: ARENA_3.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=29.6ms, exec=11.8ms (wystąpiło 2 razy, klatki 174-179, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 179 (dt=51.0ms, wykonanie=13.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=51.6ms, exec=15.7ms (klatka 194)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 194 (dt=51.6ms, wykonanie=15.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=44.4ms, exec=19.0ms (wystąpiło 4 razy, klatki 196-207, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 207 (dt=48.0ms, wykonanie=13.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1280 > 1275 (wystąpiło 3 razy, klatki 210-239, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 239: totalDrawCalls=1290 (fill=506, stroke=694, drawImage=90, arc=300, quadraticCurveTo=654). Arena: ARENA_3.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=14.7ms (wystąpiło 5 razy, klatki 210-223, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 223 (dt=48.2ms, wykonanie=11.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=9.7ms (wystąpiło 3 razy, klatki 226-238, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 238 (dt=44.5ms, wykonanie=16.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1289 > 1275 (wystąpiło 6 razy, klatki 240-245, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 245: totalDrawCalls=1294 (fill=511, stroke=693, drawImage=90, arc=311, quadraticCurveTo=658). Arena: ARENA_3.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=48.3ms, exec=9.8ms (wystąpiło 6 razy, klatki 241-253, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 253 (dt=48.8ms, wykonanie=11.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=12.4ms (wystąpiło 5 razy, klatki 256-268, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 268 (dt=47.8ms, wykonanie=12.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=42.6ms, exec=12.5ms (wystąpiło 7 razy, klatki 270-283, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 283 (dt=48.3ms, wykonanie=13.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1301 > 1275 (wystąpiło 6 razy, klatki 284-289, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 289: totalDrawCalls=1327 (fill=528, stroke=710, drawImage=89, arc=364, quadraticCurveTo=658). Arena: ARENA_3.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=16.2ms (wystąpiło 6 razy, klatki 287-299, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 299 (dt=75.0ms, wykonanie=13.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=75.0ms, exec=12.0ms (wystąpiło 7 razy, klatki 300-310, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 310 (dt=46.2ms, wykonanie=11.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=48.8ms, exec=13.4ms (wystąpiło 4 razy, klatki 315-324, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 324 (dt=30.6ms, wykonanie=9.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=29.2ms, exec=6.7ms (klatka 342)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 342 (dt=29.2ms, wykonanie=6.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=29.1ms, exec=6.1ms (klatka 416)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 416 (dt=29.1ms, wykonanie=6.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=48.0ms, exec=9.7ms (klatka 519)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 519 (dt=48.0ms, wykonanie=9.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=30.9ms, exec=9.4ms (klatka 566)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 566 (dt=30.9ms, wykonanie=9.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=30.7ms, exec=6.9ms (klatka 591)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 591 (dt=30.7ms, wykonanie=6.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=31.2ms, exec=4.9ms (klatka 641)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 641 (dt=31.2ms, wykonanie=4.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
