# Zewnętrzne pliki dźwiękowe (`assets/audio/`)

Domyślnie gra korzysta z wbudowanej syntezy Web Audio API (`js/audio/synth.js`) dla każdego efektu.
Jeśli chcesz zastąpić dowolny dźwięk własnym nagraniem lub paczką sampli z internetu (np. `.wav`, `.ogg`, `.mp3`, `.webm`), **nie musisz modyfikować kodu JavaScript**:

1. Wrzuć wybrany plik dźwiękowy do katalogu `assets/audio/` (możesz tworzyć podkatalogi, np. `assets/audio/weapons/ak47.wav`).
2. Otwórz plik `assets/audio/manifest.json` i zamień `null` przy wybranym identyfikatorze na nazwę pliku (względem `assets/audio/`):

```json
"weapon_ak47": "weapons/ak47.wav"
```

## Losowe warianty i dostrajanie głośności

Możesz podać tablicę wariantów (silnik losowo wybierze jeden z nich przy każdym odtworzeniu):

```json
"hit_ricochet": [
  "hits/ricochet_1.ogg",
  "hits/ricochet_2.ogg",
  "hits/ricochet_3.ogg"
]
```

Możesz też przekazać obiekt z osobnym wzmocnieniem głośności (`volume`) oraz zakresem losowej zmiany wysokości dźwięku (`pitchJitter`, np. `0.08` = +/- 8%):

```json
"weapon_shotgun": {
  "src": "weapons/spas12.wav",
  "volume": 0.9,
  "pitchJitter": 0.06
}
```

## Automatyczny powrót do syntezy (Fallback)

- Wpisy pozostawione jako `null` automatycznie odtwarzają wbudowaną syntezę Web Audio API.
- Jeśli wskazany plik jeszcze się ładuje, nie istnieje albo ma uszkodzony format, silnik płynnie użyje syntezy zapasowej bez przerywania gry.
- W konsoli przeglądarki możesz na żywo przetestować dowolny dźwięk wpisując:
  `KeepItHighAudio.test('weapon_ak47')` albo wyświetlić listę identyfikatorów: `KeepItHighAudio.list()`.
