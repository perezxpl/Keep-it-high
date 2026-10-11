// =============================================================================
// KEEP IT HIGH - UI MANAGER & STATE OVERLAY SYSTEM
// Zarządza Menu Głównym, Oknem Ustawień oraz Panelem Pauzy
// =============================================================================

import { CONFIG } from './config.js';
import { CLASSES } from './classes/index.js';
import {
  drawPlayer,
  drawHeadHairPreview,
  drawHeadBeardPreview,
  drawHeadHeadgearPreview,
  drawHeadMaskPreview,
  drawHeadNeckPreview,
  HAIR_STYLE_LIST,
  HAIR_COLOR_LIST,
  BEARD_STYLE_LIST,
  BEARD_COLOR_LIST,
  HEADGEAR_STYLE_LIST,
  HEADGEAR_COLOR_LIST,
  MASK_STYLE_LIST,
  MASK_COLOR_LIST,
  NECK_STYLE_LIST,
  doesMaskSupportColor,
  TORSO_STYLE_LIST,
  TORSO_COLOR_LIST,
  doesTorsoSupportColor,
  drawTorsoPreview,
  PANTS_STYLE_LIST,
  PANTS_COLOR_LIST,
  doesPantsSupportColor,
  drawPantsPreview,
  setLocalPlayerCustomVisuals
} from './player/renderer.js';

// Klucz do zapisu konfiguracji w localStorage
const SETTINGS_STORAGE_KEY = 'keep_it_high_settings_v1';
const APPEARANCE_STORAGE_KEY = 'keep_it_high_appearance_v1';

// Domyślna konfiguracja
const DEFAULT_SETTINGS = {
  masterVolume: 80,
  sfxVolume: 85,
  acidSiren: true,
  muteAll: false,
  goreEnabled: true,
  screenShake: true,
  cameraLead: true,
  cameraSmooth: true,
  debugColliders: false
};

const DEFAULT_APPEARANCE = {
  hairStyle: 'buzzcut',
  hairColor: '#18181b',
  beardStyle: 'clean',
  beardColor: '#18181b',
  headgearStyle: 'none',
  headgearColor: '#18181b',
  maskStyle: 'none',
  maskColor: '#18181b',
  neckStyle: 'none',
  torsoStyle: 'short_sleeve',
  torsoColor: '#18181b',
  pantsStyle: 'cargo_long',
  pantsColor: '#18181b'
};

// =============================================================================
// 1. PROCEDURALNY SYNTEZATOR DŹWIĘKÓW UI (WEB AUDIO API)
// =============================================================================
let audioCtx = null;
let masterGainNode = null;
let sfxGainNode = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
    masterGainNode = audioCtx.createGain();
    sfxGainNode = audioCtx.createGain();
    sfxGainNode.connect(masterGainNode);
    masterGainNode.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playUiClick() {
  const ctx = getAudioContext();
  if (!ctx || uiManager.settings.muteAll) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.04);

    const sfxVol = (uiManager.settings.sfxVolume / 100) * 0.18;
    gain.gain.setValueAtTime(sfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch (_) {}
}

export function playUiHover() {
  const ctx = getAudioContext();
  if (!ctx || uiManager.settings.muteAll) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);

    const sfxVol = (uiManager.settings.sfxVolume / 100) * 0.06;
    gain.gain.setValueAtTime(sfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start(now);
    osc.stop(now + 0.03);
  } catch (_) {}
}

export function playUiPause() {
  const ctx = getAudioContext();
  if (!ctx || uiManager.settings.muteAll) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(310, now + 0.12);

    const sfxVol = (uiManager.settings.sfxVolume / 100) * 0.22;
    gain.gain.setValueAtTime(sfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start(now);
    osc.stop(now + 0.14);
  } catch (_) {}
}

export function playUiResume() {
  const ctx = getAudioContext();
  if (!ctx || uiManager.settings.muteAll) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.11);

    const sfxVol = (uiManager.settings.sfxVolume / 100) * 0.22;
    gain.gain.setValueAtTime(sfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch (_) {}
}

export function playTestTone() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
    osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6

    const sfxVol = (uiManager.settings.sfxVolume / 100) * 0.25;
    gain.gain.setValueAtTime(sfxVol, now);
    gain.gain.setValueAtTime(sfxVol, now + 0.32);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch (_) {}
}

