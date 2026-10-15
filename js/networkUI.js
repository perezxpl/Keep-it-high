// =============================================================================
// NETWORKUI.JS - INTERFEJS UŻYTKOWNIKA DLA TRYBU SIECIOWEGO I CZAT TEKSTOWY
// Obsługa modala P2P, kodów pokoi, pingów, listy botów oraz czatu w grze (Klawisz T)
// =============================================================================

import { networkState } from './network.js';
import { getMpBotCount, getMpBotLayoutDescription } from './bot.js';

// =============================================================================
// STATUS UI I WSKAŹNIKI
// =============================================================================
export function updateUIStatus(status, message) {
  networkState.status = status;
  networkState.statusMsg = message;

  const dot = document.getElementById('mp-status-dot');
  const text = document.getElementById('mp-status-text');
  const pingTag = document.getElementById('mp-ping-tag');
  const roleVal = document.getElementById('mp-role-val');
  const setupView = document.getElementById('mp-setup-view');
  const connectedView = document.getElementById('mp-connected-view');
  const topBadge = document.getElementById('mp-open-btn');

  if (dot) {
    dot.className = 'mp-status-dot';
    if (status === 'connected') dot.classList.add('dot-green');
    else if (status === 'hosting' || status === 'connecting') dot.classList.add('dot-yellow');
    else dot.classList.add('dot-red');
  }

  if (text) text.textContent = message.toUpperCase();

  if (topBadge) {
    if (status === 'connected') {
      topBadge.textContent = 'MULTI (ON)';
      topBadge.style.borderColor = '#4ade80';
      topBadge.style.color = '#4ade80';
    } else if (status === 'hosting' || status === 'connecting') {
      topBadge.textContent = 'MULTI (...)';
      topBadge.style.borderColor = '#facc15';
      topBadge.style.color = '#facc15';
    } else {
      topBadge.textContent = 'MULTI';
      topBadge.style.borderColor = 'rgba(0, 229, 255, 0.5)';
      topBadge.style.color = '#00e5ff';
    }
  }

  if (status === 'connected') {
    if (setupView) setupView.style.display = 'none';
    if (connectedView) connectedView.style.display = 'block';
    if (pingTag) pingTag.style.display = 'inline-block';
    if (roleVal) {
      roleVal.textContent = networkState.isHost ? 'HOST (Baza Cyan / Władca Fizyki)' : 'KLIENT (Baza Orange)';
      roleVal.style.color = networkState.isHost ? '#00e5ff' : '#f97316';
    }
  } else {
    if (setupView) setupView.style.display = 'block';
    if (connectedView) connectedView.style.display = 'none';
    if (pingTag) pingTag.style.display = 'none';
  }
}

export function updatePingUI(ping) {
  const pingTag = document.getElementById('mp-ping-tag');
  const livePing = document.getElementById('mp-live-ping');
  const str = `${ping} ms`;
  if (pingTag) pingTag.textContent = str;
  if (livePing) livePing.textContent = str;
}

export function displayHostRoomCode(id) {
  const hostInit = document.getElementById('mp-host-start-row');
  const hostInfo = document.getElementById('mp-host-info-row');
  const codeVal = document.getElementById('mp-host-code-val');

  if (hostInit) hostInit.style.display = 'none';
  if (hostInfo) hostInfo.style.display = 'block';
  if (codeVal) codeVal.textContent = id;
}

export function openMultiplayerModal() {
  const modal = document.getElementById('mp-modal');
  if (modal) modal.classList.remove('mp-modal-hidden');
  updateCursorVisibility();
}

export function closeMultiplayerModal() {
  const modal = document.getElementById('mp-modal');
  if (modal) modal.classList.add('mp-modal-hidden');
  updateCursorVisibility();
}

// =============================================================================
// ZARZĄDZANIE WIDOCZNOŚCIĄ KURSORA (DEV MENU / MULTI / CZAT)
// =============================================================================
let isHoveringUI = false;

