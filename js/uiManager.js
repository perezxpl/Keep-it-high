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
  SHOES_STYLE_LIST,
  SHOES_COLOR_LIST,
  drawShoesPreview,
  JETPACK_STYLE_LIST,
  JETPACK_COLOR_LIST,
  drawJetpackPreview,
  drawPersonalGearPreview,
  setLocalPlayerCustomVisuals
} from './player/renderer.js';

// Klucz do zapisu konfiguracji w localStorage
const SETTINGS_STORAGE_KEY = 'keep_it_high_settings_v1';
const CLASS_APPEARANCES_STORAGE_KEY = 'keep_it_high_class_appearances_v1';
const APPEARANCE_STORAGE_KEY = 'keep_it_high_appearance_v1';

import { getCurrentRank, getNextRank, getPlayerXP, getRankProgress, getPlayerStatsSummary, resetPlayerStats, RANKS, XP_RULES, XP_REWARDS } from './progression.js';

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

export const DEFAULT_CLASS_APPEARANCES = {
  RAPTOR: {
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
    torsoColor: '#10b981', // lekki zielonkawy zwiadowca
    pantsStyle: 'cargo_long',
    pantsColor: '#18181b',
    shoesStyle: 'combat_boots',
    shoesColor: '#18181b',
    jetpackStyle: 'classic',
    jetpackColor: '#10b981'
  },
  STRIKER: {
    hairStyle: 'spiky',
    hairColor: '#18181b',
    beardStyle: 'stubble',
    beardColor: '#18181b',
    headgearStyle: 'cap_forward',
    headgearColor: '#1e293b',
    maskStyle: 'none',
    maskColor: '#18181b',
    neckStyle: 'dogtags',
    torsoStyle: 'short_sleeve',
    torsoColor: '#0284c7', // taktyczny niebieski
    pantsStyle: 'cargo_long',
    pantsColor: '#0f172a',
    shoesStyle: 'combat_boots',
    shoesColor: '#18181b',
    jetpackStyle: 'classic',
    jetpackColor: '#00e5ff'
  },
  ENFORCER: {
    hairStyle: 'buzzcut',
    hairColor: '#18181b',
    beardStyle: 'full_beard',
    beardColor: '#18181b',
    headgearStyle: 'marcus_bandana',
    headgearColor: '#18181b',
    maskStyle: 'none',
    maskColor: '#18181b',
    neckStyle: 'heavy_chain',
    torsoStyle: 'sleeveless',
    torsoColor: '#b91c1c', // bojowa czerwień kolosa
    pantsStyle: 'cargo_long',
    pantsColor: '#111827',
    shoesStyle: 'heavy_buckle_boots',
    shoesColor: '#09090b',
    jetpackStyle: 'classic',
    jetpackColor: '#ef4444'
  }
};

