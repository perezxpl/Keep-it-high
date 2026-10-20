// =============================================================================
// JS/LOADOUT/ARMORYUI.JS - WOJSKOWA ZBROJOWNIA // MODUŁ EKWIPUNKU I KIESZENI
// Minimalistyczny interfejs militarny, Orbitron/Rajdhani, ZERO EMOJIS
// =============================================================================

import { WEAPONS } from '../weapons/transform.js';
import { saveStoredLoadout } from './state.js';
import { equipPocket1Slot } from './logic.js';
import { playUiClick, playUiHover } from '../uiManager.js';

/**
 * Katalog taktyczny uzbrojenia dla Zbrojowni
 */
export const ARMORY_CATALOG = {
  pocket1: {
    slot0: [
      {
        id: 'AK47',
        name: 'AK-47',
        fullName: 'Karabin Szturmowy AK-47',
        category: 'GŁÓWNA',
        caliber: '7.62x39MM SOVIET',
        typeLabel: 'AUTOMATYCZNY',
        dmg: 26,
        rpm: 600,
        mag: 30,
        reserve: 90,
        reload: '2.2s',
        stats: { dmgBar: 65, rpmBar: 85, magBar: 80, relBar: 65 },
        desc: 'Uniwersalny karabin automatyczny o wysokiej sile ognia i stabilnej balistyce na średnim dystansie.'
      },
      {
        id: 'SHOTGUN',
        name: 'SPAS-12',
        fullName: 'Strzelba Bojowa SPAS-12',
        category: 'GŁÓWNA',
        caliber: '12 GAUGE BUCKSHOT',
        typeLabel: 'PUMP-ACTION',
        dmg: 112,
        rpm: 75,
        mag: 8,
        reserve: 64,
        reload: '2.4s',
        stats: { dmgBar: 95, rpmBar: 25, magBar: 40, relBar: 55 },
        desc: 'Potężna strzelba gładkolufowa bliskiego zasięgu. Ekstremalny odrzut kinetyczny i rozrywanie celów.'
      },
      {
        id: 'SNIPER',
        name: 'BARRETT .50',
        fullName: 'Karabin Wyborowy Barrett .50',
        category: 'GŁÓWNA',
        caliber: '.50 BMG (12.7x99MM)',
        typeLabel: 'BOLT-ACTION',
        dmg: 120,
        rpm: 55,
        mag: 5,
        reserve: 25,
        reload: '2.8s',
        stats: { dmgBar: 100, rpmBar: 18, magBar: 25, relBar: 40 },
        desc: 'Ciężki karabin przeciwsprzętowy dalekiego zasięgu z celownikiem laserowym i dekapitacją jednym strzałem.'
      }
    ],
    slot1: [
      {
        id: 'GLOCK',
        name: 'GLOCK 17',
        fullName: 'Pistolet Wojskowy Glock 17',
        category: 'DODATKOWA',
        caliber: '9x19MM PARABELLUM',
        typeLabel: 'SEMI-AUTO',
        dmg: 24,
        rpm: 200,
        mag: 17,
        reserve: 68,
        reload: '1.4s',
        stats: { dmgBar: 45, rpmBar: 60, magBar: 65, relBar: 92 },
        desc: 'Niezawodny pistolet boczny o błyskawicznym przeładowaniu. Idealny do szybkiego dobijania wrogów po wyczerpaniu magazynka.'
      }
    ],
    slot2: [
      {
        id: 'SNIPER',
        name: 'BARRETT .50',
        fullName: 'Barrett .50 (Rezerwa Wyborowa)',
        category: 'REZERWA',
        caliber: '.50 BMG',
        typeLabel: 'BOLT-ACTION',
        dmg: 120,
        rpm: 55,
        mag: 5,
        reserve: 25,
        reload: '2.8s',
        stats: { dmgBar: 100, rpmBar: 18, magBar: 25, relBar: 40 },
        desc: 'Konfiguracja rezerwowa pod daleki zasięg eliminacji celów.'
      },
      {
        id: 'SHOTGUN',
        name: 'SPAS-12',
        fullName: 'SPAS-12 (Rezerwa Szturmowa)',
        category: 'REZERWA',
        caliber: '12 GAUGE',
        typeLabel: 'PUMP-ACTION',
        dmg: 112,
        rpm: 75,
        mag: 8,
        reserve: 64,
        reload: '2.4s',
        stats: { dmgBar: 95, rpmBar: 25, magBar: 40, relBar: 55 },
        desc: 'Zabezpieczenie na wypadek walki w ciasnych przejściach i korytarzach.'
      },
      {
        id: 'AK47',
        name: 'AK-47',
        fullName: 'AK-47 (Rezerwa Bojowa)',
        category: 'REZERWA',
        caliber: '7.62x39MM',
        typeLabel: 'AUTOMATYCZNY',
        dmg: 26,
        rpm: 600,
        mag: 30,
        reserve: 90,
        reload: '2.2s',
        stats: { dmgBar: 65, rpmBar: 85, magBar: 80, relBar: 65 },
        desc: 'Wszechstronny karabin rezerwowy na każdą sytuację bojową.'
      }
    ]
  },
  pocket2: [
    {
      id: 'GRENADE',
      name: 'M67 FRAG',
      fullName: 'Granat Odłamkowy M67 HE',
      category: 'MIOTANA',
      caliber: 'MATERIAŁ COMP B (180G)',
      typeLabel: 'TAKTYCZNY',
      dmg: 130,
      radius: '180 PX',
      fuse: '5.0s (OD ZAWLECZKI)',
      stats: { dmgBar: 100, radBar: 90, fuseBar: 75 },
      desc: 'Gotowanie zapalnika od wyciągnięcia zawleczki. Destrukcja odłamkowa, tworzenie kraterów i niszczenie platform.'
    }
  ]
};

