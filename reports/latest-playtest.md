# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 16.11.2026, 16:42:22
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (53)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 61.1 s (3172 przetworzonych klatek, 3112 analizowanych)
- **Średni FPS:** **56.1 FPS** (średni czas klatki: 17.82 ms)
- **1% Low FPS:** **27.8 FPS** (99. percentyl czasu klatki: 36 ms)
- **Maksymalny czas wykonania klatki (exec):** 22.5 ms
- **Maksymalny odstęp między klatkami (dt):** 75 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 47
- **Średnie Draw Calls / klatkę (GPU):** **829** (fill: 269, stroke: 466, drawImage: 94, arc: 174, quadraticCurveTo: 372, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1485**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 47 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 6 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.4ms (klatka 63)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 63 (dt=36.0ms, wykonanie=6.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=5.9ms (klatka 83)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 83 (dt=36.1ms, wykonanie=5.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=6.0ms (wystąpiło 3 razy, klatki 91-104, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 104 (dt=36.1ms, wykonanie=5.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=5.6ms (wystąpiło 4 razy, klatki 109-118, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 118 (dt=36.1ms, wykonanie=6.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.1ms (wystąpiło 2 razy, klatki 123-133, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 133 (dt=36.2ms, wykonanie=6.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=11.1ms (wystąpiło 2 razy, klatki 170-179, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 179 (dt=36.0ms, wykonanie=8.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.8ms (wystąpiło 4 razy, klatki 182-192, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 192 (dt=35.8ms, wykonanie=6.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=9.5ms (wystąpiło 6 razy, klatki 201-209, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 209 (dt=35.5ms, wykonanie=9.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=8.3ms (wystąpiło 8 razy, klatki 211-224, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 224 (dt=36.0ms, wykonanie=12.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=11.5ms (wystąpiło 12 razy, klatki 225-239, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 239 (dt=35.9ms, wykonanie=22.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1316 > 1275 (klatka 239)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 239: totalDrawCalls=1316 (fill=461, stroke=702, drawImage=153, arc=263, quadraticCurveTo=707). Arena: ARENA_3.

### 12. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1301 > 1275 (wystąpiło 30 razy, klatki 240-269, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 269: totalDrawCalls=1410 (fill=535, stroke=751, drawImage=124, arc=378, quadraticCurveTo=706). Arena: ARENA_3.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=16.0ms (wystąpiło 8 razy, klatki 240-254, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 254 (dt=36.0ms, wykonanie=11.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=8.6ms (wystąpiło 9 razy, klatki 256-268, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 268 (dt=36.0ms, wykonanie=10.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 15. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1408 > 1275 (wystąpiło 7 razy, klatki 270-276, trwanie: 7 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 276: totalDrawCalls=1412 (fill=537, stroke=752, drawImage=123, arc=355, quadraticCurveTo=706). Arena: ARENA_3.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=13.6ms (wystąpiło 5 razy, klatki 271-284, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 284 (dt=36.1ms, wykonanie=11.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.8ms (wystąpiło 3 razy, klatki 288-299, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 299 (dt=36.0ms, wykonanie=10.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=35.3ms, exec=10.2ms (wystąpiło 4 razy, klatki 303-312, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 312 (dt=36.0ms, wykonanie=10.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.1ms (klatka 317)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 317 (dt=36.0ms, wykonanie=7.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [FRAME_STUTTER] Przycięcie klatki: dt=75.0ms, exec=4.7ms (wystąpiło 2 razy, klatki 437-439, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 439 (dt=54.1ms, wykonanie=6.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 21. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=9.0ms (wystąpiło 4 razy, klatki 450-460, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 460 (dt=36.0ms, wykonanie=10.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=7.3ms (wystąpiło 2 razy, klatki 465-476, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 476 (dt=35.1ms, wykonanie=8.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=7.4ms (klatka 633)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 633 (dt=35.7ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=8.0ms (klatka 684)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 684 (dt=36.1ms, wykonanie=8.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 25. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=10.2ms (wystąpiło 4 razy, klatki 692-702, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 702 (dt=36.0ms, wykonanie=8.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 26. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=10.3ms (wystąpiło 6 razy, klatki 705-719, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 719 (dt=35.9ms, wykonanie=15.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 27. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1282 > 1275 (wystąpiło 3 razy, klatki 717-719, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 719: totalDrawCalls=1286 (fill=516, stroke=659, drawImage=111, arc=366, quadraticCurveTo=571). Arena: ARENA_3.

### 28. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1284 > 1275 (wystąpiło 30 razy, klatki 720-749, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 749: totalDrawCalls=1478 (fill=609, stroke=751, drawImage=118, arc=411, quadraticCurveTo=676). Arena: ARENA_3.

### 29. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=12.8ms (wystąpiło 7 razy, klatki 721-732, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 732 (dt=35.7ms, wykonanie=12.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 30. [FRAME_STUTTER] Przycięcie klatki: dt=34.9ms, exec=9.5ms (wystąpiło 2 razy, klatki 738-746, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 746 (dt=35.3ms, wykonanie=8.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 31. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1297 > 1275 (wystąpiło 3 razy, klatki 750-752, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 752: totalDrawCalls=1296 (fill=524, stroke=659, drawImage=113, arc=375, quadraticCurveTo=511). Arena: ARENA_3.

### 32. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=13.3ms (klatka 777)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 777 (dt=35.5ms, wykonanie=13.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 33. [FRAME_STUTTER] Przycięcie klatki: dt=35.2ms, exec=9.0ms (klatka 790)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 790 (dt=35.2ms, wykonanie=9.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 34. [FRAME_STUTTER] Przycięcie klatki: dt=34.3ms, exec=8.0ms (wystąpiło 2 razy, klatki 814-817, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 817 (dt=35.9ms, wykonanie=9.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 35. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=6.1ms (wystąpiło 2 razy, klatki 827-829, trwanie: 3 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 829 (dt=36.1ms, wykonanie=6.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 36. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=8.8ms (wystąpiło 2 razy, klatki 879-882, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 882 (dt=36.1ms, wykonanie=12.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 37. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=10.1ms (wystąpiło 5 razy, klatki 885-899, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 899 (dt=36.0ms, wykonanie=7.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 38. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=9.7ms (wystąpiło 4 razy, klatki 903-914, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 914 (dt=36.0ms, wykonanie=11.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 39. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=8.3ms (wystąpiło 3 razy, klatki 919-927, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 927 (dt=36.0ms, wykonanie=11.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 40. [FRAME_STUTTER] Przycięcie klatki: dt=34.7ms, exec=11.5ms (wystąpiło 3 razy, klatki 930-938, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 938 (dt=36.1ms, wykonanie=6.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 41. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=8.3ms (klatka 999)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 999 (dt=35.6ms, wykonanie=8.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 42. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=5.9ms (klatka 1140)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1140 (dt=36.0ms, wykonanie=5.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 43. [FRAME_STUTTER] Przycięcie klatki: dt=34.5ms, exec=7.4ms (klatka 1197)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1197 (dt=34.5ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 44. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.4ms (wystąpiło 4 razy, klatki 1200-1212, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1212 (dt=35.9ms, wykonanie=4.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 45. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=6.1ms (wystąpiło 2 razy, klatki 1402-1407, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1407 (dt=36.0ms, wykonanie=7.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 46. [FRAME_STUTTER] Przycięcie klatki: dt=35.7ms, exec=5.4ms (klatka 1418)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1418 (dt=35.7ms, wykonanie=5.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 47. [FRAME_STUTTER] Przycięcie klatki: dt=35.6ms, exec=5.4ms (klatka 1432)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1432 (dt=35.6ms, wykonanie=5.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 48. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=5.1ms (klatka 1441)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1441 (dt=36.0ms, wykonanie=5.1ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 49. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.7ms (wystąpiło 2 razy, klatki 1459-1468, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1468 (dt=35.6ms, wykonanie=6.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 50. [FRAME_STUTTER] Przycięcie klatki: dt=36.1ms, exec=8.8ms (klatka 1512)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1512 (dt=36.1ms, wykonanie=8.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 51. [FRAME_STUTTER] Przycięcie klatki: dt=35.5ms, exec=7.4ms (wystąpiło 3 razy, klatki 1515-1524, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1524 (dt=36.0ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 52. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=6.0ms (klatka 1549)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1549 (dt=36.0ms, wykonanie=6.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 53. [FRAME_STUTTER] Przycięcie klatki: dt=36.0ms, exec=7.6ms (klatka 2002)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 2002 (dt=36.0ms, wykonanie=7.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
