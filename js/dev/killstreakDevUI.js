// =========================================================================
// DEV/KILLSTREAKDEVUI.JS - ZAKŁADKA TESTOWANIA SERII ZABÓJSTW W PANELU DEV
// Szybkie wywoływanie wszystkich nagród (UAV, Zrzut, Nalot, Sentry, Dron, Kolos),
// dodawanie fragów do serii oraz testowanie stosu kolejki nagród na HUD.
// =========================================================================

import {
  KILLSTREAKS,
  killstreakState,
  triggerKillstreakUnlockAnim,
  setKillstreakNotification
} from '../killstreaks/state.js';
import {
  activateKillstreak,
  registerKillstreakKill,
  initKillstreaks
} from '../killstreaks/logic.js';
import { player } from '../player.js';
import { clearJuggernautMode } from '../player/juggernaut.js';
import { restorePlayerArmoryLoadout } from '../loadout/index.js';

let devKillstreaksBtn = null;
let devKillstreaksSubpanel = null;
let isSubpanelOpen = false;
let instantActivateMode = true;

function bindDevAction(el, handler) {
  let lastTriggerMs = 0;
  const wrapped = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const now = Date.now();
    if (now - lastTriggerMs < 180) return;
    lastTriggerMs = now;
    handler(e);
  };
  el.addEventListener('click', wrapped);
  el.addEventListener('touchend', wrapped);
}

/**
 * Inicjalizuje zakładkę szybkiego testowania serii zabójstw wewnątrz #dev-menu
 */