let _activeSlotIndex = 0; // 0 = Główna, 1 = Dodatkowa, 2 = Rezerwa, 3 = Miotana (Pocket 2)
let _currentArmoryView = 'SLOTS'; // 'SLOTS' (Przegląd slotów) lub 'PICKER' (Okno wyboru broni dla slotu)
let _playerRef = null;
let _closeCallback = null;

/**
 * Pobranie danych uzbrojenia z katalogu taktycznego
 */
export function getCatalogWeapon(id, categoryType = null) {
  if (categoryType === 'slot0') {
    const found = ARMORY_CATALOG.pocket1.slot0.find(w => w.id === id);
    if (found) return found;
  } else if (categoryType === 'slot1') {
    const found = ARMORY_CATALOG.pocket1.slot1.find(w => w.id === id);
    if (found) return found;
  } else if (categoryType === 'slot2') {
    const found = ARMORY_CATALOG.pocket1.slot2.find(w => w.id === id);
    if (found) return found;
  } else if (categoryType === 'throw') {
    const found = ARMORY_CATALOG.pocket2.find(w => w.id === id);
    if (found) return found;
  }

  const all = [
    ...ARMORY_CATALOG.pocket1.slot0,
    ...ARMORY_CATALOG.pocket1.slot1,
    ...ARMORY_CATALOG.pocket1.slot2,
    ...ARMORY_CATALOG.pocket2
  ];
  const item = all.find(w => w.id === id);
  if (item) return item;

  const raw = (WEAPONS && WEAPONS[id]) ? WEAPONS[id] : (WEAPONS?.AK47 || {});
  return {
    id: id,
    name: raw.name || id,
    fullName: raw.fullName || raw.name || id,
    category: raw.category || 'BROŃ',
    caliber: raw.caliber || '7.62MM',
    typeLabel: raw.auto ? 'AUTOMATYCZNY' : 'SEMI-AUTO',
    dmg: raw.damage || 25,
    rpm: Math.round(60 / ((raw.fireRate || 10) / 60)) || 600,
    mag: raw.magSize || 30,
    reserve: raw.maxReserve || 90,
    reload: `${((raw.reloadTime || 120) / 60).toFixed(1)}s`,
    stats: { dmgBar: 60, rpmBar: 70, magBar: 70, relBar: 65 },
    desc: 'Standardowe wyposażenie taktyczne pola walki.'
  };
}

/**
 * Inicjalizacja nasłuchu zdarzeń dla Zbrojowni
 */
