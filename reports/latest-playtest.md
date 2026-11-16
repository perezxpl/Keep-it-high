# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 16.11.2026, 17:34:21
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (17)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.4 s (1039 przetworzonych klatek, 979 analizowanych)
- **Średni FPS:** **57.5 FPS** (średni czas klatki: 17.38 ms)
- **1% Low FPS:** **27.9 FPS** (99. percentyl czasu klatki: 35.9 ms)
- **Maksymalny czas wykonania klatki (exec):** 14.2 ms
- **Maksymalny odstęp między klatkami (dt):** 36.1 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 17
- **Średnie Draw Calls / klatkę (GPU):** **824** (fill: 265, stroke: 462, drawImage: 96, arc: 165, quadraticCurveTo: 386, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1255**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 17 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 0 | OK |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=7.7ms (klatka 64)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 64 (dt=35.2ms, wykonanie=7.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=5.3ms (wystąpiło 2 razy, klatki 103-104, trwanie: 2 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 104 (dt=36.0ms, wykonanie=5.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=5.9ms (klatka 108)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 108 (dt=36.0ms, wykonanie=5.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=4.6ms (klatka 202)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 202 (dt=36.0ms, wykonanie=4.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=9.2ms (wystąpiło 2 razy, klatki 291-295, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 295 (dt=35.5ms, wykonanie=8.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=7.7ms (wystąpiło 2 razy, klatki 301-310, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 310 (dt=35.3ms, wykonanie=10.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=7.9ms (wystąpiło 2 razy, klatki 320-329, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 329 (dt=35.5ms, wykonanie=6.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=8.2ms (klatka 331)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 331 (dt=36.1ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=34.8ms, exec=11.6ms (wystąpiło 2 razy, klatki 347-352, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 352 (dt=35.4ms, wykonanie=10.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=11.7ms (klatka 377)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 377 (dt=35.2ms, wykonanie=11.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=10.8ms (wystąpiło 2 razy, klatki 622-626, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 626 (dt=35.9ms, wykonanie=9.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=8.4ms (klatka 803)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 803 (dt=35.6ms, wykonanie=8.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.9ms (klatka 848)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 848 (dt=36.0ms, wykonanie=7.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=8.7ms (wystąpiło 2 razy, klatki 855-859, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 859 (dt=35.5ms, wykonanie=8.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=10.7ms (klatka 981)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 981 (dt=36.0ms, wykonanie=10.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=35.8ms, exec=7.4ms (klatka 998)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 998 (dt=35.8ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=7.3ms (klatka 1010)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1010 (dt=35.9ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
