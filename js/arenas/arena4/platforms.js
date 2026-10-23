// =========================================================================
// ARENAS/ARENA4/PLATFORMS.JS - GEOMETRIA PLATFORM PĘDZĄCEGO POCIĄGU PANCERNEGO
// Moduł Areny 4 (Soldat-like 2D Speeding Armored Train - Modern Military)
// =========================================================================

export function createTrainPlatforms() {
  const platforms = [
    // =====================================================================
    // 1. CZŁON 1: WAGON OGONOWY / ZBROJOWNIA (CABOOSE: X = 200..920)
    // =====================================================================
    // Ciągły dach pancerny wagonu zbrojowni (jednolita płyta od krawędzi do krawędzi)
    {
      id: 'train_caboose_roof',
      type: 'solid',
      isDropThrough: false,
      theme: 'industrial',
      x: 200,
      w: 720,
      y: 410,
      h: 22,
      thickness: 22
    },
    // Osłona dachowa: Agregat wentylacyjny (szerokość 70px, wysokość 35px)
    {
      id: 'train_w1_roof_ac_unit',
      type: 'solid',
      theme: 'industrial',
      x: 520,
      w: 70,
      y: 375,
      h: 35,
      thickness: 35
    },
    // Podłoga wewnętrzna zbrojowni
    {
      id: 'train_caboose_floor',
      type: 'solid',
      x: 200,
      w: 720,
      y: 820,
      h: 30,
      thickness: 30
    },
    // Tylna płyta zaporowa ogona (Solid Wall)
    {
      id: 'train_caboose_rear_wall',
      type: 'solid',
      isWall: true,
      x: 195,
      y: 410,
      w: 25,
      h: 440,
      thickness: 25
    },

    // =====================================================================
    // 2. CZŁON 2: WAGON SZTABOWY / DOWODZENIE (COMMAND: X = 960..1720)
    // =====================================================================
    // Ciągły dach pancerny wagonu sztabowego (jednolita płyta od krawędzi do krawędzi)
    {
      id: 'train_command_roof',
      type: 'solid',
      isDropThrough: false,
      theme: 'industrial',
      x: 960,
      w: 760,
      y: 410,
      h: 22,
      thickness: 22
    },
    // Osłona dachowa: Niska skrzynia techniczna (szerokość 60px, wysokość 25px)
    {
      id: 'train_w2_roof_crate',
      type: 'solid',
      theme: 'industrial',
      x: 1450,
      w: 60,
      y: 385,
      h: 25,
      thickness: 25
    },
    // Wnętrze: Blok serwerowy (wysoka ciemnoszara bryła z diodami LED)
    {
      id: 'train_w2_server_block',
      type: 'solid',
      theme: 'industrial',
      x: 1250,
      w: 180,
      y: 670,
      h: 150,
      thickness: 150
    },
    // Podłoga wagonu sztabowego
    {
      id: 'train_command_floor',
      type: 'solid',
      x: 960,
      w: 760,
      y: 820,
      h: 30,
      thickness: 30
    },

    // =====================================================================
    // 3. CZŁON 3: WAGON CENTRALNY / CARGO (X = 1780..2540)
    // =====================================================================
    // Ciągły dach pancerny wagonu cargo (jednolita płyta od krawędzi do krawędzi)
    {
      id: 'train_central_roof',
      type: 'solid',
      isDropThrough: false,
      theme: 'industrial',
      x: 1780,
      w: 760,
      y: 410,
      h: 22,
      thickness: 22
    },
    // Osłona dachowa: Lewa niska barierka ochronna
    {
      id: 'train_w3_roof_barrier_left',
      type: 'solid',
      theme: 'industrial',
      x: 1815,
      w: 40,
      y: 385,
      h: 25,
      thickness: 25
    },
    // Osłona dachowa: Prawa niska barierka ochronna
    {
      id: 'train_w3_roof_barrier_right',
      type: 'solid',
      theme: 'industrial',
      x: 2465,
      w: 40,
      y: 385,
      h: 25,
      thickness: 25
    },
    // Wnętrze: Dwa ułożone na sobie kontenery cargo z pasami ostrzegawczymi
    // Dolny szeroki kontener cargo
    {
      id: 'train_w3_cargo_lower',
      type: 'solid',
      theme: 'industrial',
      x: 1950,
      w: 420,
      y: 690,
      h: 130,
      thickness: 130
    },
    // Górny kontener cargo leżący na dolnym
    {
      id: 'train_w3_cargo_upper',
      type: 'solid',
      theme: 'industrial',
      x: 2030,
      w: 260,
      y: 560,
      h: 130,
      thickness: 130
    },
    // Podłoga wagonu centralnego
    {
      id: 'train_central_floor',
      type: 'solid',
      x: 1780,
      w: 760,
      y: 820,
      h: 30,
      thickness: 30
    },

    // =====================================================================
    // 4. CZŁON 4: WAGON TOWAROWY / PLATFORMA KONTENEROWA (CARGO: X = 2600..3360)
    // =====================================================================
    // Ciągły dach kontenerowy wagonu towarowego
    {
      id: 'train_cargo_roof',
      type: 'solid',
      isDropThrough: false,
      theme: 'industrial',
      x: 2600,
      w: 760,
      y: 410,
      h: 22,
      thickness: 22
    },
    // Podłoga wagonu towarowego
    {
      id: 'train_cargo_floor',
      type: 'solid',
      x: 2600,
      w: 760,
      y: 820,
      h: 30,
      thickness: 30
    },

    // =====================================================================
    // 5. CZŁON 5: LOKOMOTYWA PANCERNA (LOCOMOTIVE & PLOW: X = 3420..3960)
    // =====================================================================
    // Ciągły dach kabiny lokomotywy
    {
      id: 'train_loco_roof',
      type: 'solid',
      isDropThrough: false,
      theme: 'industrial',
      x: 3420,
      w: 530,
      y: 390,
      h: 22,
      thickness: 22
    },
    // Przedni pomost obserwacyjny nad pługiem
    {
      id: 'train_loco_cowcatcher_deck',
      type: 'catwalk',
      theme: 'industrial',
      x: 3770,
      w: 160,
      y: 650,
      h: 20,
      thickness: 20
    },
    // Pług czołowy (Ściana blokująca uderzenie z przodu)
    {
      id: 'train_loco_front_plow',
      type: 'solid',
      isWall: true,
      x: 3940,
      y: 480,
      w: 30,
      h: 370,
      thickness: 30
    },
    // Podłoga lokomotywy
    {
      id: 'train_loco_floor',
      type: 'solid',
      x: 3420,
      w: 530,
      y: 820,
      h: 30,
      thickness: 30
    }
  ];

  return platforms;
}

export const ARENA_4_PLATFORMS = createTrainPlatforms();