export function updateCursorVisibility() {
  const gameContainer = document.getElementById('game-container');
  const canvasEl = document.getElementById('game');
  const mpModal = document.getElementById('mp-modal');
  const devMenu = document.getElementById('dev-menu');

  const isMpOpen = mpModal && !mpModal.classList.contains('mp-modal-hidden');
  const isDevOpen = devMenu && !devMenu.classList.contains('dev-menu-hidden');
  const isChatOpen = !!isChatActive;
  const isNotInGame = (typeof window !== 'undefined' && window.GAME_STATE && window.GAME_STATE.current !== 'PLAYING');

  const showCursor = isMpOpen || isDevOpen || isChatOpen || isHoveringUI || isNotInGame;

  if (gameContainer) {
    if (showCursor) {
      gameContainer.classList.add('cursor-visible');
    } else {
      gameContainer.classList.remove('cursor-visible');
    }
  }
  if (canvasEl) {
    canvasEl.style.cursor = showCursor ? 'default' : 'none';
  }
}

// =============================================================================
// SYSTEM CZATU TEKSTOWEGO ONLINE (KLAWISZ "T")
// =============================================================================
export let isChatActive = false;

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

export function addChatMessageToUI(sender, text, color = '#00e5ff') {
  const chatMessages = document.getElementById('chat-messages');
  const chatContainer = document.getElementById('game-chat');
  if (!chatMessages) return;

  const msgEl = document.createElement('div');
  msgEl.className = 'chat-msg';
  msgEl.style.borderLeftColor = color;
  msgEl.innerHTML = `<span class="chat-sender" style="color: ${color}">[${escapeHtml(sender)}]:</span><span class="chat-text">${escapeHtml(text)}</span>`;

  chatMessages.appendChild(msgEl);

  // Ogranicz do ostatnich 20 wiadomości w historii
  while (chatMessages.children.length > 20) {
    chatMessages.removeChild(chatMessages.firstChild);
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Odśwież widoczność czatu dla nowej wiadomości
  if (chatContainer) {
    chatContainer.style.opacity = '1';
  }

  // Płynne wygaszenie po 7 sekundach
  setTimeout(() => {
    msgEl.classList.add('msg-fading');
  }, 7000);
}

export function sendChatMessage(text) {
  if (!text || !text.trim()) return;
  text = text.trim();

  const myName = networkState.isHost ? 'P1 (TY)' : (networkState.isConnected ? 'P2 (TY)' : 'TY');
  const myColor = networkState.isHost ? '#00e5ff' : '#f97316';

  if (networkState.conn && networkState.isConnected) {
    try {
      networkState.conn.send({
        type: 'chat_msg',
        text: text,
        sender: networkState.isHost ? 'P1' : 'P2',
        color: networkState.isHost ? '#00e5ff' : '#f97316'
      });
    } catch (e) {
      console.warn('[P2P] Send chat error:', e);
    }
  }

  addChatMessageToUI(myName, text, myColor);
}

export function openChat() {
  const chatContainer = document.getElementById('game-chat');
  const chatInput = document.getElementById('chat-input');
  if (!chatContainer || !chatInput) return;

  isChatActive = true;
  chatContainer.classList.remove('chat-hidden');
  chatContainer.style.opacity = '1';

  // Przywróć pełną widoczność wszystkich ostatnich wiadomości
  const msgs = chatContainer.querySelectorAll('.chat-msg');
  msgs.forEach((m) => m.classList.remove('msg-fading'));

  chatInput.value = '';
  setTimeout(() => {
    chatInput.focus();
    chatInput.select();
  }, 10);

  updateCursorVisibility();
}

export function closeChat() {
  const chatContainer = document.getElementById('game-chat');
  const chatInput = document.getElementById('chat-input');
  if (!chatContainer) return;

  isChatActive = false;
  chatContainer.classList.add('chat-hidden');
  if (chatInput) {
    chatInput.value = '';
    chatInput.blur();
  }

  updateCursorVisibility();
}

function initChatUI() {
  const chatInput = document.getElementById('chat-input');
  const chatWrapper = document.getElementById('chat-input-wrapper');
  const sendBtn = document.getElementById('chat-send-btn');
  const closeChatBtn = document.getElementById('chat-close-btn');
  const mobileChatBtn = document.getElementById('mobile-chat-btn');
  if (!chatInput) return;

  let isInteractingWithChatControls = false;
  const preventBlurControls = [sendBtn, closeChatBtn, mobileChatBtn].filter(Boolean);
  preventBlurControls.forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => {
      isInteractingWithChatControls = true;
      e.stopPropagation();
    });
    btn.addEventListener('touchstart', (e) => {
      isInteractingWithChatControls = true;
      e.stopPropagation();
    }, { passive: false });
    btn.addEventListener('pointerup', () => {
      setTimeout(() => { isInteractingWithChatControls = false; }, 300);
    });
    btn.addEventListener('touchend', () => {
      setTimeout(() => { isInteractingWithChatControls = false; }, 300);
    });
  });

  if (chatWrapper) {
    chatWrapper.addEventListener('mousedown', (e) => e.stopPropagation());
    chatWrapper.addEventListener('pointerdown', (e) => e.stopPropagation());
    chatWrapper.addEventListener('touchstart', (e) => e.stopPropagation());
  }

  const handleSend = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const text = chatInput.value.trim();
    if (text) {
      sendChatMessage(text);
      chatInput.value = '';
    }
    closeChat();
  };

  if (sendBtn) {
    sendBtn.addEventListener('click', handleSend);
  }

  if (closeChatBtn) {
    closeChatBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeChat();
    });
  }

  if (mobileChatBtn) {
    mobileChatBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isChatActive) closeChat();
      else openChat();
    });
  }

  chatInput.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleSend(e);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeChat();
    }
  });

  chatInput.addEventListener('blur', () => {
    setTimeout(() => {
      if (!isInteractingWithChatControls && isChatActive) {
        closeChat();
      }
    }, 150);
  });
}

