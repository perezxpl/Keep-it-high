// =============================================================================
// JS/LOADOUT/ARMORYUI.JS - WOJSKOWA ZBROJOWNIA // MODUŁ EKWIPUNKU I KIESZENI
// Minimalistyczny interfejs militarny, Orbitron/Rajdhani, ZERO EMOJIS
// =============================================================================

import { WEAPONS } from '../weapons/transform.js';
import { saveStoredLoadout } from './state.js';
import { equipPocket1Slot } from './logic.js';

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
let _playerRef = null;
let _closeCallback = null;

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

  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeArmory());
  }
  if (saveBtn) {
    saveBtn.addEventListener('click', () => closeArmory());
  }

  // Zamknięcie klawiszem ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (armoryOverlay && armoryOverlay.style.display === 'flex') {
        closeArmory();
      }
    }
  });
}

/**
 * Otwarcie modalnego okna Zbrojowni
 */
export function openArmory(playerInstance = null, onClose = null) {
  if (playerInstance) _playerRef = playerInstance;
  if (onClose) _closeCallback = onClose;

  const overlay = document.getElementById('armory-overlay');
  if (!overlay) return;

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
 * Renderowanie dynamicznej zawartości Zbrojowni
 */
export function renderArmoryUI() {
  const p = _playerRef || window.player;
  if (!p || !p.loadout) return;

  const slots = p.loadout.pocket1?.slots || ['AK47', 'GLOCK', 'SNIPER'];

  // 1. Zaktualizuj kafelki slotów Kieszeni 1
  for (let i = 0; i < 3; i++) {
    const slotCard = document.getElementById(`armory-slot-card-${i}`);
    const slotNameEl = document.getElementById(`armory-slot-name-${i}`);
    const slotBadgeEl = document.getElementById(`armory-slot-badge-${i}`);

    const wepId = slots[i] || 'AK47';
    const wepDef = WEAPONS[wepId] || WEAPONS.AK47;

    if (slotNameEl) slotNameEl.textContent = wepDef.fullName || wepDef.name || wepId;
    if (slotBadgeEl) slotBadgeEl.textContent = `[${wepDef.category || 'BRON'}]`;

    if (slotCard) {
      slotCard.classList.toggle('active', _activeSlotIndex === i);
      slotCard.onclick = () => {
        _activeSlotIndex = i;
        renderArmoryUI();
      };
    }
  }

  // 2. Kafelek Kieszeni 2 (Miotana)
  const slotThrowCard = document.getElementById('armory-slot-card-throwable');
  if (slotThrowCard) {
    slotThrowCard.classList.toggle('active', _activeSlotIndex === 3);
    slotThrowCard.onclick = () => {
      _activeSlotIndex = 3;
      renderArmoryUI();
    };
  }

  // 3. Renderowanie listy dostępnych broni dla wybranego slotu
  const listContainer = document.getElementById('armory-weapons-grid');
  if (!listContainer) return;

  listContainer.innerHTML = '';

  let availableList = [];
  let currentEquippedId = '';

  if (_activeSlotIndex === 0) {
    availableList = ARMORY_CATALOG.pocket1.slot0;
    currentEquippedId = slots[0];
  } else if (_activeSlotIndex === 1) {
    availableList = ARMORY_CATALOG.pocket1.slot1;
    currentEquippedId = slots[1];
  } else if (_activeSlotIndex === 2) {
    availableList = ARMORY_CATALOG.pocket1.slot2;
    currentEquippedId = slots[2];
  } else {
    availableList = ARMORY_CATALOG.pocket2;
    currentEquippedId = 'GRENADE';
  }

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
          ${isEquipped ? 'AKTUALNIE WYPOSAŻONA' : 'WYPOSAŻ BROŃ'}
        </button>
      </div>
    `;

    const equipBtn = cardEl.querySelector('.armory-equip-btn');
    if (equipBtn && !isEquipped) {
      equipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        equipArmoryWeapon(_activeSlotIndex, wep.id);
      });
    }

    listContainer.appendChild(cardEl);
  });
}

/**
 * Wyposażenie broni w wybranym slocie
 */
export function equipArmoryWeapon(slotIndex, weaponId) {
  const p = _playerRef || window.player;
  if (!p || !p.loadout) return;

  if (slotIndex >= 0 && slotIndex <= 2) {
    p.loadout.pocket1.slots[slotIndex] = weaponId;
    saveStoredLoadout(p.loadout);

    // Jeśli ten slot jest aktualnie trzymany w dłoniach, załóż broń natychmiast
    if (p.loadout.pocket1.activeSlotIndex === slotIndex) {
      equipPocket1Slot(p, slotIndex);
    }
  }

  renderArmoryUI();
}
