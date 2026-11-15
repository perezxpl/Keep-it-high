# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 15.11.2026, 20:19:58
> Status końcowy: **WYKRYTO ANOMALIE (21)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 10.1 s (412 przetworzonych klatek, 352 analizowanych)
- **Średni FPS:** **44.9 FPS** (średni czas klatki: 22.27 ms)
- **1% Low FPS:** **27.5 FPS** (99. percentyl czasu klatki: 36.3 ms)
- **Maksymalny czas wykonania klatki (exec):** 14.6 ms
- **Maksymalny odstęp między klatkami (dt):** 72 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 21

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 6px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 21 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=4.6ms (wystąpiło 2 razy, klatki 75-86, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 86 (dt=35.9ms, wykonanie=8.7ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=4.4ms (klatka 95)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 95 (dt=36.0ms, wykonanie=4.4ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=4.1ms (klatka 113)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 113 (dt=36.0ms, wykonanie=4.1ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=4.1ms (klatka 131)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 131 (dt=36.0ms, wykonanie=4.1ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.8ms (wystąpiło 4 razy, klatki 171-179, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 179 (dt=72.0ms, wykonanie=11.7ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=9.9ms (wystąpiło 3 razy, klatki 182-194, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 194 (dt=36.1ms, wykonanie=6.0ms > limit 28ms). Arena: ARENA_5, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=35.4ms, exec=6.6ms (wystąpiło 3 razy, klatki 199-208, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 208 (dt=35.4ms, wykonanie=8.6ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=7.2ms (wystąpiło 5 razy, klatki 210-222, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 222 (dt=35.2ms, wykonanie=7.1ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.4ms (wystąpiło 4 razy, klatki 225-239, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 239 (dt=36.0ms, wykonanie=5.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=6.5ms (wystąpiło 2 razy, klatki 245-250, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 250 (dt=36.1ms, wykonanie=7.2ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.1ms (wystąpiło 4 razy, klatki 255-269, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 269 (dt=36.1ms, wykonanie=8.4ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=36.2ms, exec=11.9ms (wystąpiło 5 razy, klatki 271-283, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 283 (dt=36.2ms, wykonanie=6.2ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=9.5ms (wystąpiło 8 razy, klatki 285-298, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 298 (dt=35.6ms, wykonanie=8.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.9ms (wystąpiło 10 razy, klatki 300-314, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 314 (dt=35.7ms, wykonanie=6.1ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.0ms (wystąpiło 7 razy, klatki 315-328, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 328 (dt=35.9ms, wykonanie=6.5ms > limit 28ms). Arena: ARENA_5, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.6ms (wystąpiło 5 razy, klatki 331-344, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 344 (dt=36.2ms, wykonanie=7.5ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.8ms (wystąpiło 5 razy, klatki 348-358, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 358 (dt=35.7ms, wykonanie=8.0ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=6.0ms (wystąpiło 6 razy, klatki 360-373, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 373 (dt=35.7ms, wykonanie=8.6ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=5.7ms (wystąpiło 8 razy, klatki 376-388, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 388 (dt=36.0ms, wykonanie=6.8ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=6.4ms (wystąpiło 6 razy, klatki 391-404, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 404 (dt=35.0ms, wykonanie=13.9ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=52.4ms, exec=10.6ms (wystąpiło 6 razy, klatki 405-411, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 411 (dt=36.0ms, wykonanie=8.7ms > limit 28ms). Arena: ARENA_5, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