// =============================================================================
// 2. OBIEKT GŁÓWNY UIMANAGER
// =============================================================================
export const uiManager = {
  settings: { ...DEFAULT_SETTINGS },
  appearance: { ...DEFAULT_APPEARANCE },
  selectedClassId: 'RAPTOR',
  callbacks: null,
  isInitialized: false,

  init(callbacks) {
    if (this.isInitialized) return;
    this.callbacks = callbacks;
    this.loadSettings();
    this.loadAppearance();
    this.bindDOM();
    this.applySettings();
    this.applyAppearance();
    this.isInitialized = true;
  },

  loadAppearance() {
    try {
      const saved = localStorage.getItem(APPEARANCE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.appearance = { ...DEFAULT_APPEARANCE, ...parsed };
      }
    } catch (e) {
      console.warn('[UI] Błąd odczytu wyglądu postaci z localStorage:', e);
      this.appearance = { ...DEFAULT_APPEARANCE };
    }
  },

  saveAppearance() {
    try {
      localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(this.appearance));
    } catch (e) {
      console.warn('[UI] Błąd zapisu wyglądu postaci do localStorage:', e);
    }
  },

  applyAppearance() {
    const custom = {
      hairStyle: this.appearance.hairStyle || 'buzzcut',
      hairColor: this.appearance.hairColor || '#18181b',
      beardStyle: this.appearance.beardStyle || 'clean',
      beardColor: this.appearance.beardColor || (this.appearance.hairColor || '#18181b'),
      headgearStyle: this.appearance.headgearStyle || 'none',
      headgearColor: this.appearance.headgearColor || '#18181b',
      maskStyle: this.appearance.maskStyle || 'none',
      maskColor: this.appearance.maskColor || '#18181b',
      neckStyle: this.appearance.neckStyle || 'none',
      torsoStyle: this.appearance.torsoStyle || 'short_sleeve',
      torsoColor: this.appearance.torsoColor || '#18181b',
      pantsStyle: this.appearance.pantsStyle || 'cargo_long',
      pantsColor: this.appearance.pantsColor || '#18181b'
    };
    setLocalPlayerCustomVisuals(custom);
    if (this.creatorDummyPlayer) {
      this.creatorDummyPlayer.customVisuals = { ...custom };
      this.creatorDummyPlayer._hairImpulse = 1.0;
    }
    if (typeof window !== 'undefined' && window.player) {
      window.player.customVisuals = { ...(window.player.customVisuals || {}), ...custom };
      window.player._hairImpulse = 1.0;
    }
  },

  loadSettings() {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.warn('[UI] Błąd odczytu konfiguracji z localStorage:', e);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  },

  saveSettings() {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('[UI] Błąd zapisu konfiguracji do localStorage:', e);
    }
  },

  applySettings() {
    // 1. Audio głośności
    if (masterGainNode) {
      const vol = this.settings.muteAll ? 0 : (this.settings.masterVolume / 100);
      masterGainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    }
    if (sfxGainNode) {
      const sfx = (this.settings.sfxVolume / 100);
      sfxGainNode.gain.setValueAtTime(sfx, audioCtx.currentTime);
    }

    // 2. Opcje rozgrywki i silnika
    CONFIG.GORE_ENABLED = !!this.settings.goreEnabled;
    CONFIG.CAMERA_AIM_LEAD_ENABLED = !!this.settings.cameraLead;
    CONFIG.CAMERA_CLAMPING = !!this.settings.cameraSmooth;

    if (typeof window !== 'undefined') {
      window.DEBUG_COLLIDERS = !!this.settings.debugColliders;
      window.ACID_SIREN_ENABLED = !!this.settings.acidSiren;
    }

    // Aktualizacja wskaźnika szybkiego wyciszenia w stopce menu
    const quickMuteBtn = document.getElementById('menu-quick-mute-btn');
    if (quickMuteBtn) {
      quickMuteBtn.textContent = this.settings.muteAll ? '🔇 DŹWIĘK: WYŁ' : '🔊 DŹWIĘK: WŁ';
      quickMuteBtn.classList.toggle('muted', !!this.settings.muteAll);
    }

    this.syncFormControls();
  },

  syncFormControls() {
    const masterSlider = document.getElementById('setting-master-vol');
    const masterVal = document.getElementById('val-master-vol');
    if (masterSlider) masterSlider.value = this.settings.masterVolume;
    if (masterVal) masterVal.textContent = `${this.settings.masterVolume}%`;

    const sfxSlider = document.getElementById('setting-sfx-vol');
    const sfxVal = document.getElementById('val-sfx-vol');
    if (sfxSlider) sfxSlider.value = this.settings.sfxVolume;
    if (sfxVal) sfxVal.textContent = `${this.settings.sfxVolume}%`;

    const sirenToggle = document.getElementById('setting-acid-siren');
    if (sirenToggle) sirenToggle.checked = !!this.settings.acidSiren;

    const muteToggle = document.getElementById('setting-mute-all');
    if (muteToggle) muteToggle.checked = !!this.settings.muteAll;

    const goreToggle = document.getElementById('setting-gore-enabled');
    if (goreToggle) goreToggle.checked = !!this.settings.goreEnabled;

    const shakeToggle = document.getElementById('setting-screen-shake');
    if (shakeToggle) shakeToggle.checked = !!this.settings.screenShake;

    const leadToggle = document.getElementById('setting-camera-lead');
    if (leadToggle) leadToggle.checked = !!this.settings.cameraLead;

    const smoothToggle = document.getElementById('setting-camera-smooth');
    if (smoothToggle) smoothToggle.checked = !!this.settings.cameraSmooth;

    const collidersToggle = document.getElementById('setting-debug-colliders');
    if (collidersToggle) collidersToggle.checked = !!this.settings.debugColliders;
  },

  selectClass(classId) {
    this.selectedClassId = classId;
  },

  updateMpArenaUI(arenaId) {
    const norm = (arenaId === 'ARENA_3' || arenaId === 'arena-3') ? 'arena-3' :
                 (arenaId === 'ARENA_2' || arenaId === 'arena-2' || arenaId === 'ARENA_2_PANDORA' || arenaId === 'ARENA_2_SECTOR_X') ? 'arena-2' : 'arena-1';
    document.querySelectorAll('.mp-arena-card').forEach(b => {
      const isTarget = b.dataset.arena === norm;
      b.classList.toggle('active', isTarget);
    });
  },

  updateArenaSelectUI(arenaId) {
    const norm = (arenaId === 'ARENA_3' || arenaId === 'arena-3') ? 'ARENA_3' :
                 (arenaId === 'ARENA_2' || arenaId === 'arena-2' || arenaId === 'ARENA_2_PANDORA' || arenaId === 'ARENA_2_SECTOR_X') ? 'ARENA_2' : 'ARENA_1';
    document.querySelectorAll('#screen-arena-select .arena-card').forEach(b => {
      const isTarget = b.dataset.arena === norm;
      b.classList.toggle('active', isTarget);
    });
  },

  syncUI(gameState) {
    const menuEl = document.getElementById('main-menu-overlay');
    const settingsEl = document.getElementById('settings-overlay');
    const creatorEl = document.getElementById('creator-overlay');
    const pauseEl = document.getElementById('pause-overlay');
    const hudPauseBtn = document.getElementById('hud-pause-btn');
    const devPanel = document.getElementById('dev-panel-container');
    const gameContainer = document.getElementById('game-container');
    const canvasEl = document.getElementById('game');

    // Ukryj domyślnie wszystkie ekrany UI
    if (menuEl) menuEl.style.display = 'none';
    if (settingsEl) settingsEl.style.display = 'none';
    if (creatorEl) creatorEl.style.display = 'none';
    if (pauseEl) pauseEl.style.display = 'none';
    this.stopCreatorPreview();

    const isCursorActive = (gameState !== 'PLAYING');

    if (gameContainer) {
      if (isCursorActive) gameContainer.classList.add('cursor-visible');
      else gameContainer.classList.remove('cursor-visible');
    }
    if (canvasEl) {
      canvasEl.style.cursor = isCursorActive ? 'default' : 'none';
    }

    switch (gameState) {
      case 'MENU':
        if (menuEl) menuEl.style.display = 'flex';
        if (hudPauseBtn) hudPauseBtn.style.display = 'none';
        if (devPanel) devPanel.style.display = 'none';
        {
          const menuActionsEl = document.getElementById('menu-main-actions');
          const arenaSelectEl = document.getElementById('screen-arena-select');
          if (menuActionsEl) menuActionsEl.classList.remove('hidden');
          if (arenaSelectEl) arenaSelectEl.classList.add('hidden');
        }
        break;

      case 'ARENA_SELECT':
        if (menuEl) menuEl.style.display = 'flex';
        if (hudPauseBtn) hudPauseBtn.style.display = 'none';
        if (devPanel) devPanel.style.display = 'none';
        {
          const menuActionsEl = document.getElementById('menu-main-actions');
          const arenaSelectEl = document.getElementById('screen-arena-select');
          if (menuActionsEl) menuActionsEl.classList.add('hidden');
          if (arenaSelectEl) arenaSelectEl.classList.remove('hidden');
          if (typeof window !== 'undefined' && window.activeArenaId) {
            this.updateArenaSelectUI(window.activeArenaId);
          }
        }
        break;

      case 'CLASS_SELECT':
        if (hudPauseBtn) hudPauseBtn.style.display = 'none';
        if (devPanel) devPanel.style.display = 'none';
        break;

      case 'PLAYING':
        if (hudPauseBtn) hudPauseBtn.style.display = 'flex';
        if (devPanel) devPanel.style.display = 'flex';
        break;

      case 'SETTINGS':
        if (settingsEl) settingsEl.style.display = 'flex';
        if (hudPauseBtn) hudPauseBtn.style.display = 'none';
        this.syncFormControls();
        break;

      case 'CREATOR':
        if (creatorEl) creatorEl.style.display = 'flex';
        if (hudPauseBtn) hudPauseBtn.style.display = 'none';
        this.initCreatorHairUI();
        this.initCreatorBeardUI();
        this.initCreatorHeadgearUI();
        this.initCreatorMaskUI();
        this.initCreatorNeckUI();
        this.initCreatorTorsoUI();
        this.initCreatorPantsUI();
        this.switchCreatorTab(this.activeCreatorTab || 'hair');
        this.startCreatorPreview();
        break;

      case 'PAUSED':
        if (pauseEl) pauseEl.style.display = 'flex';
        if (hudPauseBtn) hudPauseBtn.style.display = 'none';
        if (devPanel) devPanel.style.display = 'flex';

        // Aktualizacja informacji o arenie w pauzie
        const matchInfoEl = document.getElementById('pause-match-info');
        if (matchInfoEl && this.callbacks && typeof this.callbacks.getMatchInfo === 'function') {
          matchInfoEl.textContent = this.callbacks.getMatchInfo();
        }
        break;
    }
  },

  bindDOM() {

    // -------------------------------------------------------------------------
    // LOBBY MULTIPLAYER: Wybór mapy / areny
    // -------------------------------------------------------------------------
    document.querySelectorAll('.mp-arena-card').forEach(btn => {
      btn.addEventListener('mouseenter', () => playUiHover());
      btn.addEventListener('click', () => {
        playUiClick();
        const arenaId = btn.dataset.arena;
        if (!arenaId) return;
        this.updateMpArenaUI(arenaId);
        if (typeof window !== 'undefined' && typeof window.switchArena === 'function') {
          window.switchArena(arenaId);
        }
      });
    });

    // -------------------------------------------------------------------------
    // EKRAN WYBORU ARENY (ARENA SELECT)
    // -------------------------------------------------------------------------
    document.querySelectorAll('#screen-arena-select .arena-card').forEach(card => {
      card.addEventListener('mouseenter', () => playUiHover());
      card.addEventListener('click', () => {
        playUiClick();
        const arenaId = card.dataset.arena;
        if (!arenaId) return;
        this.updateArenaSelectUI(arenaId);
        if (this.callbacks && typeof this.callbacks.onSelectArena === 'function') {
          this.callbacks.onSelectArena(arenaId);
        }
      });
    });

    const arenaBackBtn = document.getElementById('btn-arena-back');
    if (arenaBackBtn) {
      arenaBackBtn.addEventListener('mouseenter', () => playUiHover());
      arenaBackBtn.addEventListener('click', () => {
        playUiClick();
        if (this.callbacks && typeof this.callbacks.onBackToMenu === 'function') {
          this.callbacks.onBackToMenu();
        }
      });
    }

    // MENU GŁÓWNE: Przycisk "ROZPOCZNIJ ROZGRYWKĘ"
    const playBtn = document.getElementById('menu-btn-play');
    if (playBtn) {
      playBtn.addEventListener('mouseenter', () => playUiHover());
      playBtn.addEventListener('click', () => {
        playUiClick();
        if (this.callbacks && typeof this.callbacks.onStartGame === 'function') {
          this.callbacks.onStartGame();
        }
      });
    }

    // MENU GŁÓWNE: Przycisk "KREATOR POSTACI"
    const creatorBtn = document.getElementById('menu-btn-creator');
    if (creatorBtn) {
      creatorBtn.addEventListener('mouseenter', () => playUiHover());
      creatorBtn.addEventListener('click', () => {
        playUiClick();
        if (this.callbacks && typeof this.callbacks.onOpenCreator === 'function') {
          this.callbacks.onOpenCreator();
        }
      });
    }

    // MENU GŁÓWNE: Przycisk "USTAWIENIA"
    const settingsBtn = document.getElementById('menu-btn-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('mouseenter', () => playUiHover());
      settingsBtn.addEventListener('click', () => {
        playUiClick();
        if (this.callbacks && typeof this.callbacks.onOpenSettings === 'function') {
          this.callbacks.onOpenSettings();
        }
      });
    }

    // MENU GŁÓWNE: Przycisk "MULTIPLAYER P2P"
    const multiBtn = document.getElementById('menu-btn-multi');
    if (multiBtn) {
      multiBtn.addEventListener('mouseenter', () => playUiHover());
      multiBtn.addEventListener('click', () => {
        playUiClick();
        const mpModal = document.getElementById('mp-modal');
        if (mpModal) mpModal.classList.remove('mp-modal-hidden');
      });
    }

    // MENU GŁÓWNE: Przycisk "STEROWANIE" (otwiera zakładkę controls w ustawieniach)
    const controlsBtn = document.getElementById('menu-btn-controls');
    if (controlsBtn) {
      controlsBtn.addEventListener('mouseenter', () => playUiHover());
      controlsBtn.addEventListener('click', () => {
        playUiClick();
        if (this.callbacks && typeof this.callbacks.onOpenSettings === 'function') {
          this.callbacks.onOpenSettings();
          this.switchTab('controls');
        }
      });
    }

    // MENU GŁÓWNE: Szybkie wyciszenie
    const quickMuteBtn = document.getElementById('menu-quick-mute-btn');
    if (quickMuteBtn) {
      quickMuteBtn.addEventListener('click', () => {
        playUiClick();
        this.settings.muteAll = !this.settings.muteAll;
        this.saveSettings();
        this.applySettings();
      });
    }

    // -------------------------------------------------------------------------
    // HUD: Przycisk Pauzy
    // -------------------------------------------------------------------------
    const hudPauseBtn = document.getElementById('hud-pause-btn');
    if (hudPauseBtn) {
      hudPauseBtn.addEventListener('mouseenter', () => playUiHover());
      hudPauseBtn.addEventListener('click', () => {
        playUiPause();
        if (this.callbacks && typeof this.callbacks.onPause === 'function') {
          this.callbacks.onPause();
        }
      });
    }

    // -------------------------------------------------------------------------
    // MENU PAUZY
    // -------------------------------------------------------------------------
    const pauseResumeBtn = document.getElementById('pause-btn-resume');
    if (pauseResumeBtn) {
      pauseResumeBtn.addEventListener('mouseenter', () => playUiHover());
      pauseResumeBtn.addEventListener('click', () => {
        playUiResume();
        if (this.callbacks && typeof this.callbacks.onResume === 'function') {
          this.callbacks.onResume();
        }
      });
    }

    const pauseRestartBtn = document.getElementById('pause-btn-restart');
    if (pauseRestartBtn) {
      pauseRestartBtn.addEventListener('mouseenter', () => playUiHover());
      pauseRestartBtn.addEventListener('click', () => {
        playUiClick();
        if (this.callbacks && typeof this.callbacks.onRestartRound === 'function') {
          this.callbacks.onRestartRound();
        }
      });
    }

    const pauseClassBtn = document.getElementById('pause-btn-class');
    if (pauseClassBtn) {
      pauseClassBtn.addEventListener('mouseenter', () => playUiHover());
      pauseClassBtn.addEventListener('click', () => {
        playUiClick();
        if (this.callbacks && typeof this.callbacks.onChangeClass === 'function') {
          this.callbacks.onChangeClass();
        }
      });
    }

    const pauseCreatorBtn = document.getElementById('pause-btn-creator');
    if (pauseCreatorBtn) {
      pauseCreatorBtn.addEventListener('mouseenter', () => playUiHover());
      pauseCreatorBtn.addEventListener('click', () => {
        playUiClick();
        if (this.callbacks && typeof this.callbacks.onOpenCreator === 'function') {
          this.callbacks.onOpenCreator();
        }
      });
    }

    const pauseSettingsBtn = document.getElementById('pause-btn-settings');
    if (pauseSettingsBtn) {
      pauseSettingsBtn.addEventListener('mouseenter', () => playUiHover());
      pauseSettingsBtn.addEventListener('click', () => {
        playUiClick();
        if (this.callbacks && typeof this.callbacks.onOpenSettings === 'function') {
          this.callbacks.onOpenSettings();
        }
      });
    }

    const pauseMenuBtn = document.getElementById('pause-btn-menu');
    if (pauseMenuBtn) {
      pauseMenuBtn.addEventListener('mouseenter', () => playUiHover());
      pauseMenuBtn.addEventListener('click', () => {
        playUiClick();
        if (this.callbacks && typeof this.callbacks.onReturnToMenu === 'function') {
          this.callbacks.onReturnToMenu();
        }
      });
    }

    // -------------------------------------------------------------------------
    // OKNO KREATORA POSTACI: Zamykanie / Wróć
    // -------------------------------------------------------------------------
    const creatorCloseBtn = document.getElementById('creator-close-btn');
    if (creatorCloseBtn) {
      creatorCloseBtn.addEventListener('click', () => {
        playUiClick();
        if (this.callbacks && typeof this.callbacks.onCloseCreator === 'function') {
          this.callbacks.onCloseCreator();
        }
      });
    }

    const creatorBackBtn = document.getElementById('creator-back-btn');
    if (creatorBackBtn) {
      creatorBackBtn.addEventListener('click', () => {
        playUiClick();
        if (this.callbacks && typeof this.callbacks.onCloseCreator === 'function') {
          this.callbacks.onCloseCreator();
        }
      });
    }

    // Zakładki Kreatora Postaci (WŁOSY / ZAROST)
    document.querySelectorAll('.creator-tab-btn').forEach((btn) => {
      btn.addEventListener('mouseenter', () => playUiHover());
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.creatorTab;
        if (!tabId) return;
        playUiClick();
        this.switchCreatorTab(tabId);
      });
    });

    // -------------------------------------------------------------------------
    // OKNO USTAWIEŃ: Zakładki (Tabs)
    // -------------------------------------------------------------------------
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        playUiClick();
        const tabName = btn.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // OKNO USTAWIEŃ: Zamykanie / Wróć
    const settingsCloseBtn = document.getElementById('settings-close-btn');
    if (settingsCloseBtn) {
      settingsCloseBtn.addEventListener('click', () => {
        playUiClick();
        if (this.callbacks && typeof this.callbacks.onCloseSettings === 'function') {
          this.callbacks.onCloseSettings();
        }
      });
    }

    const settingsBackBtn = document.getElementById('settings-back-btn');
    if (settingsBackBtn) {
      settingsBackBtn.addEventListener('click', () => {
        playUiClick();
        if (this.callbacks && typeof this.callbacks.onCloseSettings === 'function') {
          this.callbacks.onCloseSettings();
        }
      });
    }

    const settingsResetBtn = document.getElementById('settings-reset-btn');
    if (settingsResetBtn) {
      settingsResetBtn.addEventListener('click', () => {
        playUiClick();
        this.settings = { ...DEFAULT_SETTINGS };
        this.saveSettings();
        this.applySettings();
      });
    }

    // Suwak Master Volume
    const masterSlider = document.getElementById('setting-master-vol');
    if (masterSlider) {
      masterSlider.addEventListener('input', (e) => {
        this.settings.masterVolume = parseInt(e.target.value, 10);
        document.getElementById('val-master-vol').textContent = `${this.settings.masterVolume}%`;
        this.applySettings();
      });
      masterSlider.addEventListener('change', () => this.saveSettings());
    }

    // Suwak SFX Volume
    const sfxSlider = document.getElementById('setting-sfx-vol');
    if (sfxSlider) {
      sfxSlider.addEventListener('input', (e) => {
        this.settings.sfxVolume = parseInt(e.target.value, 10);
        document.getElementById('val-sfx-vol').textContent = `${this.settings.sfxVolume}%`;
        this.applySettings();
      });
      sfxSlider.addEventListener('change', () => this.saveSettings());
    }

    // Toggle Syreny Kwasu
    const sirenToggle = document.getElementById('setting-acid-siren');
    if (sirenToggle) {
      sirenToggle.addEventListener('change', (e) => {
        playUiClick();
        this.settings.acidSiren = e.target.checked;
        this.saveSettings();
        this.applySettings();
      });
    }

    // Toggle Mute All
    const muteToggle = document.getElementById('setting-mute-all');
    if (muteToggle) {
      muteToggle.addEventListener('change', (e) => {
        playUiClick();
        this.settings.muteAll = e.target.checked;
        this.saveSettings();
        this.applySettings();
      });
    }

    // Przycisk testu dźwięku
    const testSoundBtn = document.getElementById('btn-test-sound');
    if (testSoundBtn) {
      testSoundBtn.addEventListener('click', () => {
        playTestTone();
      });
    }

    // Toggle Gore
    const goreToggle = document.getElementById('setting-gore-enabled');
    if (goreToggle) {
      goreToggle.addEventListener('change', (e) => {
        playUiClick();
        this.settings.goreEnabled = e.target.checked;
        this.saveSettings();
        this.applySettings();
      });
    }

    // Toggle Screen Shake
    const shakeToggle = document.getElementById('setting-screen-shake');
    if (shakeToggle) {
      shakeToggle.addEventListener('change', (e) => {
        playUiClick();
        this.settings.screenShake = e.target.checked;
        this.saveSettings();
        this.applySettings();
      });
    }

    // Toggle Camera Lead
    const leadToggle = document.getElementById('setting-camera-lead');
    if (leadToggle) {
      leadToggle.addEventListener('change', (e) => {
        playUiClick();
        this.settings.cameraLead = e.target.checked;
        this.saveSettings();
        this.applySettings();
      });
    }

    // Toggle Camera Smooth
    const smoothToggle = document.getElementById('setting-camera-smooth');
    if (smoothToggle) {
      smoothToggle.addEventListener('change', (e) => {
        playUiClick();
        this.settings.cameraSmooth = e.target.checked;
        this.saveSettings();
        this.applySettings();
      });
    }

    // Toggle Debug Colliders
    const collidersToggle = document.getElementById('setting-debug-colliders');
    if (collidersToggle) {
      collidersToggle.addEventListener('change', (e) => {
        playUiClick();
        this.settings.debugColliders = e.target.checked;
        this.saveSettings();
        this.applySettings();
      });
    }

    this.initCreatorHairUI();
    this.initCreatorBeardUI();
    this.initCreatorHeadgearUI();
    this.initCreatorMaskUI();
    this.initCreatorNeckUI();
    this.initCreatorTorsoUI();
    this.initCreatorPantsUI();
  },

  initCreatorHairUI() {
    const gridEl = document.getElementById('creator-hair-grid');
    const colorsEl = document.getElementById('creator-hair-colors');
    if (!gridEl || !colorsEl) return;

    gridEl.innerHTML = '';
    colorsEl.innerHTML = '';

    // 1. Kafelki z samą głową i fryzurą (bez nazw czy opisów)
    HAIR_STYLE_LIST.forEach((styleId) => {
      const tileBtn = document.createElement('button');
      tileBtn.type = 'button';
      tileBtn.className = 'creator-hair-tile';
      tileBtn.dataset.hairStyle = styleId;
      if (this.appearance.hairStyle === styleId) {
        tileBtn.classList.add('active');
      }

      const cvs = document.createElement('canvas');
      cvs.width = 68;
      cvs.height = 68;
      tileBtn.appendChild(cvs);

      tileBtn.addEventListener('mouseenter', () => playUiHover());
      tileBtn.addEventListener('click', () => {
        playUiClick();
        this.appearance.hairStyle = styleId;
        this.saveAppearance();
        this.applyAppearance();
        this.syncCreatorHairSelectionUI();
        this.renderCreatorBeardTiles();
        this.renderCreatorHeadgearTiles();
        this.renderCreatorMaskTiles();
      });

      gridEl.appendChild(tileBtn);
    });

    // 2. Próbki kolorów włosów pod kafelkami fryzur
    HAIR_COLOR_LIST.forEach((hexCol) => {
      const swatchBtn = document.createElement('button');
      swatchBtn.type = 'button';
      swatchBtn.className = 'creator-color-swatch';
      swatchBtn.dataset.hairColor = hexCol;
      swatchBtn.style.backgroundColor = hexCol;
      if (String(this.appearance.hairColor).toLowerCase() === hexCol.toLowerCase()) {
        swatchBtn.classList.add('active');
      }

      swatchBtn.addEventListener('mouseenter', () => playUiHover());
      swatchBtn.addEventListener('click', () => {
        playUiClick();
        this.appearance.hairColor = hexCol;
        this.saveAppearance();
        this.applyAppearance();
        this.syncCreatorHairSelectionUI();
        this.renderCreatorHairTiles();
        this.renderCreatorBeardTiles();
        this.renderCreatorHeadgearTiles();
        this.renderCreatorMaskTiles();
      });

      colorsEl.appendChild(swatchBtn);
    });

    this.renderCreatorHairTiles();
  },

  syncCreatorHairSelectionUI() {
    const curStyle = this.appearance.hairStyle || 'buzzcut';
    const curColor = String(this.appearance.hairColor || '#18181b').toLowerCase();

    document.querySelectorAll('#creator-hair-grid .creator-hair-tile').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.hairStyle === curStyle);
    });

    document.querySelectorAll('#creator-hair-colors .creator-color-swatch').forEach((btn) => {
      btn.classList.toggle('active', String(btn.dataset.hairColor).toLowerCase() === curColor);
    });
  },

  renderCreatorHairTiles() {
    const curColor = this.appearance.hairColor || '#18181b';
    document.querySelectorAll('#creator-hair-grid .creator-hair-tile').forEach((btn) => {
      const styleId = btn.dataset.hairStyle || 'buzzcut';
      const cvs = btn.querySelector('canvas');
      if (cvs) {
        const ctx = cvs.getContext('2d');
        drawHeadHairPreview(ctx, cvs.width, cvs.height, styleId, curColor);
      }
    });
  },

  initCreatorBeardUI() {
    const gridEl = document.getElementById('creator-beard-grid');
    const colorsEl = document.getElementById('creator-beard-colors');
    if (!gridEl || !colorsEl) return;

    gridEl.innerHTML = '';
    colorsEl.innerHTML = '';

    // 1. Kafelki z samą głową i stylem zarostu (bez nazw i opisów)
    BEARD_STYLE_LIST.forEach((styleId) => {
      const tileBtn = document.createElement('button');
      tileBtn.type = 'button';
      tileBtn.className = 'creator-hair-tile';
      tileBtn.dataset.beardStyle = styleId;
      if (this.appearance.beardStyle === styleId) {
        tileBtn.classList.add('active');
      }

      const cvs = document.createElement('canvas');
      cvs.width = 68;
      cvs.height = 68;
      tileBtn.appendChild(cvs);

      tileBtn.addEventListener('mouseenter', () => playUiHover());
      tileBtn.addEventListener('click', () => {
        playUiClick();
        this.appearance.beardStyle = styleId;
        this.saveAppearance();
        this.applyAppearance();
        this.syncCreatorBeardSelectionUI();
        this.renderCreatorBeardTiles();
        this.renderCreatorHeadgearTiles();
        this.renderCreatorMaskTiles();
      });

      gridEl.appendChild(tileBtn);
    });

    // 2. Próbki kolorów zarostu pod kafelkami zarostów
    BEARD_COLOR_LIST.forEach((hexCol) => {
      const swatchBtn = document.createElement('button');
      swatchBtn.type = 'button';
      swatchBtn.className = 'creator-color-swatch';
      swatchBtn.dataset.beardColor = hexCol;
      swatchBtn.style.backgroundColor = hexCol;
      const curCol = String(this.appearance.beardColor || this.appearance.hairColor || '#18181b').toLowerCase();
      if (curCol === hexCol.toLowerCase()) {
        swatchBtn.classList.add('active');
      }

      swatchBtn.addEventListener('mouseenter', () => playUiHover());
      swatchBtn.addEventListener('click', () => {
        playUiClick();
        this.appearance.beardColor = hexCol;
        this.saveAppearance();
        this.applyAppearance();
        this.syncCreatorBeardSelectionUI();
        this.renderCreatorBeardTiles();
        this.renderCreatorHeadgearTiles();
        this.renderCreatorMaskTiles();
      });

      colorsEl.appendChild(swatchBtn);
    });

    this.renderCreatorBeardTiles();
  },

  syncCreatorBeardSelectionUI() {
    const curStyle = this.appearance.beardStyle || 'clean';
    const curColor = String(this.appearance.beardColor || this.appearance.hairColor || '#18181b').toLowerCase();

    document.querySelectorAll('#creator-beard-grid .creator-hair-tile').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.beardStyle === curStyle);
    });

    document.querySelectorAll('#creator-beard-colors .creator-color-swatch').forEach((btn) => {
      btn.classList.toggle('active', String(btn.dataset.beardColor).toLowerCase() === curColor);
    });
  },

  renderCreatorBeardTiles() {
    const curBeardColor = this.appearance.beardColor || this.appearance.hairColor || '#18181b';
    const curHairStyle = this.appearance.hairStyle || 'buzzcut';
    const curHairColor = this.appearance.hairColor || '#18181b';

    document.querySelectorAll('#creator-beard-grid .creator-hair-tile').forEach((btn) => {
      const styleId = btn.dataset.beardStyle || 'clean';
      const cvs = btn.querySelector('canvas');
      if (cvs) {
        const ctx = cvs.getContext('2d');
        drawHeadBeardPreview(ctx, cvs.width, cvs.height, styleId, curBeardColor, curHairStyle, curHairColor);
      }
    });
  },

  initCreatorHeadgearUI() {
    const gridEl = document.getElementById('creator-headgear-grid');
    const colorsEl = document.getElementById('creator-headgear-colors');
    if (!gridEl || !colorsEl) return;

    gridEl.innerHTML = '';
    colorsEl.innerHTML = '';

    // 1. Kafelki z samą głową i stylem nakrycia głowy (bez nazw i opisów)
    HEADGEAR_STYLE_LIST.forEach((styleId) => {
      const tileBtn = document.createElement('button');
      tileBtn.type = 'button';
      tileBtn.className = 'creator-hair-tile';
      tileBtn.dataset.headgearStyle = styleId;
      if ((this.appearance.headgearStyle || 'none') === styleId) {
        tileBtn.classList.add('active');
      }

      const cvs = document.createElement('canvas');
      cvs.width = 68;
      cvs.height = 68;
      tileBtn.appendChild(cvs);

      tileBtn.addEventListener('mouseenter', () => playUiHover());
      tileBtn.addEventListener('click', () => {
        playUiClick();
        this.appearance.headgearStyle = styleId;
        this.saveAppearance();
        this.applyAppearance();
        this.syncCreatorHeadgearSelectionUI();
        this.renderCreatorHeadgearTiles();
        this.renderCreatorMaskTiles();
        this.renderCreatorNeckTiles();
      });

      gridEl.appendChild(tileBtn);
    });

    // 2. Próbki kolorów nakrycia głowy pod kafelkami
    HEADGEAR_COLOR_LIST.forEach((hexCol) => {
      const swatchBtn = document.createElement('button');
      swatchBtn.type = 'button';
      swatchBtn.className = 'creator-color-swatch';
      swatchBtn.dataset.headgearColor = hexCol;
      swatchBtn.style.backgroundColor = hexCol;
      const curCol = String(this.appearance.headgearColor || '#18181b').toLowerCase();
      if (curCol === hexCol.toLowerCase()) {
        swatchBtn.classList.add('active');
      }

      swatchBtn.addEventListener('mouseenter', () => playUiHover());
      swatchBtn.addEventListener('click', () => {
        playUiClick();
        this.appearance.headgearColor = hexCol;
        this.saveAppearance();
        this.applyAppearance();
        this.syncCreatorHeadgearSelectionUI();
        this.renderCreatorHeadgearTiles();
        this.renderCreatorMaskTiles();
        this.renderCreatorNeckTiles();
      });

      colorsEl.appendChild(swatchBtn);
    });

    this.renderCreatorHeadgearTiles();
  },

  syncCreatorHeadgearSelectionUI() {
    const curStyle = this.appearance.headgearStyle || 'none';
    const curColor = String(this.appearance.headgearColor || '#18181b').toLowerCase();

    document.querySelectorAll('#creator-headgear-grid .creator-hair-tile').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.headgearStyle === curStyle);
    });

    document.querySelectorAll('#creator-headgear-colors .creator-color-swatch').forEach((btn) => {
      btn.classList.toggle('active', String(btn.dataset.headgearColor).toLowerCase() === curColor);
    });
  },

  renderCreatorHeadgearTiles() {
    const curHeadgearColor = this.appearance.headgearColor || '#18181b';
    const curHairStyle = this.appearance.hairStyle || 'buzzcut';
    const curHairColor = this.appearance.hairColor || '#18181b';
    const curBeardStyle = this.appearance.beardStyle || 'clean';
    const curBeardColor = this.appearance.beardColor || '#18181b';

    document.querySelectorAll('#creator-headgear-grid .creator-hair-tile').forEach((btn) => {
      const styleId = btn.dataset.headgearStyle || 'none';
      const cvs = btn.querySelector('canvas');
      if (cvs) {
        const ctx = cvs.getContext('2d');
        drawHeadHeadgearPreview(ctx, cvs.width, cvs.height, styleId, curHeadgearColor, curHairStyle, curHairColor, curBeardStyle, curBeardColor);
      }
    });
  },

  initCreatorMaskUI() {
    const gridEl = document.getElementById('creator-mask-grid');
    const colorsEl = document.getElementById('creator-mask-colors');
    if (!gridEl || !colorsEl) return;

    gridEl.innerHTML = '';
    colorsEl.innerHTML = '';

    // 1. Kafelki z maskami / okularami (bez nazw i opisów)
    MASK_STYLE_LIST.forEach((styleId) => {
      const tileBtn = document.createElement('button');
      tileBtn.type = 'button';
      tileBtn.className = 'creator-hair-tile';
      tileBtn.dataset.maskStyle = styleId;
      if ((this.appearance.maskStyle || 'none') === styleId) {
        tileBtn.classList.add('active');
      }

      const cvs = document.createElement('canvas');
      cvs.width = 68;
      cvs.height = 68;
      tileBtn.appendChild(cvs);

      tileBtn.addEventListener('mouseenter', () => playUiHover());
      tileBtn.addEventListener('click', () => {
        playUiClick();
        this.appearance.maskStyle = styleId;
        this.saveAppearance();
        this.applyAppearance();
        this.syncCreatorMaskSelectionUI();
        this.renderCreatorMaskTiles();
        this.renderCreatorNeckTiles();
      });

      gridEl.appendChild(tileBtn);
    });

    // 2. Próbki kolorów maski (wyświetlane tylko gdy dany styl obsługuje kolory)
    MASK_COLOR_LIST.forEach((hexCol) => {
      const swatchBtn = document.createElement('button');
      swatchBtn.type = 'button';
      swatchBtn.className = 'creator-color-swatch';
      swatchBtn.dataset.maskColor = hexCol;
      swatchBtn.style.backgroundColor = hexCol;
      const curCol = String(this.appearance.maskColor || '#18181b').toLowerCase();
      if (curCol === hexCol.toLowerCase()) {
        swatchBtn.classList.add('active');
      }

      swatchBtn.addEventListener('mouseenter', () => playUiHover());
      swatchBtn.addEventListener('click', () => {
        playUiClick();
        this.appearance.maskColor = hexCol;
        this.saveAppearance();
        this.applyAppearance();
        this.syncCreatorMaskSelectionUI();
        this.renderCreatorMaskTiles();
        this.renderCreatorNeckTiles();
      });

      colorsEl.appendChild(swatchBtn);
    });

    this.syncCreatorMaskSelectionUI();
    this.renderCreatorMaskTiles();
  },

  syncCreatorMaskSelectionUI() {
    const curStyle = this.appearance.maskStyle || 'none';
    const curColor = String(this.appearance.maskColor || '#18181b').toLowerCase();

    document.querySelectorAll('#creator-mask-grid .creator-hair-tile').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.maskStyle === curStyle);
    });

    document.querySelectorAll('#creator-mask-colors .creator-color-swatch').forEach((btn) => {
      btn.classList.toggle('active', String(btn.dataset.maskColor).toLowerCase() === curColor);
    });

    const colorsEl = document.getElementById('creator-mask-colors');
    if (colorsEl) {
      colorsEl.style.display = doesMaskSupportColor(curStyle) ? 'flex' : 'none';
    }
  },

  renderCreatorMaskTiles() {
    const curMaskColor = this.appearance.maskColor || '#18181b';
    const curHeadgearStyle = this.appearance.headgearStyle || 'none';
    const curHeadgearColor = this.appearance.headgearColor || '#18181b';
    const curHairStyle = this.appearance.hairStyle || 'buzzcut';
    const curHairColor = this.appearance.hairColor || '#18181b';
    const curBeardStyle = this.appearance.beardStyle || 'clean';
    const curBeardColor = this.appearance.beardColor || '#18181b';

    document.querySelectorAll('#creator-mask-grid .creator-hair-tile').forEach((btn) => {
      const styleId = btn.dataset.maskStyle || 'none';
      const cvs = btn.querySelector('canvas');
      if (cvs) {
        const ctx = cvs.getContext('2d');
        drawHeadMaskPreview(
          ctx,
          cvs.width,
          cvs.height,
          styleId,
          curMaskColor,
          curHeadgearStyle,
          curHeadgearColor,
          curHairStyle,
          curHairColor,
          curBeardStyle,
          curBeardColor
        );
      }
    });
  },

  initCreatorNeckUI() {
    const gridEl = document.getElementById('creator-neck-grid');
    if (!gridEl) return;

    gridEl.innerHTML = '';

    // Kafelki ze stylem ozdób szyi (brak, nieśmiertelnik wojskowy, złoty łańcuch)
    NECK_STYLE_LIST.forEach((styleId) => {
      const tileBtn = document.createElement('button');
      tileBtn.type = 'button';
      tileBtn.className = 'creator-hair-tile';
      tileBtn.dataset.neckStyle = styleId;
      if ((this.appearance.neckStyle || 'none') === styleId) {
        tileBtn.classList.add('active');
      }

      const cvs = document.createElement('canvas');
      cvs.width = 68;
      cvs.height = 68;
      tileBtn.appendChild(cvs);

      tileBtn.addEventListener('mouseenter', () => playUiHover());
      tileBtn.addEventListener('click', () => {
        playUiClick();
        this.appearance.neckStyle = styleId;
        this.saveAppearance();
        this.applyAppearance();
        this.syncCreatorNeckSelectionUI();
        this.renderCreatorNeckTiles();
      });

      gridEl.appendChild(tileBtn);
    });

    this.syncCreatorNeckSelectionUI();
    this.renderCreatorNeckTiles();
  },

  syncCreatorNeckSelectionUI() {
    const curStyle = this.appearance.neckStyle || 'none';
    document.querySelectorAll('#creator-neck-grid .creator-hair-tile').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.neckStyle === curStyle);
    });
  },

  renderCreatorNeckTiles() {
    const curHeadgearStyle = this.appearance.headgearStyle || 'none';
    const curHeadgearColor = this.appearance.headgearColor || '#18181b';
    const curMaskStyle = this.appearance.maskStyle || 'none';
    const curMaskColor = this.appearance.maskColor || '#18181b';
    const curHairStyle = this.appearance.hairStyle || 'buzzcut';
    const curHairColor = this.appearance.hairColor || '#18181b';
    const curBeardStyle = this.appearance.beardStyle || 'clean';
    const curBeardColor = this.appearance.beardColor || '#18181b';

    document.querySelectorAll('#creator-neck-grid .creator-hair-tile').forEach((btn) => {
      const styleId = btn.dataset.neckStyle || 'none';
      const cvs = btn.querySelector('canvas');
      if (cvs) {
        const ctx = cvs.getContext('2d');
        drawHeadNeckPreview(
          ctx,
          cvs.width,
          cvs.height,
          styleId,
          curHeadgearStyle,
          curHeadgearColor,
          curMaskStyle,
          curMaskColor,
          curHairStyle,
          curHairColor,
          curBeardStyle,
          curBeardColor
        );
      }
    });
  },

  initCreatorTorsoUI() {
    const gridEl = document.getElementById('creator-torso-grid');
    const colorsEl = document.getElementById('creator-torso-colors');
    if (!gridEl || !colorsEl) return;

    gridEl.innerHTML = '';
    colorsEl.innerHTML = '';

    // 1. Kafelki z fasonami ubrania torsu (krótki/długi rękaw, moro jasne/ciemne)
    TORSO_STYLE_LIST.forEach((styleId) => {
      const tileBtn = document.createElement('button');
      tileBtn.type = 'button';
      tileBtn.className = 'creator-hair-tile';
      tileBtn.dataset.torsoStyle = styleId;
      if ((this.appearance.torsoStyle || 'short_sleeve') === styleId) {
        tileBtn.classList.add('active');
      }

      const cvs = document.createElement('canvas');
      cvs.width = 68;
      cvs.height = 68;
      tileBtn.appendChild(cvs);

      tileBtn.addEventListener('mouseenter', () => playUiHover());
      tileBtn.addEventListener('click', () => {
        playUiClick();
        this.appearance.torsoStyle = styleId;
        this.saveAppearance();
        this.applyAppearance();
        this.syncCreatorTorsoSelectionUI();
        this.renderCreatorTorsoTiles();
        this.renderCreatorNeckTiles();
        this.renderCreatorPantsTiles();
      });

      gridEl.appendChild(tileBtn);
    });

    // 2. Próbki kolorów koszulki dla fasonów jednolitych
    TORSO_COLOR_LIST.forEach((hexCol) => {
      const swatchBtn = document.createElement('button');
      swatchBtn.type = 'button';
      swatchBtn.className = 'creator-color-swatch';
      swatchBtn.dataset.torsoColor = hexCol;
      swatchBtn.style.backgroundColor = hexCol;
      if (String(this.appearance.torsoColor || '#18181b').toLowerCase() === hexCol.toLowerCase()) {
        swatchBtn.classList.add('active');
      }

      swatchBtn.addEventListener('mouseenter', () => playUiHover());
      swatchBtn.addEventListener('click', () => {
        playUiClick();
        this.appearance.torsoColor = hexCol;
        this.saveAppearance();
        this.applyAppearance();
        this.syncCreatorTorsoSelectionUI();
        this.renderCreatorTorsoTiles();
        this.renderCreatorNeckTiles();
        this.renderCreatorPantsTiles();
      });

      colorsEl.appendChild(swatchBtn);
    });

    this.syncCreatorTorsoSelectionUI();
    this.renderCreatorTorsoTiles();
  },

  syncCreatorTorsoSelectionUI() {
    const curStyle = this.appearance.torsoStyle || 'short_sleeve';
    const curColor = String(this.appearance.torsoColor || '#18181b').toLowerCase();

    document.querySelectorAll('#creator-torso-grid .creator-hair-tile').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.torsoStyle === curStyle);
    });

    document.querySelectorAll('#creator-torso-colors .creator-color-swatch').forEach((btn) => {
      btn.classList.toggle('active', String(btn.dataset.torsoColor).toLowerCase() === curColor);
    });

    const colorsEl = document.getElementById('creator-torso-colors');
    if (colorsEl) {
      colorsEl.style.display = doesTorsoSupportColor(curStyle) ? 'flex' : 'none';
    }
  },

  renderCreatorTorsoTiles() {
    const curColor = this.appearance.torsoColor || '#18181b';
    const visuals = { ...this.appearance };

    document.querySelectorAll('#creator-torso-grid .creator-hair-tile').forEach((btn) => {
      const styleId = btn.dataset.torsoStyle || 'short_sleeve';
      const cvs = btn.querySelector('canvas');
      if (cvs) {
        const ctx = cvs.getContext('2d');
        drawTorsoPreview(ctx, cvs.width, cvs.height, styleId, curColor, visuals);
      }
    });
  },

  initCreatorPantsUI() {
    const gridEl = document.getElementById('creator-pants-grid');
    const colorsEl = document.getElementById('creator-pants-colors');
    if (!gridEl || !colorsEl) return;

    gridEl.innerHTML = '';
    colorsEl.innerHTML = '';

    // 1. Kafelki z fasonami spodni (długie bojówki, krótkie spodenki, moro jasne/ciemne)
    PANTS_STYLE_LIST.forEach((styleId) => {
      const tileBtn = document.createElement('button');
      tileBtn.type = 'button';
      tileBtn.className = 'creator-hair-tile';
      tileBtn.dataset.pantsStyle = styleId;
      if ((this.appearance.pantsStyle || 'cargo_long') === styleId) {
        tileBtn.classList.add('active');
      }

      const cvs = document.createElement('canvas');
      cvs.width = 68;
      cvs.height = 68;
      tileBtn.appendChild(cvs);

      tileBtn.addEventListener('mouseenter', () => playUiHover());
      tileBtn.addEventListener('click', () => {
        playUiClick();
        this.appearance.pantsStyle = styleId;
        this.saveAppearance();
        this.applyAppearance();
        this.syncCreatorPantsSelectionUI();
        this.renderCreatorPantsTiles();
      });

      gridEl.appendChild(tileBtn);
    });

    // 2. Próbki kolorów spodni dla fasonów jednolitych
    PANTS_COLOR_LIST.forEach((hexCol) => {
      const swatchBtn = document.createElement('button');
      swatchBtn.type = 'button';
      swatchBtn.className = 'creator-color-swatch';
      swatchBtn.dataset.pantsColor = hexCol;
      swatchBtn.style.backgroundColor = hexCol;
      if (String(this.appearance.pantsColor || '#18181b').toLowerCase() === hexCol.toLowerCase()) {
        swatchBtn.classList.add('active');
      }

      swatchBtn.addEventListener('mouseenter', () => playUiHover());
      swatchBtn.addEventListener('click', () => {
        playUiClick();
        this.appearance.pantsColor = hexCol;
        this.saveAppearance();
        this.applyAppearance();
        this.syncCreatorPantsSelectionUI();
        this.renderCreatorPantsTiles();
      });

      colorsEl.appendChild(swatchBtn);
    });

    this.syncCreatorPantsSelectionUI();
    this.renderCreatorPantsTiles();
  },

  syncCreatorPantsSelectionUI() {
    const curStyle = this.appearance.pantsStyle || 'cargo_long';
    const curColor = String(this.appearance.pantsColor || '#18181b').toLowerCase();

    document.querySelectorAll('#creator-pants-grid .creator-hair-tile').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.pantsStyle === curStyle);
    });

    document.querySelectorAll('#creator-pants-colors .creator-color-swatch').forEach((btn) => {
      btn.classList.toggle('active', String(btn.dataset.pantsColor).toLowerCase() === curColor);
    });

    const colorsEl = document.getElementById('creator-pants-colors');
    if (colorsEl) {
      colorsEl.style.display = doesPantsSupportColor(curStyle) ? 'flex' : 'none';
    }
  },

  renderCreatorPantsTiles() {
    const curColor = this.appearance.pantsColor || '#18181b';
    const visuals = { ...this.appearance };

    document.querySelectorAll('#creator-pants-grid .creator-hair-tile').forEach((btn) => {
      const styleId = btn.dataset.pantsStyle || 'cargo_long';
      const cvs = btn.querySelector('canvas');
      if (cvs) {
        const ctx = cvs.getContext('2d');
        drawPantsPreview(ctx, cvs.width, cvs.height, styleId, curColor, visuals);
      }
    });
  },

  activeCreatorTab: 'hair',

  switchCreatorTab(tabId = 'hair') {
    if (tabId === 'mask') tabId = 'headgear';
    this.activeCreatorTab = tabId;
    document.querySelectorAll('.creator-tab-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.creatorTab === tabId);
    });
    document.querySelectorAll('.creator-tab-pane').forEach((pane) => {
      const isTarget = (pane.id === `creator-tab-${tabId}`);
      pane.style.display = isTarget ? 'flex' : 'none';
      pane.classList.toggle('active', isTarget);
    });
    if (tabId === 'hair') {
      this.syncCreatorHairSelectionUI();
      this.renderCreatorHairTiles();
    } else if (tabId === 'beard') {
      this.syncCreatorBeardSelectionUI();
      this.renderCreatorBeardTiles();
    } else if (tabId === 'headgear') {
      this.syncCreatorHeadgearSelectionUI();
      this.syncCreatorMaskSelectionUI();
      this.syncCreatorNeckSelectionUI();
      this.renderCreatorHeadgearTiles();
      this.renderCreatorMaskTiles();
      this.renderCreatorNeckTiles();
    } else if (tabId === 'torso') {
      this.syncCreatorTorsoSelectionUI();
      this.renderCreatorTorsoTiles();
    } else if (tabId === 'pants') {
      this.syncCreatorPantsSelectionUI();
      this.renderCreatorPantsTiles();
    }
  },

  creatorRafId: null,
  creatorDummyPlayer: null,

  startCreatorPreview() {
    this.stopCreatorPreview();
    if (!this.creatorDummyPlayer) {
      this.creatorDummyPlayer = {
        _isCreatorPreview: true,
        x: -12,
        y: -70,
        w: 24,
        h: 70,
        vx: 0,
        vy: 0,
        onGround: true,
        isJumping: false,
        isSliding: false,
        isIntro: false,
        isProne: false,
        isCrouching: false,
        state: 'STAND',
        currentGroundY: 0,
        groundY: 0,
        pelvisY: -11.8,
        facing: 1,
        yaw: 0,
        gaitMode: 'IDLE',
        stridePhase: 0,
        torsoTilt: 0,
        torsoTiltVel: 0,
        headPitch: 0,
        headBob: 0,
        headBobVel: 0,
        kneeJuggleWeight: 0,
        thighLen: 25,
        shinLen: 24,
        upperArmLen: 14,
        forearmLen: 13,
        hp: 100,
        maxHp: 100,
        hasHead: true,
        decapitated: false,
        isGibbed: false,
        dismembered: {
          armFront: false,
          armBack: false,
          legFront: false,
          legBack: false
        },
        isDead: false,
        staggerTimer: 0,
        jetFuel: 150,
        jetMax: 150,
        isJetpacking: false,
        hasHelmet: false,
        helmetHp: 0,
        hasVest: false,
        vestHp: 0,
        isHolstered: true,
        holsterWeight: 1.0,
        currentWeapon: null,
        aimAngle: 0,
        currentClass: CLASSES.RAPTOR,
        customVisuals: {
          hairStyle: this.appearance.hairStyle || 'buzzcut',
          hairColor: this.appearance.hairColor || '#18181b',
          beardStyle: this.appearance.beardStyle || 'clean',
          beardColor: this.appearance.beardColor || '#18181b',
          headgearStyle: this.appearance.headgearStyle || 'none',
          headgearColor: this.appearance.headgearColor || '#18181b',
          maskStyle: this.appearance.maskStyle || 'none',
          maskColor: this.appearance.maskColor || '#18181b',
          neckStyle: this.appearance.neckStyle || 'none',
          torsoStyle: this.appearance.torsoStyle || 'short_sleeve',
          torsoColor: this.appearance.torsoColor || '#18181b',
          pantsStyle: this.appearance.pantsStyle || 'cargo_long',
          pantsColor: this.appearance.pantsColor || '#18181b'
        },
        pose: { initialized: false }
      };
    }

    this.applyAppearance();
    this.syncCreatorHairSelectionUI();
    this.syncCreatorBeardSelectionUI();
    this.syncCreatorHeadgearSelectionUI();
    this.syncCreatorMaskSelectionUI();
    this.syncCreatorNeckSelectionUI();
    this.syncCreatorTorsoSelectionUI();
    this.syncCreatorPantsSelectionUI();
    this.renderCreatorHairTiles();

    const tick = () => {
      this.drawCreatorPreviewFrame();
      this.creatorRafId = requestAnimationFrame(tick);
    };
    this.creatorRafId = requestAnimationFrame(tick);
  },

  stopCreatorPreview() {
    if (this.creatorRafId) {
      cancelAnimationFrame(this.creatorRafId);
      this.creatorRafId = null;
    }
  },

  drawCreatorPreviewFrame() {
    const canvas = document.getElementById('creator-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    // 1. Subtelna siatka techniczna w tle (w stylu okna podglądu Soldat)
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.06)';
    ctx.lineWidth = 1;
    const gridStep = 20;
    for (let gx = gridStep; gx < cw; gx += gridStep) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, ch);
      ctx.stroke();
    }
    for (let gy = gridStep; gy < ch; gy += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(cw, gy);
      ctx.stroke();
    }

    // 2. Linia podłoża (podest pod stopami postaci z wyraźnym zapasem od dolnej krawędzi ramki)
    const floorScreenY = ch - 34;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.40)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(28, floorScreenY);
    ctx.lineTo(cw - 28, floorScreenY);
    ctx.stroke();

    // Cień pod stopami
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cw / 2, floorScreenY + 2, 26, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Rysowanie całej postaci w skali dopasowanej tak, by od stóp po czubek głowy mieściła się z dużym zapasem
    const dummy = this.creatorDummyPlayer;
    if (!dummy) return;
    dummy.currentClass = CLASSES.RAPTOR;

    ctx.save();
    ctx.translate(cw / 2, floorScreenY);
    ctx.scale(1.65, 1.65);
    drawPlayer(ctx, 0, dummy);
    ctx.restore();
  },

  switchTab(tabName) {
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.style.display = (pane.id === `tab-${tabName}`) ? 'block' : 'none';
      pane.classList.toggle('active', pane.id === `tab-${tabName}`);
    });
  }
};

if (typeof window !== 'undefined') {
  window.uiManager = uiManager;
}
