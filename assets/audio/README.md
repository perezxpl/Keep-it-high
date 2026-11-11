# Zewnetrzne pliki dzwiekowe (`assets/audio/`)

Gra korzysta wylacznie z prawdziwych nagran audio w domenie publicznej (**CC0 1.0 Universal**) zapisanych w tym katalogu (sztuczna synteza rozgrywki w `js/audio/state.js` jest wylaczona flaga `ENABLE_GAMEPLAY_SYNTH: false`).

## Zrodla uzytych paczek CC0 1.0 (Public Domain)
- **Free Firearm Sound Library (`buddingmonkey/FreeFirearmsSFXLibrary`, CC0 1.0)** — 192 kHz sciezki Master Tracks zza strzelca (bez przesuniec fazowych mikrofonow frontowych): AK-47, Benelli Nova, Winchester Model 12, Tikka, Walther PPQ 9mm, Smith & Wesson, a takze prawdziwe mechaniki broni (przeladowanie, suchy strzal, magazynek, suwadlo, przeladowanie strzelby).
- **Kenney Impact, RPG & Sci-Fi Sounds (`CC0 1.0`)** — trafienia w cialo (`impact_punch_*`), trafienia w kamizelke i tarcze (`impact_plate_*`, `impact_metal_*`), rykoszety (`impact_tin_*`, `impact_generic_*`), tupniecie Enforcera (`impact_mining_*`), kopniecia i odbicia pilki (`impact_soft_*`), slupek (`impact_bell_heavy_*`), skok i ladowanie (`footstep_concrete_*`), sub-basowy wstrzas eksplozji (`lowFrequency_explosion_*`, `explosionCrunch_*`), rzut (`cloth3`), oraz interfejs UI (`ui_click`, `ui_pause`, `ui_resume`).
- **OpenGameArt CC0 & `lavenderdotpet/CC0-Public-Domain-Sounds` (`CC0 1.0 Universal`)** — wielowarstwowe eksplozje plenerowe i przeciwpancerne (`25-CC0-bang-firework-sfx` + `Warfork CC0` + `Muffled Distant Explosion` + `BB_2HTC Boom`), szybkie ciecia ostrza i rzuty (`Micro Pack - Organic Wooshes/Slash`, `Swishes Sound Pack`, `War on Water/throwgrenade`), rakieta RPG-7 (`missile.wav`), dopalacz Rocket Boots (`sci-fi-sfx/rocket_01.ogg`), plynna petla silnika odrzutowego (`engine_loop.ogg`), headshot i rozczlonkowanie (`Wet Break 1..3`), krotkie okrzyki smierci (`death_pain_grunts`), fanfara bramki (`theircoming3.ogg`), syrena i dzwonek testowy (`alarm2.ogg`, `Ding.ogg`).

## Podmiana dowolnego dzwieku na wlasny

Jesli chcesz zastapic wybrany efekt wlasnym nagraniem (`.wav`, `.ogg`, `.mp3`, `.webm`), **nie musisz modyfikowac kodu JavaScript**:

1. Wrzuc plik do katalogu `assets/audio/`.
2. Zaktualizuj odpowiedni wpis w `assets/audio/manifest.json`:

```json
"weapon_ak47": {
  "src": ["weapon_ak47_1.wav", "weapon_ak47_2.wav"],
  "volume": 1.10,
  "pitchJitter": 0.03
}
```

Silnik automatycznie wybierze losowy wariant z tablicy, zastosuje opcjonalny `volume`, `pitchJitter` i `loop`.
W konsoli przegladarki mozesz przetestowac kazdy efekt komenda `KeepItHighAudio.test('weapon_ak47')` albo wyswietlic wszystkie ID przez `KeepItHighAudio.list()`.