const DEFAULT_APPEARANCE = DEFAULT_CLASS_APPEARANCES.RAPTOR;

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
  classAppearances: {
    RAPTOR: { ...DEFAULT_CLASS_APPEARANCES.RAPTOR },
    STRIKER: { ...DEFAULT_CLASS_APPEARANCES.STRIKER },
    ENFORCER: { ...DEFAULT_CLASS_APPEARANCES.ENFORCER }
  },
  activeCreatorClass: 'RAPTOR',
  creatorView: 'class_select',
  appearance: { ...DEFAULT_CLASS_APPEARANCES.RAPTOR },
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
    this.updateMenuRankDisplay();
    this.isInitialized = true;
  },

  updateMenuRankDisplay() {
    const currentXp = getPlayerXP();
    const rank = getCurrentRank(currentXp);
    const nextRank = getNextRank(currentXp);
    const progress = getRankProgress(currentXp);

    const iconEl = document.getElementById('menu-rank-icon');
    const nameEl = document.getElementById('menu-rank-name');
    const xpEl = document.getElementById('menu-rank-xp-text');
    const barFillEl = document.getElementById('menu-rank-bar-fill');
    const nextBadgeEl = document.getElementById('menu-rank-next-badge');

    if (iconEl) iconEl.textContent = rank.icon;
    if (nameEl) nameEl.textContent = rank.name.toUpperCase();
    if (xpEl) xpEl.textContent = `${currentXp} XP`;
    if (barFillEl) barFillEl.style.width = `${Math.min(100, Math.round(progress * 100))}%`;
    if (nextBadgeEl) {
      if (nextRank) {
        const left = Math.max(0, nextRank.minXp - currentXp);
        nextBadgeEl.textContent = `NASTĘPNY: ${nextRank.name} (${nextRank.minXp} XP / brakuje ${left} XP)`;
      } else {
        nextBadgeEl.textContent = `MAKSYMALNY STOPIEŃ WOJSKOWY: ELITA ARENY`;
      }
    }

    // Aktualizacja statystyk Karty Gracza
    const stats = getPlayerStatsSummary();
    const elKills = document.getElementById('menu-stat-kills');
    const elDeaths = document.getElementById('menu-stat-deaths');
    const elKd = document.getElementById('menu-stat-kd');
    const elWins = document.getElementById('menu-stat-wins');
    const elLosses = document.getElementById('menu-stat-losses');
    const elMatches = document.getElementById('menu-stat-matches');
    const elWinRate = document.getElementById('menu-stat-winrate');
    const elGoals = document.getElementById('menu-stat-goals');

    if (elKills) elKills.textContent = stats.kills;
    if (elDeaths) elDeaths.textContent = stats.deaths;
    if (elKd) elKd.textContent = stats.kdRatio;
    if (elWins) elWins.textContent = stats.matchesWon;
    if (elLosses) elLosses.textContent = stats.matchesLost;
    if (elMatches) elMatches.textContent = stats.matchesPlayed;
    if (elWinRate) elWinRate.textContent = stats.winRate;
    if (elGoals) elGoals.textContent = stats.goalsScored;
  },

  openRanksModal() {
    this.renderRanksModal();
    const modalEl = document.getElementById('ranks-modal');
    if (modalEl) {
      modalEl.classList.remove('ranks-modal-hidden');
    }
  },

  closeRanksModal() {
    const modalEl = document.getElementById('ranks-modal');
    if (modalEl) {
      modalEl.classList.add('ranks-modal-hidden');
    }
  },

  switchRanksTab(tabId) {
    const ladderBtn = document.getElementById('ranks-tab-ladder-btn');
    const rulesBtn = document.getElementById('ranks-tab-rules-btn');
    const ladderView = document.getElementById('ranks-tab-ladder-view');
    const rulesView = document.getElementById('ranks-tab-rules-view');

    if (tabId === 'rules') {
      if (ladderBtn) ladderBtn.classList.remove('active');
      if (rulesBtn) rulesBtn.classList.add('active');
      if (ladderView) ladderView.style.display = 'none';
      if (rulesView) rulesView.style.display = 'block';
    } else {
      if (ladderBtn) ladderBtn.classList.add('active');
      if (rulesBtn) rulesBtn.classList.remove('active');
      if (ladderView) ladderView.style.display = 'block';
      if (rulesView) rulesView.style.display = 'none';
    }
  },

  renderRanksModal() {
    const currentXp = getPlayerXP();
    const rank = getCurrentRank(currentXp);
    const nextRank = getNextRank(currentXp);
    const progress = getRankProgress(currentXp);

    // 1. Karta Hero (Aktualny stopień)
    const heroIcon = document.getElementById('ranks-hero-icon');
    const heroName = document.getElementById('ranks-hero-name');
    const heroXp = document.getElementById('ranks-hero-xp-val');
    const heroNext = document.getElementById('ranks-hero-next');
    const heroFill = document.getElementById('ranks-hero-progress-fill');

    if (heroIcon) heroIcon.textContent = rank.icon;
    if (heroName) heroName.textContent = rank.name.toUpperCase();
    if (heroXp) heroXp.textContent = `${currentXp.toLocaleString('pl-PL')} XP`;
    if (heroFill) heroFill.style.width = `${Math.min(100, Math.round(progress * 100))}%`;
    if (heroNext) {
      if (nextRank) {
        const left = Math.max(0, nextRank.minXp - currentXp);
        const percent = Math.min(100, Math.round(progress * 100));
        heroNext.textContent = `NASTĘPNY: ${nextRank.name} (${nextRank.minXp.toLocaleString('pl-PL')} XP / brakuje ${left.toLocaleString('pl-PL')} XP) [${percent}%]`;
      } else {
        heroNext.textContent = `MAKSYMALNY STOPIEŃ WOJSKOWY: ELITA ARENY [100%]`;
      }
    }

    // 2. Generowanie listy 12 rang wojskowych
    const ladderContainer = document.getElementById('ranks-ladder-container');
    if (ladderContainer && Array.isArray(RANKS)) {
      ladderContainer.innerHTML = '';
      RANKS.forEach((r, idx) => {
        const tierNum = (r.tier !== undefined ? r.tier : (idx + 1)).toString().padStart(2, '0');
        const isCurrent = (r.id === rank.id);
        const isUnlocked = (currentXp >= r.minXp);
        const missingXp = Math.max(0, r.minXp - currentXp);

        const card = document.createElement('div');
        card.className = `rank-ladder-card ${isCurrent ? 'current-rank' : (isUnlocked ? 'unlocked' : 'locked')}`;

        let statusHtml = '';
        if (isCurrent) {
          statusHtml = `<span class="rank-status-tag tag-current"><span class="tag-pulse-dot"></span>TWÓJ AKTUALNY STOPIEŃ</span>`;
        } else if (isUnlocked) {
          statusHtml = `<span class="rank-status-tag tag-unlocked">✔ ODBLOKOWANY</span>`;
        } else {
          statusHtml = `<span class="rank-status-tag tag-locked">🔒 DO ZDOBYCIA (brakuje ${missingXp.toLocaleString('pl-PL')} XP)</span>`;
        }

        card.innerHTML = `
          <div class="rank-card-insignia">
            <span class="rank-insignia-text">${r.icon}</span>
          </div>
          <div class="rank-card-details">
            <div class="rank-card-meta-row">
              <span class="rank-card-tier">TIER ${tierNum}</span>
              <span class="rank-card-xp-req">${r.minXp.toLocaleString('pl-PL')} XP</span>
            </div>
            <div class="rank-card-name-row">
              <span class="rank-card-name">${r.name}</span>
              <span class="rank-card-short">[${r.short.toUpperCase()}]</span>
            </div>
            <div class="rank-card-desc">${r.desc || 'Stopień bojowy Modern Military.'}</div>
            <div class="rank-card-status-row">
              ${statusHtml}
            </div>
          </div>
        `;
        ladderContainer.appendChild(card);
      });
    }

    // 3. Generowanie tabeli zasad XP
    const rulesContainer = document.getElementById('ranks-rules-container');
    if (rulesContainer && Array.isArray(XP_RULES)) {
      rulesContainer.innerHTML = '';
      XP_RULES.forEach(rule => {
        const card = document.createElement('div');
        card.className = 'ranks-rule-card';
        card.innerHTML = `
          <div class="rule-icon-box">
            <span>${rule.icon}</span>
          </div>
          <div class="rule-details">
            <div class="rule-header-row">
              <span class="rule-category-badge">${rule.category.toUpperCase()}</span>
              <span class="rule-xp-badge ${rule.badgeClass}">${rule.xp > 0 ? `+${rule.xp} XP` : `${rule.xp} XP`}</span>
            </div>
            <div class="rule-title">${rule.title}</div>
            <div class="rule-desc">${rule.desc}</div>
            <div class="rule-tip">🎯 ${rule.tip}</div>
          </div>
        `;
        rulesContainer.appendChild(card);
      });
    }
  },

  loadAppearance() {
    try {
      const rawClassData = localStorage.getItem(CLASS_APPEARANCES_STORAGE_KEY);
      if (rawClassData) {
        const parsed = JSON.parse(rawClassData);
        this.classAppearances = {
          RAPTOR: { ...DEFAULT_CLASS_APPEARANCES.RAPTOR, ...(parsed.RAPTOR || {}) },
          STRIKER: { ...DEFAULT_CLASS_APPEARANCES.STRIKER, ...(parsed.STRIKER || {}) },
          ENFORCER: { ...DEFAULT_CLASS_APPEARANCES.ENFORCER, ...(parsed.ENFORCER || {}) }
        };
        // Migracja starego beretu i koszulki z rękawami Enforcera na chustę Marcusa i bezrękawnik
        if (parsed.ENFORCER && parsed.ENFORCER.headgearStyle === 'beret' && parsed.ENFORCER.headgearColor === '#7f1d1d') {
          this.classAppearances.ENFORCER.headgearStyle = 'marcus_bandana';
          this.classAppearances.ENFORCER.headgearColor = '#18181b';
        }
        if (parsed.ENFORCER && parsed.ENFORCER.torsoStyle === 'short_sleeve' && parsed.ENFORCER.torsoColor === '#b91c1c') {
          this.classAppearances.ENFORCER.torsoStyle = 'sleeveless';
        }
      } else {
        // Wsteczna kompatybilność: migracja ze starego pojedynczego profilu APPEARANCE_STORAGE_KEY
        const legacyRaw = localStorage.getItem(APPEARANCE_STORAGE_KEY);
        let legacyParsed = null;
        if (legacyRaw) {
          try { legacyParsed = JSON.parse(legacyRaw); } catch (_) {}
        }
        this.classAppearances = {
          RAPTOR: { ...DEFAULT_CLASS_APPEARANCES.RAPTOR, ...(legacyParsed || {}) },
          STRIKER: { ...DEFAULT_CLASS_APPEARANCES.STRIKER },
          ENFORCER: { ...DEFAULT_CLASS_APPEARANCES.ENFORCER }
        };
        this.saveAppearance();
      }
    } catch (e) {
      console.warn('[UI] Błąd odczytu wyglądu postaci z localStorage:', e);
      this.classAppearances = {
        RAPTOR: { ...DEFAULT_CLASS_APPEARANCES.RAPTOR },
        STRIKER: { ...DEFAULT_CLASS_APPEARANCES.STRIKER },
        ENFORCER: { ...DEFAULT_CLASS_APPEARANCES.ENFORCER }
      };
    }
    if (!this.activeCreatorClass || !this.classAppearances[this.activeCreatorClass]) {
      this.activeCreatorClass = 'RAPTOR';
    }
    this.appearance = this.classAppearances[this.activeCreatorClass];
  },

  saveAppearance() {
    try {
      localStorage.setItem(CLASS_APPEARANCES_STORAGE_KEY, JSON.stringify(this.classAppearances));
      localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(this.classAppearances[this.activeCreatorClass] || this.appearance));
    } catch (e) {
      console.warn('[UI] Błąd zapisu wyglądu postaci do localStorage:', e);
    }
  },

  applyAppearance(classId = this.activeCreatorClass) {
    const cid = String(classId || 'RAPTOR').toUpperCase();
    const app = this.classAppearances[cid] || this.appearance || DEFAULT_CLASS_APPEARANCES.RAPTOR;
    const custom = {
      hairStyle: app.hairStyle || 'buzzcut',
      hairColor: app.hairColor || '#18181b',
      beardStyle: app.beardStyle || 'clean',
      beardColor: app.beardColor || (app.hairColor || '#18181b'),
      headgearStyle: app.headgearStyle || 'none',
      headgearColor: app.headgearColor || '#18181b',
      maskStyle: app.maskStyle || 'none',
      maskColor: app.maskColor || '#18181b',
      neckStyle: app.neckStyle || 'none',
      torsoStyle: app.torsoStyle || 'short_sleeve',
      torsoColor: app.torsoColor || '#18181b',
      pantsStyle: app.pantsStyle || 'cargo_long',
      pantsColor: app.pantsColor || '#18181b',
      shoesStyle: app.shoesStyle || 'combat_boots',
      shoesColor: app.shoesColor || '#18181b',
      jetpackStyle: app.jetpackStyle || 'classic',
      jetpackColor: app.jetpackColor || '#00e5ff'
    };
    setLocalPlayerCustomVisuals(custom);
    if (this.creatorDummyPlayer) {
      this.creatorDummyPlayer.customVisuals = { ...custom };
      this.creatorDummyPlayer._hairImpulse = 1.0;
    }
    if (typeof window !== 'undefined' && window.player) {
      const curClassId = String(window.player.currentClass?.id || 'RAPTOR').toUpperCase();
      if (curClassId === cid) {
        window.player.customVisuals = { ...(window.player.customVisuals || {}), ...custom };
        window.player._hairImpulse = 1.0;
      }
    }
  },

  applyAppearanceForClass(classId, targetPlayer = (typeof window !== 'undefined' ? window.player : null)) {
    const cid = String(classId || 'RAPTOR').toUpperCase();
    const app = this.classAppearances?.[cid] || this.classAppearances?.RAPTOR || DEFAULT_CLASS_APPEARANCES.RAPTOR;
    const custom = {
      hairStyle: app.hairStyle || 'buzzcut',
      hairColor: app.hairColor || '#18181b',
      beardStyle: app.beardStyle || 'clean',
      beardColor: app.beardColor || (app.hairColor || '#18181b'),
      headgearStyle: app.headgearStyle || 'none',
      headgearColor: app.headgearColor || '#18181b',
      maskStyle: app.maskStyle || 'none',
      maskColor: app.maskColor || '#18181b',
      neckStyle: app.neckStyle || 'none',
      torsoStyle: app.torsoStyle || 'short_sleeve',
      torsoColor: app.torsoColor || '#18181b',
      pantsStyle: app.pantsStyle || 'cargo_long',
      pantsColor: app.pantsColor || '#18181b',
      shoesStyle: app.shoesStyle || 'combat_boots',
      shoesColor: app.shoesColor || '#18181b',
      jetpackStyle: app.jetpackStyle || 'classic',
      jetpackColor: app.jetpackColor || '#00e5ff'
    };
    setLocalPlayerCustomVisuals(custom);
    if (targetPlayer) {
      targetPlayer.customVisuals = { ...(targetPlayer.customVisuals || {}), ...custom };
      targetPlayer._hairImpulse = 1.0;
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
    this.applyAppearanceForClass(classId);
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
    if (gameState === 'PLAYING') this.closeRanksModal();
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
        this.updateMenuRankDisplay();
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
        this.initCreatorShoesUI();
        this.initCreatorJetpackUI();
        this.showCreatorClassSelectView();
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
    // KARTA GRACZA: Resetowanie statystyk
    // -------------------------------------------------------------------------
    const resetStatsBtn = document.getElementById('menu-btn-reset-stats');
    if (resetStatsBtn) {
      resetStatsBtn.addEventListener('mouseenter', () => playUiHover());
      resetStatsBtn.addEventListener('click', () => {
        playUiClick();
        if (confirm('Czy na pewno chcesz zresetować swoje statystyki bojowe (zabójstwa, mecze, bramki)?')) {
          resetPlayerStats();
          this.updateMenuRankDisplay();
        }
      });
    }

    // -------------------------------------------------------------------------
    // KARTA GRACZA I MENU: PODGLĄD STOPNI WOJSKOWYCH I PREMII XP
    // -------------------------------------------------------------------------
    const handleOpenRanksModal = () => {
      playUiClick();
      this.openRanksModal();
    };

    const ranksPreviewBtn = document.getElementById('menu-btn-ranks-preview');
    if (ranksPreviewBtn) {
      ranksPreviewBtn.addEventListener('mouseenter', () => playUiHover());
      ranksPreviewBtn.addEventListener('click', handleOpenRanksModal);
    }

    const rankClickableEl = document.getElementById('menu-player-rank-clickable');
    if (rankClickableEl) {
      rankClickableEl.addEventListener('mouseenter', () => playUiHover());
      rankClickableEl.addEventListener('click', handleOpenRanksModal);
    }

    const ranksMainBtn = document.getElementById('menu-btn-ranks-main');
    if (ranksMainBtn) {
      ranksMainBtn.addEventListener('mouseenter', () => playUiHover());
      ranksMainBtn.addEventListener('click', handleOpenRanksModal);
    }

    const ranksCloseBtn = document.getElementById('ranks-close-btn');
    if (ranksCloseBtn) {
      ranksCloseBtn.addEventListener('mouseenter', () => playUiHover());
      ranksCloseBtn.addEventListener('click', () => {
        playUiClick();
        this.closeRanksModal();
      });
    }

    const ranksBackdrop = document.getElementById('ranks-backdrop');
    if (ranksBackdrop) {
      ranksBackdrop.addEventListener('click', () => {
        playUiClick();
        this.closeRanksModal();
      });
    }

    const tabLadderBtn = document.getElementById('ranks-tab-ladder-btn');
    if (tabLadderBtn) {
      tabLadderBtn.addEventListener('mouseenter', () => playUiHover());
      tabLadderBtn.addEventListener('click', () => {
        playUiClick();
        this.switchRanksTab('ladder');
      });
    }

    const tabRulesBtn = document.getElementById('ranks-tab-rules-btn');
    if (tabRulesBtn) {
      tabRulesBtn.addEventListener('mouseenter', () => playUiHover());
      tabRulesBtn.addEventListener('click', () => {
        playUiClick();
        this.switchRanksTab('rules');
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const ranksModal = document.getElementById('ranks-modal');
        if (ranksModal && !ranksModal.classList.contains('ranks-modal-hidden')) {
          this.closeRanksModal();
        }
      }
    });

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
      creatorBackBtn.addEventListener('mouseenter', () => playUiHover());
      creatorBackBtn.addEventListener('click', () => {
        playUiClick();
        if (this.callbacks && typeof this.callbacks.onCloseCreator === 'function') {
          this.callbacks.onCloseCreator();
        }
      });
    }

    // Karty wyboru klasy w Kreatorze Postaci (RAPTOR, STRIKER, ENFORCER)
    document.querySelectorAll('.creator-class-select-card').forEach((btn) => {
      btn.addEventListener('mouseenter', () => playUiHover());
      btn.addEventListener('click', () => {
        const classId = btn.dataset.creatorClass;
        if (!classId) return;
        playUiClick();
        this.openCreatorClassEditor(classId);
      });
    });

    // Przycisk "← Wybierz Inną Klasę" w edytorze (powrót do wyboru klas)
    const editorBackBtn = document.getElementById('creator-editor-back-btn');
    if (editorBackBtn) {
      editorBackBtn.addEventListener('mouseenter', () => playUiHover());
      editorBackBtn.addEventListener('click', () => {
        playUiClick();
        this.showCreatorClassSelectView();
      });
    }

    // Przycisk "✓ Wróć do Menu" w edytorze
    const editorDoneBtn = document.getElementById('creator-editor-done-btn');
    if (editorDoneBtn) {
      editorDoneBtn.addEventListener('mouseenter', () => playUiHover());
      editorDoneBtn.addEventListener('click', () => {
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
    this.initCreatorShoesUI();
    this.initCreatorJetpackUI();
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

  initCreatorShoesUI() {
    const gridEl = document.getElementById('creator-shoes-grid');
    const colorsEl = document.getElementById('creator-shoes-colors');
    if (!gridEl || !colorsEl) return;

    gridEl.innerHTML = '';
    colorsEl.innerHTML = '';

    // 1. Kafelki z fasonami butów (ciężkie buty, sneakersy, korki, hi-top, wysokie buty z klamrami)
    SHOES_STYLE_LIST.forEach((styleId) => {
      const tileBtn = document.createElement('button');
      tileBtn.type = 'button';
      tileBtn.className = 'creator-hair-tile';
      tileBtn.dataset.shoesStyle = styleId;
      if ((this.appearance.shoesStyle || 'combat_boots') === styleId) {
        tileBtn.classList.add('active');
      }

      const cvs = document.createElement('canvas');
      cvs.width = 68;
      cvs.height = 68;
      tileBtn.appendChild(cvs);

      tileBtn.addEventListener('mouseenter', () => playUiHover());
      tileBtn.addEventListener('click', () => {
        playUiClick();
        this.appearance.shoesStyle = styleId;
        this.saveAppearance();
        this.applyAppearance();
        this.syncCreatorShoesSelectionUI();
        this.renderCreatorShoesTiles();
      });

      gridEl.appendChild(tileBtn);
    });

    // 2. Próbki kolorów obuwia
    SHOES_COLOR_LIST.forEach((hexCol) => {
      const swatchBtn = document.createElement('button');
      swatchBtn.type = 'button';
      swatchBtn.className = 'creator-color-swatch';
      swatchBtn.dataset.shoesColor = hexCol;
      swatchBtn.style.backgroundColor = hexCol;
      if (String(this.appearance.shoesColor || '#18181b').toLowerCase() === hexCol.toLowerCase()) {
        swatchBtn.classList.add('active');
      }

      swatchBtn.addEventListener('mouseenter', () => playUiHover());
      swatchBtn.addEventListener('click', () => {
        playUiClick();
        this.appearance.shoesColor = hexCol;
        this.saveAppearance();
        this.applyAppearance();
        this.syncCreatorShoesSelectionUI();
        this.renderCreatorShoesTiles();
      });

      colorsEl.appendChild(swatchBtn);
    });

    this.syncCreatorShoesSelectionUI();
    this.renderCreatorShoesTiles();
  },

  syncCreatorShoesSelectionUI() {
    const curStyle = this.appearance.shoesStyle || 'combat_boots';
    const curColor = String(this.appearance.shoesColor || '#18181b').toLowerCase();

    document.querySelectorAll('#creator-shoes-grid .creator-hair-tile').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.shoesStyle === curStyle);
    });

    document.querySelectorAll('#creator-shoes-colors .creator-color-swatch').forEach((btn) => {
      btn.classList.toggle('active', String(btn.dataset.shoesColor).toLowerCase() === curColor);
    });
  },

  renderCreatorShoesTiles() {
    const curColor = this.appearance.shoesColor || '#18181b';
    const visuals = { ...this.appearance };

    document.querySelectorAll('#creator-shoes-grid .creator-hair-tile').forEach((btn) => {
      const styleId = btn.dataset.shoesStyle || 'combat_boots';
      const cvs = btn.querySelector('canvas');
      if (cvs) {
        const ctx = cvs.getContext('2d');
        drawShoesPreview(ctx, cvs.width, cvs.height, styleId, curColor, visuals);
      }
    });
  },

  initCreatorJetpackUI() {
    const gridEl = document.getElementById('creator-jetpack-grid');
    const colorsEl = document.getElementById('creator-jetpack-colors');
    if (!gridEl || !colorsEl) return;

    gridEl.innerHTML = '';
    colorsEl.innerHTML = '';

    // 1. Kafelki z fasonami jetpacka (obecnie model podstawowy: Mk.I)
    JETPACK_STYLE_LIST.forEach((styleId) => {
      const tileBtn = document.createElement('button');
      tileBtn.type = 'button';
      tileBtn.className = 'creator-hair-tile';
      tileBtn.dataset.jetpackStyle = styleId;
      if ((this.appearance.jetpackStyle || 'classic') === styleId) {
        tileBtn.classList.add('active');
      }

      const cvs = document.createElement('canvas');
      cvs.width = 68;
      cvs.height = 68;
      tileBtn.appendChild(cvs);

      tileBtn.addEventListener('mouseenter', () => playUiHover());
      tileBtn.addEventListener('click', () => {
        playUiClick();
        this.appearance.jetpackStyle = styleId;
        this.saveAppearance();
        this.applyAppearance();
        this.syncCreatorJetpackSelectionUI();
        this.renderCreatorJetpackTiles();
      });

      gridEl.appendChild(tileBtn);
    });

    // 2. Próbki kolorów ognia i napędu jetpacka
    JETPACK_COLOR_LIST.forEach((hexCol) => {
      const swatchBtn = document.createElement('button');
      swatchBtn.type = 'button';
      swatchBtn.className = 'creator-color-swatch';
      swatchBtn.dataset.jetpackColor = hexCol;
      swatchBtn.style.backgroundColor = hexCol;
      if (String(this.appearance.jetpackColor || '#00e5ff').toLowerCase() === hexCol.toLowerCase()) {
        swatchBtn.classList.add('active');
      }

      swatchBtn.addEventListener('mouseenter', () => playUiHover());
      swatchBtn.addEventListener('click', () => {
        playUiClick();
        this.appearance.jetpackColor = hexCol;
        this.saveAppearance();
        this.applyAppearance();
        this.syncCreatorJetpackSelectionUI();
        this.renderCreatorJetpackTiles();
      });

      colorsEl.appendChild(swatchBtn);
    });

    this.syncCreatorJetpackSelectionUI();
    this.renderCreatorJetpackTiles();
  },

  syncCreatorJetpackSelectionUI() {
    const curStyle = this.appearance.jetpackStyle || 'classic';
    const curColor = String(this.appearance.jetpackColor || '#00e5ff').toLowerCase();

    document.querySelectorAll('#creator-jetpack-grid .creator-hair-tile').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.jetpackStyle === curStyle);
    });

    document.querySelectorAll('#creator-jetpack-colors .creator-color-swatch').forEach((btn) => {
      btn.classList.toggle('active', String(btn.dataset.jetpackColor).toLowerCase() === curColor);
    });
  },

  renderCreatorJetpackTiles() {
    const curColor = this.appearance.jetpackColor || '#00e5ff';
    const visuals = { ...this.appearance };
    const classId = this.activeCreatorClass || 'RAPTOR';

    document.querySelectorAll('#creator-jetpack-grid .creator-hair-tile').forEach((btn) => {
      const styleId = btn.dataset.jetpackStyle || 'classic';
      const cvs = btn.querySelector('canvas');
      if (cvs) {
        const ctx = cvs.getContext('2d');
        drawPersonalGearPreview(ctx, cvs.width, cvs.height, classId, styleId, curColor, visuals);
      }
    });
  },

  updatePersonalGearTabUI() {
    const cid = String(this.activeCreatorClass || 'RAPTOR').toUpperCase();
    const tabBtn = document.getElementById('creator-tab-btn-gear');
    const tabIcon = document.getElementById('creator-gear-tab-icon');
    const tabText = document.getElementById('creator-gear-tab-text');
    const headerIcon = document.getElementById('creator-gear-header-icon');
    const headerTitle = document.getElementById('creator-gear-header-title');

    let icon = '🚀';
    let tabLabel = 'JETPACK';
    let headerText = 'PLECAK ODRZUTOWY (JETPACK)';
    let tooltip = 'Fason i płomień napędu jetpacka';

    if (cid === 'STRIKER') {
      if (tabBtn) tabBtn.style.display = '';
      icon = '⚡';
      tabLabel = 'ROCKET BOOTS';
      headerText = 'BUTY ODRZUTOWE (ROCKET BOOTS)';
      tooltip = 'Fason i płomień dysz butów odrzutowych';
    } else if (cid === 'ENFORCER') {
      if (tabBtn) tabBtn.style.display = 'none';
      if (this.activeCreatorTab === 'jetpack') {
        this.switchCreatorTab('head');
      }
      return;
    } else {
      if (tabBtn) tabBtn.style.display = '';
    }

    if (tabBtn) tabBtn.title = tooltip;
    if (tabIcon) tabIcon.textContent = icon;
    if (tabText) tabText.textContent = tabLabel;
    if (headerIcon) headerIcon.textContent = icon;
    if (headerTitle) headerTitle.textContent = headerText;
  },

  showCreatorClassSelectView() {
    this.creatorView = 'class_select';
    this.stopCreatorPreview();

    const selectView = document.getElementById('creator-class-select-view');
    const editorView = document.getElementById('creator-editor-view');
    if (selectView) selectView.style.display = 'flex';
    if (editorView) editorView.style.display = 'none';

    const titleEl = document.getElementById('creator-modal-title');
    const subEl = document.getElementById('creator-modal-subtitle');
    if (titleEl) titleEl.textContent = 'KREATOR POSTACI';
    if (subEl) subEl.textContent = 'Wybierz klasę operatora do modyfikacji wyglądu';
  },

  openCreatorClassEditor(classId = 'RAPTOR') {
    const cid = String(classId || 'RAPTOR').toUpperCase();
    this.creatorView = 'editor';
    this.switchCreatorClass(cid, false);

    const selectView = document.getElementById('creator-class-select-view');
    const editorView = document.getElementById('creator-editor-view');
    if (selectView) selectView.style.display = 'none';
    if (editorView) editorView.style.display = 'flex';

    const titleEl = document.getElementById('creator-modal-title');
    const subEl = document.getElementById('creator-modal-subtitle');
    if (cid === 'RAPTOR') {
      if (titleEl) titleEl.textContent = 'KREATOR: RAPTOR (KLASA LEKKA)';
      if (subEl) subEl.textContent = 'Zwiadowca i lotnik – modyfikacja sylwetki i plecaka odrzutowego';
    } else if (cid === 'STRIKER') {
      if (titleEl) titleEl.textContent = 'KREATOR: STRIKER (KLASA ŚREDNIA)';
      if (subEl) subEl.textContent = 'Szturmowiec i strzelec – modyfikacja sylwetki i butów Rocket Boots';
    } else if (cid === 'ENFORCER') {
      if (titleEl) titleEl.textContent = 'KREATOR: ENFORCER (KLASA CIĘŻKA)';
      if (subEl) subEl.textContent = 'Kolos i czołg – modyfikacja sylwetki i modułu skoku';
    }

    this.startCreatorPreview();
  },

  switchCreatorClass(classId = 'RAPTOR', playSound = true) {
    const cid = String(classId || 'RAPTOR').toUpperCase();
    this.activeCreatorClass = cid;
    if (!this.classAppearances[cid]) {
      this.classAppearances[cid] = { ...(DEFAULT_CLASS_APPEARANCES[cid] || DEFAULT_CLASS_APPEARANCES.RAPTOR) };
    }
    this.appearance = this.classAppearances[cid];

    // 1. Zaznaczenie aktywnej karty klasy
    document.querySelectorAll('.creator-class-card').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.creatorClass === cid);
    });

    // 2. Etykieta pod oknem podglądu postaci
    const labelEl = document.getElementById('creator-preview-label');
    if (labelEl) {
      if (cid === 'RAPTOR') {
        labelEl.textContent = 'KLASA LEKKA: RAPTOR';
        labelEl.style.color = '#10b981';
      } else if (cid === 'STRIKER') {
        labelEl.textContent = 'KLASA ŚREDNIA: STRIKER';
        labelEl.style.color = '#38bdf8';
      } else if (cid === 'ENFORCER') {
        labelEl.textContent = 'KLASA CIĘŻKA: ENFORCER';
        labelEl.style.color = '#ef4444';
      }
    }

    // 3. Aktualizacja parametrów i anatomii manekina IK (dummy player)
    const activeClassObj = CLASSES[cid] || CLASSES.RAPTOR;
    const bodyDef = activeClassObj?.body || { w: 24, h: 70, thighLen: 25, shinLen: 24, upperArmLen: 14, forearmLen: 13 };
    if (this.creatorDummyPlayer) {
      this.creatorDummyPlayer.currentClass = activeClassObj;
      this.creatorDummyPlayer.w = bodyDef.w;
      this.creatorDummyPlayer.h = bodyDef.h;
      this.creatorDummyPlayer.x = -bodyDef.w / 2;
      this.creatorDummyPlayer.y = -bodyDef.h;
      this.creatorDummyPlayer.thighLen = bodyDef.thighLen;
      this.creatorDummyPlayer.shinLen = bodyDef.shinLen;
      this.creatorDummyPlayer.upperArmLen = bodyDef.upperArmLen;
      this.creatorDummyPlayer.forearmLen = bodyDef.forearmLen;
      this.creatorDummyPlayer.customVisuals = { ...this.appearance };
      this.creatorDummyPlayer._hairImpulse = 1.0;
    }

    // 4. Dostosowanie 7. zakładki (Narzędzie osobiste)
    this.updatePersonalGearTabUI();

    // 5. Synchronizacja stanu zaznaczeń wszystkich kafelków i palet barw
    this.syncAllCreatorSelectionsUI();
    this.renderCurrentCreatorTabTiles();

    // 6. Odświeżenie kafelków wyposażenia osobistego pod nowy model (Jetpack / Buty / Moduł)
    this.renderCreatorJetpackTiles();

    // 7. Zastosowanie wyglądu
    this.applyAppearance(cid);
  },

  syncAllCreatorSelectionsUI() {
    this.syncCreatorHairSelectionUI();
    this.syncCreatorBeardSelectionUI();
    this.syncCreatorHeadgearSelectionUI();
    this.syncCreatorMaskSelectionUI();
    this.syncCreatorNeckSelectionUI();
    this.syncCreatorTorsoSelectionUI();
    this.syncCreatorPantsSelectionUI();
    this.syncCreatorShoesSelectionUI();
    this.syncCreatorJetpackSelectionUI();
  },

  renderCurrentCreatorTabTiles() {
    const tabId = this.activeCreatorTab || 'hair';
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
    } else if (tabId === 'shoes') {
      this.syncCreatorShoesSelectionUI();
      this.renderCreatorShoesTiles();
    } else if (tabId === 'jetpack') {
      this.syncCreatorJetpackSelectionUI();
      this.renderCreatorJetpackTiles();
    }
  },

  renderAllCreatorTiles() {
    this.renderCreatorHairTiles();
    this.renderCreatorBeardTiles();
    this.renderCreatorHeadgearTiles();
    this.renderCreatorMaskTiles();
    this.renderCreatorNeckTiles();
    this.renderCreatorTorsoTiles();
    this.renderCreatorPantsTiles();
    this.renderCreatorShoesTiles();
    this.renderCreatorJetpackTiles();
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
    this.renderCurrentCreatorTabTiles();
  },

  creatorRafId: null,
  creatorDummyPlayer: null,

  startCreatorPreview() {
    this.stopCreatorPreview();
    const activeClassObj = CLASSES[this.activeCreatorClass] || CLASSES.RAPTOR;
    const bodyDef = activeClassObj?.body || { w: 24, h: 70, thighLen: 25, shinLen: 24, upperArmLen: 14, forearmLen: 13 };
    if (!this.creatorDummyPlayer) {
      this.creatorDummyPlayer = {
        _isCreatorPreview: true,
        x: -bodyDef.w / 2,
        y: -bodyDef.h,
        w: bodyDef.w,
        h: bodyDef.h,
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
        thighLen: bodyDef.thighLen,
        shinLen: bodyDef.shinLen,
        upperArmLen: bodyDef.upperArmLen,
        forearmLen: bodyDef.forearmLen,
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
        currentClass: activeClassObj,
        customVisuals: { ...(this.appearance || DEFAULT_CLASS_APPEARANCES.RAPTOR) },
        pose: { initialized: false }
      };
    } else {
      this.creatorDummyPlayer.currentClass = activeClassObj;
      this.creatorDummyPlayer.w = bodyDef.w;
      this.creatorDummyPlayer.h = bodyDef.h;
      this.creatorDummyPlayer.x = -bodyDef.w / 2;
      this.creatorDummyPlayer.y = -bodyDef.h;
      this.creatorDummyPlayer.thighLen = bodyDef.thighLen;
      this.creatorDummyPlayer.shinLen = bodyDef.shinLen;
      this.creatorDummyPlayer.upperArmLen = bodyDef.upperArmLen;
      this.creatorDummyPlayer.forearmLen = bodyDef.forearmLen;
      this.creatorDummyPlayer.customVisuals = { ...(this.appearance || DEFAULT_CLASS_APPEARANCES.RAPTOR) };
      this.creatorDummyPlayer._hairImpulse = 1.0;
    }

    this.applyAppearance();
    this.updatePersonalGearTabUI();
    this.syncAllCreatorSelectionsUI();
    this.renderCurrentCreatorTabTiles();

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
    const activeClassObj = CLASSES[this.activeCreatorClass] || CLASSES.RAPTOR;
    const bodyDef = activeClassObj?.body || { w: 24, h: 70, thighLen: 25, shinLen: 24, upperArmLen: 14, forearmLen: 13 };
    dummy.currentClass = activeClassObj;
    dummy.w = bodyDef.w;
    dummy.h = bodyDef.h;
    dummy.y = -bodyDef.h;
    dummy.thighLen = bodyDef.thighLen;
    dummy.shinLen = bodyDef.shinLen;
    dummy.upperArmLen = bodyDef.upperArmLen;
    dummy.forearmLen = bodyDef.forearmLen;

    if (this.activeCreatorTab === 'jetpack') {
      if (this.activeCreatorClass === 'RAPTOR') {
        dummy.isJetpacking = true;
        dummy.yaw = 0.55;
      } else {
        dummy.isJetpacking = false;
        dummy.yaw = 0.35;
      }
    } else {
      dummy.isJetpacking = false;
      dummy.yaw = 0;
    }

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