export function initArmoryUI(playerInstance) {
  if (playerInstance) {
    _playerRef = playerInstance;
  }

  const armoryOverlay = document.getElementById('armory-overlay');
  const closeBtn = document.getElementById('armory-close-btn');
  const saveBtn = document.getElementById('armory-save-btn');
  const pickerCloseBtn = document.getElementById('armory-picker-close-btn');
  const pickerBackBtn = document.getElementById('armory-picker-back-btn');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeArmory());
  }
  if (saveBtn) {
    saveBtn.addEventListener('click', () => closeArmory());
  }
  if (pickerCloseBtn) {
    pickerCloseBtn.addEventListener('click', () => closeSlotPicker());
  }
  if (pickerBackBtn) {
    pickerBackBtn.addEventListener('click', () => closeSlotPicker());
  }

  // Kafelki slotów w widoku głównym ekwipunku
  for (let i = 0; i < 3; i++) {
    const slotCard = document.getElementById(`armory-slot-card-${i}`);
    if (slotCard) {
      slotCard.addEventListener('mouseenter', () => playUiHover());
      slotCard.addEventListener('click', () => openSlotPicker(i));
    }
  }

  const slotThrowCard = document.getElementById('armory-slot-card-throwable');
  if (slotThrowCard) {
    slotThrowCard.addEventListener('mouseenter', () => playUiHover());
    slotThrowCard.addEventListener('click', () => openSlotPicker(3));
  }

  // Zamknięcie klawiszem ESC / Powrót z podokna do przeglądu slotów
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (armoryOverlay && armoryOverlay.style.display === 'flex') {
        const pickerModal = document.getElementById('armory-picker-modal');
        if (pickerModal && pickerModal.style.display !== 'none') {
          closeSlotPicker();
        } else {
          closeArmory();
        }
      }
    }
  });
}

/**
 * Otwarcie modalnego okna Zbrojowni (zawsze zaczyna od widoku slotów)
 */
export function openArmory(playerInstance = null, onClose = null) {
  if (playerInstance) _playerRef = playerInstance;
  if (onClose) _closeCallback = onClose;

  const overlay = document.getElementById('armory-overlay');
  if (!overlay) return;

  _currentArmoryView = 'SLOTS';
  const pickerModal = document.getElementById('armory-picker-modal');
  if (pickerModal) {
    pickerModal.style.display = 'none';
  }

  overlay.style.display = 'flex';
  renderArmoryUI();
}

/**
 * Zamknięcie Zbrojowni i zapis
 */
