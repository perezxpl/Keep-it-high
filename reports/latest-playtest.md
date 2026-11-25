# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 25.11.2026, 09:28:36
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (9)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.3 s (1050 przetworzonych klatek, 990 analizowanych)
- **Średni FPS:** **59.6 FPS** (średni czas klatki: 16.77 ms)
- **1% Low FPS:** **55.2 FPS** (99. percentyl czasu klatki: 18.1 ms)
- **Maksymalny czas wykonania klatki (exec):** 20.2 ms
- **Maksymalny odstęp między klatkami (dt):** 18.1 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 0
- **Średnie Draw Calls / klatkę (GPU):** **1113** (fill: 409, stroke: 597, drawImage: 107, arc: 217, quadraticCurveTo: 596, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1462**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 0 | OK |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 9 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1297 > 1275 (wystąpiło 11 razy, klatki 407-417, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 417: totalDrawCalls=1307 (fill=517, stroke=692, drawImage=98, arc=316, quadraticCurveTo=658). Arena: ARENA_3.

### 2. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1283 > 1275 (wystąpiło 11 razy, klatki 589-599, trwanie: 11 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 599: totalDrawCalls=1285 (fill=487, stroke=662, drawImage=136, arc=264, quadraticCurveTo=647). Arena: ARENA_3.

### 3. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1311 > 1275 (wystąpiło 9 razy, klatki 600-608, trwanie: 9 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 608: totalDrawCalls=1307 (fill=500, stroke=675, drawImage=132, arc=290, quadraticCurveTo=661). Arena: ARENA_3.

### 4. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1328 > 1275 (wystąpiło 18 razy, klatki 672-689, trwanie: 18 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 689: totalDrawCalls=1330 (fill=544, stroke=691, drawImage=95, arc=322, quadraticCurveTo=638). Arena: ARENA_3.

### 5. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1316 > 1275 (wystąpiło 30 razy, klatki 690-719, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 719: totalDrawCalls=1347 (fill=540, stroke=699, drawImage=108, arc=365, quadraticCurveTo=636). Arena: ARENA_3.

### 6. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1347 > 1275 (wystąpiło 21 razy, klatki 720-740, trwanie: 21 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 740: totalDrawCalls=1324 (fill=532, stroke=684, drawImage=108, arc=327, quadraticCurveTo=638). Arena: ARENA_3.

### 7. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1347 > 1275 (wystąpiło 10 razy, klatki 980-989, trwanie: 10 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 989: totalDrawCalls=1363 (fill=551, stroke=719, drawImage=93, arc=387, quadraticCurveTo=657). Arena: ARENA_3.

### 8. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1367 > 1275 (wystąpiło 30 razy, klatki 990-1019, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1019: totalDrawCalls=1458 (fill=616, stroke=755, drawImage=87, arc=418, quadraticCurveTo=652). Arena: ARENA_3.

### 9. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1458 > 1275 (wystąpiło 30 razy, klatki 1020-1049, trwanie: 30 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 1049: totalDrawCalls=1438 (fill=612, stroke=741, drawImage=85, arc=424, quadraticCurveTo=652). Arena: ARENA_3.
