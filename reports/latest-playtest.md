# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 16.11.2026, 12:02:48
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (41)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 30.7 s (1120 przetworzonych klatek, 1060 analizowanych)
- **Średni FPS:** **40 FPS** (średni czas klatki: 25.01 ms)
- **1% Low FPS:** **20.7 FPS** (99. percentyl czasu klatki: 48.4 ms)
- **Maksymalny czas wykonania klatki (exec):** 36.9 ms
- **Maksymalny odstęp między klatkami (dt):** 75 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 24
- **Średnie Draw Calls / klatkę (GPU):** **658** (fill: 168, stroke: 397, drawImage: 93, arc: 113, quadraticCurveTo: 248, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1132**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 24 | UWAGA |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU > 650 wywołań) | 17 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [FRAME_STUTTER] Przycięcie klatki: dt=47.7ms, exec=8.4ms (wystąpiło 2 razy, klatki 63-72, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 72 (dt=50.6ms, wykonanie=7.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 2. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=15.8ms (wystąpiło 3 razy, klatki 127-134, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 134 (dt=71.5ms, wykonanie=11.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 3. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 735 > 650 (wystąpiło 19 razy, klatki 131-149, trwanie: 19 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 149: totalDrawCalls=803 (fill=235, stroke=470, drawImage=98, arc=139, quadraticCurveTo=435). Arena: ARENA_3.

### 4. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=7.8ms (wystąpiło 4 razy, klatki 138-149, trwanie: 12 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 149 (dt=75.0ms, wykonanie=7.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 5. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 807 > 650 (wystąpiło 30 razy, klatki 150-179, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 179: totalDrawCalls=981 (fill=305, stroke=549, drawImage=127, arc=177, quadraticCurveTo=600). Arena: ARENA_3.

### 6. [FRAME_STUTTER] Przycięcie klatki: dt=46.0ms, exec=12.1ms (wystąpiło 2 razy, klatki 156-161, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 161 (dt=46.4ms, wykonanie=8.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 7. [FRAME_STUTTER] Przycięcie klatki: dt=42.9ms, exec=6.8ms (wystąpiło 9 razy, klatki 165-179, trwanie: 15 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 179 (dt=36.4ms, wykonanie=11.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 8. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 981 > 650 (wystąpiło 30 razy, klatki 180-209, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 209: totalDrawCalls=1003 (fill=303, stroke=576, drawImage=124, arc=205, quadraticCurveTo=600). Arena: ARENA_3.

### 9. [FRAME_STUTTER] Przycięcie klatki: dt=36.5ms, exec=8.7ms (wystąpiło 6 razy, klatki 181-191, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 191 (dt=48.2ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 10. [FRAME_STUTTER] Przycięcie klatki: dt=51.1ms, exec=8.8ms (wystąpiło 6 razy, klatki 195-208, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 208 (dt=30.3ms, wykonanie=11.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 11. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1003 > 650 (wystąpiło 30 razy, klatki 210-239, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 239: totalDrawCalls=887 (fill=250, stroke=519, drawImage=118, arc=136, quadraticCurveTo=487). Arena: ARENA_3.

### 12. [FRAME_STUTTER] Przycięcie klatki: dt=53.4ms, exec=11.9ms (wystąpiło 5 razy, klatki 210-222, trwanie: 13 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 222 (dt=48.1ms, wykonanie=8.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 13. [FRAME_STUTTER] Przycięcie klatki: dt=42.8ms, exec=12.9ms (wystąpiło 8 razy, klatki 226-239, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 239 (dt=48.4ms, wykonanie=14.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 14. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 883 > 650 (wystąpiło 30 razy, klatki 240-269, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 269: totalDrawCalls=880 (fill=254, stroke=516, drawImage=110, arc=113, quadraticCurveTo=487). Arena: ARENA_3.

### 15. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=8.1ms (wystąpiło 3 razy, klatki 241-254, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 254 (dt=48.2ms, wykonanie=16.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 16. [FRAME_STUTTER] Przycięcie klatki: dt=48.1ms, exec=6.7ms (klatka 255)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 255 (dt=48.1ms, wykonanie=6.7ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 17. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 903 > 650 (wystąpiło 30 razy, klatki 270-299, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 299: totalDrawCalls=941 (fill=284, stroke=541, drawImage=116, arc=163, quadraticCurveTo=487). Arena: ARENA_3.

### 18. [FRAME_STUTTER] Przycięcie klatki: dt=46.3ms, exec=7.1ms (wystąpiło 2 razy, klatki 270-277, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 277 (dt=43.2ms, wykonanie=12.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 19. [FRAME_STUTTER] Przycięcie klatki: dt=48.5ms, exec=8.8ms (wystąpiło 3 razy, klatki 289-299, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 299 (dt=49.4ms, wykonanie=5.8ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 20. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 938 > 650 (wystąpiło 30 razy, klatki 300-329, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 329: totalDrawCalls=769 (fill=197, stroke=463, drawImage=109, arc=116, quadraticCurveTo=322). Arena: ARENA_3.

### 21. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 768 > 650 (wystąpiło 11 razy, klatki 330-340, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 340: totalDrawCalls=766 (fill=202, stroke=456, drawImage=108, arc=111, quadraticCurveTo=324). Arena: ARENA_3.

### 22. [FRAME_STUTTER] Przycięcie klatki: dt=28.8ms, exec=5.6ms (klatka 385)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 385 (dt=28.8ms, wykonanie=5.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 23. [FRAME_STUTTER] Przycięcie klatki: dt=29.8ms, exec=11.2ms (klatka 580)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 580 (dt=29.8ms, wykonanie=11.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 4, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 24. [FRAME_STUTTER] Przycięcie klatki: dt=28.2ms, exec=7.4ms (klatka 685)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 685 (dt=28.2ms, wykonanie=7.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 25. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=12.4ms (wystąpiło 4 razy, klatki 694-701, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 701 (dt=30.0ms, wykonanie=8.2ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 26. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 761 > 650 (wystąpiło 4 razy, klatki 716-719, trwanie: 4 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 719: totalDrawCalls=760 (fill=212, stroke=458, drawImage=90, arc=133, quadraticCurveTo=324). Arena: ARENA_3.

### 27. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 760 > 650 (wystąpiło 30 razy, klatki 720-749, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 749: totalDrawCalls=790 (fill=222, stroke=458, drawImage=110, arc=167, quadraticCurveTo=324). Arena: ARENA_3.

### 28. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 790 > 650 (wystąpiło 30 razy, klatki 750-779, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 779: totalDrawCalls=776 (fill=216, stroke=461, drawImage=99, arc=132, quadraticCurveTo=324). Arena: ARENA_3.

### 29. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 774 > 650 (wystąpiło 30 razy, klatki 780-809, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 809: totalDrawCalls=759 (fill=207, stroke=461, drawImage=91, arc=111, quadraticCurveTo=324). Arena: ARENA_3.

### 30. [FRAME_STUTTER] Przycięcie klatki: dt=28.3ms, exec=7.3ms (klatka 784)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 784 (dt=28.3ms, wykonanie=7.3ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 31. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 759 > 650 (wystąpiło 30 razy, klatki 810-839, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 839: totalDrawCalls=759 (fill=206, stroke=461, drawImage=92, arc=122, quadraticCurveTo=328). Arena: ARENA_3.

### 32. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 753 > 650 (wystąpiło 30 razy, klatki 840-869, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 869: totalDrawCalls=827 (fill=230, stroke=486, drawImage=111, arc=137, quadraticCurveTo=328). Arena: ARENA_3.

### 33. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 820 > 650 (wystąpiło 30 razy, klatki 870-899, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 899: totalDrawCalls=774 (fill=205, stroke=464, drawImage=105, arc=116, quadraticCurveTo=328). Arena: ARENA_3.

### 34. [FRAME_STUTTER] Przycięcie klatki: dt=51.4ms, exec=6.0ms (klatka 877)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 877 (dt=51.4ms, wykonanie=6.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 35. [FRAME_STUTTER] Przycięcie klatki: dt=48.4ms, exec=7.9ms (klatka 899)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 899 (dt=48.4ms, wykonanie=7.9ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 36. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 768 > 650 (wystąpiło 30 razy, klatki 900-929, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 929: totalDrawCalls=753 (fill=195, stroke=460, drawImage=98, arc=107, quadraticCurveTo=324). Arena: ARENA_3.

### 37. [FRAME_STUTTER] Przycięcie klatki: dt=48.2ms, exec=9.6ms (klatka 903)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 903 (dt=48.2ms, wykonanie=9.6ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 38. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 749 > 650 (wystąpiło 8 razy, klatki 930-937, trwanie: 8 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 937: totalDrawCalls=745 (fill=196, stroke=460, drawImage=89, arc=99, quadraticCurveTo=324). Arena: ARENA_3.

### 39. [FRAME_STUTTER] Przycięcie klatki: dt=35.9ms, exec=8.7ms (wystąpiło 2 razy, klatki 930-934, trwanie: 5 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 934 (dt=30.7ms, wykonanie=7.5ms > limit 28ms). Arena: ARENA_3, żywe postacie: 6, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 40. [FRAME_STUTTER] Przycięcie klatki: dt=30.0ms, exec=14.0ms (klatka 1060)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1060 (dt=30.0ms, wykonanie=14.0ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.

### 41. [FRAME_STUTTER] Przycięcie klatki: dt=30.6ms, exec=6.7ms (wystąpiło 2 razy, klatki 1084-1089, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano spadek płynności w klatce 1089 (dt=29.6ms, wykonanie=4.4ms > limit 28ms). Arena: ARENA_3, żywe postacie: 5, pociski: 0, cząsteczki: 0, krew: 0, opadające klocki: 0, wybuchy linii: 0.