export function closeArmory() {
  const overlay = document.getElementById('armory-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }

  const pickerModal = document.getElementById('armory-picker-modal');
  if (pickerModal) {
    pickerModal.style.display = 'none';
  }
  _currentArmoryView = 'SLOTS';

  if (_playerRef && _playerRef.loadout) {
    saveStoredLoadout(_playerRef.loadout);
    // Zsynchronizuj bieżącą broń z aktywnym slotem
    const curSlotId = _playerRef.loadout.pocket1?.slots?.[_playerRef.loadout.pocket1?.activeSlotIndex || 0] || 'AK47';
    if (WEAPONS[curSlotId]) {
      _playerRef.currentWeapon = WEAPONS[curSlotId];
    }
  }

  if (typeof _closeCallback === 'function') {
    const cb = _closeCallback;
    _closeCallback = null;
    cb();
  }
}

/**
 * Wejście do dedykowanego okna wyboru broni dla danego slotu
 */
export function openSlotPicker(slotIndex) {
  playUiClick();
  _activeSlotIndex = slotIndex;
  _currentArmoryView = 'PICKER';

  const pickerModal = document.getElementById('armory-picker-modal');
  if (pickerModal) {
    pickerModal.style.display = 'flex';
  }
  renderArmoryUI();
}

/**
 * Powrót z okna wyboru broni do przeglądu slotów ekwipunku
 */
export function closeSlotPicker() {
  playUiClick();
  _currentArmoryView = 'SLOTS';

  const pickerModal = document.getElementById('armory-picker-modal');
  if (pickerModal) {
    pickerModal.style.display = 'none';
  }
  renderArmoryUI();
}

// Globalna ekspozycja dla pewności działania interakcji z HTML
if (typeof window !== 'undefined') {
  window.openSlotPicker = openSlotPicker;
  window.closeSlotPicker = closeSlotPicker;
}

/**
 * Renderowanie dynamicznej zawartości Zbrojowni
 */
export function renderArmoryUI() {
  const p = _playerRef || window.player;
  if (!p || !p.loadout) return;

  const slots = p.loadout.pocket1?.slots || ['AK47', 'GLOCK', 'SNIPER'];
  const throwables = p.loadout.pocket2?.throwables || ['GRENADE'];

  const pickerModal = document.getElementById('armory-picker-modal');

  // -------------------------------------------------------------------------
  // 1. AKTUALIZACJA DANYCH I OBSŁUGI KLIKNIĘĆ W KAFELKI SLOTÓW EKWIPUNKU
  // -------------------------------------------------------------------------
  // Przypisanie obsługi kliknięć bezpośrednio w kafelki (potrójne zabezpieczenie)
  for (let i = 0; i < 3; i++) {
    const cardEl = document.getElementById(`armory-slot-card-${i}`);
    if (cardEl) {
      cardEl.onclick = () => openSlotPicker(i);
      cardEl.style.cursor = 'pointer';
    }
  }
  const throwCardEl = document.getElementById('armory-slot-card-throwable');
  if (throwCardEl) {
    throwCardEl.onclick = () => openSlotPicker(3);
    throwCardEl.style.cursor = 'pointer';
  }

  // Aktualizacja kafelka Slot 1 (Główna)
  const slot0Def = getCatalogWeapon(slots[0] || 'AK47', 'slot0');
  const name0 = document.getElementById('armory-slot-name-0');
  const det0 = document.getElementById('armory-slot-details-0');
  const dmg0 = document.getElementById('armory-slot-stat-dmg-0');
  const rpm0 = document.getElementById('armory-slot-stat-rpm-0');
  const mag0 = document.getElementById('armory-slot-stat-mag-0');
  if (name0) name0.textContent = slot0Def.fullName || slot0Def.name;
  if (det0) det0.textContent = `${slot0Def.caliber} · ${slot0Def.typeLabel}`;
  if (dmg0) dmg0.textContent = `DMG: ${slot0Def.dmg}`;
  if (rpm0) rpm0.textContent = `RPM: ${slot0Def.rpm}`;
  if (mag0) mag0.textContent = `MAG: ${slot0Def.mag}`;

  // Aktualizacja kafelka Slot 2 (Dodatkowa)
  const slot1Def = getCatalogWeapon(slots[1] || 'GLOCK', 'slot1');
  const name1 = document.getElementById('armory-slot-name-1');
  const det1 = document.getElementById('armory-slot-details-1');
  const dmg1 = document.getElementById('armory-slot-stat-dmg-1');
  const rpm1 = document.getElementById('armory-slot-stat-rpm-1');
  const mag1 = document.getElementById('armory-slot-stat-mag-1');
  if (name1) name1.textContent = slot1Def.fullName || slot1Def.name;
  if (det1) det1.textContent = `${slot1Def.caliber} · ${slot1Def.typeLabel}`;
  if (dmg1) dmg1.textContent = `DMG: ${slot1Def.dmg}`;
  if (rpm1) rpm1.textContent = `RPM: ${slot1Def.rpm}`;
  if (mag1) mag1.textContent = `MAG: ${slot1Def.mag}`;

  // Aktualizacja kafelka Slot 3 (Rezerwa)
  const slot2Def = getCatalogWeapon(slots[2] || 'SNIPER', 'slot2');
  const name2 = document.getElementById('armory-slot-name-2');
  const det2 = document.getElementById('armory-slot-details-2');
  const dmg2 = document.getElementById('armory-slot-stat-dmg-2');
  const rpm2 = document.getElementById('armory-slot-stat-rpm-2');
  const mag2 = document.getElementById('armory-slot-stat-mag-2');
  if (name2) name2.textContent = slot2Def.fullName || slot2Def.name;
  if (det2) det2.textContent = `${slot2Def.caliber} · ${slot2Def.typeLabel}`;
  if (dmg2) dmg2.textContent = `DMG: ${slot2Def.dmg}`;
  if (rpm2) rpm2.textContent = `RPM: ${slot2Def.rpm}`;
  if (mag2) mag2.textContent = `MAG: ${slot2Def.mag}`;

  // Aktualizacja kafelka Kieszeń 2 (Miotana)
  const throwDef = getCatalogWeapon(throwables[0] || 'GRENADE', 'throw');
  const nameThrow = document.getElementById('armory-slot-name-throw');
  const detThrow = document.getElementById('armory-slot-details-throw');
  const dmgThrow = document.getElementById('armory-slot-stat-dmg-throw');
  const radThrow = document.getElementById('armory-slot-stat-rad-throw');
  const fuseThrow = document.getElementById('armory-slot-stat-fuse-throw');
  if (nameThrow) nameThrow.textContent = throwDef.fullName || throwDef.name;
  if (detThrow) detThrow.textContent = `${throwDef.caliber} · ZAPALNIK ${throwDef.fuse}`;
  if (dmgThrow) dmgThrow.textContent = `DMG: ${throwDef.dmg}`;
  if (radThrow) radThrow.textContent = `PROMIEŃ: ${throwDef.radius}`;
  if (fuseThrow) fuseThrow.textContent = `CZAS: ${throwDef.fuse}`;

  // -------------------------------------------------------------------------
  // 2. JEŚLI OTWARTE JEST OKNO WYBORU (PICKER), RENDERUJEMY BRONIE
  // -------------------------------------------------------------------------
  if (_currentArmoryView === 'PICKER') {
    if (pickerModal) {
      pickerModal.style.display = 'flex';
    }

    const tagEl = document.getElementById('armory-picker-slot-tag');
    const titleEl = document.getElementById('armory-picker-slot-title');
    const counterEl = document.getElementById('armory-picker-counter');
    const listContainer = document.getElementById('armory-weapons-grid');

    let availableList = [];
    let currentEquippedId = '';
    let slotTagText = '';
    let slotTitleText = '';

    if (_activeSlotIndex === 0) {
      slotTagText = 'SLOT 1 // KIESZEŃ 1: BROŃ GŁÓWNA';
      slotTitleText = 'WYBIERZ BROŃ GŁÓWNĄ';
      availableList = ARMORY_CATALOG.pocket1.slot0;
      currentEquippedId = slots[0];
    } else if (_activeSlotIndex === 1) {
      slotTagText = 'SLOT 2 // KIESZEŃ 1: BROŃ DODATKOWA';
      slotTitleText = 'WYBIERZ BROŃ DODATKOWĄ';
      availableList = ARMORY_CATALOG.pocket1.slot1;
      currentEquippedId = slots[1];
    } else if (_activeSlotIndex === 2) {
      slotTagText = 'SLOT 3 // KIESZEŃ 1: REZERWA BOJOWA';
      slotTitleText = 'WYBIERZ BROŃ REZERWOWĄ';
      availableList = ARMORY_CATALOG.pocket1.slot2;
      currentEquippedId = slots[2];
    } else {
      slotTagText = 'KIESZEŃ 2 // WYPOSAŻENIE MIOTANE & TAKTYCZNE';
      slotTitleText = 'WYBIERZ BROŃ MIOTANĄ';
      availableList = ARMORY_CATALOG.pocket2;
      currentEquippedId = throwables[0] || 'GRENADE';
    }

    if (tagEl) tagEl.textContent = slotTagText;
    if (titleEl) titleEl.textContent = slotTitleText;
    if (counterEl) counterEl.textContent = `${availableList.length} DOSTĘPNE`;

    if (!listContainer) return;
    listContainer.innerHTML = '';

    availableList.forEach((wep) => {
      const isEquipped = (wep.id === currentEquippedId);
      const cardEl = document.createElement('div');
      cardEl.className = `armory-weapon-card ${isEquipped ? 'equipped' : ''}`;

      const isThrow = (_activeSlotIndex === 3);

      let statsHtml = '';
      if (!isThrow) {
        statsHtml = `
          <div class="armory-stats-grid">
            <div class="armory-stat-row">
              <span class="stat-lbl">OBRAŻENIA</span>
              <div class="stat-bar-track"><div class="stat-bar-fill" style="width: ${wep.stats.dmgBar}%"></div></div>
              <span class="stat-val">${wep.dmg}</span>
            </div>
            <div class="armory-stat-row">
              <span class="stat-lbl">SZYBKOŚĆ OGNIA</span>
              <div class="stat-bar-track"><div class="stat-bar-fill" style="width: ${wep.stats.rpmBar}%"></div></div>
              <span class="stat-val">${wep.rpm} RPM</span>
            </div>
            <div class="armory-stat-row">
              <span class="stat-lbl">MAGAZYNEK</span>
              <div class="stat-bar-track"><div class="stat-bar-fill" style="width: ${wep.stats.magBar}%"></div></div>
              <span class="stat-val">${wep.mag} / ${wep.reserve}</span>
            </div>
            <div class="armory-stat-row">
              <span class="stat-lbl">PRZEŁADOWANIE</span>
              <div class="stat-bar-track"><div class="stat-bar-fill" style="width: ${wep.stats.relBar}%"></div></div>
              <span class="stat-val">${wep.reload}</span>
            </div>
          </div>
        `;
      } else {
        statsHtml = `
          <div class="armory-stats-grid">
            <div class="armory-stat-row">
              <span class="stat-lbl">OBRAŻENIA OBSZAROWE</span>
              <div class="stat-bar-track"><div class="stat-bar-fill" style="width: ${wep.stats.dmgBar}%"></div></div>
              <span class="stat-val">${wep.dmg} MAX</span>
            </div>
            <div class="armory-stat-row">
              <span class="stat-lbl">PROMIEŃ RAŻENIA</span>
              <div class="stat-bar-track"><div class="stat-bar-fill" style="width: ${wep.stats.radBar}%"></div></div>
              <span class="stat-val">${wep.radius}</span>
            </div>
            <div class="armory-stat-row">
              <span class="stat-lbl">ZAPALNIK CZASOWY</span>
              <div class="stat-bar-track"><div class="stat-bar-fill" style="width: ${wep.stats.fuseBar}%"></div></div>
              <span class="stat-val">${wep.fuse}</span>
            </div>
          </div>
        `;
      }

      cardEl.innerHTML = `
        <div class="armory-card-header">
          <div class="armory-card-title-col">
            <h3 class="armory-card-name">${wep.fullName}</h3>
            <div class="armory-card-meta">
              <span class="armory-meta-tag">[${wep.category}]</span>
              <span class="armory-meta-caliber">${wep.caliber}</span>
              <span class="armory-meta-type">${wep.typeLabel}</span>
            </div>
          </div>
          <div class="armory-card-status">
            ${isEquipped ? '<span class="equipped-badge">WYPOSAŻONO</span>' : ''}
          </div>
        </div>
        <p class="armory-card-desc">${wep.desc}</p>
        ${statsHtml}
        <div class="armory-card-footer">
          <button type="button" class="ui-btn ${isEquipped ? 'ui-btn-secondary' : 'ui-btn-primary'} armory-equip-btn" ${isEquipped ? 'disabled' : ''}>
            ${isEquipped ? 'AKTUALNIE WYPOSAŻONA' : 'WYBIERZ I PRZYPISZ'}
          </button>
        </div>
      `;

      cardEl.addEventListener('mouseenter', () => playUiHover());

      const equipBtn = cardEl.querySelector('.armory-equip-btn');
      if (equipBtn && !isEquipped) {
        equipBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          equipArmoryWeapon(_activeSlotIndex, wep.id);
        });
      }

      listContainer.appendChild(cardEl);
    });
  } else {
    if (pickerModal) {
      pickerModal.style.display = 'none';
    }
  }
}

/**
 * Wyposażenie broni w wybranym slocie i powrót do widoku slotów
 */
export function equipArmoryWeapon(slotIndex, weaponId) {
  const p = _playerRef || window.player;
  if (!p || !p.loadout) return;

  playUiClick();

  if (slotIndex >= 0 && slotIndex <= 2) {
    p.loadout.pocket1.slots[slotIndex] = weaponId;
    saveStoredLoadout(p.loadout);

    // Jeśli ten slot jest aktualnie trzymany w dłoniach, załóż broń natychmiast
    if (p.loadout.pocket1.activeSlotIndex === slotIndex) {
      equipPocket1Slot(p, slotIndex);
    }
  } else if (slotIndex === 3) {
    if (!Array.isArray(p.loadout.pocket2.throwables)) {
      p.loadout.pocket2.throwables = ['GRENADE'];
    }
    p.loadout.pocket2.throwables[0] = weaponId;
    saveStoredLoadout(p.loadout);
  }

  // Płynne zamknięcie okna wyboru i powrót do widoku slotów
  closeSlotPicker();
}
