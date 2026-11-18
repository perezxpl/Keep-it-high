# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 18.11.2026, 08:31:33
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (20)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 15.4 s (487 przetworzonych klatek, 427 analizowanych)
- **Średni FPS:** **35.6 FPS** (średni czas klatki: 28.05 ms)
- **1% Low FPS:** **14.8 FPS** (99. percentyl czasu klatki: 67.5 ms)
- **Maksymalny czas wykonania klatki (exec):** 31.8 ms
- **Maksymalny odstęp między klatkami (dt):** 75 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 17
- **Średnie Draw Calls / klatkę (GPU):** **982** (fill: 346, stroke: 536, drawImage: 100, arc: 168, quadraticCurveTo: 554, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1417**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 17 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 3 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=29.9ms, exec=8.3ms (wystąpiło 2 razy, klatki 121-131, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 131 (dt=48.2ms, wykonanie=16.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=24.2ms, exec=28.6ms (wystąpiło 3 razy, klatki 135-149, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 149 (dt=48.2ms, wykonanie=17.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=47.9ms, exec=14.0ms (wystąpiło 3 razy, klatki 151-163, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 163 (dt=48.2ms, wykonanie=10.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=44.5ms, exec=10.3ms (klatka 173)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 173 (dt=44.5ms, wykonanie=10.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=52.8ms, exec=12.6ms (wystąpiło 4 razy, klatki 184-194, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 194 (dt=48.8ms, wykonanie=10.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=9.6ms (wystąpiło 3 razy, klatki 200-207, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 207 (dt=48.3ms, wykonanie=10.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=42.4ms, exec=9.0ms (wystąpiło 5 razy, klatki 213-223, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 223 (dt=42.7ms, wykonanie=13.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=59.7ms, exec=12.3ms (wystąpiło 12 razy, klatki 225-239, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 239 (dt=36.7ms, wykonanie=20.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=42.6ms, exec=18.9ms (wystąpiło 13 razy, klatki 240-254, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 254 (dt=54.0ms, wykonanie=16.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1301 > 1275 (klatka 251)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 251: totalDrawCalls=1301 (fill=463, stroke=720, drawImage=118, arc=251, quadraticCurveTo=660). Arena: ARENA_3.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=40.5ms, exec=20.8ms (wystąpiło 9 razy, klatki 255-268, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 268 (dt=48.1ms, wykonanie=18.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=48.0ms, exec=12.5ms (wystąpiło 5 razy, klatki 271-281, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 281 (dt=48.2ms, wykonanie=16.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=48.0ms, exec=13.4ms (klatka 291)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 291 (dt=48.0ms, wykonanie=13.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=49.6ms, exec=8.9ms (klatka 303)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 303 (dt=49.6ms, wykonanie=8.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=42.8ms, exec=16.4ms (wystąpiło 3 razy, klatki 336-342, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 342 (dt=48.4ms, wykonanie=19.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1278 > 1275 (wystąpiło 15 razy, klatki 462-479, trwanie: 18 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 479: totalDrawCalls=1394 (fill=535, stroke=746, drawImage=113, arc=310, quadraticCurveTo=656). Arena: ARENA_3.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=11.3ms (wystąpiło 3 razy, klatki 462-464, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 464 (dt=75.0ms, wykonanie=10.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=12.3ms (wystąpiło 7 razy, klatki 469-479, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 479 (dt=48.3ms, wykonanie=21.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1394 > 1275 (wystąpiło 8 razy, klatki 480-487, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 487: totalDrawCalls=1369 (fill=518, stroke=738, drawImage=113, arc=291, quadraticCurveTo=660). Arena: ARENA_3.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=14.2ms (wystąpiło 3 razy, klatki 482-486, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 486 (dt=49.1ms, wykonanie=11.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
