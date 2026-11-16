# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 16.11.2026, 14:29:42
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (14)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 10.2 s (295 przetworzonych klatek, 235 analizowanych)
- **Średni FPS:** **35.2 FPS** (średni czas klatki: 28.38 ms)
- **1% Low FPS:** **20.3 FPS** (99. percentyl czasu klatki: 49.2 ms)
- **Maksymalny czas wykonania klatki (exec):** 23.5 ms
- **Maksymalny odstęp między klatkami (dt):** 75 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 14
- **Średnie Draw Calls / klatkę (GPU):** **818** (fill: 276, stroke: 441, drawImage: 101, arc: 121, quadraticCurveTo: 544, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1063**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 14 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 0 | OK |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=11.8ms (wystąpiło 4 razy, klatki 61-69, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 69 (dt=47.9ms, wykonanie=9.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=43.7ms, exec=9.4ms (wystąpiło 4 razy, klatki 75-83, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 83 (dt=48.5ms, wykonanie=8.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=7.0ms (klatka 100)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 100 (dt=48.1ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=43.2ms, exec=11.6ms (wystąpiło 2 razy, klatki 107-110, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 110 (dt=47.9ms, wykonanie=5.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=51.5ms, exec=8.7ms (wystąpiło 4 razy, klatki 126-133, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 133 (dt=48.1ms, wykonanie=14.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=41.7ms, exec=11.0ms (wystąpiło 3 razy, klatki 136-146, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 146 (dt=48.1ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=20.1ms (wystąpiło 5 razy, klatki 180-191, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 191 (dt=48.0ms, wykonanie=8.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=43.4ms, exec=11.0ms (wystąpiło 2 razy, klatki 206-208, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 208 (dt=48.1ms, wykonanie=8.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=48.0ms, exec=10.9ms (wystąpiło 2 razy, klatki 211-214, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 214 (dt=45.1ms, wykonanie=10.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=42.4ms, exec=15.5ms (wystąpiło 2 razy, klatki 225-238, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 238 (dt=41.8ms, wykonanie=8.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=44.5ms, exec=10.4ms (wystąpiło 3 razy, klatki 242-252, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 252 (dt=43.5ms, wykonanie=14.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=42.9ms, exec=11.1ms (wystąpiło 6 razy, klatki 255-268, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 268 (dt=48.1ms, wykonanie=13.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=28.4ms, exec=12.5ms (wystąpiło 6 razy, klatki 270-283, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 283 (dt=48.1ms, wykonanie=12.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=49.2ms, exec=10.7ms (wystąpiło 3 razy, klatki 285-289, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 289 (dt=48.0ms, wykonanie=10.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
