// =============================================================================
// KEEP IT HIGH - UI MANAGER & STATE OVERLAY SYSTEM
// Zarządza Menu Głównym, Oknem Ustawień oraz Panelem Pauzy
// =============================================================================

import { CONFIG } from './config.js';
import { CLASSES } from './classes/index.js';

// Klucz do zapisu konfiguracji w localStorage
const SETTINGS_STORAGE_KEY = 'keep_it_high_settings_v1';

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
  selectedClassId: 'RAPTOR',
  callbacks: null,
  isInitialized: false,

  init(callbacks) {
    if (this.isInitialized) return;
    this.callbacks = callbacks;
    this.loadSettings();
    this.bindDOM();
    this.applySettings();
    this.isInitialized = true;
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
    const pauseEl = document.getElementById('pause-overlay');
    const hudPauseBtn = document.getElementById('hud-pause-btn');
    const devPanel = document.getElementById('dev-panel-container');
    const gameContainer = document.getElementById('game-container');
    const canvasEl = document.getElementById('game');

    // Ukryj domyślnie wszystkie ekrany UI
    if (menuEl) menuEl.style.display = 'none';
    if (settingsEl) settingsEl.style.display = 'none';
    if (pauseEl) pauseEl.style.display = 'none';

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
