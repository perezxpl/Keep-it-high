# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)

> Data testu: 24.11.2026, 08:29:12
> Tryb diagnostyczny: **ŚCISŁY (strict=1)**
> Status końcowy: **CZYSTO - BRAK ANOMALII**

## 1. Statystyki Wydajności i Płynności (FPS)
- **Czas trwania testu:** 15.4 s (643 przetworzonych klatek, 583 analizowanych)
- **Średni FPS:** **59.4 FPS** (średni czas klatki: 16.83 ms)
- **1% Low FPS:** **55.2 FPS** (99. percentyl czasu klatki: 18.1 ms)
- **Maksymalny czas wykonania klatki (exec):** 26.9 ms
- **Maksymalny odstęp między klatkami (dt):** 18.3 ms
- **Liczba przycięć (FRAME_STUTTER > 28 ms):** 0
- **Średnie Draw Calls / klatkę (GPU):** **999** (fill: 358, stroke: 537, drawImage: 104, arc: 178, quadraticCurveTo: 575, clip: 0)
- **Maksymalne Draw Calls / klatkę (GPU):** **1256**

## 2. Podsumowanie Wykrytych Zdarzeń Fizyki
| Kategoria Anomalii | Liczba Zdarzeń | Status |
| :--- | :---: | :---: |
| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | 0 | OK |
| **BLOCK_PENETRATION** (Wnikanie w lite klocki > 4px) | 0 | OK |
| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | 0 | OK |
| **SURFACE_JITTER** (Migotanie onGround na platformach) | 0 | OK |
| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | 0 | OK |
| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | 0 | OK |
| **HIGH_DRAW_CALLS** (Przeciążenie GPU powyżej limitu) | 0 | OK |

## 3. Szczegółowa Lista Zdarzeń
> STATUS: CZYSTO. Wszystkie postacie i klocki poruszały się zgodnie z prawami fizyki silnika.
> Nie wykryto żadnych anomalii kolizyjnych, zacięć bloków ani krytycznych przycięć wydajności.