export function initKillstreaksDevUI() {
  if (typeof document === 'undefined') return;
  const devMenu = document.getElementById('dev-menu');
  if (!devMenu || document.getElementById('dev-killstreaks-btn')) return;

  const sep = document.createElement('span');
  sep.style.cssText = 'color: rgba(255,255,255,0.25); margin: 0 3px;';
  sep.textContent = '|';
  devMenu.appendChild(sep);

  devKillstreaksBtn = document.createElement('button');
  devKillstreaksBtn.className = 'dev-btn';
  devKillstreaksBtn.id = 'dev-killstreaks-btn';
  devKillstreaksBtn.type = 'button';
  devKillstreaksBtn.title = 'Otwórz / Zamknij zakładkę testowania nagród za serie zabójstw';
  devKillstreaksBtn.style.cssText = 'border-color: #eab308; color: #facc15; font-weight: 700;';
  devKillstreaksBtn.textContent = 'SERIE: OFF';
  devMenu.appendChild(devKillstreaksBtn);

  devKillstreaksSubpanel = document.createElement('div');
  devKillstreaksSubpanel.id = 'dev-killstreaks-subpanel';
  devKillstreaksSubpanel.style.cssText = 'display: none; align-items: center; gap: 4px; flex-wrap: wrap; margin-left: 2px; padding: 3px 6px; background: rgba(15, 23, 42, 0.72); border: 1px solid rgba(234, 179, 8, 0.35); border-radius: 6px;';

  // Przełącznik trybu testowania: Odpal natychmiast vs Dodaj do stosu kolejki
  const modeBtn = document.createElement('button');
  modeBtn.className = 'dev-btn';
  modeBtn.id = 'dev-ks-mode-btn';
  modeBtn.type = 'button';
  modeBtn.title = 'Przełącz: natychmiastowa aktywacja nagrody albo dodanie jej do kolejki na HUD';
  const syncModeBtnUI = () => {
    if (instantActivateMode) {
      modeBtn.textContent = 'TRYB: ODPAL';
      modeBtn.style.borderColor = '#eab308';
      modeBtn.style.color = '#facc15';
      modeBtn.style.background = 'rgba(234, 179, 8, 0.16)';
    } else {
      modeBtn.textContent = 'TRYB: KOLEJKA';
      modeBtn.style.borderColor = '#38bdf8';
      modeBtn.style.color = '#7dd3fc';
      modeBtn.style.background = 'rgba(56, 189, 248, 0.16)';
    }
  };
  syncModeBtnUI();
  bindDevAction(modeBtn, () => {
    instantActivateMode = !instantActivateMode;
    syncModeBtnUI();
  });
  devKillstreaksSubpanel.appendChild(modeBtn);

  // Przycisk +1 FRAG (test progresu paska i progów serii)
  const addKillBtn = document.createElement('button');
  addKillBtn.className = 'dev-btn';
  addKillBtn.id = 'dev-ks-kill-btn';
  addKillBtn.type = 'button';
  addKillBtn.title = 'Zarejestruj +1 eliminację do bieżącej serii zabójstw';
  addKillBtn.style.cssText = 'border-color: #22c55e; color: #4ade80; font-weight: 700;';
  addKillBtn.textContent = '+1 FRAG';
  bindDevAction(addKillBtn, () => {
    registerKillstreakKill();
  });
  devKillstreaksSubpanel.appendChild(addKillBtn);

  // Przyciski wszystkich nagród z katalogu KILLSTREAKS
  for (const ks of KILLSTREAKS) {
    const ksBtn = document.createElement('button');
    ksBtn.className = 'dev-btn dev-ks-reward-btn';
    ksBtn.id = `dev-ks-btn-${ks.id}`;
    ksBtn.dataset.streakId = ks.id;
    ksBtn.type = 'button';
    ksBtn.title = `${ks.name} (${ks.killsRequired} fragów) - ${ks.desc}`;
    const accent = ks.accent || '#00e5ff';
    ksBtn.style.cssText = `border-color: ${accent}; color: ${accent}; font-weight: 700;`;
    ksBtn.textContent = `${ks.short} (${ks.killsRequired})`;

    bindDevAction(ksBtn, () => {
      if (instantActivateMode) {
        if (ks.id === 'MORTAR_STRIKE' && killstreakState.mortarTargeting) {
          activateKillstreak('MORTAR_STRIKE');
          return;
        }
        if (!killstreakState.availableStreaks.includes(ks.id)) {
          killstreakState.availableStreaks.push(ks.id);
        }
        activateKillstreak(ks.id);
      } else {
        killstreakState.availableStreaks.push(ks.id);
        triggerKillstreakUnlockAnim(ks.id);
        setKillstreakNotification(
          `[DEV] DODANO ${ks.tag}`,
          `${ks.name.toUpperCase()} W KOLEJCE (${killstreakState.availableStreaks.length})`,
          accent,
          2.6,
          ks.id
        );
      }
    });

    devKillstreaksSubpanel.appendChild(ksBtn);
  }

  // Przycisk RESETU serii i efektów aktywnych
  const resetBtn = document.createElement('button');
  resetBtn.className = 'dev-btn';
  resetBtn.id = 'dev-ks-reset-btn';
  resetBtn.type = 'button';
  resetBtn.title = 'Wyczyść bieżącą serię, kolejkę nagród oraz status Kolosa';
  resetBtn.style.cssText = 'border-color: rgba(239, 68, 68, 0.55); color: #f87171; font-weight: 600;';
  resetBtn.textContent = 'RESET SERII';
  bindDevAction(resetBtn, () => {
    initKillstreaks();
    if (player && player.isJuggernaut) {
      clearJuggernautMode(player);
      player.hp = player.maxHp;
      player.vestHp = 0;
      player.hasVest = false;
      player.hasHelmet = false;
      if (player.visuals) {
        player.visuals.hasVest = false;
        player.visuals.hasHelmet = false;
      }
      restorePlayerArmoryLoadout(player);
    }
  });
  devKillstreaksSubpanel.appendChild(resetBtn);

  devMenu.appendChild(devKillstreaksSubpanel);

  const toggleSubpanel = () => {
    isSubpanelOpen = !isSubpanelOpen;
    if (isSubpanelOpen) {
      devKillstreaksBtn.textContent = 'SERIE: ON';
      devKillstreaksBtn.style.background = 'rgba(234, 179, 8, 0.30)';
      devKillstreaksBtn.style.borderColor = '#facc15';
      devKillstreaksBtn.style.color = '#ffffff';
      devKillstreaksBtn.style.boxShadow = '0 0 12px rgba(234, 179, 8, 0.55)';
      devKillstreaksSubpanel.style.display = 'inline-flex';
    } else {
      devKillstreaksBtn.textContent = 'SERIE: OFF';
      devKillstreaksBtn.style.background = '';
      devKillstreaksBtn.style.borderColor = '#eab308';
      devKillstreaksBtn.style.color = '#facc15';
      devKillstreaksBtn.style.boxShadow = '';
      devKillstreaksSubpanel.style.display = 'none';
    }
  };

  bindDevAction(devKillstreaksBtn, toggleSubpanel);
}
