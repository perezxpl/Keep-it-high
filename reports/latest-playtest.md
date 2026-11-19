# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 19.11.2026, 07:13:14
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (16)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 10.3 s (256 przetworzonych klatek, 196 analizowanych)
- **Średni FPS:** **30.3 FPS** (średni czas klatki: 32.99 ms)
- **1% Low FPS:** **13.3 FPS** (99. percentyl czasu klatki: 75 ms)
- **Maksymalny czas wykonania klatki (exec):** 51.9 ms
- **Maksymalny odstęp między klatkami (dt):** 75 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 14
- **Średnie Draw Calls / klatkę (GPU):** **1146** (fill: 500, stroke: 596, drawImage: 50, arc: 225, quadraticCurveTo: 762, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1476**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 14 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 2 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=48.5ms, exec=5.7ms (wystąpiło 2 razy, klatki 61-67, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 67 (dt=43.6ms, wykonanie=6.2ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=51.0ms, exec=5.9ms (wystąpiło 5 razy, klatki 75-88, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 88 (dt=47.4ms, wykonanie=6.1ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=47.6ms, exec=8.7ms (wystąpiło 5 razy, klatki 92-104, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 104 (dt=50.3ms, wykonanie=5.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=65.9ms, exec=7.9ms (wystąpiło 4 razy, klatki 111-118, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 118 (dt=29.3ms, wykonanie=20.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=63.0ms, exec=8.6ms (wystąpiło 6 razy, klatki 121-133, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 133 (dt=48.9ms, wykonanie=10.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=47.4ms, exec=9.0ms (wystąpiło 7 razy, klatki 137-149, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 149 (dt=47.8ms, wykonanie=12.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=48.8ms, exec=12.7ms (wystąpiło 6 razy, klatki 150-162, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 162 (dt=43.8ms, wykonanie=8.7ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=41.9ms, exec=9.5ms (wystąpiło 6 razy, klatki 165-179, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 179 (dt=50.0ms, wykonanie=10.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=50.9ms, exec=17.4ms (wystąpiło 8 razy, klatki 182-194, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 194 (dt=45.7ms, wykonanie=11.2ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=37.1ms, exec=12.2ms (wystąpiło 8 razy, klatki 195-209, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 209 (dt=36.4ms, wykonanie=9.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=41.1ms, exec=9.5ms (wystąpiło 6 razy, klatki 212-223, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 223 (dt=48.0ms, wykonanie=8.3ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1304 > 1275 (wystąpiło 25 razy, klatki 215-239, trwanie: 25 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 239: totalDrawCalls=1343 (fill=616, stroke=666, drawImage=61, arc=385, quadraticCurveTo=747). Arena: ARENA_5.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=8.9ms (wystąpiło 7 razy, klatki 225-238, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 238 (dt=47.3ms, wykonanie=8.7ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1343 > 1275 (wystąpiło 17 razy, klatki 240-256, trwanie: 17 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 256: totalDrawCalls=1413 (fill=649, stroke=698, drawImage=66, arc=385, quadraticCurveTo=878). Arena: ARENA_5.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=48.6ms, exec=16.5ms (wystąpiło 7 razy, klatki 241-253, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 253 (dt=48.0ms, wykonanie=13.2ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=13.5ms (wystąpiło 2 razy, klatki 255-256, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 256 (dt=52.8ms, wykonanie=10.4ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