// =============================================================================
// SYNCHRONIZACJA UI BOTÓW
// =============================================================================
export function syncMpBotUI(count = getMpBotCount()) {
  const c = parseInt(count, 10);
  const isHost = networkState.isHost || !networkState.isConnected;
  const layoutDesc = getMpBotLayoutDescription(c);

  document.querySelectorAll('#mp-bot-selector-row button, #mp-connected-bot-selector-row button, #briefing-mp-bot-selector-row button').forEach(btn => {
    const bCount = parseInt(btn.dataset.mpBots, 10);
    btn.classList.toggle('active', bCount === c);
  });

  const noteEl = document.getElementById('mp-bot-info-note');
  if (noteEl) noteEl.textContent = layoutDesc;

  const briefingNoteEl = document.getElementById('briefing-mp-bot-note');
  if (briefingNoteEl) briefingNoteEl.textContent = layoutDesc;

  const connectedValEl = document.getElementById('mp-connected-bots-val');
  if (connectedValEl) {
    const label = (c === 0) ? '0 (1v1 POJEDYNEK)' : `${c} BOTÓW (${c === 2 ? '2v2' : (c === 4 ? '3v3' : 'ASYSTA')})`;
    connectedValEl.textContent = isHost ? label : `${label} [ZARZĄDZA HOST]`;
  }

  const connectedRow = document.getElementById('mp-connected-bots-row');
  if (connectedRow) {
    connectedRow.style.display = (networkState.isConnected && isHost) ? 'block' : 'none';
  }

  const hostDesc = document.getElementById('mp-bot-desc-text');
  if (hostDesc) {
    hostDesc.textContent = isHost
      ? 'Wybierz liczbę botów AI uzupełniających drużyny w meczu sieciowym:'
      : 'Liczbą botów w sesji zarządza Host gry:';
  }
}

