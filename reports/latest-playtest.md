# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 25.11.2026, 08:48:59
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **WYKRYTO ANOMALIE (2)**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 20.3 s (1060 przetworzonych klatek, 1000 analizowanych)
- **Średni FPS:** **59.6 FPS** (średni czas klatki: 16.78 ms)
- **1% Low FPS:** **55.2 FPS** (99. percentyl czasu klatki: 18.1 ms)
- **Maksymalny czas wykonania klatki (exec):** 18.7 ms
- **Maksymalny odstęp między klatkami (dt):** 18.2 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 0
- **Średnie Draw Calls / klatkę (GPU):** **901** (fill: 311, stroke: 485, drawImage: 104, arc: 170, quadraticCurveTo: 455, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1307**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 0 | OK |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 2 | UWAGA |

## 3. Szczegółowa Lista Wykrytych Zdarzeń

### 1. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1301 > 1275 (wystąpiło 13 razy, klatki 330-343, trwanie: 14 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 343: totalDrawCalls=1280 (fill=500, stroke=668, drawImage=112, arc=348, quadraticCurveTo=663). Arena: ARENA_3.

### 2. [HIGH_DRAW_CALLS] Przekroczony limit Draw Calls: 1301 > 1275 (wystąpiło 6 razy, klatki 368-373, trwanie: 6 klatek)
- **Opis techniczny:** Zarejestrowano wysokie obciążenie Canvas 2D w klatce 373: totalDrawCalls=1289 (fill=508, stroke=679, drawImage=102, arc=349, quadraticCurveTo=661). Arena: ARENA_3.
