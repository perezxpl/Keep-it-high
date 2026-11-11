# Zewnetrzne pliki dzwiekowe (`assets/audio/`)

Gra korzysta wylacznie z prawdziwych nagran audio w domenie publicznej (**CC0 1.0**) zapisanych w tym katalogu (sztuczna synteza rozgrywki w `js/audio/state.js` jest wylaczona flaga `ENABLE_GAMEPLAY_SYNTH: false`).

## Zrodla uzytych paczek CC0 1.0 (Public Domain)
- **Free Firearm Sound Library (`buddingmonkey/FreeFirearmsSFXLibrary`, CC0 1.0)** — prawdziwe nagrania strzalow (AK-47, Benelli Nova, Winchester Model 12, Tikka, Walther PPQ 9mm, 1911).
- **Kenney Interface Sounds (`CC0 1.0`)** — klikniecia, suwaki i przejscia interfejsu UI (`ui_click`, `ui_pause`, `ui_resume`, `weapon_dry_fire`).
- **OpenGameArt (`CC0 1.0`)** — eksplozje, odglosy przeladowania i zamkow, uderzenia metal/ciasto, chlasty mieczy, silniki odrzutowe, para/tloki, alarm, dzwonek testowy, skoki i okrzyki bolu.

## Podmiana dowolnego dzwieku na wlasny

Jesli chcesz zastapic wybrany efekt wlasnym nagraniem (`.wav`, `.ogg`, `.mp3`, `.webm`), **nie musisz modyfikowac kodu JavaScript**:

1. Wrzuć plik do katalogu `assets/audio/`.
2. Zaktualizuj odpowiedni wpis w `assets/audio/manifest.json`:

```json
"weapon_ak47": {
  "src": ["weapon_ak47_1.wav", "weapon_ak47_2.wav"],
  "volume": 0.9,
  "pitchJitter": 0.05
}
```

Silnik automatycznie wybierze losowy wariant z tablicy, zastosuje opcjonalny `volume`, `pitchJitter` i `loop`.
W konsoli przegladarki mozesz przetestowac kazdy efekt komenda `KeepItHighAudio.test('weapon_ak47')` albo wyswietlic wszystkie ID przez `KeepItHighAudio.list()`.