// =============================================================================
// GŁÓWNA INICJALIZACJA ELEMENTÓW DOM INTERFEJSU SIECIOWEGO
// =============================================================================
export function initNetworkUI(handlers = {}) {
  const {
    hostRoom,
    joinRoom,
    disconnectNetwork,
    broadcastMpBotCount
  } = handlers;

  const openBtn = document.getElementById('mp-open-btn');
  const closeBtn = document.getElementById('mp-close-btn');
  const devMpBtn = document.getElementById('dev-mp-btn');
  const backdrop = document.getElementById('mp-backdrop');

  if (openBtn) openBtn.onclick = () => openMultiplayerModal();
  if (devMpBtn) devMpBtn.onclick = () => openMultiplayerModal();
  if (closeBtn) closeBtn.onclick = () => closeMultiplayerModal();
  if (backdrop) backdrop.onclick = () => closeMultiplayerModal();

  // Tworzenie pokoju
  const hostBtn = document.getElementById('mp-host-btn');
  if (hostBtn && typeof hostRoom === 'function') {
    hostBtn.onclick = () => hostRoom();
  }

  // Kopiowanie linku z zaproszeniem
  const copyLinkBtn = document.getElementById('mp-copy-link-btn');
  if (copyLinkBtn) {
    copyLinkBtn.onclick = () => {
      if (networkState.roomId) {
        const url = `${window.location.origin}${window.location.pathname}?room=${networkState.roomId}`;
        navigator.clipboard.writeText(url).then(() => {
          copyLinkBtn.textContent = 'LINK SKOPIOWANY';
          setTimeout(() => { copyLinkBtn.textContent = 'KOPIUJ LINK'; }, 2500);
        });
      }
    };
  }

  // Kopiowanie kodu pokoju
  const copyBtn = document.getElementById('mp-copy-code-btn');
  const codeVal = document.getElementById('mp-host-code-val');
  if (copyBtn && codeVal) {
    copyBtn.onclick = () => {
      const code = codeVal.textContent;
      if (code && navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => {
          copyBtn.textContent = 'SKOPIOWANO!';
          setTimeout(() => { copyBtn.textContent = 'KOPIUJ KOD'; }, 2000);
        });
      }
    };
  }

  // Dołączanie do pokoju
  const joinBtn = document.getElementById('mp-join-btn');
  const joinInput = document.getElementById('mp-join-input');
  if (joinBtn && joinInput && typeof joinRoom === 'function') {
    joinBtn.onclick = () => {
      const code = joinInput.value.trim();
      if (code) joinRoom(code);
    };
    joinInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        const code = joinInput.value.trim();
        if (code) joinRoom(code);
      }
    };
  }

  // Start gry w trybie sieciowym
  const launchGameBtn = document.getElementById('mp-launch-game-btn');
  if (launchGameBtn) {
    launchGameBtn.onclick = () => {
      if (networkState.conn && networkState.isConnected) {
        try { networkState.conn.send({ type: 'start_game' }); } catch (_) {}
      }
      closeMultiplayerModal();
      if (typeof window !== 'undefined' && typeof window.setGameState === 'function') {
        window.setGameState('PLAYING');
      }
    };
  }

  // Rozłączenie gry
  const disconnectBtn = document.getElementById('mp-disconnect-btn');
  if (disconnectBtn && typeof disconnectNetwork === 'function') {
    disconnectBtn.onclick = () => disconnectNetwork();
  }

  // Inicjalizacja czatu tekstowego
  initChatUI();

  // Nasłuchiwanie najechania kursorem na panele UI
  const bindHover = (elId) => {
    const el = document.getElementById(elId);
    if (el) {
      el.addEventListener('mouseenter', () => { isHoveringUI = true; updateCursorVisibility(); });
      el.addEventListener('mouseleave', () => { isHoveringUI = false; updateCursorVisibility(); });
    }
  };

  bindHover('dev-panel-container');
  bindHover('mp-modal');
  bindHover('game-chat');

  // Monitorowanie przycisku DEV
  const devToggleBtn = document.getElementById('dev-toggle-btn');
  if (devToggleBtn) {
    devToggleBtn.addEventListener('click', () => {
      setTimeout(updateCursorVisibility, 50);
    });
  }

  // Auto-connect jeśli w URL przekazano ?room=... lub ?join=...
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const targetRoom = urlParams.get('room') || urlParams.get('join');
    if (targetRoom && typeof joinRoom === 'function') {
      openMultiplayerModal();
      if (joinInput) joinInput.value = targetRoom;
      setTimeout(() => {
        joinRoom(targetRoom);
      }, 500);
    }
  } catch (e) { }

  // Wybór liczby botów w grze sieciowej (0-4)
  if (typeof broadcastMpBotCount === 'function') {
    document.querySelectorAll('#mp-bot-selector-row button, #mp-connected-bot-selector-row button, #briefing-mp-bot-selector-row button').forEach(btn => {
      btn.addEventListener('click', () => {
        if (networkState.isConnected && !networkState.isHost) return;
        const count = parseInt(btn.dataset.mpBots, 10);
        broadcastMpBotCount(count);
      });
    });
  }

  syncMpBotUI(getMpBotCount());
  updateCursorVisibility();
}
